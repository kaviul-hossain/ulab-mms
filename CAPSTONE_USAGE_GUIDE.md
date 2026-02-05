# Quick Reference: Using Capstone Management with Semester Tracking

## What Changed?
The Capstone Management panel now integrates with your actual course database. Instead of static lists, the admin can now:
- See courses with their semester and year information
- View actual students enrolled in each course
- Assign students to supervisors based on real enrollment data
- Filter everything by semester

## How to Use

### 1. Open Capstone Management
- Go to Admin Dashboard → Capstone Management
- You'll see two tabs: "Student Assignments" and "Capstone Marks"

### 2. Assign a Student to Supervisor/Evaluator

**Click "Assign Student" button**:
- **Course**: Select a capstone course (you'll see semester/year info now)
  - Example: `CSE4098A - Capstone Project (Spring 2024)`
- **Student**: Once course is selected, real students in that course appear
  - Only shows students actually enrolled in selected course
- **Supervisor**: Choose from all registered teachers/supervisors
  - Pulled from your users database
  - Sorted alphabetically
- **Supervisor Role**: How they'll be involved
  - `Supervisor` - Supervises the project
  - `Evaluator` - Evaluates the project
  - `Both` - Does both
- **Evaluator** (Optional): Assign a different person to evaluate (optional)

**Submit**: Creates assignment so student sees supervisor/evaluator in their Capstone tab

### 3. View All Assignments
- See table of all capstone assignments
- Shows: Course, Student Name, Student ID, Supervisor, Evaluator
- Edit or Delete any assignment

### 4. Filter Assignments
- **Filter by Course**: Select which capstone course to view
- **Filter by User**: See assignments for specific supervisor/evaluator
- **Refresh**: Reload table with current data

### 5. View Capstone Marks
- Switch to "Capstone Marks" tab
- See all student submissions (proposal, midterm, final)
- Filter by submission type
- Delete records if needed
- View marks from supervisors and evaluators

## What Data Comes From Where?

| Data | Source | Notes |
|------|--------|-------|
| **Courses** | Your course database | Only shows CSE4098A/B/C and CSE499 |
| **Semester/Year** | Course record | Spring/Summer/Fall + year |
| **Students** | Student enrollment data | Only students in selected course |
| **Supervisors/Evaluators** | User accounts | All registered users in system |
| **Assignments** | CapstoneMarks collection | Linked by student→course→semester |

## Semester Context

When you see a course listed:
```
CSE4098A - Capstone Project (Spring 2024)
```

This tells you:
- **CSE4098A**: The course code
- **Capstone Project**: The course name
- **Spring 2024**: When it runs (semester + year)

This helps when you have same course in multiple semesters!

## Key Improvements

✨ **Real Data**: No more hardcoded static lists
✨ **Semester Aware**: See which semester each assignment is for
✨ **Smart Student Loading**: Students list updates based on selected course
✨ **Accurate Relationships**: Students are linked to their actual course enrollments
✨ **Easy Filtering**: Filter by course (with semester info) or supervisor

## API Endpoints (for developers)

If building integrations:
- `GET /api/auth/users` - All supervisors/evaluators
- `GET /api/students?courseId=ID` - Students in a course
- `GET /api/students?semester=Spring&year=2024` - Students in semester
- `GET /api/courses` - All courses with semester info
- `GET /api/admin/capstone-assignment` - All assignments
- `POST /api/admin/capstone-assignment` - Create assignment
- `DELETE /api/admin/capstone-assignment?id=ID` - Remove assignment

## Common Tasks

### Find all students in Spring 2024
1. In Capstone Management
2. Filter by Course (all Spring 2024 courses appear there)
3. Or use API: `GET /api/students?semester=Spring&year=2024`

### Assign all supervisors for a course
1. Click "Assign Student"
2. Select the course
3. For each student in dropdown, create assignment one-by-one
4. (Future: bulk assignment feature)

### View all assignments for Fall 2024
1. Filter by Course
2. Select each Fall 2024 course
3. Or use API with semester filter

### Change supervisor for a student
1. Click Edit on that assignment
2. Select different supervisor
3. Click Update

## Troubleshooting

**"Select a course first" error when choosing student**:
- Make sure you selected a course first
- The student dropdown depends on course selection

**Don't see expected students in dropdown**:
- Make sure course is selected
- Make sure students are actually enrolled in that course
- Check course in Course Management

**Supervisors list is empty**:
- Make sure users are registered in system
- Check Auth → Users database

**Can't find a specific course**:
- Only capstone courses (CSE4098A/B/C, CSE499) appear here
- Check Course Management for other courses
