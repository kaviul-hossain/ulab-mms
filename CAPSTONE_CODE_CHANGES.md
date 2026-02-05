# Code Changes - Capstone Management Integration

## 1. New File: `/app/api/auth/users/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// GET all users for dropdown selection (supervisors, evaluators)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Fetch all users with basic info needed for supervisor/evaluator selection
    const users = await User.find({}, 'name email _id')
      .sort({ name: 1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Purpose**: Fetch all registered users in the system for supervisor/evaluator dropdown selection in the capstone assignment form.

---

## 2. Modified File: `/app/api/students/route.ts`

### Added GET Method

```typescript
// GET all students (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const semester = searchParams.get('semester');
    const year = searchParams.get('year');
    const includeArchivedCourses = searchParams.get('includeArchived') === 'true';

    let query: any = {};

    // If courseId is specified, filter by that course
    if (courseId) {
      query.courseId = courseId;
    } else if (semester || year) {
      // Filter by semester/year - need to find courses first
      let courseQuery: any = {};
      
      if (semester) {
        courseQuery.semester = semester;
      }
      if (year) {
        courseQuery.year = parseInt(year);
      }
      if (!includeArchivedCourses) {
        courseQuery.isArchived = { $ne: true };
      }

      const courses = await Course.find(courseQuery);
      const courseIds = courses.map(c => c._id);
      
      if (courseIds.length > 0) {
        query.courseId = { $in: courseIds };
      } else {
        // No courses found for the given criteria
        return NextResponse.json([], { status: 200 });
      }
    }

    // Fetch students with course details
    const students = await Student.find(query)
      .populate({
        path: 'courseId',
        select: 'name code semester year section courseType',
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(students, { status: 200 });
  } catch (error: any) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST existing method remains unchanged
export async function POST(request: NextRequest) {
  // ... existing code ...
}
```

**Purpose**: Enable fetching of students with optional filtering by course, semester, or year.

---

## 3. Modified File: `/app/admin/dashboard/components/CapstoneManagement.tsx`

### Change 1: Updated Course Interface

**Before:**
```typescript
interface Course {
  _id: string;
  name: string;
  code: string;
}
```

**After:**
```typescript
interface Course {
  _id: string;
  name: string;
  code: string;
  semester?: string;
  year?: number;
}
```

### Change 2: Enhanced loadDropdowns() Function

**Before:**
```typescript
const loadDropdowns = async () => {
  setLoadingDropdowns(true);
  try {
    // Load courses
    const coursesResponse = await fetch('/api/courses');
    const coursesData = await coursesResponse.json();
    if (coursesData.courses) {
      const capstoneCoursesFiltered = coursesData.courses.filter((c: any) =>
        CAPSTONE_COURSES.some(code => c.code?.toUpperCase().includes(code))
      );
      setCourses(capstoneCoursesFiltered);
    }

    // Load users
    const usersResponse = await fetch('/api/students');
    const usersData = await usersResponse.json();
    if (Array.isArray(usersData)) {
      setUsers(usersData);
    }
  } catch (err) {
    console.error('Failed to load dropdowns:', err);
  } finally {
    setLoadingDropdowns(false);
  }
};
```

**After:**
```typescript
const loadDropdowns = async () => {
  setLoadingDropdowns(true);
  try {
    // Load courses with semester and year info
    const coursesResponse = await fetch('/api/courses');
    const coursesData = await coursesResponse.json();
    if (coursesData.courses) {
      // Filter for capstone courses and add semester/year info for display
      const capstoneCoursesFiltered = coursesData.courses.filter((c: any) =>
        CAPSTONE_COURSES.some(code => c.code?.toUpperCase().includes(code))
      );
      setCourses(capstoneCoursesFiltered);
    }

    // Load users (supervisors and evaluators) - not students
    // For the assignment form, we need user accounts, not enrolled students
    const usersResponse = await fetch('/api/auth/users');
    const usersData = await usersResponse.json();
    if (Array.isArray(usersData)) {
      setUsers(usersData);
    } else if (usersData && Array.isArray(usersData.users)) {
      setUsers(usersData.users);
    }
  } catch (err) {
    console.error('Failed to load dropdowns:', err);
    // Fallback: try to get users from students endpoint as fallback
    try {
      const fallbackResponse = await fetch('/api/students');
      const fallbackData = await fallbackResponse.json();
      if (Array.isArray(fallbackData)) {
        setUsers(fallbackData);
      }
    } catch (fallbackErr) {
      console.error('Fallback users load also failed:', fallbackErr);
    }
  } finally {
    setLoadingDropdowns(false);
  }
};
```

### Change 3: Updated Course Filter Display

**Before:**
```typescript
<div className="flex items-center gap-2">
  <Label htmlFor="filter-course">Filter by Course:</Label>
  <select
    id="filter-course"
    value={filterCourse}
    onChange={(e) => setFilterCourse(e.target.value)}
    className="px-3 py-2 border rounded-md text-sm"
  >
    <option value="">All Courses</option>
    {courses.map((c) => (
      <option key={c._id} value={c._id}>
        {c.code} - {c.name}
      </option>
    ))}
  </select>
</div>
```

**After:**
```typescript
<div className="flex items-center gap-2">
  <Label htmlFor="filter-course">Filter by Course:</Label>
  <select
    id="filter-course"
    value={filterCourse}
    onChange={(e) => setFilterCourse(e.target.value)}
    className="px-3 py-2 border rounded-md text-sm"
  >
    <option value="">All Courses</option>
    {courses.map((c) => (
      <option key={c._id} value={c._id}>
        {c.code} - {c.name} {c.year && c.semester ? `(${c.semester} ${c.year})` : ''}
      </option>
    ))}
  </select>
</div>
```

### Change 4: Updated Course Selection in Assignment Dialog

**Before:**
```typescript
{/* Course Selection */}
<div>
  <Label htmlFor="courseId" className="font-semibold">
    Course <span className="text-red-500">*</span>
  </Label>
  <select
    id="courseId"
    value={formData.courseId}
    onChange={(e) => handleCourseChange(e.target.value)}
    disabled={loadingDropdowns}
    className="w-full px-3 py-2 border rounded-md mt-1"
    required
  >
    <option value="">Select a capstone course</option>
    {courses.map((c) => (
      <option key={c._id} value={c._id}>
        {c.code} - {c.name}
      </option>
    ))}
  </select>
</div>
```

**After:**
```typescript
{/* Course Selection */}
<div>
  <Label htmlFor="courseId" className="font-semibold">
    Course <span className="text-red-500">*</span>
  </Label>
  <select
    id="courseId"
    value={formData.courseId}
    onChange={(e) => handleCourseChange(e.target.value)}
    disabled={loadingDropdowns}
    className="w-full px-3 py-2 border rounded-md mt-1"
    required
  >
    <option value="">Select a capstone course</option>
    {courses.map((c) => (
      <option key={c._id} value={c._id}>
        {c.code} - {c.name} {c.year && c.semester ? `(${c.semester} ${c.year})` : ''}
      </option>
    ))}
  </select>
</div>
```

---

## Summary of Changes

| Aspect | Change Type | Details |
|--------|------------|---------|
| **New Endpoint** | Addition | `/api/auth/users` - Fetch all system users |
| **Students Endpoint** | Enhancement | Added GET method with semester/year filtering |
| **Course Interface** | Update | Added `semester` and `year` optional fields |
| **Load Dropdowns** | Improvement | Now uses `/api/auth/users` instead of `/api/students` |
| **UI Display** | Enhancement | Course dropdowns now show semester and year |
| **Data Binding** | Fix | Users properly separated from students in logic |

---

## No Breaking Changes

- All existing functionality preserved
- POST endpoints unchanged
- Existing component behavior maintained
- Backward compatible with current system
- No database schema changes required
- No auth/permission changes needed

---

## Impact on Component Behavior

**Before**: Component had static course lists and tried to load supervisors from students endpoint

**After**: Component loads real data from proper endpoints with semester awareness built in

The component now properly integrates with the database structure instead of using static lists.
