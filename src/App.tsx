import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileUp, Download, Eye, FileBox, Loader2, ChevronRight, ChevronLeft, Settings, ExternalLink, Bot, Sparkles, Key, Github, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { StudentData } from './types';
import { PdfTemplate } from './components/PdfTemplate';
import { cn } from './lib/utils';

export default function App() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    Input: true,
    Process: true,
    Outcome: true,
    Feedback: true,
    Reflection1: true,
    Reflection2: true,
    Reflection3: true,
    TeacherFeedback: true,
  });

  const [stampLine1, setStampLine1] = useState('HKHS');
  const [stampLine2, setStampLine2] = useState('114-1');
  const [footerSystemName, setFooterSystemName] = useState('自主學習歷程系統');
  const [footerCreatorName, setFooterCreatorName] = useState('Avatar Biology');

  // UI feature states
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // AI Feature States
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [systemPrompt, setSystemPrompt] = useState(`# 系統提示詞：自主學習 IPOF 分析與回饋導師

## 📌 基本資訊
* **Role:** 自主學習 IPOF 分析與回饋導師
* **Tone:** 教師口吻（溫暖、鼓勵、具備邏輯引導性、循循善誘）
* **Background:** 熟悉 108 課綱自主學習精神，精通「規劃目標」階段的「IPOF 分析」工具。深知學習的四大要素（資源、方法、成果、回饋）就像 BLACKPINK 的四位成員一樣缺一不可。擅長扮演「淘金師傅」協助學生篩選資源，以及「夢想織匠」引導學生想像成果畫面。

## 🎯 目標 (Goals)
1. 深度分析高中生提交的 IPOF 學習單內容（包含 Input, Process, Outcome, Feedback）。
2. 診斷計畫中的盲點（如：資源太發散、方法不具體、成果難以想像、缺乏回饋機制）。
3. 以溫暖的教師口吻給予客觀回饋，並透過提問引導學生自行優化計畫。

## 🔍 分析架構 (Analysis Framework)
* **總體檢視：** 四項要素是否緊密扣合主題？是否有「由終為始」（先想像成果 O，再回推資源 I 與方法 P）的邏輯連貫性？
* **Input (資源檢核)：** 評估學生提出的資源是否具備「可靠性、符合需求、適合自己」這三個標準。若學生只寫「上網查」，需引導其具體化（如：哪本書？哪個 YouTube 頻道？論文文獻？）。
* **Process (方法檢核)：** 評估學習方法是否具體可行。能否有效將 Input 轉化為 Outcome？（如：是單純「看影片」，還是「看影片學發音並分析案例」？）。
* **Outcome (成果檢核)：** 成果是否有清晰的「畫面感」？（如：是一支附字幕的影片、一份簡報，還是 IG 圖文？）。
* **Feedback (回饋檢核)：** 是否有明確的檢核點或對象？（如：找老師討論、觀察社群愛心數，或是與社團學長姐討論）。

## ⚠️ 規則與約束 (Rules and Constraints)
* **絕對禁止：** 直接幫學生改寫完所有的內容。必須遵守「引導者」的角色，提供方向與具體範例讓學生自己思考。
* **語氣要求：** 開頭必須先肯定學生的努力與亮點，建立其自信心。批評必須轉化為「溫和的建議與提問」。
* **版面與字數限制 (極重要🔥)：** 為了確保回饋內容能完美列印於單頁 A4 紙上而不被切斷，**總字數必須嚴格控制在 350 - 450 字以內**。句子請保持精煉扼要，直接切入重點，切勿過度展開說明。

## 📝 輸出格式 (Output Format)
請直接輸出以下四個項目的 Markdown 格式，**絕對不要**有任何開場白或結語對話（如：「好的」、「這是一份分析報告」等）。請務必使用 Markdown 粗體語法（\`**\`）來強調標題或重點：

1. **🌟 亮點捕捉：** 熱情地肯定學生的主題與目前計畫中寫得最棒的元素。
2. **🔍 IPOF 深度診斷：** 針對 I, P, O, F 逐一進行簡要分析，點出寫得具體的地方，以及稍微模糊、需要補強的盲點。
3. **💡 給你的思考（Next Steps）：** 針對盲點，提出 2-3 個引發思考的問題。例如：「針對你的資源 (I)，你打算參考哪些具體的頻道呢？這資源對你來說可靠嗎？」。
4. **🤝 貼心叮嚀：** 給予鼓勵，提醒學生可以善用 AI 或網路搜尋來輔助尋找靈感，並期待他們完善計畫。`);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState<{ current: number; total: number } | null>(null);
  const [aiMessage, setAiMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const toggleField = (id: string) => {
    setVisibleFields(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const downloadSampleCsv = () => {
    const csvContent = "時間戳記,姓名,班級座號,主題,日期,Input,Process,Outcome,Feedback,反思1,反思2,反思3,教師回饋\n4/10/2026 14:44:14,甄愛學,10122,台日手搖飲品牌行銷策略對比：以 IG 視覺呈現與文案為例,2026-04-10,YouTube 大家的日本語 N5測驗書,看50音教學 在YouTube聽練習說 用AI建立題目來做,做題目的錯題統整 文法上的筆記整理 分析哪部分是最容易遇到的問題,做習題測驗 統整錯題本找出常錯的文法 口說給朋友聽,資源 平常就有看到很多日語書 也有事先接觸 所以很容易找到資源,成果 用報告的方式 展現出我做題和統整資料的過程,日式甜點,";
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'sample_students.csv');
  };

  const generateAiFeedback = async () => {
    setAiMessage(null);
    if (!apiKey) {
      setAiMessage({ type: 'error', text: '請先輸入您的 Google Gemini API Key 以啟用 AI 分析服務' });
      return;
    }
    
    // Find students without feedback
    const targetStudents = students.filter(s => !s['教師回饋'] || s['教師回饋'].trim() === '');
    
    if (targetStudents.length === 0) {
      setAiMessage({ type: 'error', text: '所有學生都已經有教師回饋了！若要重新生成，請先在 CSV 中清空該欄位。' });
      return;
    }

    setIsAiProcessing(true);
    setAiProgress({ current: 0, total: targetStudents.length });
    let currentProcessed = 0;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const newStudents = [...students];
      
      for (let i = 0; i < newStudents.length; i++) {
        const s = newStudents[i];
        if (s['教師回饋'] && s['教師回饋'].trim() !== '') continue;

        const prompt = `${systemPrompt}\n\n【學生資料】\n主題：${s['主題'] || '無'}\nInput：${s['Input'] || '無'}\nProcess：${s['Process'] || '無'}\nOutcome：${s['Outcome'] || '無'}\nFeedback：${s['Feedback'] || '無'}\n反思1：${s['反思1'] || '無'}\n反思2：${s['反思2'] || '無'}\n反思3：${s['反思3'] || '無'}`;

        let attempt = 0;
        let success = false;
        
        while (!success && attempt < 3) {
          try {
            const response = await ai.models.generateContent({
              model: selectedModel,
              contents: prompt,
            });

            newStudents[i] = { ...s, '教師回饋': response.text };
            setStudents([...newStudents]);
            success = true;
          } catch (err: any) {
            if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
              attempt++;
              if (attempt >= 3) throw err; // 達到最大重試次數，拋出錯誤
              // 遇到 429 錯誤，等待 15 秒後重試 (這通常是因為觸發了 Free Tier RPM 限制)
              setAiMessage({ type: 'error', text: `⏳ 處理第 ${i + 1} 筆時觸發頻率限制，等待 15 秒後自動重試... (第 ${attempt} 次)` });
              await new Promise(resolve => setTimeout(resolve, 15000));
            } else {
              throw err; // 其他錯誤直接拋出
            }
          }
        }
        
        currentProcessed++;
        setAiMessage({ type: 'success', text: `執行中... (${currentProcessed}/${targetStudents.length})` });
        setAiProgress({ current: currentProcessed, total: targetStudents.length });
        
        // 基本延遲：稍微放慢速度避免瞬間打滿限制。
        // Free Tier的 Flash 模型限制為 15 RPM (每4秒1次)。若想完全避免則需設 4000，這裡我們設 2000 並仰賴上面的 429 重試機制。
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setAiMessage({ type: 'success', text: `✅ ${targetStudents.length} 筆 AI 教師回饋產生完成！您可以預覽或開始匯出。` });
    } catch (error: any) {
      console.error(error);
      setAiMessage({ type: 'error', text: '發生錯誤：' + (error?.message || error) });
    } finally {
      setIsAiProcessing(false);
      setAiProgress(null);
    }
  };

  // Hidden container for html2canvas rendering
  const printRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse<StudentData>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validData = results.data.filter(s => !!s['姓名'] && !!s['主題']);
          setStudents(validData);
          setSelectedIdx(0);
        },
        error: (error) => {
          setAiMessage({ type: 'error', text: '解析 CSV 檔案時發生錯誤：' + error.message });
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<StudentData>(worksheet, { defval: '' });
        
        const validData = jsonData.filter(s => !!s['姓名'] && !!s['主題']);
        setStudents(validData);
        setSelectedIdx(0);
      } catch (error: any) {
        setAiMessage({ type: 'error', text: '解析 Excel 檔案時發生錯誤：' + (error?.message || String(error)) });
      }
    } else {
      setAiMessage({ type: 'error', text: '不支援的檔案格式，請上傳 CSV 或 Excel 檔案。' });
    }
  };

  const generatePDFBlob = async (element: HTMLElement): Promise<Blob> => {
    const pages = element.querySelectorAll('.pdf-page');
    
    if (pages.length === 0) {
      throw new Error("No PDF pages found to generate");
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const pageEl = pages[i] as HTMLElement;
      // scale to 2 for better print quality
      const canvas = await html2canvas(pageEl, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    return pdf.output('blob');
  };

  const handleBatchDownload = async () => {
    if (students.length === 0 || !printRef.current) return;
    
    setIsGenerating(true);
    setProgress({ current: 0, total: students.length });
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < students.length; i++) {
        setSelectedIdx(i);
        // Wait for React to render the newly selected student into the DOM
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (printRef.current) {
          const blob = await generatePDFBlob(printRef.current);
          const student = students[i];
          const fileName = `${student['班級座號']}_${student['姓名']}_IPOF分析.pdf`;
          zip.file(fileName, blob);
          
          setProgress({ current: i + 1, total: students.length });
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'IPOF_分析報告_全部.zip');
      
    } catch (error: any) {
      console.error(error);
      setDownloadError(error?.message || String(error));
      setAiMessage({ type: 'error', text: '產生 PDF 時發生錯誤：' + (error?.message || String(error)) });
    } finally {
      setIsGenerating(false);
      setProgress(null);
      setSelectedIdx(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-2 rounded-xl shadow-sm">
            <FileBox className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">自主學習：IPOF分析報告產生器</h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm">
            <FileUp className="w-4 h-4 text-indigo-600" />
            上傳 CSV / Excel 檔案
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          
          {students.length > 0 && (
            <button
              onClick={handleBatchDownload}
              disabled={isGenerating}
              className={cn(
                "bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm shadow-indigo-200",
                isGenerating && "opacity-70 cursor-not-allowed hidden"
              )}
            >
              <Download className="w-4 h-4" />
              批次下載全部 PDF
            </button>
          )}
        </div>
      </nav>

      {students.length === 0 ? (
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-[calc(100vh-8rem)]">
          {/* Hero Section */}
          <div className="text-center mb-16 mt-8 md:mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="inline-flex items-center justify-center p-2.5 bg-white rounded-2xl mb-6 shadow-sm border border-slate-200">
               <div className="flex gap-2">
                 <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileBox className="w-6 h-6 text-indigo-600" />
                 </div>
                 <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                 </div>
                 <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Download className="w-6 h-6 text-emerald-600" />
                 </div>
               </div>
            </div>
            <h2 className="text-4xl md:text-[2.75rem] font-extrabold text-slate-800 mb-6 tracking-tight leading-tight">
              深度分析 IPOF 學習規劃，<br className="md:PDF" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                產出具啟發性的回饋報告。
              </span>
            </h2>
            <p className="text-[1.1rem] text-slate-600 max-w-2xl mx-auto leading-relaxed">
              專為高中「自主學習」課程打造。教師導入學生的 <span className="font-bold text-indigo-600">IPOF 學習檔案</span>，透過 <span className="font-bold text-amber-500">AI 深度診斷</span>給予溫暖回饋，並<span className="font-bold text-emerald-600">一鍵批量匯出PDF完整報告</span>，大幅節省批改時間。
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 w-full mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 ease-out fill-mode-both">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 text-amber-500 border border-amber-100">
                 <Bot className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-3">AI 智慧批次診斷</h3>
               <p className="text-slate-600 text-[14px] leading-relaxed">
                 串接強大的 Google Gemini，化身溫暖且具啟發性的教師，<span className="font-bold text-amber-600">自動分析數十份計畫</span>的盲點與邏輯，並<span className="font-bold text-amber-600">給予具體改善建議</span>。
               </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 text-indigo-600 border border-indigo-100">
                 <FileUp className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-3">多管道資料匯入</h3>
               <p className="text-slate-600 text-[14px] leading-relaxed">
                 提供<span className="font-bold text-indigo-600">自動化的「Google 表單生產器」</span>及「標準 CSV 範本」，讓您輕鬆收集全班同學的資料，<span className="font-bold text-indigo-600">一鍵上傳</span>徹底無縫接軌。
               </p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 text-emerald-600 border border-emerald-100">
                 <Eye className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-3">極致列印排版</h3>
               <p className="text-slate-600 text-[14px] leading-relaxed">
                 解決傳統網頁印成 PDF 會跑版的痛點。客製化的防溢位機制與 A4 雙頁設計，<span className="font-bold text-emerald-600">下載出來即可直接列印或發送</span>。
               </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-6 md:p-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 ease-out fill-mode-both mb-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">準備開始使用</h2>
              <p className="text-slate-500">請選擇以下任一方式準備您的資料格式，準備好即可上傳</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full mb-10">
              {/* Card 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-lg">1️⃣</div>
                  <h3 className="text-lg font-bold text-slate-800">使用「表單生產器」</h3>
                </div>
                <p className="text-slate-600 mb-4 text-[14px] leading-relaxed">
                  透過我們開發的 Google 腳本工具，在您的雲端硬碟<span className="font-bold text-blue-600">一秒自動建立</span>包含所有必要欄位的 Google 表單。
                </p>
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
                  <h4 className="flex items-center gap-1.5 font-bold text-slate-700 text-[12px] mb-2">
                    <span className="text-blue-500">ℹ️</span> 首次授權須知
                  </h4>
                  <p className="text-slate-500 text-[12px] leading-relaxed">
                    系統會要求 Google 授權，這僅為了在「您的個人雲端硬碟」中建立表單，<span className="font-bold text-blue-600">資料完全屬於您，絕對安全</span>請放心放行。
                  </p>
                </div>
                <a 
                  href="https://script.google.com/macros/s/AKfycbwJW15j5wY9vmxAaw20M89d3zCuelKMFqBdxXqIdKWyQoqBgDQA6TvZ-CkC9hDkl3OT/exec" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-transparent text-[14px] font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                >
                  前往表單生產器 <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Card 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 text-lg">2️⃣</div>
                  <h3 className="text-lg font-bold text-slate-800">手動建立資料檔</h3>
                </div>
                <p className="text-slate-600 mb-8 max-w-[90%] text-[14px] leading-relaxed">
                  如果您已有現成的學生資料，只需要<span className="font-bold text-emerald-600">下載標準 CSV 範本檔</span>，並將您的資料複製貼上到對應的欄位中即可。
                </p>
                <div className="mt-auto">
                  <button 
                    onClick={downloadSampleCsv}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent text-[14px] font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    下載標準 CSV 範例檔 <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div className="w-full relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative w-full bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-colors">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileUp className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-indigo-900 mb-2">準備好 CSV / Excel 檔了嗎？</h3>
                <p className="text-slate-500 mb-8 max-w-sm text-sm">將收集好的檔案拖曳至此處，或點擊下方按鈕上傳，我們將為您渲染畫面。</p>
                
                <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-[15px]">
                  點擊選擇檔案上傳
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          <div className="lg:col-span-4 lg:col-start-1 flex flex-col gap-4 sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar pr-2 pb-2">
            
            {/* AI Feedback Panel */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 shadow-sm p-4 shrink-0 flex flex-col gap-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-indigo-900 text-[14px] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  AI 智能教師回饋生成
                </h3>
              </div>
              <p className="text-[12px] text-indigo-700/80 leading-relaxed mb-1">
                讓 AI 依照學生的歷程內容給予具體回饋（本功能需使用您個人的 Gemini API Key）。
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-none bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                      <Key className="w-4 h-4 text-indigo-400" />
                    </div>
                    <input 
                      type="password" 
                      placeholder="輸入 Google Gemini API Key..."
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="flex-1 px-3 py-2 border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm transition-colors bg-white placeholder:text-indigo-200"
                    />
                  </div>
                  <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-[12px] text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 self-start ml-1 mt-1 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    如何取得 API Key?
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 ml-1">AI 模型選擇</label>
                    <select
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[13px] bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (推薦/快速)</option>
                        <option value="gemini-3.1-pro-preview">Gemini 3 Pro (最新/最強)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (精確/耗時)</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button 
                      onClick={generateAiFeedback}
                      disabled={isAiProcessing || isGenerating}
                      className={cn(
                        "w-full py-1.5 px-3 rounded-lg text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm",
                        isAiProcessing || isGenerating
                          ? "bg-indigo-200 text-indigo-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                      )}
                    >
                      {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      開始批次分析
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-1">
                  <button 
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 transition-colors w-full"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5" /> 系統提示詞設定 <span className="opacity-70 font-medium ml-1">可修改教師的回饋模式</span>
                    </span>
                    {showSystemPrompt ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  
                  {showSystemPrompt && (
                    <div className="mt-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <textarea 
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-[12px] bg-white text-slate-600 h-48 resize-y custom-scrollbar leading-relaxed"
                      />
                    </div>
                  )}
                </div>

                {aiMessage && (
                  <div className={cn(
                    "px-3 py-2 rounded-lg text-[12px] font-medium leading-relaxed break-words",
                    aiMessage.type === 'error' ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}>
                    {aiMessage.text}
                  </div>
                )}
              </div>
            </div>

            {/* Field Selection Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 shrink-0">
              <h3 className="font-bold text-slate-800 mb-2 text-[14px] flex items-center gap-2">
                <FileBox className="w-4 h-4 text-indigo-500" />
                選擇要匯出的欄位
              </h3>
              <p className="text-[12px] text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-100/60 mb-3 leading-relaxed font-medium">
                <span className="text-amber-600 font-bold">💡 提示：</span>請注意上傳的表格檔中，<strong className="text-slate-800">首列欄位名稱</strong>必須與下方所列名稱一致，才能精準辨識並呈現在分析報告中呦！
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'Input', label: 'Input' },
                  { id: 'Process', label: 'Process' },
                  { id: 'Outcome', label: 'Outcome' },
                  { id: 'Feedback', label: 'Feedback' },
                  { id: 'Reflection1', label: '反思1' },
                  { id: 'Reflection2', label: '反思2' },
                  { id: 'Reflection3', label: '反思3' },
                  { id: 'TeacherFeedback', label: '教師回饋 (AI)' },
                ].map(s => (
                  <label key={s.id} className={cn(
                    "flex items-center gap-1.5 text-[13px] cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors select-none",
                    s.id === 'TeacherFeedback' && "bg-indigo-50/50 border-indigo-100 text-indigo-800 font-medium"
                  )}>
                    <input type="checkbox" checked={visibleFields[s.id] || false} onChange={() => toggleField(s.id)} className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer" />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Text Settings Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 shrink-0 flex flex-col gap-3">
              <h3 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-500" />
                自訂文字設定
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-600">學校名稱 (印章上排)</label>
                  <input 
                    type="text" 
                    value={stampLine1}
                    onChange={e => setStampLine1(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-600">學年度 (印章下排)</label>
                  <input 
                    type="text" 
                    value={stampLine2}
                    onChange={e => setStampLine2(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-600">系統名稱 (頁尾左側)</label>
                  <input 
                    type="text" 
                    value={footerSystemName}
                    onChange={e => setFooterSystemName(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-600">生成者 (頁尾右側)</label>
                  <input 
                    type="text" 
                    value={footerCreatorName}
                    onChange={e => setFooterCreatorName(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 relative">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base tracking-wide">
                  <span className="text-xl">👥</span> 學生列表
                </h2>
                <span className="text-xs font-bold text-slate-500 bg-slate-200/50 border border-slate-200 px-2.5 py-1 rounded-md">
                  共 {students.length} 筆
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar min-h-[300px]">
                <div className="space-y-1.5">
                  {students.map((student, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between disabled:opacity-50",
                        selectedIdx === idx 
                          ? "bg-indigo-50/80 border border-indigo-200 shadow-sm text-indigo-900" 
                          : "hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200"
                      )}
                      disabled={isGenerating || isAiProcessing}
                    >
                      <div className="flex flex-col gap-1 w-full min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-wide text-[15px]">{student['姓名']}</span>
                          <span className="text-xs text-slate-600 bg-white border border-slate-200 shadow-sm px-2 py-0.5 rounded-md font-medium">{student['班級座號']}</span>
                          {!!student['教師回饋'] && <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-500 truncate w-full tracking-wide">
                          {student['主題']}
                        </div>
                      </div>
                      {selectedIdx === idx && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shrink-0"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
               <div className="w-full max-w-[794px] flex justify-between items-center mb-4 px-1">
                 <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg tracking-wide">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  預覽視窗
                 </h2>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setSelectedIdx(prev => Math.max(0, prev - 1))}
                     disabled={selectedIdx === 0 || isGenerating}
                     className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium transition-colors cursor-pointer bg-white shadow-sm"
                   >
                     <ChevronLeft className="w-4 h-4 mr-1 text-slate-400" />
                     上一筆
                   </button>
                   <button 
                     onClick={() => setSelectedIdx(prev => Math.min(students.length - 1, prev + 1))}
                     disabled={selectedIdx === students.length - 1 || isGenerating}
                     className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm font-medium transition-colors cursor-pointer bg-white shadow-sm"
                   >
                     下一筆
                     <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                   </button>
                 </div>
               </div>

               <div className="w-full bg-slate-200 border border-slate-300 rounded-2xl p-8 flex justify-center shadow-inner relative overflow-y-auto overflow-x-hidden min-h-[calc(100vh-10rem)]">
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl sticky top-0 h-full">
                       <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center w-[360px] border border-indigo-100">
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-5" />
                          <h3 className="text-xl font-bold text-slate-800 tracking-wide">打包中，請稍候...</h3>
                          <p className="text-slate-500 text-sm mt-2 font-medium">
                            處理進度：{progress?.current} / {progress?.total} 份
                          </p>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden shadow-inner">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${(progress?.current || 0) / (progress?.total || 1) * 100}%` }}
                            ></div>
                          </div>
                       </div>
                    </div>
                  )}

                  {isAiProcessing && (
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl sticky top-0 h-full">
                       <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center w-[360px] border border-indigo-100">
                          <Bot className="w-12 h-12 text-indigo-500 mb-4 animate-bounce" />
                          <h3 className="text-xl font-bold text-slate-800 tracking-wide mb-2">生成智能回饋中...</h3>
                          <p className="text-slate-500 text-sm font-medium">
                            分析進度：{aiProgress?.current} / {aiProgress?.total} 份
                          </p>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full mt-6 overflow-hidden shadow-inner">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                              style={{ width: `${(aiProgress?.current || 0) / (aiProgress?.total || 1) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-400 mt-4 font-medium tracking-wide">模型推測過程可能較長，請耐心等候</p>
                       </div>
                    </div>
                  )}

                  {downloadError && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center rounded-2xl sticky top-0 h-full p-6">
                       <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-lg border border-red-200">
                          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 tracking-wide mb-2">無法產生 PDF</h3>
                          <p className="text-slate-600 text-sm font-medium mb-4 text-center break-words w-full bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {downloadError}
                          </p>
                          <button onClick={() => setDownloadError(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">關閉</button>
                       </div>
                    </div>
                  )}

                  <div 
                    className="transform origin-top transition-transform" 
                    style={{ width: '794px', minHeight: '1123px' }}
                  >
                    <PdfTemplate 
                      data={students[selectedIdx]} 
                      visibleFields={visibleFields} 
                      stampLine1={stampLine1}
                      stampLine2={stampLine2}
                      footerSystemName={footerSystemName}
                      footerCreatorName={footerCreatorName}
                    />
                  </div>
               </div>
            </div>
          </div>
        </main>
      )}

      <div 
        className="fixed top-0 left-0 pointer-events-none z-[-9999]" 
        style={{ transform: 'translate(-9999px, -9999px)' }}
      >
        {students.length > 0 && selectedIdx < students.length && (
          <PdfTemplate 
            ref={printRef} 
            data={students[selectedIdx]} 
            visibleFields={visibleFields} 
            stampLine1={stampLine1}
            stampLine2={stampLine2}
            footerSystemName={footerSystemName}
            footerCreatorName={footerCreatorName}
          />
        )}
      </div>

      <footer className="w-full py-5 mt-auto bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="text-slate-500 text-sm font-medium tracking-wide flex items-center justify-center md:justify-start">
              © 2026 Avatar Biology. Developed with <span className="inline-block animate-heartbeat text-red-500 mx-1 translate-y-[1px] text-base">❤️</span> for Education.
            </div>
            <div className="text-slate-400 text-[13px] font-medium text-center md:text-left">
              本專案採 MIT License 開源，期望 AI 讓教育評量更客觀、更具啟發性。
            </div>
          </div>
          
          <div className="flex items-center gap-5 text-slate-500">
            <a href="https://github.com/AvatarBiology/SDL-IPOF" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-sm font-medium">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button onClick={() => setShowEmailModal(true)} className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-sm font-medium">
              <Mail className="w-4 h-4" />
              <span>E-mail</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowEmailModal(false)}>
           <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-sm border border-slate-200" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-wide mb-2">歡迎聯絡與交流</h3>
              <p className="text-slate-600 text-[15px] font-medium mb-6 text-center select-all bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 w-full">
                avatarbiology@gmail.com
              </p>
              <button onClick={() => setShowEmailModal(false)} className="w-full py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">
                關閉
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

