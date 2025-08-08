"use client";

import { useState, useRef, useEffect } from "react";
import { FaqItem } from "@/types/api";

interface EventFaqProps {
  faqs: FaqItem[];
}

export default function EventFaq({ faqs }: EventFaqProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const scrollLeft = container.scrollLeft;

      // 각 슬라이드의 너비 (카드 288px + 간격 16px)
      const slideWidth = 288 + 16;

      // 현재 스크롤 위치를 기준으로 슬라이드 인덱스 계산
      let slideIndex = Math.round(scrollLeft / slideWidth);

      // 인덱스 범위 제한
      slideIndex = Math.max(0, Math.min(slideIndex, faqs.length - 1));

      setCurrentSlide(slideIndex);
    }
  };

  // 도트 클릭 핸들러
  const goToSlide = (index: number) => {
    if (carouselRef.current) {
      const slideWidth = 288 + 16; // w-72 (288px) + space-x-4 (16px)
      const scrollPosition = index * slideWidth;

      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });

      // 즉시 상태 업데이트 (스크롤 이벤트 대기하지 않고)
      setCurrentSlide(index);
    }
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      // passive: true로 설정하여 이벤트가 확실히 감지되도록
      carousel.addEventListener('scroll', handleScroll, { passive: true });

      // 초기 위치 설정
      handleScroll();

      return () => {
        carousel.removeEventListener('scroll', handleScroll);
      };
    }
  }, [faqs.length, handleScroll]);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-8">
      <h3 className="text-white font-semibold mb-3 text-sm" style={{ opacity: 0.8 }}>
        자주 묻는 질문
      </h3>

      {/* 캐로셀 컨테이너 */}
      <div className="overflow-x-auto scrollbar-hide" ref={carouselRef}>
        <div className="flex space-x-4">
          {faqs.map((faq, index) => (
            <div 
              key={faq.id || index}
              className="flex-shrink-0 w-72 rounded-lg p-4" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div>
                <h4 className="text-white font-medium text-l mb-2">{faq.question}</h4>
                <p className="text-white text-sm" style={{ opacity: 0.6 }}>
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페이지 컨트롤 (도트 인디케이터) */}
      {faqs.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: faqs.length }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 bg-white`}
              style={{
                opacity: index === currentSlide ? 1 : 0.3
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
} 