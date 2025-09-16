import { NextRequest, NextResponse } from 'next/server';
import { sendTaskDeadlineReminder } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // 驗證請求來源（只允許 Vercel Cron）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    // TODO: 從資料庫獲取即將到期的任務
    // 目前使用示範資料
    const upcomingTasks = [
      // {
      //   userEmail: 'user@example.com',
      //   userName: '測試用戶',
      //   taskName: '購物日語練習',
      //   deadline: '2024-01-01 10:00',
      //   reminderSent: false
      // }
    ];

    console.log(`[CRON] 檢查任務提醒，找到 ${upcomingTasks.length} 個即將到期的任務`);

    const results = [];
    for (const task of upcomingTasks) {
      if (!task.reminderSent) {
        const result = await sendTaskDeadlineReminder(
          task.userEmail,
          task.taskName,
          task.deadline,
          task.userName
        );
        
        results.push({
          taskName: task.taskName,
          email: task.userEmail,
          success: result.success,
          error: result.error || null
        });

        // TODO: 標記提醒已發送到資料庫
        if (result.success) {
          console.log(`[CRON] 任務提醒已發送: ${task.taskName} -> ${task.userEmail}`);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[CRON] 任務提醒完成 - 成功: ${successCount}, 失敗: ${failCount}`);

    return NextResponse.json({
      success: true,
      message: `Task reminders processed`,
      stats: { success: successCount, failed: failCount },
      results
    });

  } catch (error) {
    console.error('[CRON] Task reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process task reminders' },
      { status: 500 }
    );
  }
}