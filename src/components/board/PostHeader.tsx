import { FreeBoardItem, NoticeItem } from '@/types/api';

interface PostHeaderProps {
  post: FreeBoardItem | NoticeItem;
  isFreeBoardPost: boolean;
  formatDate: (dateString: string) => string;
}

export default function PostHeader({ post, isFreeBoardPost, formatDate }: PostHeaderProps) {
  return (
    <div className={`${isFreeBoardPost ? 'mb-4' : 'mb-6'}`}>
      {!isFreeBoardPost && (
        <div className="mb-1">
          <h1 className="text-xl font-bold">{post.title}</h1>
        </div>
      )}
      
      {isFreeBoardPost && 'user' in post && post.user && (
        <div className="flex items-center mb-4, mt-4">
          <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mr-3">
            {post.user.profileImageUrl ? (
              <img 
                src={post.user.profileImageUrl} 
                alt={post.user.nickname}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-md font-medium">
                {post.user.nickname.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-md">{post.user.nickname}</div>
            <div className="text-sm text-gray-400">
              {formatDate(post.createdAt || '')}
            </div>
          </div>
        </div>
      )}

      {!isFreeBoardPost && (
        <div className="text-sm text-gray-400 mb-4">
          {formatDate(post.createdAt || '')}
        </div>
      )}
    </div>
  );
} 