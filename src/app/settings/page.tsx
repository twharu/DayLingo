'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Settings() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    email: '',
    userName: '',
    dailyReminderEnabled: true,
    taskReminderEnabled: true,
    dailyReminderTime: '08:00',
    reminderMinutesBefore: 30
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 載入現有設定
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      // 儲存到 localStorage（之後可以改成資料庫）
      localStorage.setItem('emailSettings', JSON.stringify(settings));
      
      // 發送測試 Email
      if (settings.email && settings.dailyReminderEnabled) {
        const response = await fetch('/api/send-reminder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'daily',
            email: settings.email,
            userName: settings.userName
          }),
        });

        if (response.ok) {
          setMessage('✅ 設定已儲存！測試 Email 已發送到您的信箱');
        } else {
          setMessage('⚠️ 設定已儲存，但測試 Email 發送失敗');
        }
      } else {
        setMessage('✅ 設定已儲存！');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage('❌ 儲存設定時發生錯誤');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按鈕 */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="mr-2">←</span>
          返回
        </button>

        {/* 標題 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ 設定</h1>
          <p className="text-gray-600">管理您的 Email 提醒偏好</p>
        </div>

        {/* 設定表單 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📧 基本資訊</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={settings.userName}
                    onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                    placeholder="您的姓名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email 地址
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 每日提醒 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🌅 每日提醒</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="dailyReminder"
                    checked={settings.dailyReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, dailyReminderEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="dailyReminder" className="ml-2 text-sm text-gray-700">
                    啟用每日學習提醒
                  </label>
                </div>
                
                {settings.dailyReminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提醒時間
                    </label>
                    <input
                      type="time"
                      value={settings.dailyReminderTime}
                      onChange={(e) => setSettings({ ...settings, dailyReminderTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      每天會在這個時間發送學習提醒 Email
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 任務提醒 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ 任務提醒</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="taskReminder"
                    checked={settings.taskReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, taskReminderEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="taskReminder" className="ml-2 text-sm text-gray-700">
                    啟用任務到期提醒
                  </label>
                </div>
                
                {settings.taskReminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提前提醒時間
                    </label>
                    <select
                      value={settings.reminderMinutesBefore}
                      onChange={(e) => setSettings({ ...settings, reminderMinutesBefore: parseInt(e.target.value) })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 分鐘前</option>
                      <option value={30}>30 分鐘前</option>
                      <option value={60}>1 小時前</option>
                      <option value={120}>2 小時前</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      任務到期前多久發送提醒 Email
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 儲存按鈕 */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="text-sm text-gray-600">
                {message && (
                  <div className={`p-3 rounded-lg ${
                    message.includes('✅') ? 'bg-green-100 text-green-800' :
                    message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {message}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleSave}
                disabled={isSaving || !settings.email}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? '儲存中...' : '儲存設定'}
              </button>
            </div>
          </div>
        </div>

        {/* 說明 */}
        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <h4 className="font-semibold text-blue-800 mb-2">📝 使用說明</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 每日提醒：每天固定時間發送學習提醒</li>
            <li>• 任務提醒：在您設定的任務到期前發送提醒</li>
            <li>• 點擊「儲存設定」會發送測試 Email 確認功能正常</li>
          </ul>
        </div>
      </div>
    </div>
  );
}