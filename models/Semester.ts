import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISemester extends Document {
  name: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SemesterSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    startDate: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

let Semester: Model<ISemester>;

try {
  Semester = mongoose.model<ISemester>('Semester');
} catch {
  Semester = mongoose.model<ISemester>('Semester', SemesterSchema);
}

export default Semester;
