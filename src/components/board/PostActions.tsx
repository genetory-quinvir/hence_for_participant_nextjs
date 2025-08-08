import { FreeBoardItem } from '@/types/api';

interface PostActionsProps {
  post: FreeBoardItem;
}

export default function PostActions({ post }: PostActionsProps) {
  return (
    <div className="px-0 pb-5">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-white mr-2" style={{ opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="text-sm font-regular text-white" style={{ opacity: 0.8 }}>
            {post.likeCount || 0}
          </span>
        </div>
        
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white mr-2" style={{ opacity: 0.6 }}>
            <path fillRule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-regular text-white" style={{ opacity: 0.8 }}>
            {post.commentCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
} 