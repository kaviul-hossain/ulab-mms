import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key');

/**
 * Verifies if the request has a valid admin token
 * @param request - The Next.js request object
 * @returns true if the request has a valid admin token, false otherwise
 */
export async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return false;
    }

    const { payload } = await jwtVerify(token, SECRET);
    
    if (payload.type !== 'admin') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return false;
  }
}
