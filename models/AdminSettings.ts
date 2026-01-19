import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminSettings extends Document {
  passwordHash: string;
  username: string; // Always 'admin'
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      default: 'admin',
    },
    passwordHash: {
      type: String,
      required: false, // Not required initially - will prompt to set on first login
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings: Model<IAdminSettings> =
  mongoose.models.AdminSettings || mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);

export default AdminSettings;
