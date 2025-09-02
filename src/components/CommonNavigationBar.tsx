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
  fixedHeight?: boolean;
  height?: string;
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
  fixedHeight = false,
  height = "50px",
}: CommonNavigationBarProps) {
  const router = useRouter();
  return (
    <nav 
      className={`bg-${backgroundColor} bg-opacity-${backgroundOpacity} border-${backgroundColor} ${sticky ? 'sticky top-0 z-50' : ''}`}
      style={{
        height: fixedHeight ? height : 'auto',
        minHeight: fixedHeight ? height : '44px'
      }}
    >
      <div className="relative flex items-center justify-between h-full px-2">
        {/* 왼쪽 버튼 */}
        <div className="flex items-center z-10">
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
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center z-0">
          <h1 className={`text-md font-semibold ${textColor}`}>{title}</h1>
        </div>

        {/* 오른쪽 버튼 */}
        <div className="flex items-center z-10">
          {rightButton ? (
            onRightClick ? (
              <button
                onClick={onRightClick}
                className={`rounded-sm hover:bg-${backgroundColor} hover:bg-opacity-20 active:bg-opacity-30 transition-colors`}
              >
                {rightButton}
              </button>
            ) : (
              rightButton
            )
          ) : (
            <div className="w-10 h-10"></div>
          )}
        </div>
      </div>
    </nav>
  );
} 