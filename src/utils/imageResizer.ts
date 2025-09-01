// 이미지 리사이징 유틸리티

interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

// 기본 리사이징 옵션
const DEFAULT_OPTIONS: ResizeOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'webp'
};

// 이미지 리사이징 함수
export async function resizeImage(
  file: File, 
  options: ResizeOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 원본 이미지 크기
      const { width: originalWidth, height: originalHeight } = img;
      
      // 리사이징할 크기 계산
      let { width: newWidth, height: newHeight } = calculateDimensions(
        originalWidth, 
        originalHeight, 
        opts.maxWidth!, 
        opts.maxHeight!
      );
      
      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // 이미지 그리기
      ctx!.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 캔버스를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // 새로운 File 객체 생성
            const resizedFile = new File([blob], file.name, {
              type: `image/${opts.format}`,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('이미지 리사이징에 실패했습니다.'));
          }
        },
        `image/${opts.format}`,
        opts.quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };
    
    // File을 URL로 변환하여 이미지 로드
    const url = URL.createObjectURL(file);
    img.src = url;
    
    // 메모리 정리
    img.onload = () => {
      URL.revokeObjectURL(url);
    };
  });
}

// 비율을 유지하면서 크기 계산
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // 너비가 최대 너비를 초과하는 경우
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  
  // 높이가 최대 높이를 초과하는 경우
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }
  
  return { width: Math.round(width), height: Math.round(height) };
}

// 여러 이미지 리사이징
export async function resizeImages(
  files: File[], 
  options: ResizeOptions = {}
): Promise<File[]> {
  const resizePromises = files.map(file => resizeImage(file, options));
  return Promise.all(resizePromises);
}

// 파일 크기 확인 (MB 단위)
export function getFileSizeInMB(file: File): number {
  return file.size / (1024 * 1024);
}

// 이미지 파일인지 확인
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// 지원되는 이미지 형식인지 확인
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return supportedTypes.includes(file.type);
}
