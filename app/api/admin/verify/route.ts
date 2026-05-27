import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key');

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      
      if (payload.type !== 'admin') {
        return NextResponse.json(
          { authenticated: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { authenticated: true, username: 'admin' },
        { status: 200 }
      );
    } catch (err) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 200 }
    );
  }
}
