# 日本留學生活日語學習 APP

這是一個專為台灣留學生設計的日語學習應用程式，使用 AI 生成與日常任務相關的日語學習內容。

## 功能特色

- AI 生成任務相關的日語單字和例句
- 實用的日語對話練習
- 相關的日本新聞和文化資訊
- 個人單字庫系統（即將推出）
- 複習功能（即將推出）

## 技術架構

- **前端**: Next.js 15 + React + TypeScript + Tailwind CSS
- **後端**: Next.js API Routes
- **AI**: OpenAI GPT-4
- **資料庫**: Firebase Firestore
- **部署**: Vercel

## 安裝與設置

### 1. 環境需求
- Node.js 18+ 
- npm 或 yarn

### 2. 安裝依賴
\`\`\`bash
npm install
\`\`\`

### 3. 環境變數設置

複製 \`.env.local\` 文件並填入你的 API 金鑰：

\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
\`\`\`

### 4. 取得 API 金鑰

#### OpenAI API 金鑰
1. 前往 [OpenAI Platform](https://platform.openai.com/)
2. 註冊或登入帳號
3. 前往 API Keys 頁面
4. 點擊 "Create new secret key"
5. 複製金鑰並貼到 \`.env.local\`

#### Firebase 設置
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案
3. 啟用 Firestore Database
4. 前往專案設置 → 一般設定
5. 在「你的應用程式」區域新增 Web 應用程式
6. 複製配置資訊到 \`.env.local\`

### 5. 啟動開發伺服器

\`\`\`bash
npm run dev
\`\`\`

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)

## 部署到 Vercel

### 1. 推送到 GitHub
\`\`\`bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/japanese-learning-app.git
git push -u origin main
\`\`\`

### 2. 部署到 Vercel
1. 前往 [Vercel](https://vercel.com/)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇你的 GitHub 專案
5. 在環境變數設置中添加所有 \`.env.local\` 中的變數
6. 點擊 "Deploy"

## 使用方法

1. 在主頁面的文字框中輸入你想學習的任務或情境
   - 例如：「去便利商店買東西」
   - 例如：「在餐廳點餐」
   - 例如：「詢問路線」

2. 點擊「生成學習內容」按鈕

3. AI 會生成：
   - 相關的日語單字和例句
   - 實用的對話範例
   - 相關的日本文化或新聞資訊

## 專案結構

\`\`\`
japanese-learning-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate-content/
│   │   │       └── route.ts          # OpenAI API 路由
│   │   ├── page.tsx                  # 主頁面
│   │   └── layout.tsx               # 頁面佈局
│   └── lib/
│       ├── firebase.ts              # Firebase 配置
│       └── openai.ts               # OpenAI 配置
├── .env.local                      # 環境變數
└── README_SETUP.md                # 設置說明
\`\`\`

## 後續開發計劃

- [ ] 用戶認證系統
- [ ] 個人單字庫功能
- [ ] 單字收藏和管理
- [ ] 複習系統
- [ ] 學習進度追蹤
- [ ] 更精細的內容分類
- [ ] 語音功能

## 論文研究功能

此應用程式專為研究所論文設計，包含：
- 使用者行為追蹤
- 學習效果分析
- 資料收集功能
- 系統效能監控

## 支援

如遇到問題，請檢查：
1. 環境變數是否正確設置
2. API 金鑰是否有效
3. 網路連線是否正常