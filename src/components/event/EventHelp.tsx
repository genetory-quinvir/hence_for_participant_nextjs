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
    <div className="px-4 mb-12">
      <div className="rounded-xl p-4 mb-4 bg-white">
        <div className="flex items-center mb-4">
          <img 
            src="/images/icon_contact.png" 
            alt="연락처 아이콘" 
            className="w-8 h-8 mr-1 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h3 className="text-lg font-bold text-black">연락처</h3>
        </div>
        <div>
          <p className="text-md text-black opacity-60">{helpData?.contact?.phone || ''}</p>
          <p className="text-md text-black mb-3 opacity-60">{helpData?.contact?.email || ''}</p>
          <p className="text-md text-black mb-2 opacity-60">{helpData?.contact?.location || ''}</p>
        </div>
      </div>

      <div className="rounded-xl p-4 bg-white">
      <div className="flex items-start mb-4">
        <img 
              src="/images/icon_qna.png" 
              alt="연락처 아이콘" 
              className="w-8 h-8 mr-1 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          <h3 className="text-lg font-bold text-black">자주 묻는 질문</h3>
        </div>
        <div className="space-y-8">
          {helpData?.faqs && helpData.faqs.length > 0 ? (
            helpData.faqs.map((faq) => (
              <div key={faq.id}>
                <p className="text-md text-black mb-2">
                  <span className="text-purple-600 font-semibold">Q. </span>
                  {faq.question}
                </p>
                <p className="text-md text-black opacity-80">
                  <span className="font-semibold">A. </span>
                  {faq.answer}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-black opacity-60">
              자주 묻는 질문이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 