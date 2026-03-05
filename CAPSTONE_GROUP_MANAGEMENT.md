# Capstone Group Management System

## Overview

The Capstone Group Management System allows administrators to:
1. **Create groups** - Organize students into groups within a capstone course
2. **Assign supervisors** - Designate supervisors for each group
3. **Assign evaluators** - Assign one or more evaluators to evaluate group projects
4. **Track evaluations** - Monitor evaluator assignment status (pending, in-progress, completed)

## System Architecture

### Database Model: CapstoneGroup

Located in: `models/CapstoneGroup.ts`

```typescript
interface ICapstoneGroup extends Document {
  courseId: mongoose.Types.ObjectId;           // Capstone course reference
  groupName: string;                           // Name of the group project
  groupNumber?: number;                        // Optional group number
  description?: string;                        // Project description
  studentIds: mongoose.Types.ObjectId[];       // Array of students in group
  supervisorId: mongoose.Types.ObjectId;       // Primary supervisor
  evaluatorAssignments: {
    evaluatorId: mongoose.Types.ObjectId;      // Evaluator user
    assignedAt: Date;                          // When assigned
    assignedBy: mongoose.Types.ObjectId;       // Admin who assigned
    status: 'pending' | 'in-progress' | 'completed';  // Evaluation status
  }[];
  createdBy: mongoose.Types.ObjectId;         // Admin who created group
  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

#### 1. Get All Groups
```
GET /api/admin/capstone-group?courseId=xxx&supervisorId=xxx
```
Returns all groups with populated student, supervisor, evaluator, and course data.

**Query Parameters:**
- `courseId` (optional) - Filter by course
- `supervisorId` (optional) - Filter by supervisor

#### 2. Get Single Group
```
GET /api/admin/capstone-group/:id
```
Returns detailed information about a specific group.

#### 3. Create Group
```
POST /api/admin/capstone-group
```
Create a new capstone group.

**Request Body:**
```json
{
  "courseId": "course_id",
  "groupName": "AI Recommendation System",
  "groupNumber": 1,
  "description": "Group project description",
  "studentIds": ["student_id_1", "student_id_2"],
  "supervisorId": "supervisor_id"
}
```

**Validations:**
- Course must exist
- Supervisor must exist
- All students must exist
- At least one student required

#### 4. Update Group
```
PUT /api/admin/capstone-group/:id
```
Update group information (name, description, students, supervisor).

**Request Body:**
```json
{
  "groupName": "Updated Name",
  "description": "Updated description",
  "studentIds": ["student_id_1", "student_id_2", "student_id_3"],
  "supervisorId": "supervisor_id"
}
```

#### 5. Delete Group
```
DELETE /api/admin/capstone-group/:id
```
Delete a group and all its evaluator assignments.

#### 6. Assign Evaluator
```
POST /api/admin/capstone-group/:id/assign-evaluator
```
Assign an evaluator to evaluate a group.

**Request Body:**
```json
{
  "evaluatorId": "user_id"
}
```

**Validations:**
- Evaluator must exist
- Evaluator cannot be assigned twice to same group

#### 7. Remove Evaluator
```
DELETE /api/admin/capstone-group/:id/assign-evaluator/:evaluatorId
```
Remove an evaluator from a group.

## UI Components

### GroupManagement Component

Located in: `app/admin/dashboard/components/GroupManagement.tsx`

#### Features:
1. **Group List** - Display all groups with filtering options
2. **Create Group Dialog** - Form to create new groups
3. **Edit Group Dialog** - Update existing group information
4. **Evaluator Assignment Dialog** - Assign evaluators to groups
5. **Filters** - Filter by course and supervisor

#### State Management:
- `groups` - List of all groups
- `selectedGroup` - Currently selected group for editing/evaluator assignment
- `formData` - Form state for create/edit
- `evaluatorForm` - Form state for evaluator assignment
- `courseStudents` - Students in selected course
- `filterCourse`, `filterSupervisor` - Filter criteria

#### Key Functions:
- `loadGroups()` - Fetch groups from API
- `loadDropdowns()` - Load courses and users
- `loadStudentsForCourse()` - Load students for selected course
- `handleSubmit()` - Create/update group
- `handleDeleteGroup()` - Delete a group
- `handleAssignEvaluator()` - Assign evaluator to group
- `handleRemoveEvaluator()` - Remove evaluator from group

### Integration in CapstoneManagement

The GroupManagement component is integrated as a new tab in the existing CapstoneManagement component:

```tsx
<TabsTrigger value="groups" className="flex items-center gap-2">
  <FolderOpen className="h-4 w-4" />
  Groups
</TabsTrigger>
```

Accessible in the admin dashboard at the "Groups" tab alongside "Student Assignments" and "Capstone Marks".

## Usage Workflow

### For Administrators:

1. **Create a Group**
   - Click "Create Group" button
   - Select capstone course
   - Enter group name and optional group number
   - Select students from the course
   - Select supervisor
   - Submit form

2. **Assign Evaluators**
   - Find the group in the list
   - Click "Assign Evaluator" button
   - Select evaluator from dropdown
   - Confirm assignment

3. **Monitor Evaluations**
   - View evaluator status (pending, in-progress, completed)
   - Edit group details if needed
   - Remove evaluators if necessary
   - Delete group if no longer needed

### For Evaluators:

Once assigned to a group:
1. Navigate to capstone evaluation page
2. Find their assigned groups
3. Submit marks for the group
4. Marks are recorded with assignment status updated

## Database Indexes

The CapstoneGroup model includes optimized indexes:

```typescript
// Query by course
CapstoneGroupSchema.index({ courseId: 1 });

// Query groups by course and supervisor
CapstoneGroupSchema.index({ courseId: 1, supervisorId: 1 });

// Query by evaluator
CapstoneGroupSchema.index({ 'evaluatorAssignments.evaluatorId': 1 });

// Sort by creation date
CapstoneGroupSchema.index({ createdAt: -1 });
```

## Error Handling

All API endpoints include comprehensive error handling:

- **401** - Unauthorized (must be admin)
- **400** - Bad request (missing/invalid data)
- **404** - Resource not found
- **500** - Server error

Error messages are returned in response with descriptive text for debugging.

## Integration with Existing Systems

### CapstoneMarks Model
- Groups reference students in `studentIds`
- Individual marks are still recorded per student in CapstoneMarks
- Group context can be added to marks submission flow

### Course Model
- Groups belong to specific capstone courses
- Course must exist before creating groups
- Supports multiple groups per course

### User Model
- Supervisors and evaluators are User objects
- Role-based access control ensures only admins can manage groups

## Future Enhancements

1. **Group-level Marks** - Store marks at group level instead of individual student level
2. **Evaluation Rubric** - Define rubrics for evaluator assessment
3. **Deadline Management** - Set submission deadlines per group
4. **File Management** - Attach group project files/submissions
5. **Export Reports** - Generate evaluation reports for groups
6. **Notifications** - Notify evaluators when assigned to groups
7. **Group Communication** - Add messaging for supervisor-evaluator coordination

## Security Considerations

- Only authenticated admin users can perform operations
- All inputs are validated before database operations
- Referential integrity maintained through MongoDB indexes
- User roles are verified on every request
- No sensitive data exposed in API responses

## Troubleshooting

### Common Issues:

1. **"Course not found"**
   - Ensure capstone course exists in system
   - Verify course is marked as capstone type

2. **"Evaluator already assigned"**
   - Same evaluator cannot be assigned twice to one group
   - Remove evaluator first if reassigning

3. **"One or more students not found"**
   - Verify all selected students exist in system
   - Check student is enrolled in course

4. **Groups not displaying**
   - Verify API route `/api/admin/capstone-group` is accessible
   - Check admin authentication status
   - Review browser console for network errors

## File Structure

```
ulab-mms/
├── models/
│   └── CapstoneGroup.ts          # Database model
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── capstone-group/
│   │           ├── route.ts      # GET/POST all groups
│   │           └── [id]/
│   │               ├── route.ts  # GET/PUT/DELETE single group
│   │               └── assign-evaluator/
│   │                   ├── route.ts           # POST evaluator assignment
│   │                   └── [evaluatorId]/
│   │                       └── route.ts       # DELETE evaluator assignment
│   └── admin/
│       └── dashboard/
│           └── components/
│               ├── CapstoneManagement.tsx     # Main component with tabs
│               └── GroupManagement.tsx        # Group management sub-component
```

