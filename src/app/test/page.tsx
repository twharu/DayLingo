'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  participantId: string;
  email: string;
  usageCount: number;
  registeredAt: string;
  lastUsed: string;
}

interface SessionData {
  id: string;
  userId: string;
  date: string;
  category: string;
  taskName: string;
  studyTimeSeconds: number;
}

export default function TestPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    if (password === 'test123') {
      setIsAuthenticated(true);
      loadParticipants();
    } else {
      alert('密碼錯誤');
    }
  };

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'participants'));
      const data: Participant[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as Participant);
      });
      
      setParticipants(data.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()));
    } catch (error) {
      console.error('載入參與者失敗:', error);
    }
    setLoading(false);
  };

  const loadSessions = async (participantId: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'learningSessions'), where('userId', '==', participantId));
      const querySnapshot = await getDocs(q);
      const data: SessionData[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as SessionData);
      });
      
      setSessions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSelectedParticipant(participantId);
    } catch (error) {
      console.error('載入學習會話失敗:', error);
    }
    setLoading(false);
  };

  const deleteParticipant = async (participantId: string, docId: string) => {
    if (!confirm(`確定要刪除參與者 ${participantId} 嗎？`)) return;
    
    try {
      await deleteDoc(doc(db, 'participants', docId));
      
      // 同時刪除相關的學習會話
      const q = query(collection(db, 'learningSessions'), where('userId', '==', participantId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      alert('參與者及相關數據已刪除');
      loadParticipants();
      if (selectedParticipant === participantId) {
        setSessions([]);
        setSelectedParticipant(null);
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  const clearLocalStorage = () => {
    if (confirm('確定要清除 localStorage 嗎？')) {
      localStorage.clear();
      alert('localStorage 已清除！');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">測試模式</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                測試密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              進入測試模式
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600"
            >
              返回首頁
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">🧪 測試數據管理</h1>
            <div className="space-x-4">
              <button
                onClick={clearLocalStorage}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                清除 LocalStorage
              </button>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                返回首頁
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 參與者列表 */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-800">參與者列表</h3>
                <button
                  onClick={loadParticipants}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  重新整理
                </button>
              </div>
              
              {loading && <div className="text-center py-4">載入中...</div>}
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-blue-800">{participant.participantId}</h4>
                        <p className="text-sm text-gray-600">{participant.email}</p>
                        <p className="text-sm text-gray-500">使用次數: {participant.usageCount || 0}</p>
                        <p className="text-xs text-gray-400">
                          註冊: {new Date(participant.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => loadSessions(participant.participantId)}
                          className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                        >
                          查看會話
                        </button>
                        <button
                          onClick={() => deleteParticipant(participant.participantId, participant.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 學習會話列表 */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                學習會話 {selectedParticipant && `(${selectedParticipant})`}
              </h3>
              
              {selectedParticipant ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white p-4 rounded-lg shadow">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold text-green-800">{session.taskName}</h4>
                          <p className="text-sm text-gray-600">分類: {session.category}</p>
                          <p className="text-sm text-gray-500">
                            學習時長: {Math.floor(session.studyTimeSeconds / 60)}分{session.studyTimeSeconds % 60}秒
                          </p>
                          <p className="text-xs text-gray-400">日期: {session.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      暫無學習會話記錄
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  請選擇一個參與者查看學習會話
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">測試說明</h3>
            <ul className="text-yellow-700 space-y-2 text-sm">
              <li>• 在開發環境中，右下角會顯示開發者測試面板</li>
              <li>• 按 <kbd className="bg-yellow-200 px-1 rounded">Ctrl+Shift+T</kbd> 可開關測試面板</li>
              <li>• 可以模擬 1 次或 5 次使用來測試後問卷觸發</li>
              <li>• 「重置所有數據」會清除所有 localStorage</li>
              <li>• 測試完畢後記得刪除測試參與者</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}