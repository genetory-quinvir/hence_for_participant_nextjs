import { useState } from 'react';

export function useImageGallery() {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);

  const openGallery = (imageUrls: string[], startIndex: number = 0) => {
    setImages(imageUrls);
    setInitialIndex(startIndex);
    setIsOpen(true);
  };

  const closeGallery = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    images,
    initialIndex,
    openGallery,
    closeGallery
  };
} 