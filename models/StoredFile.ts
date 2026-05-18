import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoredFile extends Document {
  filename: string;
  originalName: string;
  folderId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  fileSize: number;
  mimeType: string;
  fileData: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const StoredFileSchema: Schema = new Schema(
  {
    filename: {
      type: String,
      required: [true, 'Please provide a filename'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Please provide the original filename'],
      trim: true,
    },
    folderId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceFolder',
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileData: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StoredFile: Model<IStoredFile> =
  mongoose.models.StoredFile ||
  mongoose.model<IStoredFile>('StoredFile', StoredFileSchema);
