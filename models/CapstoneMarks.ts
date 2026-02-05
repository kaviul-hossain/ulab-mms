import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICapstoneMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId; // Capstone course (CSE4098A, CSE4098B, etc.)
  supervisorId: mongoose.Types.ObjectId;
  evaluatorId?: mongoose.Types.ObjectId;
  supervisorRole?: 'supervisor' | 'evaluator' | 'both'; // Role assigned by admin
  evaluatorRole?: 'supervisor' | 'evaluator' | 'both'; // Role assigned by admin
  supervisorMarks?: number;
  supervisorComments?: string;
  evaluatorMarks?: number;
  evaluatorComments?: string;
  finalMarks?: number;
  submittedBy: mongoose.Types.ObjectId; // User who submitted the marks
  submissionType: 'supervisor' | 'evaluator';
  assignedBy?: mongoose.Types.ObjectId; // Admin who assigned the student
  createdAt: Date;
  updatedAt: Date;
}

const CapstoneMarsSchema: Schema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    evaluatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    supervisorRole: {
      type: String,
      enum: ['supervisor', 'evaluator', 'both'],
      default: 'supervisor',
    },
    evaluatorRole: {
      type: String,
      enum: ['supervisor', 'evaluator', 'both'],
      default: 'evaluator',
    },
    supervisorMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
      default: null,
    },
    supervisorComments: {
      type: String,
      default: '',
    },
    evaluatorMarks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
      default: null,
    },
    evaluatorComments: {
      type: String,
      default: '',
    },
    finalMarks: {
      type: Number,
      default: null,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submissionType: {
      type: String,
      enum: ['supervisor', 'evaluator'],
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
CapstoneMarsSchema.index({ studentId: 1, courseId: 1, supervisorId: 1 });
CapstoneMarsSchema.index({ supervisorId: 1, courseId: 1 });
CapstoneMarsSchema.index({ evaluatorId: 1, courseId: 1 });
CapstoneMarsSchema.index({ courseId: 1 });

const CapstoneMarks: Model<ICapstoneMarks> =
  mongoose.models.CapstoneMarks || mongoose.model<ICapstoneMarks>('CapstoneMarks', CapstoneMarsSchema);

export default CapstoneMarks;
