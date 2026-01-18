import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  gridfsId: mongoose.Types.ObjectId;
  isFolder: boolean;
  parentFolderId?: mongoose.Types.ObjectId | null;
  folderPath: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema: Schema = new Schema(
  {
    filename: {
      type: String,
      required: [true, 'Please provide a filename'],
      unique: true,
    },
    originalName: {
      type: String,
      required: [true, 'Please provide the original filename'],
    },
    mimeType: {
      type: String,
      required: [true, 'Please provide the MIME type'],
    },
    size: {
      type: Number,
      required: [true, 'Please provide the file size'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide the uploader user ID'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    gridfsId: {
      type: Schema.Types.ObjectId,
    },
    isFolder: {
      type: Boolean,
      default: false,
    },
    parentFolderId: {
      type: Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    folderPath: {
      type: String,
      default: '/',
    },
  },
  {
    timestamps: true,
  }
);

const File: Model<IFile> = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);

export default File;
