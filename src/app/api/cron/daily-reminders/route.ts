import { NextRequest, NextResponse } from 'next/server';
import { sendDailyReminder } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // 驗證請求來源（只允許 Vercel Cron）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: 從資料庫獲取所有啟用提醒的用戶
    // 目前使用示範資料
    const usersWithReminders = [
      // { email: 'user@example.com', name: '測試用戶', reminderEnabled: true }
    ];

    console.log(`[CRON] 開始發送每日提醒，用戶數量: ${usersWithReminders.length}`);

    const results = [];
    for (const user of usersWithReminders) {
      if (user.reminderEnabled) {
        const result = await sendDailyReminder(user.email, user.name);
        results.push({
          email: user.email,
          success: result.success,
          error: result.error || null
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[CRON] 每日提醒完成 - 成功: ${successCount}, 失敗: ${failCount}`);

    return NextResponse.json({
      success: true,
      message: `Daily reminders sent`,
      stats: { success: successCount, failed: failCount },
      results
    });

  } catch (error) {
    console.error('[CRON] Daily reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to send daily reminders' },
      { status: 500 }
    );
  }
}