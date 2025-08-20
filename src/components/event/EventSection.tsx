"use client";

import React from 'react';

interface EventSectionProps {
  title: string;
  subtitle?: string;
  rightButton?: {
    text: string;
    onClick: () => void;
  };
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
}

export default function EventSection({ 
  title, 
  subtitle, 
  rightButton, 
  children, 
  className = "",
  backgroundColor = "white"
}: EventSectionProps) {
  return (
    <section className={`${className}`}>
      {/* 섹션 헤더 */}
      <div className={`mb-4 px-4 ${backgroundColor}`}>
        <h2 className="text-xl font-bold text-black mb-1">{title}</h2>
        {(subtitle || rightButton) && (
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-sm font-regular text-black" style={{ opacity: 0.7 }}>
                {subtitle}
              </p>
            )}
            {rightButton && (
              <button
                onClick={rightButton.onClick}
                className="text-sm text-purple-700 hover:text-purple-700 transition-colors"
              >
                {rightButton.text}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 섹션 컨텐츠 */}
      {children}
    </section>
  );
} 