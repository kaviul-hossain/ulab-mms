import { NextResponse } from 'next/server';
import { getAppVersion } from '@/lib/version';

export async function GET() {
  const version = getAppVersion();

  return NextResponse.json(
    {
      version,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}