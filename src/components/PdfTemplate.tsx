import React, { forwardRef } from 'react';
import { StudentData } from '../types';
import { Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PdfTemplateProps {
  data: StudentData;
  visibleFields: Record<string, boolean>;
  stampLine1: string;
  stampLine2: string;
  footerSystemName: string;
  footerCreatorName: string;
}

export const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(
  ({ data, visibleFields, stampLine1, stampLine2, footerSystemName, footerCreatorName }, ref) => {
    
    // count active fields to adjust grid layout
    const activeIpofCount = [
      visibleFields['Input'],
      visibleFields['Process'],
      visibleFields['Outcome'],
      visibleFields['Feedback']
    ].filter(Boolean).length;

    const activeReflectionCount = [
      visibleFields['Reflection1'],
      visibleFields['Reflection2'],
      visibleFields['Reflection3']
    ].filter(Boolean).length;

    const hasTeacherFeedback = visibleFields['TeacherFeedback'] && !!data['教師回饋'];
    const onlyTeacherFeedbackSelected = hasTeacherFeedback && activeIpofCount === 0 && activeReflectionCount === 0;

    return (
      <div ref={ref} className="flex flex-col gap-8">
        <style>{`
          .pdf-page, .pdf-page * {
            border-color: #E0E0E0 !important;
          }
        `}</style>
        
        {/* Page 1: Main Content */}
        {!onlyTeacherFeedbackSelected && (
          <div
            className="pdf-page w-[794px] h-[1123px] flex flex-col p-10 relative overflow-hidden box-border shrink-0 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.15)] mx-auto"
            style={{
              fontFamily: "'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', sans-serif",
              backgroundColor: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid #E0E0E0',
              '--primary': '#2D5A27',
              '--secondary': '#4A7C44',
              '--accent': '#D4E4BC',
              '--text-main': '#1A1A1A',
              '--text-muted': '#666666',
              '--bg-paper': '#FFFFFF',
              '--border-color': '#E0E0E0',
            } as React.CSSProperties}
          >
            {/* Header */}
            <header className="flex justify-between items-end pb-[15px] mb-[20px]" style={{ borderBottom: '3px solid var(--primary)' }}>
              <div className="text-[28px] font-bold tracking-[2px]" style={{ color: 'var(--primary)' }}>
                自主學習：我的IPOF分析
              </div>
              {data['日期'] && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  建立日期：{data['日期']}
                </div>
              )}
            </header>

            {/* Student Meta */}
            <div className="flex gap-[30px] mb-[24px] px-[20px] py-[15px] rounded-[4px]" style={{ background: 'var(--accent)' }}>
              <div className="text-[15px] flex items-center">
                <span className="font-bold uppercase mr-[8px]" style={{ color: 'var(--secondary)' }}>姓名</span>
                <span className="font-medium px-[5px] pb-[4px]" style={{ borderBottom: '1.5px solid var(--secondary)' }}>{data['姓名']}</span>
              </div>
              <div className="text-[15px] flex items-center">
                <span className="font-bold uppercase mr-[8px]" style={{ color: 'var(--secondary)' }}>班級座號</span>
                <span className="font-medium px-[5px] pb-[4px]" style={{ borderBottom: '1.5px solid var(--secondary)' }}>{data['班級座號']}</span>
              </div>
              <div className="text-[15px] flex-1 flex items-center truncate">
                <span className="font-bold uppercase mr-[8px]" style={{ color: 'var(--secondary)' }}>主題</span>
                <span className="font-medium px-[5px] pb-[4px] flex-1 truncate" style={{ borderBottom: '1.5px solid var(--secondary)' }}>
                  {data['主題'] || '未填寫主題'}
                </span>
              </div>
            </div>

            <main className="flex-1 flex flex-col z-10 relative">
              
              {/* IPOF Grid */}
              {activeIpofCount > 0 && (
                <div className={`grid gap-[20px] mb-[24px] ${activeIpofCount > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${activeIpofCount > 2 ? 'grid-rows-2' : 'grid-rows-1'}`} style={{ flex: 1.4 }}>
                   {visibleFields['Input'] && <GridBox label="Input" title="● 輸入 (Input)" content={data['Input']} />}
                   {visibleFields['Process'] && <GridBox label="Process" title="● 歷程 (Process)" content={data['Process']} />}
                   {visibleFields['Outcome'] && <GridBox label="Outcome" title="● 成果 (Outcome)" content={data['Outcome']} />}
                   {visibleFields['Feedback'] && <GridBox label="Feedback" title="● 回饋 (Feedback)" content={data['Feedback']} />}
                </div>
              )}

              {/* Reflections */}
              {activeReflectionCount > 0 && (
                <div className={`grid gap-[20px] ${activeReflectionCount === 3 ? 'grid-cols-3' : (activeReflectionCount === 2 ? 'grid-cols-2' : 'grid-cols-1')}`} style={{ flex: activeIpofCount > 0 ? 0.6 : 1 }}>
                  {visibleFields['Reflection1'] && <ReflectionBox num="1" title="反思 1" content={data['反思1']} />}
                  {visibleFields['Reflection2'] && <ReflectionBox num="2" title="反思 2" content={data['反思2']} />}
                  {visibleFields['Reflection3'] && <ReflectionBox num="3" title="反思 3" content={data['反思3']} />}
                </div>
              )}
            </main>

            <div className="absolute z-50 pointer-events-none" style={{ bottom: '40px', right: '40px' }}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <g transform="rotate(-15 75 75)">
                  <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(45,90,39,0.35)" strokeWidth="4.5"/>
                  <text x="75" y="60" fontFamily="'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', sans-serif" fontSize="16" fontWeight="900" fill="rgba(45,90,39,0.35)" textAnchor="middle" letterSpacing="4">{stampLine1}</text>
                  <text x="75" y="85" fontFamily="'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', sans-serif" fontSize="16" fontWeight="900" fill="rgba(45,90,39,0.35)" textAnchor="middle" letterSpacing="4">{stampLine2}</text>
                  <text x="75" y="110" fontFamily="'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', sans-serif" fontSize="15" fontWeight="900" fill="rgba(45,90,39,0.35)" textAnchor="middle" letterSpacing="3">VERIFIED</text>
                </g>
              </svg>
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-[15px] flex justify-center text-[12px] tracking-[2px] relative z-10" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              {footerSystemName} | {footerCreatorName}
            </footer>
          </div>
        )}

        {/* Page 2: AI Teacher Feedback */}
        {hasTeacherFeedback && (
          <div
            className="pdf-page w-[794px] h-[1123px] flex flex-col p-10 relative overflow-hidden box-border shrink-0 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.15)] mx-auto"
            style={{
              fontFamily: "'PingFang TC', 'Heiti TC', 'Microsoft JhengHei', sans-serif",
              backgroundColor: '#FFFFFF',
              color: '#1A1A1A',
              border: '1px solid #E0E0E0',
              '--primary': '#2D5A27',
              '--secondary': '#4A7C44',
              '--accent': '#D4E4BC',
              '--text-main': '#1A1A1A',
              '--text-muted': '#666666',
              '--bg-paper': '#FFFFFF',
              '--border-color': '#E0E0E0',
            } as React.CSSProperties}
          >
            {/* Header for Page 2 */}
            <header className="flex justify-between items-end pb-[15px] mb-[15px]" style={{ borderBottom: '3px solid var(--primary)' }}>
              <div className="text-[24px] font-bold tracking-[1px] flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Sparkles className="w-6 h-6" strokeWidth={2.5} color="var(--primary)" /> 專屬教師回饋
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                學生：{data['班級座號']} {data['姓名']}
              </div>
            </header>

            <main className="flex-1 flex flex-col z-10 relative overflow-hidden">
              <div className="p-[20px] rounded-[8px] flex-1 break-words leading-relaxed relative overflow-hidden" style={{ backgroundColor: '#F9FBF9', border: '2px solid var(--secondary)' }}>
                 <div className="markdown-body">
                   <ReactMarkdown
                     components={{
                       strong: ({node, ...props}) => <strong className="font-extrabold text-[14.5px] tracking-wide" style={{ color: 'var(--secondary)' }} {...props} />,
                       p: ({node, ...props}) => <p className="mb-[8px] text-[13.5px] leading-[1.6]" style={{ color: 'var(--text-main)' }} {...props} />,
                       h1: ({node, ...props}) => <h1 className="font-black text-[18px] mt-[14px] mb-[8px] pb-[4px]" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-color)' }} {...props} />,
                       h2: ({node, ...props}) => <h2 className="font-black text-[16.5px] mt-[12px] mb-[6px]" style={{ color: 'var(--primary)' }} {...props} />,
                       h3: ({node, ...props}) => <h3 className="font-bold text-[15px] mt-[10px] mb-[4px]" style={{ color: 'var(--secondary)' }} {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc pl-[20px] mb-[10px] space-y-[4px] text-[13.5px] leading-[1.6]" {...props} />,
                       ol: ({node, ...props}) => <ol className="list-decimal pl-[20px] mb-[10px] space-y-[4px] text-[13.5px] leading-[1.6]" {...props} />,
                       li: ({node, ...props}) => <li {...props} />
                     }}
                   >
                     {data['教師回饋']!}
                   </ReactMarkdown>
                 </div>
                 {/* Fade-out effect at the very bottom in case content is still slightly too long */}
                 <div className="absolute bottom-0 left-0 w-full h-[25px] pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #F9FBF9)' }} />
              </div>
            </main>

            {/* Footer */}
            <footer className="mt-8 pt-[15px] flex justify-center text-[12px] tracking-[2px] relative z-10" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              {footerSystemName} | {footerCreatorName}
            </footer>
          </div>
        )}
      </div>
    );
  }
);

PdfTemplate.displayName = 'PdfTemplate';

const GridBox = ({ label, title, content }: { label: string, title: string, content: React.ReactNode }) => {
  return (
    <div className="relative flex flex-col p-[16px] rounded-[8px]" style={{ border: '1.5px solid var(--border-color)' }}>
      <div className="absolute top-[-10px] left-[15px] px-[8px] text-[13px] font-bold uppercase tracking-wider" style={{ background: 'var(--bg-paper)', color: 'var(--primary)' }}>
        {label}
      </div>
      <div className="text-[17px] font-bold mb-[10px] flex items-center gap-[8px]" style={{ color: 'var(--secondary)' }}>
        {title}
      </div>
      <div className="text-[15px] leading-[1.7] flex-1 whitespace-pre-wrap break-words" style={{ color: 'var(--text-main)' }}>
        {content || <span className="italic opacity-50 font-normal">未填寫</span>}
      </div>
    </div>
  );
};

const ReflectionBox = ({ num, title, content }: { num: string, title: string, content: React.ReactNode }) => {
  return (
    <div className="p-[16px] text-[13px] flex flex-col h-full" style={{ background: '#F9FBF9', borderTop: '2.5px solid var(--secondary)' }}>
      <span className="font-bold block mb-[10px] text-[15px] tracking-wide" style={{ color: 'var(--secondary)' }}>
        {title}
      </span>
      <div className="leading-[1.7] whitespace-pre-wrap break-words flex-1" style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
        {content || <span className="italic opacity-50 font-normal">未填寫</span>}
      </div>
    </div>
  );
};

