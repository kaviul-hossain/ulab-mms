import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, email, issue, type } = await request.json();

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue description is required' },
        { status: 400 }
      );
    }

    const actionUrl = process.env.GOOGLE_FORM_ACTION_URL;
    const entryName = process.env.GOOGLE_FORM_ENTRY_NAME;
    const entryEmail = process.env.GOOGLE_FORM_ENTRY_EMAIL;
    const entryType = process.env.GOOGLE_FORM_ENTRY_TYPE;
    const entryIssue = process.env.GOOGLE_FORM_ENTRY_ISSUE;

    if (!actionUrl || !entryName || !entryEmail || !entryType || !entryIssue) {
      console.warn('Google Form integration missing environment variables.');
      return NextResponse.json(
        { 
          error: 'Bug reporting is not fully configured yet.',
          details: 'Missing Google Form environment variables.'
        },
        { status: 500 }
      );
    }

    // Google Forms expects form-urlencoded data
    const formData = new URLSearchParams();
    formData.append(entryName, name);
    formData.append(entryEmail, email);
    formData.append(entryType, type || 'Bugs');
    formData.append(entryIssue, issue);

    // Forward to Google Forms
    const response = await fetch(actionUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Google Forms usually responds with HTML (the "Thanks for submitting" page)
    // or redirects. We just need to know it didn't throw a major error.
    if (!response.ok) {
      console.error('Failed to submit to Google Form:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to submit bug report to external service' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Bug report submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
