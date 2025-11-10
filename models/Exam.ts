import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExam extends Document {
  displayName: string; // Renamable display name
  totalMarks: number;
  weightage: number; // Percentage weightage
  scalingEnabled: boolean; // Toggle for scaling
  scalingMethod?: 'bellCurve' | 'linearNormalization' | 'minMaxNormalization' | 'percentile';
  isRequired: boolean; // True for Mid/Final (Theory) or Lab Final/OEL (Lab)
  examType: 'midterm' | 'final' | 'labFinal' | 'oel' | 'custom'; // Type of exam
  numberOfCOs?: number; // For Theory Mid/Final only
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema: Schema = new Schema(
  {
    displayName: {
      type: String,
      required: [true, 'Please provide a display name'],
      trim: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please provide total marks'],
      min: [1, 'Total marks must be at least 1'],
    },
    weightage: {
      type: Number,
      required: [true, 'Please provide weightage'],
      min: [0, 'Weightage cannot be negative'],
      max: [100, 'Weightage cannot exceed 100'],
    },
    scalingEnabled: {
      type: Boolean,
      default: false,
    },
    scalingMethod: {
      type: String,
      enum: ['bellCurve', 'linearNormalization', 'minMaxNormalization', 'percentile'],
      default: null,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    examType: {
      type: String,
      enum: ['midterm', 'final', 'labFinal', 'oel', 'custom'],
      required: true,
    },
    numberOfCOs: {
      type: Number,
      min: [0, 'Number of COs cannot be negative'],
      default: null,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
ExamSchema.index({ courseId: 1 });

const Exam: Model<IExam> =
  mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);

export default Exam;
