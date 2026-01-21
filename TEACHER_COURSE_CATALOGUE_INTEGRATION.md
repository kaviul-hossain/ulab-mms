# Teacher Course Catalogue Integration

## Overview
This document describes the integration between the admin course catalogue and teacher course creation workflow.

## Features Implemented

### 1. Section Field Addition
- Added `section` field to the Course model
- Default value: `"A"`
- Required field with max 5 characters
- Auto-converts to uppercase
- Updated compound index for duplicate prevention: `code + semester + year + section + userId`

### 2. Course Selection from Admin Catalogue
- Searchable dropdown (combobox) in teacher "Add Course" modal
- Fetches courses from admin catalogue via `/api/admin/courses`
- Fuzzy search by both course code and title
- Displays: `courseCode - courseTitle (creditHour cr)`

### 3. Course Information Display
When a course is selected from the catalogue:
- Shows course info card with:
  - Course title and code
  - Credit hours
  - Prerequisite (if exists)
- Auto-fills course name and code
- Makes name/code fields readonly (disabled with muted background)

### 4. Custom Course Creation
- "Create custom course" option when no match found
- Allows manual entry of all course fields
- Name and code are editable for custom courses

### 5. Duplicate Prevention
- Real-time duplicate checking with 500ms debounce
- Prevents duplicate: same `code + semester + year + section` for same user
- Allows multiple sections of the same course in same semester
- Shows error message if duplicate detected
- Disables submit button when duplicate exists
- API endpoint: `GET /api/courses/check-duplicate`

### 6. Updated Course Cards
- Course cards now display section badge
- Shows: Semester, Year, and Section

## User Flow

### Selecting from Catalogue
1. Click "Add Course" button
2. Click "Select from Course Catalogue" dropdown
3. Search by code or title (e.g., "CSE", "Data Structures")
4. Select a course from the list
5. Course name and code are auto-filled and locked
6. Fill in: Semester, Year, Section, Course Type
7. System automatically checks for duplicates
8. Click "Create Course"

### Creating Custom Course
1. Click "Add Course" button
2. Click "Select from Course Catalogue" dropdown
3. See "No course found in catalogue" message
4. Click "Create custom course instead"
5. Manually fill all fields (name and code are editable)
6. System checks for duplicates
7. Click "Create Course"

## Technical Details

### API Endpoints

#### Check Duplicate
```
GET /api/courses/check-duplicate
Query params: code, semester, year, section
Response: { exists: boolean, course: {...} | null }
```

#### Get Admin Courses
```
GET /api/admin/courses
Response: { success: boolean, courses: AdminCourse[] }
```

### Database Schema Changes

#### Course Model
```typescript
interface ICourse {
  // ... existing fields
  section: string; // NEW: Section identifier (e.g., "A", "B", "C")
}

// Updated compound index
CourseSchema.index(
  { code: 1, semester: 1, year: 1, section: 1, userId: 1 },
  { unique: true }
);
```

### Component Architecture

#### CourseCombobox
- Location: `app/components/CourseCombobox.tsx`
- Uses: Command, Popover, Button components
- Props:
  - `selectedCourse`: AdminCourse | null
  - `onSelect`: (course: AdminCourse | null) => void
  - `disabled`: boolean (optional)

#### Teacher Dashboard
- Location: `app/dashboard/page.tsx`
- State management:
  - `selectedAdminCourse`: Tracks catalogue selection
  - `isCustomCourse`: Toggle between catalogue/custom mode
  - `duplicateError`: Duplicate detection error message
  - `checkingDuplicate`: Loading state for duplicate check

## Validation Rules

1. **Duplicate Prevention**: Same course code can exist multiple times if:
   - Different sections (same semester/year)
   - Different semesters/years
   - Different users (teachers)

2. **Section Format**:
   - Required field
   - Max 5 characters
   - Auto-uppercase conversion
   - Examples: "A", "B1", "LAB-A"

3. **Catalogue vs Custom**:
   - Catalogue courses: name/code readonly
   - Custom courses: all fields editable
   - No reverse sync to admin catalogue

## UI/UX Features

### Course Info Card
When a catalogue course is selected:
```
┌─────────────────────────────────────┐
│ [i] Data Structures                 │
│     CSE201 • 3 Credit Hours         │
│     Prerequisite: CSE101            │
└─────────────────────────────────────┘
```

### Disabled Fields Indicator
- Muted background color
- "Auto-filled from catalogue" helper text
- Disabled cursor

### Duplicate Error
```
⚠️ This course (CSE201) already exists for 
   Spring 2024, Section A
```

### Section Display on Course Card
```
Spring | 2024 | Section A
```

## Benefits

1. **Consistency**: Ensures course codes and names match admin standards
2. **Flexibility**: Allows custom courses when needed
3. **Prevention**: Avoids duplicate course entries
4. **Clarity**: Clear distinction between sections
5. **Efficiency**: Quick course creation with auto-fill

## Future Enhancements

Potential improvements:
- Bulk section creation (create A, B, C sections at once)
- Copy students between sections
- Section capacity limits
- Section-specific scheduling
- Cross-section analytics

## Testing Checklist

- [ ] Select course from catalogue - auto-fills name/code
- [ ] Search by course code
- [ ] Search by course title
- [ ] Create custom course when not in catalogue
- [ ] Duplicate prevention works (same section)
- [ ] Multiple sections allowed (different sections)
- [ ] Section field appears in course cards
- [ ] Edit modal includes section field
- [ ] Duplicate modal includes section field
- [ ] Course info card displays correctly
- [ ] Disabled fields have proper styling
- [ ] Debounced duplicate check performs well
