import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminCourse extends Document {
  courseCode: string;
  courseTitle: string;
  creditHour: number;
  prerequisite?: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminCourseSchema: Schema = new Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Please provide a course code'],
      trim: true,
      unique: true,
      index: true,
    },
    courseTitle: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
    },
    creditHour: {
      type: Number,
      required: [true, 'Please provide credit hours'],
      min: 0,
      max: 10,
    },
    prerequisite: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate course codes
AdminCourseSchema.index({ courseCode: 1 }, { unique: true });

const AdminCourse: Model<IAdminCourse> =
  mongoose.models.AdminCourse || mongoose.model<IAdminCourse>('AdminCourse', AdminCourseSchema);

export default AdminCourse;
