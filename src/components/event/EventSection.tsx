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
}

export default function EventSection({ 
  title, 
  subtitle, 
  rightButton, 
  children, 
  className = "" 
}: EventSectionProps) {
  return (
    <section className={`py-8 px-4 ${className}`}>
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
        {(subtitle || rightButton) && (
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-sm font-regular text-white" style={{ opacity: 0.7 }}>
                {subtitle}
              </p>
            )}
            {rightButton && (
              <button
                onClick={rightButton.onClick}
                className="text-sm text-white hover:text-purple-600 transition-colors"
                style={{ opacity: 0.8 }}
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