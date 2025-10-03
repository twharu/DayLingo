import { Resend } from 'resend';

const resend = process.env.NEXT_PUBLIC_TEST_MODE === 'true' 
  ? null 
  : new Resend(process.env.RESEND_API_KEY);

export async function sendDailyReminder(email: string, userName?: string) {
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || !resend) {
    console.log(`[TEST MODE] 發送每日提醒 Email 到: ${email}`);
    return { success: true, message: 'Test mode - email not sent' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Japanese Learning App <no-reply@jp-twharu.vercel.app>',
      to: [email],
      subject: '🌅 早安！今天的日語學習時間到了',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">おはようございます！${userName ? userName : ''}さん</h2>
          
          <p>今天又是學習日語的好日子！</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">今日建議：</h3>
            <ul style="color: #6B7280;">
              <li>設定一個新的學習任務</li>
              <li>複習昨天學過的單字</li>
              <li>練習一段日常對話</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jp-twharu.vercel.app" 
               style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              開始今天的學習 →
            </a>
          </div>
          
          <p style="color: #9CA3AF; font-size: 14px;">
            不想收到提醒？<a href="https://jp-twharu.vercel.app/settings">點此設定</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send daily reminder:', error);
    return { success: false, error };
  }
}

export async function sendTaskDeadlineReminder(
  email: string, 
  taskName: string, 
  deadline: string,
  userName?: string
) {
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true' || !resend) {
    console.log(`[TEST MODE] 發送任務提醒 Email 到: ${email}, 任務: ${taskName}`);
    return { success: true, message: 'Test mode - email not sent' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Japanese Learning App <no-reply@jp-twharu.vercel.app>',
      to: [email],
      subject: `⏰ 任務提醒：${taskName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">📚 任務提醒</h2>
          
          <p>こんにちは！${userName ? userName : ''}さん</p>
          
          <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0;">
            <h3 style="color: #DC2626; margin-top: 0;">即將到期的任務：</h3>
            <p style="font-size: 18px; font-weight: bold; color: #374151;">${taskName}</p>
            <p style="color: #6B7280;">截止時間：${deadline}</p>
          </div>
          
          <p>現在就開始完成這個任務吧！</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jp-twharu.vercel.app/" 
               style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              開始學習 →
            </a>
          </div>
          
          <p style="color: #9CA3AF; font-size: 14px;">
            加油！頑張って！
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send task reminder:', error);
    return { success: false, error };
  }
}