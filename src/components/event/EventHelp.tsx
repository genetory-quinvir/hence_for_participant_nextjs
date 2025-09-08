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
      <div className="rounded-xl px-4 py-6 mb-4 bg-white">
        <div className="flex items-center mb-6">
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
        <div className="ml-3">          
          {/* 카카오톡 오픈채팅방 링크 */}
          <div className="mb-6">
            <a 
              href="http://pf.kakao.com/_xnxcKBn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-md text-black underline hover:opacity-80 transition-opacity"
            >
              <img 
                src="/images/icon_kakao.png" 
                alt="카카오톡 아이콘" 
                className="w-6 h-6 mr-2 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              카카오톡 오픈채팅방 바로가기
            </a>
          </div>
          
          {/* 인스타그램 링크 */}
          <div className="mb-2">
            <a 
              href="https://www.instagram.com/seoultech_club_union?igsh=dzEzbjMzZjRmd3pr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-md text-black underline hover:opacity-80 transition-opacity"
            >
              <svg 
                className="w-6 h-6 mr-2" 
                viewBox="0 0 24 24"
              >
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <path 
                  fill="url(#instagram-gradient)" 
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
              인스타그램 바로가기
            </a>
          </div>
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
        <div className="space-y-8 mb-4">
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