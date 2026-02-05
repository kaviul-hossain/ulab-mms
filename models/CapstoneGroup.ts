import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICapstoneGroup extends Document {
  courseId: mongoose.Types.ObjectId;
  groupName: string;
  groupNumber?: number;
  description?: string;
  studentIds: mongoose.Types.ObjectId[]; // Array of student IDs in the group
  supervisorId: mongoose.Types.ObjectId;
  evaluatorAssignments: {
    evaluatorId: mongoose.Types.ObjectId;
    assignedAt: Date;
    assignedBy: mongoose.Types.ObjectId;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  createdBy: mongoose.Types.ObjectId; // Admin who created the group
  createdAt: Date;
  updatedAt: Date;
}

const CapstoneGroupSchema: Schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    groupNumber: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
      },
    ],
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluatorAssignments: [
      {
        evaluatorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        assignedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'in-progress', 'completed'],
          default: 'pending',
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CapstoneGroupSchema.index({ courseId: 1 });
CapstoneGroupSchema.index({ courseId: 1, supervisorId: 1 });
CapstoneGroupSchema.index({ 'evaluatorAssignments.evaluatorId': 1 });
CapstoneGroupSchema.index({ createdAt: -1 });

const CapstoneGroup: Model<ICapstoneGroup> =
  mongoose.models.CapstoneGroup ||
  mongoose.model<ICapstoneGroup>('CapstoneGroup', CapstoneGroupSchema);

export default CapstoneGroup;
