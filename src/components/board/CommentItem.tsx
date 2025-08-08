import { CommentItem as CommentItemType } from '@/types/api';
import PostHeader from '@/components/common/PostHeader';

interface CommentItemProps {
  comment: CommentItemType;
  getRelativeTime: (dateString: string) => string;
}

export default function CommentItem({ comment, getRelativeTime }: CommentItemProps) {
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <PostHeader 
        nickname={comment.user?.nickname}
        createdAt={comment.createdAt}
        size="md"
        className="mb-3"
        showMoreButton={true}
        onMoreClick={() => {
          // TODO: 댓글 더보기 메뉴 표시
          console.log('댓글 더보기 클릭');
        }}
      />
      <p className="text-md text-white whitespace-pre-wrap">{comment.content || ''}</p>
    </div>
  );
} 