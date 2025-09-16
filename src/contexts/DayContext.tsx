'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DayContextType {
  currentDay: number;
  setCurrentDay: (day: number) => void;
}

const DayContext = createContext<DayContextType | undefined>(undefined);

export const useDay = () => {
  const context = useContext(DayContext);
  if (context === undefined) {
    throw new Error('useDay must be used within a DayProvider');
  }
  return context;
};

interface DayProviderProps {
  children: ReactNode;
}

export const DayProvider: React.FC<DayProviderProps> = ({ children }) => {
  // 하드코딩으로 현재 Day 설정 (1 또는 2)
  const [currentDay, setCurrentDay] = useState(2);

  return (
    <DayContext.Provider value={{ currentDay, setCurrentDay }}>
      {children}
    </DayContext.Provider>
  );
};
