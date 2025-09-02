// 이미지 리사이징 유틸리티

interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

// 기본 리사이징 옵션 (아이폰 최적화)
const DEFAULT_OPTIONS: ResizeOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'webp'
};

// 아이폰 최적화된 옵션
const getIOSOptimizedOptions = (): ResizeOptions => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return {
      maxWidth: 800, // 아이폰에서는 더 작은 크기
      maxHeight: 800,
      quality: 0.7, // 더 낮은 품질로 메모리 절약
      format: 'jpeg' // 아이폰에서는 JPEG 사용
    };
  }
  return DEFAULT_OPTIONS;
};

// WebP 지원 여부 확인 (아이폰 최적화)
function isWebPSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    // 아이폰 Safari에서 WebP 지원 확인
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // 아이폰에서는 JPEG 사용 권장
      console.log('🍎 iOS 감지: JPEG 형식 사용');
      return false;
    }
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch (error) {
    console.log('⚠️ WebP 지원 확인 실패, JPEG 사용:', error);
    return false;
  }
}

// 이미지 리사이징 함수
export async function resizeImage(
  file: File, 
  options: ResizeOptions = {}
): Promise<File> {
  // 아이폰 최적화된 옵션 적용
  const iosOptions = getIOSOptimizedOptions();
  const opts = { ...iosOptions, ...options };
  
  // WebP 지원 여부 확인 및 대체
  let targetFormat = opts.format;
  if (targetFormat === 'webp' && !isWebPSupported()) {
    console.log('⚠️ WebP가 지원되지 않습니다. JPEG로 대체합니다.');
    targetFormat = 'jpeg';
  }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // CORS 이슈 방지를 위한 설정
    img.crossOrigin = 'anonymous';
    
    // 타임아웃 설정 (15초)
    const timeout = setTimeout(() => {
      reject(new Error('이미지 리사이징 타임아웃'));
    }, 15000);
    
    img.onload = () => {
      try {
        clearTimeout(timeout);
        
        // 원본 이미지 크기
        const { width: originalWidth, height: originalHeight } = img;
        console.log(`📐 원본 크기: ${originalWidth}x${originalHeight}`);
        
        // 리사이징할 크기 계산
        let { width: newWidth, height: newHeight } = calculateDimensions(
          originalWidth, 
          originalHeight, 
          opts.maxWidth!, 
          opts.maxHeight!
        );
        
        console.log(`📐 리사이징 크기: ${newWidth}x${newHeight}`);
        
        // 캔버스 크기 설정
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 캔버스 배경을 흰색으로 설정 (투명도 문제 방지)
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, newWidth, newHeight);
        
        // 이미지 그리기
        ctx!.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 캔버스를 Blob으로 변환 (여러 번 시도)
        const tryToBlob = (attempt = 1, format = targetFormat) => {
          const mimeType = `image/${format}`;
          console.log(`🔄 Blob 생성 시도 ${attempt}/3 (${mimeType})`);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 새로운 File 객체 생성
                const resizedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                console.log(`✅ 리사이징 완료: ${file.name} -> ${resizedFile.size} bytes (${mimeType})`);
                
                // 메모리 정리
                URL.revokeObjectURL(url);
                resolve(resizedFile);
              } else {
                console.error(`❌ Blob 생성 실패 (시도 ${attempt}, ${mimeType})`);
                if (attempt < 3) {
                  console.log(`🔄 재시도 중... (${attempt + 1}/3)`);
                  setTimeout(() => tryToBlob(attempt + 1, format), 100);
                } else if (format === 'webp' && attempt === 3) {
                  // WebP 실패 시 JPEG로 재시도
                  console.log('🔄 WebP 실패, JPEG로 재시도...');
                  tryToBlob(1, 'jpeg');
                } else {
                  URL.revokeObjectURL(url);
                  reject(new Error('이미지 리사이징에 실패했습니다.'));
                }
              }
            },
            mimeType,
            opts.quality
          );
        };
        
        tryToBlob();
      } catch (error) {
        clearTimeout(timeout);
        console.error('❌ 리사이징 처리 중 오류:', error);
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      clearTimeout(timeout);
      console.error('❌ 이미지 로드 실패:', error);
      URL.revokeObjectURL(url);
      reject(new Error('이미지 로드에 실패했습니다.'));
    };
    
    // File을 URL로 변환하여 이미지 로드
    const url = URL.createObjectURL(file);
    console.log(`🔄 이미지 로드 시작: ${file.name}`);
    img.src = url;
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
