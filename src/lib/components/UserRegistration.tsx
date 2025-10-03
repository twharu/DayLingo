'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserRegistrationProps {
  isOpen: boolean;
  onComplete: (userId: string) => void;
  onClose?: () => void;
}

export default function UserRegistration({ isOpen, onComplete, onClose }: UserRegistrationProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'welcome' | 'register' | 'anonymous'>('welcome');

  const generateUserId = (): string => {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('請輸入您的名字或暱稱');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = generateUserId();
      
      // 儲存用戶資料到 Firebase
      await addDoc(collection(db, 'users'), {
        userId,
        name: name.trim(),
        email: email.trim() || null,
        registeredAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        usageCount: 0
      });

      // 儲存到 localStorage
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', name.trim());
      if (email.trim()) {
        localStorage.setItem('userEmail', email.trim());
      }

      onComplete(userId);
    } catch (error) {
      console.error('註冊失敗:', error);
      setError('註冊失敗，請稍後再試');
    }
    setLoading(false);
  };

  const handleAnonymous = () => {
    const userId = generateUserId();
    const anonymousName = `訪客${Date.now().toString().slice(-4)}`;
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', anonymousName);
    localStorage.setItem('isAnonymous', 'true');
    
    onComplete(userId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        
        {/* 歡迎步驟 */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                歡迎使用日語學習 APP！
              </h2>
              <p className="text-gray-600">
                讓我們開始您的日語學習旅程
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep('register')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                建立帳戶 (推薦)
              </button>
              
              <button
                onClick={() => setStep('anonymous')}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                訪客模式
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              建立帳戶可以保存學習進度和接收學習提醒
            </p>
          </div>
        )}

        {/* 註冊步驟 */}
        {step === 'register' && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">建立帳戶</h2>
              <p className="text-gray-600 text-sm">只需要幾秒鐘</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  您的名字或暱稱 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：小明、Yuki 等"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (可選)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="用於學習提醒 (可留空)"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  提供 Email 可以接收每日學習提醒
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setStep('welcome')}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                返回
              </button>
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '建立中...' : '開始學習'}
              </button>
            </div>
          </div>
        )}

        {/* 匿名確認步驟 */}
        {step === 'anonymous' && (
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🕶️</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">訪客模式</h2>
              <p className="text-gray-600 text-sm">
                您可以立即開始使用，但學習進度只會保存在本設備上
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ 訪客模式限制：
              </p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• 學習進度不會同步到雲端</li>
                <li>• 無法接收學習提醒</li>
                <li>• 更換設備會遺失進度</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAnonymous}
                className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                繼續使用訪客模式
              </button>
              
              <button
                onClick={() => setStep('register')}
                className="w-full text-blue-600 py-2 px-4 hover:bg-blue-50 transition-colors"
              >
                我想建立帳戶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}