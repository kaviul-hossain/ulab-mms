# Courses

Courses are the main organizing unit of the system.

## Course Model

`models/Course.ts` defines the persisted course contract.

Important fields include:

- `name`, `code`, `semester`, `year`, `section`
- `courseType` with values `Theory` or `Lab`
- `classTime`, `classRoom`, `numberOfStudents`
- grading controls like `quizAggregation`, `assignmentAggregation`, and `projectWeightage`
- `isArchived` and `archivedAt`
- `userId` for ownership

The unique compound index is the key safety rule:

```ts
CourseSchema.index({ code: 1, semester: 1, year: 1, section: 1, userId: 1 }, { unique: true });
```

That prevents the same instructor from creating duplicate course instances for the same term and section.

## Dashboard Logic

The dashboard in `app/dashboard/page.tsx` is the command center for course operations.

### Load Courses

On authentication, it fetches `/api/courses` and stores the result in local state.

### Add Course

When a course is created, the dashboard posts form data to `/api/courses` and then prepends the returned course into the list.

### Duplicate Check

The add form debounces a duplicate lookup against `/api/courses/check-duplicate`.

That gives quick feedback before the user submits.

### Archive and Delete

- archive sends `PATCH` to `/api/courses/[id]/archive`
- delete sends `DELETE` to `/api/courses/[id]`

### Duplicate and Import

The duplicate flow exports a course, edits the payload, and re-imports it.
The import flow accepts a JSON payload with `version`, `course`, `students`, and `exams`.

## API Behavior

`app/api/courses/route.ts` does the server-side work.

### GET

- resolves the current user from the session
- loads active or archived courses depending on the query string
- also includes capstone course codes shared across users

### POST

- validates required fields
- creates the course
- seeds required exams automatically

Theory courses create a midterm and final.
Lab courses create a lab final and an OEL/CE project.

## UX Feedback

Course actions use `notify.course.*` so every success or failure message is consistent.
