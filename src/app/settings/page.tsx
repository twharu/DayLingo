'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTour } from '@/lib/hooks/useTour';

export default function Settings() {
  const router = useRouter();
  const { resetTour } = useTour();
  const [settings, setSettings] = useState({
    email: '',
    userName: '',
    dailyReminderEnabled: true,
    dailyReminderTime: '08:00'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 從 localStorage 載入 Google 帳號資訊
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || '';

    // 載入提醒設定
    const savedSettings = localStorage.getItem('emailSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        email: userEmail, // 使用 Google email，不使用舊設定
        userName: userName, // 使用 Google 名稱
        dailyReminderEnabled: parsed.dailyReminderEnabled ?? true,
        dailyReminderTime: parsed.dailyReminderTime || '08:00'
      });
    } else {
      setSettings({
        email: userEmail,
        userName: userName,
        dailyReminderEnabled: true,
        dailyReminderTime: '08:00'
      });
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
          setMessage('設定已儲存！測試 Email 已發送到您的信箱');
        } else {
          setMessage('設定已儲存，但測試 Email 發送失敗');
        }
      } else {
        setMessage('設定已儲存！');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      setMessage('儲存設定時發生錯誤');
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">設定</h1>
          <p className="text-gray-600">管理您的 Email 和每日學習提醒設定</p>
        </div>

        {/* 設定表單 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-6">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Google 帳號資訊</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {settings.userName || '未設定'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    來自您的 Google 帳號
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email 地址
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {settings.email || '未設定'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    來自您的 Google 帳號
                  </p>
                </div>
              </div>
            </div>

            {/* 每日提醒 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">每日提醒</h3>
              
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

        {/* 其他功能 */}
        <div className="bg-gray-50 rounded-xl p-4 mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">其他功能</h4>
          <button
            onClick={resetTour}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            重新觀看網站導覽
          </button>
          <p className="text-xs text-gray-500 mt-2">
            重新體驗首次使用的引導教學
          </p>
        </div>
      </div>
    </div>
  );
}