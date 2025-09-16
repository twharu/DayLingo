import { NextRequest, NextResponse } from 'next/server';
import { sendDailyReminder, sendTaskDeadlineReminder } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { type, email, userName, taskName, deadline } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'daily') {
      result = await sendDailyReminder(email, userName);
    } else if (type === 'task-deadline') {
      if (!taskName || !deadline) {
        return NextResponse.json(
          { error: 'Task name and deadline are required for task reminder' },
          { status: 400 }
        );
      }
      result = await sendTaskDeadlineReminder(email, taskName, deadline, userName);
    } else {
      return NextResponse.json(
        { error: 'Invalid reminder type' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}