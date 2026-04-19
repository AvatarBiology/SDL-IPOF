# 自主學習：IPOF 分析報告產生器 (SDL-IPOF Analysis Tools)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DBFB?logo=react&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)
![Gemini API](https://img.shields.io/badge/AI-Google_Gemini-FFA700)

這是一個專為第一線教育工作者打造的開源工具，旨在協助教師快速、客觀且具啟發性地批閱高中生的「自主學習計畫」。只需上傳學生的 IPOF（Input, Process, Outcome, Feedback）紀錄表，系統即可透過 AI 進行批次診斷，並一鍵匯出為精美、適合列印的 A4 雙頁 PDF 分析報告。

本專案期望能利用 AI 賦能教育，大幅降低教師的行政負擔，同時給予學生更有溫度、更具引導性的個別化學習回饋。

---

## ✨ 核心特色 (Features)

*   📊 **無痛匯入資料**：支援上傳 `.csv`, `.xlsx`, `.xls` 檔案格式。
*   🤖 **AI 批次智慧回饋**：內建串接 Google Gemini API（支援 2.5 Flash / 3.0 Pro 等模型），化身溫暖教師，自動診斷學生的計畫盲點並給予建言。
*   🛡️ **智慧防護機制**：內建 API 呼叫頻率限制 (Rate Limits) 的指數退避重試演算法 (Exponential backoff)，即使使用免費版 API Key 也不怕瞬間流量打爆。
*   🖨️ **完美的 A4 排版**：客製化的列印級樣式 (CSS Print)，嚴格控制字數與防溢位機制，確保生成的 PDF 能完美單頁／雙頁呈現。
*   🗂️ **一鍵打包下載**：運用 `html2canvas` 與 `jsPDF` 技術於前端即時渲染，最後由 `JSZip` 批次打包所有學生的報告為一個 `.zip` 檔。
*   ⚙️ **高自由度的設定**：教師可自由開關想要印出的欄位（如只印回饋頁），亦可點開「系統提示詞」介面，深度自訂 AI 老師的說話口吻和語氣。

---

## 🚀 快速開始 (Getting Started)

### 1. 本地端執行 (Local Development)

請確認您的電腦已安裝 [Node.js](https://nodejs.org/) (建議版本 18 以上)。

```bash
# 1. 複製專案到本地
git clone https://github.com/AvatarBiology/SDL-IPOF.git
cd SDL-IPOF

# 2. 安裝必要的依賴套件
npm install

# 3. 啟動開發伺服器
npm run dev
```

啟動後，請在瀏覽器打開 `http://localhost:3000` 即可看到畫面。

### 2. 環境與金鑰準備 (API Key Setup)

若要使用 AI 生成回饋功能，您需要一組 **Google Gemini API Key**。
*   請前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 申請免費的 API 金鑰。
*   將金鑰填入系統畫面左側的設定面板中即可開始使用。

### 3. 雲端部署 (Deployment - GitHub Pages)

本專案已內建完整的 CI/CD 自動化流程。只要將這個專案推送到您的 GitHub 並設定 GitHub Pages：
1. 進入您 GitHub 專案庫的 **Settings** > **Pages**。
2. 在 **Build and deployment** 的 Source 選單中，選擇 **GitHub Actions**。
3. 爾後只要您有新的程式碼推送到 `main` 或 `master` 分支，系統即會自動為您打包並發布至線上網頁，完全免費且無需自備伺服器！

---

## 📝 資料格式說明 (Data Format)

為確保系統正常運作，您上傳的 Excel 或 CSV 檔案<strong style="color:red">首列（Header）必須與以下欄位名稱完全一致</strong>，系統才能精準辨識並載入資料：

| 欄位名稱表 | 說明 |
| :--- | :--- |
| **姓名** | *(必填)* 學生的姓名 |
| **班級座號** | 學生的班級與座號 (如：10122) |
| **主題** | *(必填)* 自主學習的題目或企劃名稱 |
| **Input** | 投入的學習資源與素材 |
| **Process** | 計畫實行的過程與方法 |
| **Outcome** | 預期達成的有形成果或表現 |
| **Feedback** | 檢核點、回饋機制或他人意見 |
| **反思1/2/3** | 學習過程中的自我反思紀錄 |
| **教師回饋** | 可留空，若留空系統會使用 AI 自動補齊。若已有內容則會直接印出 |

> 💡 **提示：** 系統畫面上方有提供「下載標準 CSV 範例檔」按鈕，您可以直接下載後填寫。

---

## 🛠️ 技術框架 (Tech Stack)

*   **前端框架**：React 19 + TypeScript + Vite
*   **視覺樣式**：Tailwind CSS 4 + Lucide React (Icons)
*   **AI 串接**：`@google/genai` (Google 官方最新 SDK)
*   **資料解析**：`papaparse` (CSV 解析), `xlsx` (Excel 解析)
*   **PDF 生成**：`html2canvas` + `jspdf`
*   **檔案處理**：`jszip` + `file-saver`
---

## 🤝 貢獻與交流 (Contributing & Contact)

歡迎各界教育工作者或開發者一起讓這個專案變得更好！
您可以隨時發起 Pull Request 或開 Issue 反饋問題。

如有任何教育應用上的想法交流，歡迎聯繫：
📧 **E-mail:** avatarbiology@gmail.com

---

## 📜 授權協議 (License)

本專案採用 **[MIT License](LICENSE)** 開源授權，任何人皆可自由使用、修改或散佈。期望 AI 讓教育評量更客觀、更具啟發性 ❤️。

