import { BoardItem } from '@/types/api';
import CommonPostHeader from '@/components/common/PostHeader';

interface PostHeaderProps {
  post: BoardItem;
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
        <CommonPostHeader 
          nickname={post.user.nickname}
          createdAt={post.createdAt}
          size="md"
          className="mb-4 mt-4"
          showMoreButton={true}
          onMoreClick={() => {
            // TODO: 더보기 메뉴 표시
            console.log('더보기 클릭');
          }}
        />
      )}

      {!isFreeBoardPost && (
        <div className="text-sm text-gray-400 mb-4">
          {formatDate(post.createdAt || '')}
        </div>
      )}
    </div>
  );
} 