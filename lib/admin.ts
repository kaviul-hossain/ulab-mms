import dbConnect from '@/lib/mongodb';
import AdminSettings from '@/models/AdminSettings';
import bcrypt from 'bcryptjs';

/**
 * Verifies the admin password from the request header
 * @param adminPassword - The password from the x-admin-password header
 * @returns true if password is valid, false otherwise
 */
export async function verifyAdminPassword(adminPassword: string): Promise<boolean> {
  try {
    if (!adminPassword) {
      return false;
    }

    await dbConnect();

    // Get the admin password from database
    const adminSettings = await AdminSettings.findOne();

    if (!adminSettings) {
      console.error('Admin settings not configured');
      return false;
    }

    // Compare password with hash
    const isValid = await bcrypt.compare(adminPassword, adminSettings.passwordHash);
    return isValid;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return false;
  }
}
