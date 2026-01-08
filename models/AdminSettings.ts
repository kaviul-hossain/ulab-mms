import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminSettings extends Document {
  passwordHash: string;
  updatedAt: Date;
}

const AdminSettingsSchema: Schema = new Schema(
  {
    passwordHash: {
      type: String,
      required: [true, 'Admin password hash is required'],
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings: Model<IAdminSettings> =
  mongoose.models.AdminSettings || mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);

export default AdminSettings;
