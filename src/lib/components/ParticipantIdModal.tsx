'use client';

import { useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ParticipantIdModalProps {
  isOpen: boolean;
  onComplete: (participantId: string) => void;
  onClose?: () => void;
}

export default function ParticipantIdModal({ isOpen, onComplete, onClose }: ParticipantIdModalProps) {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateParticipantId = async (): Promise<string> => {
    // 生成格式：JP2024XXX
    const year = new Date().getFullYear();
    const prefix = `JP${year}`;
    
    // 查詢現有的最大編號
    const q = query(
      collection(db, 'participants'),
      where('participantId', '>=', prefix),
      where('participantId', '<', `${prefix}999`)
    );
    
    const querySnapshot = await getDocs(q);
    let maxNumber = 0;
    
    querySnapshot.forEach((doc) => {
      const id = doc.data().participantId;
      const number = parseInt(id.replace(prefix, ''));
      if (number > maxNumber) {
        maxNumber = number;
      }
    });
    
    const newNumber = maxNumber + 1;
    return `${prefix}${newNumber.toString().padStart(3, '0')}`;
  };

  const handleRegister = async () => {
    if (!email.trim()) {
      setError('請輸入 Email 地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 檢查 email 是否已存在
      const q = query(collection(db, 'participants'), where('email', '==', email.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingParticipant = querySnapshot.docs[0].data();
        setError(`此 Email 已註冊，您的參與者代碼是：${existingParticipant.participantId}`);
        setLoading(false);
        return;
      }

      // 生成新的參與者 ID
      const newParticipantId = await generateParticipantId();
      
      // 儲存到 Firebase
      await addDoc(collection(db, 'participants'), {
        participantId: newParticipantId,
        email: email.trim(),
        registeredAt: new Date().toISOString(),
        usageCount: 0,
        lastUsed: new Date().toISOString()
      });

      // 儲存到 localStorage
      localStorage.setItem('participantId', newParticipantId);
      localStorage.setItem('participantEmail', email.trim());
      
      alert(`註冊成功！您的參與者代碼是：${newParticipantId}\n請記住這個代碼，換裝置時需要輸入。`);
      onComplete(newParticipantId);

    } catch (error) {
      console.error('註冊失敗:', error);
      setError('註冊失敗，請稍後再試');
    }
    
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!participantId.trim()) {
      setError('請輸入參與者代碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'participants'), where('participantId', '==', participantId.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError('找不到此參與者代碼，請檢查輸入是否正確');
        setLoading(false);
        return;
      }

      const participantDoc = querySnapshot.docs[0];
      const participantData = participantDoc.data();
      
      // 更新最後使用時間
      await updateDoc(doc(db, 'participants', participantDoc.id), {
        lastUsed: new Date().toISOString()
      });

      // 儲存到 localStorage
      localStorage.setItem('participantId', participantData.participantId);
      localStorage.setItem('participantEmail', participantData.email);
      
      onComplete(participantData.participantId);

    } catch (error) {
      console.error('登入失敗:', error);
      setError('登入失敗，請稍後再試');
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">研究參與者識別</h2>
          <p className="text-gray-600 mb-6">
            為了追蹤您的學習進度並提供更好的體驗，請選擇以下方式之一：
          </p>

          <div className="flex border-b mb-6">
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 ${
                mode === 'register' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              首次參與
            </button>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 ${
                mode === 'login' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              已有代碼
            </button>
          </div>

          {mode === 'register' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email 地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用於生成您的專屬參與者代碼，不會用於其他目的
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '處理中...' : '獲取參與者代碼'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  參與者代碼 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例：JP2024001"
                  style={{ textTransform: 'uppercase' }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  請輸入您之前獲得的參與者代碼
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '驗證中...' : '繼續使用'}
              </button>
            </div>
          )}

          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">為什麼需要這個？</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 追蹤您的學習進度和使用情況</li>
              <li>• 在不同裝置間保持數據同步</li>
              <li>• 研究分析需要（完全匿名處理）</li>
              <li>• 使用5次後會邀請您填寫回饋問卷</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}