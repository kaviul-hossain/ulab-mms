# Capstone Group Management - System Architecture Diagram

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Capstone Management Component                    │   │
│  │  ┌────────────┬────────────┬──────────────┐             │   │
│  │  │ Assignments│   Groups   │ Marks        │             │   │
│  │  │    Tab     │    Tab     │ Tab          │             │   │
│  │  └────────────┼────────────┼──────────────┘             │   │
│  │               │ (NEW)                                     │   │
│  │               ▼                                           │   │
│  │  ┌──────────────────────────────┐                       │   │
│  │  │  GroupManagement Component   │                       │   │
│  │  │  ┌────────────────────────┐  │                       │   │
│  │  │  │ Create/Edit Groups     │  │                       │   │
│  │  │  │ Assign Evaluators      │  │                       │   │
│  │  │  │ Filter Groups          │  │                       │   │
│  │  │  │ Delete Groups          │  │                       │   │
│  │  │  └────────────────────────┘  │                       │   │
│  │  └──────────────┬────────────────┘                       │   │
│  └─────────────────┼──────────────────────────────────────┘   │
│                    │                                             │
└────────────────────┼─────────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
   [GET]         [POST]         [PUT/DELETE]
    /api/         /api/            /api/
    admin/        admin/           admin/
  capstone-     capstone-       capstone-
   group         group            group
                                   /:id
```

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                              │
│                                                                    │
│  GroupManagement.tsx                                              │
│  ├─ State Management (React Hooks)                               │
│  │  ├─ groups: CapstoneGroup[]                                   │
│  │  ├─ selectedGroup: CapstoneGroup | null                       │
│  │  ├─ formData: GroupFormData                                   │
│  │  └─ courseStudents: Student[]                                 │
│  │                                                                │
│  ├─ Dialogs                                                       │
│  │  ├─ Create/Edit Group Dialog                                  │
│  │  └─ Assign Evaluator Dialog                                   │
│  │                                                                │
│  ├─ Components                                                    │
│  │  ├─ Group List Cards                                          │
│  │  ├─ Filter Controls                                           │
│  │  └─ Status Badges                                             │
│  │                                                                │
│  └─ API Calls (via fetch)                                        │
│     ├─ loadGroups()                                              │
│     ├─ handleSubmit()                                            │
│     ├─ handleDeleteGroup()                                       │
│     └─ handleAssignEvaluator()                                   │
└────────────────────────────────────────────────────────────────────┘
                             │
                             │ (HTTP)
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                  │
│                    (Next.js Route Handlers)                        │
│                                                                    │
│  /api/admin/capstone-group                                        │
│  ├─ GET: Fetch groups with optional filters                      │
│  │   └─ Validates: Admin token                                   │
│  │   └─ Returns: Array of CapstoneGroup                          │
│  │                                                                │
│  └─ POST: Create new group                                       │
│      └─ Validates: Admin, course, supervisor, students exist     │
│      └─ Returns: Created CapstoneGroup (201)                     │
│                                                                    │
│  /api/admin/capstone-group/:id                                    │
│  ├─ GET: Fetch single group with details                         │
│  ├─ PUT: Update group information                                │
│  └─ DELETE: Delete group                                         │
│                                                                    │
│  /api/admin/capstone-group/:id/assign-evaluator                  │
│  ├─ POST: Assign evaluator to group                              │
│  │   └─ Validates: Evaluator not already assigned                │
│  │                                                                │
│  └─ DELETE: Remove evaluator from group                          │
│      /[evaluatorId]                                              │
│                                                                    │
│  Authentication: JWT Token-based                                 │
│  Authorization: Admin-only                                       │
│  Error Handling: Comprehensive with proper HTTP status           │
└────────────────────────────────────────────────────────────────────┘
                             │
                             │ (MongoDB Driver)
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                              │
│                     (MongoDB + Mongoose)                          │
│                                                                    │
│  Collections:                                                     │
│  ├─ CapstoneGroup                                                │
│  │  ├─ _id: ObjectId                                             │
│  │  ├─ courseId: ObjectId (ref: Course)                          │
│  │  ├─ groupName: string                                         │
│  │  ├─ groupNumber: number (optional)                            │
│  │  ├─ description: string (optional)                            │
│  │  ├─ studentIds: [ObjectId] (ref: Student)                     │
│  │  ├─ supervisorId: ObjectId (ref: User)                        │
│  │  ├─ evaluatorAssignments: [                                   │
│  │  │   {                                                        │
│  │  │     evaluatorId: ObjectId (ref: User)                      │
│  │  │     assignedAt: Date                                       │
│  │  │     assignedBy: ObjectId (ref: User)                       │
│  │  │     status: 'pending'|'in-progress'|'completed'           │
│  │  │   }                                                        │
│  │  │ ]                                                          │
│  │  ├─ createdBy: ObjectId (ref: User)                           │
│  │  ├─ createdAt: Date                                           │
│  │  └─ updatedAt: Date                                           │
│  │                                                                │
│  ├─ Course (existing)                                            │
│  ├─ Student (existing)                                           │
│  └─ User (existing)                                              │
│                                                                    │
│  Indexes:                                                         │
│  ├─ courseId: 1                                                  │
│  ├─ courseId: 1, supervisorId: 1                                 │
│  ├─ evaluatorAssignments.evaluatorId: 1                          │
│  └─ createdAt: -1                                                │
└────────────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN USER                                                         │
│                                                                     │
│  1. Login to Admin Dashboard                                        │
│     └─ Authenticate with admin credentials                         │
│                                                                     │
│  2. Navigate to Capstone Management                                 │
│     └─ View: Student Assignments | Groups | Marks tabs              │
│                                                                     │
│  3. Click "Groups" Tab                                              │
│     └─ Load: List of existing groups with filters                   │
│                                                                     │
│  4. Choose Action:                                                  │
│     │                                                               │
│     ├─ A. CREATE GROUP                                              │
│     │   ├─ Click "Create Group" button                              │
│     │   ├─ Fill form: Course, Name, Students, Supervisor            │
│     │   ├─ Submit form                                              │
│     │   └─ Receive: Success notification, group appears in list     │
│     │                                                               │
│     ├─ B. EDIT GROUP                                                │
│     │   ├─ Click Edit icon on group card                            │
│     │   ├─ Modify: Name, Students, Supervisor                       │
│     │   ├─ Submit form                                              │
│     │   └─ Receive: Success notification, list updated              │
│     │                                                               │
│     ├─ C. ASSIGN EVALUATOR                                          │
│     │   ├─ Click "Assign Evaluator" on group card                   │
│     │   ├─ Select evaluator from dropdown                           │
│     │   ├─ Submit assignment                                        │
│     │   └─ Receive: Success notification, evaluator added to list   │
│     │                                                               │
│     ├─ D. REMOVE EVALUATOR                                          │
│     │   ├─ Click X button next to evaluator name                    │
│     │   └─ Receive: Success notification, evaluator removed         │
│     │                                                               │
│     └─ E. DELETE GROUP                                              │
│         ├─ Click Delete icon on group card                          │
│         ├─ Confirm deletion                                         │
│         └─ Receive: Success notification, group removed from list   │
│                                                                     │
│  5. Filter Groups (Optional)                                        │
│     ├─ Select Course filter                                         │
│     ├─ Select Supervisor filter                                     │
│     └─ View: Filtered results                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Group Lifecycle

```
┌──────────────┐
│  NOT CREATED │
└──────┬───────┘
       │ Admin clicks "Create Group"
       ▼
┌──────────────────┐
│  CREATED         │  Status: New group with students and supervisor
│  (Group exists)  │
└──────┬───────────┘
       │ Admin clicks "Assign Evaluator"
       ▼
┌──────────────────────────────────────┐
│ EVALUATOR ASSIGNED (Pending)         │  Status: Evaluator assigned, not yet started
│ (Ready for evaluation)               │  evaluatorAssignments[].status = 'pending'
└──────┬───────────────────────────────┘
       │ Evaluator starts evaluation
       ▼
┌──────────────────────────────────────┐
│ EVALUATOR IN PROGRESS                │  Status: Evaluation in process
│ (Evaluation ongoing)                 │  evaluatorAssignments[].status = 'in-progress'
└──────┬───────────────────────────────┘
       │ Evaluator submits marks
       ▼
┌──────────────────────────────────────┐
│ EVALUATOR COMPLETED                  │  Status: Evaluation complete
│ (Evaluation complete)                │  evaluatorAssignments[].status = 'completed'
└──────┬───────────────────────────────┘
       │ (Optional: Assign another evaluator)
       │ or (Delete group)
       ▼
┌──────────────┐
│  DELETED     │  All data removed from system
└──────────────┘
```

## Data Relationships

```
┌─────────────────────┐
│   CapstoneGroup     │
├─────────────────────┤
│ _id                 │
│ courseId ──────────┐
│ groupName           │
│ studentIds ──────┐  │
│ supervisorId ──┐ │  │
│ evaluator      │ │  │
│ Assignments ─┐ │ │  │
│ createdBy  ┐ │ │ │  │
└─────────────┼─┼─┼─┼──┘
              │ │ │ │
    ┌─────────┘ │ │ │
    │           │ │ │
    │    ┌──────┘ │ │
    │    │        │ │
    │    │   ┌────┘ │
    │    │   │      │
    │    │   │  ┌───┘
    │    │   │  │
    ▼    ▼   ▼  ▼
┌─────┐ ┌────────┐ ┌──────────┐ ┌────────┐
│User │ │ Course │ │ Student  │ │ User   │
├─────┤ ├────────┤ ├──────────┤ │(Admin) │
│_id  │ │_id     │ │_id       │ ├────────┤
│name │ │code    │ │name      │ │_id     │
│role │ │name    │ │studentId │ │name    │
└─────┘ │sems    │ └──────────┘ └────────┘
        └────────┘
        (Supervisor)
        (Evaluator)
```

## API Request/Response Examples

### Create Group Request
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "groupName": "AI Recommendation System",
  "groupNumber": 1,
  "description": "ML-based recommendation engine",
  "studentIds": [
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ],
  "supervisorId": "507f1f77bcf86cd799439015"
}
```

### Group Response
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "courseId": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Capstone Project A",
    "code": "CSE4098A"
  },
  "groupName": "AI Recommendation System",
  "groupNumber": 1,
  "description": "ML-based recommendation engine",
  "studentIds": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ali Ahmed",
      "studentId": "21-10234"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Sara Khan",
      "studentId": "21-10456"
    }
  ],
  "supervisorId": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Dr. John Smith",
    "email": "john@university.edu"
  },
  "evaluatorAssignments": [
    {
      "evaluatorId": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Prof. Jane Doe",
        "email": "jane@university.edu"
      },
      "assignedAt": "2024-01-15T10:30:00Z",
      "assignedBy": "507f1f77bcf86cd799439018",
      "status": "pending"
    }
  ],
  "createdBy": "507f1f77bcf86cd799439018",
  "createdAt": "2024-01-15T10:25:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Error States and Handling

```
┌─────────────────────────────────────────┐
│     ERROR SCENARIOS                     │
├─────────────────────────────────────────┤
│                                         │
│ 401 Unauthorized                        │
│ ├─ Cause: Not admin or token invalid    │
│ └─ Response: {error: "Unauthorized"}    │
│                                         │
│ 400 Bad Request                         │
│ ├─ Cause: Missing/invalid fields        │
│ └─ Response: {error: "Missing..."}      │
│                                         │
│ 404 Not Found                           │
│ ├─ Cause: Resource doesn't exist        │
│ └─ Response: {error: "Not found"}       │
│                                         │
│ 409 Conflict                            │
│ ├─ Cause: Duplicate evaluator           │
│ └─ Response: {error: "Already..."}      │
│                                         │
│ 500 Server Error                        │
│ ├─ Cause: Database/server issue         │
│ └─ Response: {error: "Failed..."}       │
│                                         │
└─────────────────────────────────────────┘
```

This architecture ensures scalability, maintainability, and security while providing a smooth user experience for administrators managing capstone groups.

