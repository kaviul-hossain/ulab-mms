import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICapstoneMarks extends Document {
  studentId: mongoose.Types.ObjectId;
  supervisorId: mongoose.Types.ObjectId;
  evaluatorId?: mongoose.Types.ObjectId;
  supervisorMarks?: number;
  supervisorComments?: string;
  evaluatorMarks?: number;
  evaluatorComments?: string;
  finalMarks?: number;
  submittedBy: mongoose.Types.ObjectId; // User who submitted the marks
  submissionType: 'supervisor' | 'evaluator';
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
  },
  {
    timestamps: true,
  }
);

// Compound index for student and supervisor
CapstoneMarsSchema.index({ studentId: 1, supervisorId: 1 });
CapstoneMarsSchema.index({ studentId: 1, evaluatorId: 1 });

const CapstoneMarks: Model<ICapstoneMarks> =
  mongoose.models.CapstoneMarks || mongoose.model<ICapstoneMarks>('CapstoneMarks', CapstoneMarsSchema);

export default CapstoneMarks;
