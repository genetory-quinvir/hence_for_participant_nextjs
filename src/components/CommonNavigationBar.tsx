"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface CommonNavigationBarProps {
  title?: string;
  leftButton?: React.ReactNode;
  rightButton?: React.ReactNode;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  backgroundColor?: string;
  backgroundOpacity?: number;
  textColor?: string;
  sticky?: boolean;
}

export default function CommonNavigationBar({
  title,
  leftButton,
  rightButton,
  onLeftClick,
  onRightClick,
  backgroundColor = "black",
  backgroundOpacity = 100,
  textColor = "text-white",
  sticky = true,
}: CommonNavigationBarProps) {
  const router = useRouter();
  return (
    <nav 
      className={`bg-${backgroundColor} bg-opacity-${backgroundOpacity} border-${backgroundColor} ${sticky ? 'sticky top-0 z-50 h-[50px]' : ''}`}
    >
      <div className="flex items-center justify-between h-full px-2">
        {/* 왼쪽 버튼 */}
        <div className="flex items-center">
          {leftButton ? (
            <button
              onClick={onLeftClick}
              className={`rounded-lg hover:bg-${backgroundColor} hover:bg-opacity-20 active:bg-opacity-30 transition-colors`}
            >
              {leftButton}
            </button>
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </div>

        {/* 가운데 타이틀 */}
        <div className="flex-1 text-center">
          <h1 className={`text-lg font-semibold ${textColor}`}>{title}</h1>
        </div>

        {/* 오른쪽 버튼 */}
        <div className="flex items-center">
          {rightButton ? (
            <button
              onClick={onRightClick}
              className={`rounded-lg hover:bg-${backgroundColor} hover:bg-opacity-20 active:bg-opacity-30 transition-colors`}
            >
              {rightButton}
            </button>
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </div>
      </div>
    </nav>
  );
} 