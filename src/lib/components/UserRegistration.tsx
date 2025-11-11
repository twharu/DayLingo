'use client';

import { useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UserRegistrationProps {
  isOpen: boolean;
  onComplete: (userId: string) => void;
}

export default function UserRegistration({ isOpen, onComplete }: UserRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error('無法獲取 Google 帳號 Email');
      }

      // 檢查用戶是否已存在
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      let userId: string;

      if (!querySnapshot.empty) {
        // 用戶已存在，使用現有 userId
        const existingUser = querySnapshot.docs[0].data();
        userId = existingUser.userId;
      } else {
        // 新用戶，創建記錄
        userId = user.uid; // 使用 Firebase Auth UID

        await addDoc(collection(db, 'users'), {
          userId,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          photoURL: user.photoURL || null,
          registeredAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0,
          authProvider: 'google'
        });
      }

      // 使用 AuthContext 的 login 方法（會自動儲存到 localStorage）
      login({
        userId,
        userName: user.displayName || user.email.split('@')[0],
        userEmail: user.email,
        userPhotoURL: user.photoURL || undefined
      });

      onComplete(userId);
    } catch (error: unknown) {
      console.error('Google 登入失敗:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/popup-closed-by-user') {
          setError('登入視窗已關閉');
        } else if (error.code === 'auth/cancelled-popup-request') {
          setError('登入已取消');
        } else {
          setError('Google 登入失敗，請稍後再試');
        }
      } else {
        setError('Google 登入失敗，請稍後再試');
      }
    }
    setLoading(false);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              歡迎使用DayLingo！
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-base">{loading ? '登入中...' : '使用 Google 帳號登入'}</span>
          </button>

          <p className="text-xs text-gray-500 mt-6">
            登入即表示您同意服務條款和隱私政策<br />
            學習數據將保存到雲端，並且用於研究論文。
          </p>
        </div>
      </div>
    </div>
  );
}