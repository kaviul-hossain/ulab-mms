# Capstone Group Management - Quick Start Guide

## What's New?

A new **Groups** tab has been added to the Capstone Management section in the admin dashboard. This allows admins to:

1. ✅ Create capstone groups with multiple students
2. ✅ Assign supervisors to groups
3. ✅ Assign evaluators to groups for evaluation
4. ✅ Track evaluator assignment status
5. ✅ Edit and delete groups

## Where to Access

1. Navigate to **Admin Dashboard**
2. Click on the **Capstone Management** section
3. Select the **Groups** tab (between "Student Assignments" and "Capstone Marks")

## How to Use

### Creating a Group

1. Click the **"Create Group"** button
2. Fill in the following information:
   - **Course**: Select a capstone course (CSE4098A, CSE4098B, CSE4098C, or CSE499)
   - **Group Name**: Enter a descriptive name (e.g., "AI Recommendation System")
   - **Group Number**: Optional - assign a group number
   - **Description**: Optional - add project description
   - **Supervisor**: Select the faculty member supervising the group
   - **Students**: Select one or more students from the course

3. Click **"Create Group"** to save

### Assigning Evaluators

1. Find the group in the list
2. Click **"Assign Evaluator"** button within the group card
3. Select an evaluator from the dropdown
4. Click **"Assign Evaluator"** to confirm

**Status tracking:**
- **Pending** - Evaluator assigned but hasn't started evaluation
- **In Progress** - Evaluator is evaluating the group
- **Completed** - Evaluation finished

### Editing a Group

1. Click the **Edit** (pencil icon) button on the group card
2. Update the group information
3. Click **"Update Group"** to save changes

### Removing Evaluators

1. Click the **X** button next to an evaluator's name in the group card
2. The evaluator assignment will be removed

### Deleting a Group

1. Click the **Delete** (trash icon) button on the group card
2. Confirm the deletion when prompted

## Filtering Groups

Use the filter options at the top to view groups by:
- **Course** - Filter by capstone course
- **Supervisor** - Filter by assigned supervisor

## Database Structure

Each group contains:
- **Group Information**: Name, number, description, course
- **Students**: List of students in the group
- **Supervisor**: Faculty member overseeing the group
- **Evaluators**: List of assigned evaluators with status
- **Timestamps**: Creation and update dates

## Features

### Complete CRUD Operations
- ✅ Create new groups
- ✅ Read/view group details
- ✅ Update group information
- ✅ Delete groups

### Evaluator Management
- ✅ Assign multiple evaluators per group
- ✅ Track evaluation status
- ✅ Remove evaluators if needed
- ✅ Prevent duplicate assignments

### Search & Filter
- ✅ Filter by course
- ✅ Filter by supervisor
- ✅ View all groups or filter results

### Data Validation
- ✅ Ensures all required fields are filled
- ✅ Verifies course, supervisor, and students exist
- ✅ Prevents duplicate evaluator assignments
- ✅ Validates at least one student per group

## API Endpoints (For Developers)

### Groups Management
```
GET    /api/admin/capstone-group                    # List all groups
POST   /api/admin/capstone-group                    # Create new group
GET    /api/admin/capstone-group/:id                # Get single group
PUT    /api/admin/capstone-group/:id                # Update group
DELETE /api/admin/capstone-group/:id                # Delete group
```

### Evaluator Assignment
```
POST   /api/admin/capstone-group/:id/assign-evaluator              # Assign evaluator
DELETE /api/admin/capstone-group/:id/assign-evaluator/:evaluatorId # Remove evaluator
```

### Query Parameters
- `courseId` - Filter by course ID
- `supervisorId` - Filter by supervisor ID

## Technical Details

### Files Modified/Created
- **Model**: `models/CapstoneGroup.ts` - Database schema
- **UI Component**: `app/admin/dashboard/components/GroupManagement.tsx` - Group management interface
- **Main Component**: `app/admin/dashboard/components/CapstoneManagement.tsx` - Updated with Groups tab
- **API Routes**: `app/api/admin/capstone-group/*` - REST API endpoints
- **Documentation**: `CAPSTONE_GROUP_MANAGEMENT.md` - Detailed documentation

### Database Indexes
The system includes optimized indexes for:
- Fast queries by course
- Fast queries by course and supervisor
- Fast queries by evaluator
- Sorted results by creation date

## Troubleshooting

### Issue: "Course not found"
**Solution**: Make sure the capstone course exists in the system

### Issue: "Evaluator already assigned"
**Solution**: Each evaluator can only be assigned once per group. Remove the evaluator first if reassigning

### Issue: "One or more students not found"
**Solution**: Verify all selected students exist and are enrolled in the selected course

### Issue: Groups not loading
**Solution**: 
- Clear browser cache
- Verify you're logged in as admin
- Check browser console for errors
- Ensure API server is running

## Future Enhancements

Potential features to add:
- Group-level marks aggregation
- Group evaluation rubrics
- Evaluation deadlines
- Group file submissions
- Email notifications for evaluators
- Export group evaluation reports
- Group communication module

## Support

For issues or questions about the Group Management system, refer to:
- `CAPSTONE_GROUP_MANAGEMENT.md` - Comprehensive technical documentation
- Admin dashboard Group tab - UI documentation embedded in the interface
- Error messages in the application - Clear error feedback

