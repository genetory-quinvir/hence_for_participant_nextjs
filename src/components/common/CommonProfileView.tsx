import React from 'react';

interface CommonProfileViewProps {
  profileImageUrl?: string | null;
  nickname?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
  showBorder?: boolean;
  showHover?: boolean;
}

const CommonProfileView: React.FC<CommonProfileViewProps> = ({
  profileImageUrl,
  nickname = '',
  size = 'md',
  onClick,
  className = '',
  showBorder = false,
  showHover = false
}) => {
  // 크기별 스타일 설정
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-[56px] h-[56px] text-2xl'
  };

  // 기본 스타일
  const baseClasses = `bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 ${sizeClasses[size]}`;
  
  // 추가 스타일
  const additionalClasses = [
    showBorder && 'border-2 border-gray-100',
    showHover && 'hover:border-opacity-40 transition-all',
    onClick && 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');

  const finalClasses = `${baseClasses} ${additionalClasses}`;

  // 사용자 이니셜 생성
  const getUserInitial = () => {
    if (!nickname) return 'U';
    return nickname.charAt(0).toUpperCase();
  };

  return (
    <div 
      className={finalClasses}
      onClick={onClick}
      style={{
        backgroundColor: profileImageUrl ? 'transparent' : '#f3f4f6',
        border: showBorder ? 'none' : 'none'
      }}
    >
      {profileImageUrl ? (
        <div className="w-full h-full rounded-full overflow-hidden">
          <img 
            src={profileImageUrl} 
            alt="Profile" 
            className="w-full h-full object-cover rounded-full" 
          />
        </div>
      ) : (
        <span className="text-black font-semibold">
          {getUserInitial()}
        </span>
      )}
    </div>
  );
};

export default CommonProfileView; 