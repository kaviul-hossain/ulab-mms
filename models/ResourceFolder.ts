import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResourceFolder extends Document {
  name: string;
  parentId: mongoose.Types.ObjectId | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceFolderSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a folder name'],
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'ResourceFolder',
      default: null,
    },
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

export const ResourceFolder: Model<IResourceFolder> =
  mongoose.models.ResourceFolder ||
  mongoose.model<IResourceFolder>('ResourceFolder', ResourceFolderSchema);
