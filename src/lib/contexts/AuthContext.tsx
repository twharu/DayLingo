'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  userName: string;
  userEmail?: string;
  userPhotoURL?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化時從 localStorage 載入使用者資料
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      const userPhotoURL = localStorage.getItem('userPhotoURL');

      if (userId && userName) {
        setUser({
          userId,
          userName,
          userEmail: userEmail || undefined,
          userPhotoURL: userPhotoURL || undefined,
        });
      }
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    // 更新狀態
    setUser(userData);

    // 儲存到 localStorage
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userName', userData.userName);
    if (userData.userEmail) {
      localStorage.setItem('userEmail', userData.userEmail);
    }
    if (userData.userPhotoURL) {
      localStorage.setItem('userPhotoURL', userData.userPhotoURL);
    }
  };

  const logout = () => {
    const userId = user?.userId;

    // 清除狀態
    setUser(null);

    // 清除所有 localStorage 資料
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhotoURL');
    localStorage.removeItem('tourCompleted');
    localStorage.removeItem('surveyCompleted');
    localStorage.removeItem('postSurveyCompleted');
    localStorage.removeItem('localUsageCount');

    // 清除動態 key
    if (userId) {
      localStorage.removeItem(`postSurveyTriggered_${userId}`);
      localStorage.removeItem(`usageCount_${userId}`);
      localStorage.removeItem(`lastUsageCheck_${userId}`);
    }

    // 重新載入頁面
    window.location.href = window.location.origin;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
