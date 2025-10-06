// 音檔快取系統（使用 IndexedDB）
// 可以存儲大量音檔，不受 localStorage 5MB 限制

const DB_NAME = 'japanese-learning-tts-cache';
const STORE_NAME = 'audio-files';
const DB_VERSION = 1;

// 初始化 IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// 生成快取 key（使用 hash 避免特殊字符問題）
async function generateCacheKey(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// 從快取中獲取音檔
export async function getCachedAudio(text: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const key = await generateCacheKey(text);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('獲取快取音檔失敗:', error);
    return null;
  }
}

// 將音檔存入快取
export async function setCachedAudio(text: string, audioBlob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const key = await generateCacheKey(text);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(audioBlob, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('存儲快取音檔失敗:', error);
  }
}

// 清除所有快取（可選，用於測試或管理）
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('TTS 快取已清除');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('清除快取失敗:', error);
  }
}

// 獲取快取大小（可選，用於監控）
export async function getCacheSize(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('獲取快取大小失敗:', error);
    return 0;
  }
}
