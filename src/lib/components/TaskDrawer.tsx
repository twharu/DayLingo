'use client';

import { useState } from 'react';

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSubmit: (formData: {
    selectedDate: string;
    selectedTime: string;
    selectedCategory: string;
    taskName: string;
    taskDescription: string;
    reminderEnabled: boolean;
    reminderMinutesBefore: number;
  }) => void;
  loading?: boolean;
}

export default function TaskDrawer({ isOpen, onClose, selectedDate, onSubmit, loading = false }: TaskDrawerProps) {
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30);

  const categories = [
    '日常',
    '購物',
    '學校',
    '文件申辦',
    '工作'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedCategory || !taskName.trim() || !taskDescription.trim()) {
      alert('請填寫所有必填欄位');
      return;
    }

    onSubmit({
      selectedDate,
      selectedTime,
      selectedCategory,
      taskName,
      taskDescription,
      reminderEnabled,
      reminderMinutesBefore
    });
  };

  const handleClose = () => {
    // 清空表單
    setSelectedTime('09:00');
    setSelectedCategory('');
    setTaskName('');
    setTaskDescription('');
    setReminderEnabled(true);
    setReminderMinutesBefore(30);
    onClose();
  };

  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleClose}
        />
      )}

      {/* 抽屜內容 */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        max-h-[90vh] overflow-y-auto
      `}>
        {/* 拖拽指示器 */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">建立任務</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表單內容 */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 選擇日期和時間 */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                選擇日期和時間 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">
                    {new Date(selectedDate).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    時間
                  </label>
                  <div className="flex space-x-4">
                    {/* 小時選擇 */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">小時</label>
                      <select
                        value={selectedTime.split(':')[0]}
                        onChange={(e) => {
                          const minute = selectedTime.split(':')[1];
                          setSelectedTime(`${e.target.value}:${minute}`);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        required
                      >
                        {Array.from({length: 24}, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <option key={hour} value={hour}>
                              {hour}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    {/* 分鐘選擇 */}
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">分鐘</label>
                      <select
                        value={selectedTime.split(':')[1]}
                        onChange={(e) => {
                          const hour = selectedTime.split(':')[0];
                          setSelectedTime(`${hour}:${e.target.value}`);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        required
                      >
                        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(minute => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 提醒設定 */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                提醒設定
              </label>
              <div className="space-y-4">
                {/* 是否啟用提醒 */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="reminderEnabled" className="ml-3 text-gray-700">
                    任務前發送 Email 提醒
                  </label>
                </div>
                
                {/* 提前提醒時間 */}
                {reminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提前提醒時間
                    </label>
                    <select
                      value={reminderMinutesBefore}
                      onChange={(e) => setReminderMinutesBefore(parseInt(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={15}>15 分鐘前</option>
                      <option value={30}>30 分鐘前</option>
                      <option value={60}>1 小時前</option>
                      <option value={120}>2 小時前</option>
                      <option value={360}>6 小時前</option>
                      <option value={1440}>1 天前</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      將在任務開始前發送提醒 Email
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. 任務分類標籤 */}
            <div>
              <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-3">
                任務分類 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                required
              >
                <option value="">請選擇分類...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 任務名稱 */}
            <div>
              <label htmlFor="taskName" className="block text-lg font-medium text-gray-700 mb-3">
                任務名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="taskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="例如：便利商店購買日用品、餐廳點餐、問路等..."
                required
              />
            </div>

            {/* 4. 任務詳細描述 */}
            <div>
              <label htmlFor="taskDescription" className="block text-lg font-medium text-gray-700 mb-3">
                任務詳細描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                rows={4}
                placeholder="請詳細描述這個任務的情境、目的、可能遇到的狀況等..."
                required
              />
            </div>

            {/* 按鈕區域 */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-4 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-lg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !selectedDate || !selectedTime || !selectedCategory || !taskName.trim() || !taskDescription.trim()}
                className="flex-2 bg-blue-600 text-white py-4 px-8 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
              >
                {loading ? 'AI 生成學習內容中...' : '生成日語學習內容'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部安全區域 */}
        <div className="h-4"></div>
      </div>
    </>
  );
}