/**
 * 輸入驗證工具
 * 用於檢查使用者輸入是否安全、有效且無惡意內容
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * 檢查字串是否包含危險的 HTML/腳本標籤
 */
const hasDangerousTags = (input: string): boolean => {
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * 檢查字串是否包含 SQL 注入嘗試
 */
const hasSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;|\-\-|\/\*|\*\/)/,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * 檢查字串是否為亂碼或無意義內容
 */
const isGibberish = (input: string): boolean => {
  // 移除空白後檢查
  const trimmed = input.trim();

  // 檢查是否為空
  if (trimmed.length === 0) {
    return true;
  }

  // 檢查是否過短（少於 2 個字元）
  if (trimmed.length < 2) {
    return true;
  }

  // 檢查是否包含過多特殊符號（超過 30%）
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\s]/g) || []).length;
  const specialCharRatio = specialCharCount / trimmed.length;
  if (specialCharRatio > 0.3) {
    return true;
  }

  // 檢查是否重複相同字元過多次（超過 5 次）
  const repeatedPattern = /(.)\1{5,}/;
  if (repeatedPattern.test(trimmed)) {
    return true;
  }

  // 檢查是否只包含數字
  if (/^\d+$/.test(trimmed)) {
    return true;
  }

  // 檢查是否只包含特殊符號和空白
  if (/^[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]+$/.test(trimmed)) {
    return true;
  }

  // 檢查是否包含過多連續的非字母數字字元（超過 3 個）
  if (/[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\s]{4,}/.test(trimmed)) {
    return true;
  }

  // 檢查鍵盤亂打模式（如 asdfghjkl, qwertyuiop）
  const keyboardPatterns = [
    /qwerty|asdfgh|zxcvbn/i,
    /12345|67890/,
    /abcdef|ghijkl|mnopqr|stuvwx/i,
  ];
  if (keyboardPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }

  // 檢查子音/母音比例是否異常（針對英文/拼音亂碼）
  // 正常文字應該有合理的子音母音分布
  const latinChars = trimmed.match(/[a-zA-Z]/g);
  if (latinChars && latinChars.length > 3) {
    const vowels = trimmed.match(/[aeiouAEIOU]/g) || [];
    const vowelRatio = vowels.length / latinChars.length;

    // 母音比例應該在 20%-50% 之間（過低或過高都可能是亂碼）
    if (vowelRatio < 0.15 || vowelRatio > 0.6) {
      return true;
    }
  }

  // 檢查是否缺少空格（長文字但沒有空格可能是亂碼）
  // 超過 20 個字元的純英文/數字但沒有空格
  if (trimmed.length > 20 && !/\s/.test(trimmed) && /^[a-zA-Z0-9]+$/.test(trimmed)) {
    return true;
  }

  return false;
};

/**
 * 清理和標準化輸入
 */
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    // 移除控制字元
    .replace(/[\x00-\x1F\x7F]/g, '')
    // 標準化空白
    .replace(/\s+/g, ' ')
    // 移除零寬度字元
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
};

/**
 * 驗證待辦事項名稱
 */
export const validateTaskName = (taskName: string): ValidationResult => {
  // 先清理輸入
  const sanitized = sanitizeInput(taskName);

  // 檢查是否為空
  if (!sanitized) {
    return {
      isValid: false,
      error: '待辦事項不能為空'
    };
  }

  // 檢查長度（1-100 字元）
  if (sanitized.length < 1 || sanitized.length > 100) {
    return {
      isValid: false,
      error: '待辦事項長度必須在 1-100 字元之間'
    };
  }

  // 檢查危險標籤
  if (hasDangerousTags(sanitized)) {
    return {
      isValid: false,
      error: '包含不允許的內容'
    };
  }

  // 檢查 SQL 注入
  if (hasSQLInjection(sanitized)) {
    return {
      isValid: false,
      error: '格式不正確'
    };
  }

  // 檢查是否為亂碼
  if (isGibberish(sanitized)) {
    return {
      isValid: false,
      error: '請輸入有效的文字'
    };
  }

  return {
    isValid: true,
    sanitized
  };
};

/**
 * 驗證待辦事項描述
 */
export const validateTaskDescription = (description: string): ValidationResult => {
  // 先清理輸入
  const sanitized = sanitizeInput(description);

  // 檢查是否為空
  if (!sanitized) {
    return {
      isValid: false,
      error: '待辦事項描述不能為空'
    };
  }

  // 檢查長度（5-100 字元）
  if (sanitized.length < 5) {
    return {
      isValid: false,
      error: '待辦事項描述至少需要 5 個字元'
    };
  }

  if (sanitized.length > 100) {
    return {
      isValid: false,
      error: '待辦事項描述不能超過 100 字元'
    };
  }

  // 檢查危險標籤
  if (hasDangerousTags(sanitized)) {
    return {
      isValid: false,
      error: '待辦事項描述包含不允許的內容'
    };
  }

  // 檢查 SQL 注入
  if (hasSQLInjection(sanitized)) {
    return {
      isValid: false,
      error: '待辦事項描述格式不正確'
    };
  }

  // 檢查是否為亂碼
  if (isGibberish(sanitized)) {
    return {
      isValid: false,
      error: '請輸入有效的文字'
    };
  }

  return {
    isValid: true,
    sanitized
  };
};

/**
 * 驗證分類
 */
export const validateCategory = (category: string, allowedCategories: string[]): ValidationResult => {
  const sanitized = sanitizeInput(category);

  if (!sanitized) {
    return {
      isValid: false,
      error: '請選擇待辦事項分類'
    };
  }

  // 檢查是否在允許的分類列表中
  if (!allowedCategories.includes(sanitized)) {
    return {
      isValid: false,
      error: '請選擇有效的待辦事項分類'
    };
  }

  return {
    isValid: true,
    sanitized
  };
};

/**
 * 驗證日期
 */
export const validateDate = (dateString: string): ValidationResult => {
  const sanitized = sanitizeInput(dateString);

  if (!sanitized) {
    return {
      isValid: false,
      error: '請選擇日期'
    };
  }

  // 檢查日期格式 (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(sanitized)) {
    return {
      isValid: false,
      error: '日期格式不正確'
    };
  }

  // 檢查是否為有效日期
  const date = new Date(sanitized);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: '無效的日期'
    };
  }

  // 檢查日期範圍（不能晚於一年後）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  if (date > oneYearLater) {
    return {
      isValid: false,
      error: '日期不能晚於一年後'
    };
  }

  return {
    isValid: true,
    sanitized
  };
};
