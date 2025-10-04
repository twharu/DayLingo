'use client';

import { useState } from 'react';
import {
  validateTaskName,
  validateTaskDescription,
  validateCategory,
  validateDate
} from '@/lib/inputValidator';

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  onSubmit: (formData: {
    selectedDate: string;
    selectedCategory: string;
    taskName: string;
    taskDescription: string;
  }) => void;
  loading?: boolean;
}

export default function TaskDrawer({ isOpen, onClose, selectedDate, onSubmit, loading = false }: TaskDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [errors, setErrors] = useState<{
    category?: string;
    taskName?: string;
    taskDescription?: string;
    date?: string;
  }>({});

  const categories = [
    '日常',
    '購物',
    '學校',
    '文件申辦',
    '工作'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的錯誤
    setErrors({});

    // 驗證所有欄位
    const dateValidation = validateDate(selectedDate);
    const categoryValidation = validateCategory(selectedCategory, categories);
    const nameValidation = validateTaskName(taskName);
    const descriptionValidation = validateTaskDescription(taskDescription);

    // 收集錯誤
    const newErrors: typeof errors = {};
    if (!dateValidation.isValid) {
      newErrors.date = dateValidation.error;
    }
    if (!categoryValidation.isValid) {
      newErrors.category = categoryValidation.error;
    }
    if (!nameValidation.isValid) {
      newErrors.taskName = nameValidation.error;
    }
    if (!descriptionValidation.isValid) {
      newErrors.taskDescription = descriptionValidation.error;
    }

    // 如果有錯誤，顯示並停止提交
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 使用清理後的資料提交
    onSubmit({
      selectedDate: dateValidation.sanitized!,
      selectedCategory: categoryValidation.sanitized!,
      taskName: nameValidation.sanitized!,
      taskDescription: descriptionValidation.sanitized!
    });
  };

  const handleClose = () => {
    // 清空表單和錯誤
    setSelectedCategory('');
    setTaskName('');
    setTaskDescription('');
    setErrors({});
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
            {/* 1. 選擇日期 */}
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-3">
                日期 <span className="text-red-500">*</span>
              </label>
              <div className={`p-4 rounded-lg ${errors.date ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={errors.date ? 'text-red-800 font-medium' : 'text-blue-800 font-medium'}>
                  {new Date(selectedDate).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
              {errors.date && (
                <p className="mt-2 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* 2. 任務分類標籤 */}
            <div>
              <label htmlFor="category" className="block text-lg font-medium text-gray-700 mb-3">
                任務分類 <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (errors.category) {
                    setErrors({ ...errors, category: undefined });
                  }
                }}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:border-transparent text-lg ${
                  errors.category
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                required
              >
                <option value="">請選擇分類...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-2 text-sm text-red-600">{errors.category}</p>
              )}
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
                onChange={(e) => {
                  setTaskName(e.target.value);
                  if (errors.taskName) {
                    setErrors({ ...errors, taskName: undefined });
                  }
                }}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:border-transparent text-lg ${
                  errors.taskName
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="例如：去商店街、跟朋友見面、去銀行辦事等..."
                required
              />
              {errors.taskName && (
                <p className="mt-2 text-sm text-red-600">{errors.taskName}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">1-100 字元</p>
            </div>

            {/* 4. 任務詳細描述 */}
            <div>
              <label htmlFor="taskDescription" className="block text-lg font-medium text-gray-700 mb-3">
                任務詳細描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="taskDescription"
                value={taskDescription}
                onChange={(e) => {
                  setTaskDescription(e.target.value);
                  if (errors.taskDescription) {
                    setErrors({ ...errors, taskDescription: undefined });
                  }
                }}
                className={`w-full p-4 border rounded-lg focus:ring-2 focus:border-transparent text-lg ${
                  errors.taskDescription
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={4}
                placeholder="請詳細描述這個任務的情境、目的、可能遇到的狀況等..."
                required
              />
              {errors.taskDescription && (
                <p className="mt-2 text-sm text-red-600">{errors.taskDescription}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">5-100 字元</p>
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
                disabled={loading || !selectedDate || !selectedCategory || !taskName.trim() || !taskDescription.trim()}
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