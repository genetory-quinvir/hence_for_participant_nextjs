"use client";

import { ContactInfo, FaqItem, EmergencyInfo } from "@/types/api";

interface EventHelpProps {
  helpData?: {
    contact?: ContactInfo;
    faqs?: FaqItem[];
    emergencyInfo?: EmergencyInfo;
  };
}

export default function EventHelp({ helpData }: EventHelpProps) {
  return (
    <section className="py-8 px-4">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">도움말 & 문의</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          궁금한 점이 있으시면 언제든 문의해주세요
        </p>
      </div>

      {/* 연락처 섹션 */}
      <div 
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-lg font-bold text-white mb-4">연락처</h3>
        <div className="space-y-0">
          <p className="text-sm text-white" style={{ opacity: 0.6 }}>{helpData?.contact?.phone || ''}</p>
          <p className="text-sm text-white mb-3" style={{ opacity: 0.6 }}>{helpData?.contact?.email || ''}</p>
          <p className="text-sm text-white mb-2" style={{ opacity: 0.6 }}>{helpData?.contact?.location || ''}</p>
        </div>
      </div>

      {/* 자주 묻는 질문 섹션 */}
      <div 
        className="rounded-xl px-4 py-6"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-lg font-bold text-white mb-4">자주 묻는 질문</h3>
        <div className="space-y-8 pt-2">
          {helpData?.faqs && helpData.faqs.length > 0 ? (
            helpData.faqs.map((faq) => (
              <div key={faq.id}>
                <p className="text-sm text-white mb-2">
                  <span className="text-purple-600 font-semibold">Q. </span>
                  {faq.question}
                </p>
                <p className="text-sm text-white" style={{ opacity: 0.8 }}>
                  <span className="font-semibold">A. </span>
                  {faq.answer}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white" style={{ opacity: 0.6 }}>
              자주 묻는 질문이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 긴급 정보 섹션 */}
{/*
      {helpData?.emergencyInfo?.content && (
        <div 
          className="rounded-xl p-4 mt-4"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <h3 className="text-lg font-bold text-red-400 mb-3">긴급 정보</h3>
          <p className="text-sm text-white" style={{ opacity: 0.9 }}>
            {helpData.emergencyInfo.content}
          </p>
        </div>
      )}
*/}

    </section>
  );
} 