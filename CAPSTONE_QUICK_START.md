# Capstone Marks Feature - Quick Start Guide

## 🚀 How to Use

### For Users

1. **Access Capstone Feature**
   - Click the "Capstone" button in the dashboard navbar
   - You'll see two options on the main capstone page

2. **Submit as Supervisor**
   - Click "Submit as Supervisor" card
   - Browse your list of supervised students
   - Click "Add Marks" on any student
   - Enter marks (0-100) and optional feedback
   - Click "Submit Marks"
   - View previously submitted marks with edit option

3. **Submit as Evaluator**
   - Click "Submit as Evaluator" card
   - Browse your list of assigned students
   - Click "Add Marks" on any student
   - Enter evaluation marks (0-100) and feedback
   - Click "Submit Marks"

### Features

- 🔍 **Search**: Find students quickly by name or roll number
- ✏️ **Edit**: Update marks anytime before deadline
- 💬 **Comments**: Add detailed feedback with your marks
- ✅ **Status**: Visual indicator when marks are submitted
- 📊 **Auto-Calculate**: Final marks calculated as average of supervisor & evaluator

## 📁 File Structure

```
app/
├── capstone/
│   ├── page.tsx                 # Main capstone page with two options
│   ├── supervisor/
│   │   └── page.tsx            # Supervisor marks submission page
│   └── evaluator/
│       └── page.tsx            # Evaluator marks submission page
├── api/
│   └── capstone/
│       └── route.ts            # API endpoints (GET, POST)
└── dashboard/
    └── page.tsx                # Updated with Capstone button

models/
└── CapstoneMarks.ts           # Mongoose schema for capstone marks

components/ui/
└── textarea.tsx               # New textarea component for comments
```

## 🔌 API Endpoints

### GET /api/capstone
Fetch capstone marks with optional filters

**Query Parameters:**
- `submissionType` (optional): "supervisor" or "evaluator"
- `studentId` (optional): Filter by specific student

**Response:**
```json
[
  {
    "_id": "...",
    "studentId": { "_id": "...", "name": "...", "rollNumber": "..." },
    "supervisorMarks": 85,
    "supervisorComments": "Good work",
    "evaluatorMarks": 90,
    "evaluatorComments": "Excellent project",
    "finalMarks": 87.5,
    "submissionType": "supervisor"
  }
]
```

### POST /api/capstone
Create or update capstone marks

**Request Body:**
```json
{
  "studentId": "...",
  "supervisorId": "...",
  "evaluatorId": "...",
  "supervisorMarks": 85,
  "supervisorComments": "Good work",
  "submissionType": "supervisor"
}
```

## 🎨 UI Elements

- **Main Page**: Landing page with card-based selection
- **Supervisor/Evaluator Pages**: Grid layout with student cards
- **Modal Dialog**: For marks submission with validation
- **Toast Notifications**: User feedback on actions
- **Search Bar**: Quick student lookup
- **Status Badges**: Shows submission status

## ⚙️ Requirements

- Authenticated user session
- Student list in system
- Valid student IDs
- Marks between 0-100

## 🔒 Security

- Session-based authentication required
- User ID stored with submissions
- MongoDB indexes for performance
- Input validation on all fields
- Type-safe TypeScript implementation

## 📝 Example Workflow

```
User Dashboard
    ↓
Click "Capstone" Button
    ↓
Choose Role (Supervisor/Evaluator)
    ↓
View Student List
    ↓
Search/Select Student
    ↓
Enter Marks & Comments
    ↓
Submit (Validation)
    ↓
Success Notification
    ↓
Database Updated
    ↓
Final Marks Calculated (if both submitted)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Marks not saving | Check marks are 0-100 and all required fields filled |
| Students not showing | Verify students are created in system |
| API errors | Check browser console for detailed error messages |
| Permissions denied | Ensure you're logged in with active session |

## 📊 Database

All capstone marks are stored in MongoDB with:
- Automatic timestamps (createdAt, updatedAt)
- Compound indexes for quick lookups
- Foreign key references to users and students

## 🚀 Next Steps

After implementation, you can:
1. Test with sample data
2. Configure marks validation rules
3. Set deadlines for submissions
4. Create reports for grade compilation
5. Add bulk import functionality
