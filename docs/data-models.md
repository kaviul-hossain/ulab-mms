# Data Models

This page summarizes the main persisted entities used by the app.

## `User`

`models/User.ts` stores authentication data.

- `name`
- `email`
- `password`
- `role`
- password reset token fields

## `Course`

`models/Course.ts` stores course ownership and grading configuration.

- identity fields: `name`, `code`, `semester`, `year`, `section`
- teaching info: `classTime`, `classRoom`, `numberOfStudents`
- grading config: aggregation modes, weightages, grading scale, and mapping objects
- lifecycle fields: `isArchived`, `archivedAt`
- ownership: `userId`

## `Exam`

The course creation API seeds required exams automatically, so the exam model is a core dependency even when users never open it directly.

Typical use:

- store structured assessment items
- associate marks with a course
- support theory and lab course variants

## `Mark`

Marks attach student performance to exams and ultimately drive the grade summaries.

## `AttendanceSession`

Attendance sessions power check-in via session code.

## `CapstoneGroup` and `CapstoneMarks`

These models split the capstone workflow into group tracking and scored submissions.

## `StoredFile` and `ResourceFolder`

These models support the resources and file browsing areas.

## Implementation Notes

- most models use Mongoose timestamps
- the app relies on compound uniqueness where the business rules require it
- route handlers usually connect through `lib/mongodb.ts` before querying models
