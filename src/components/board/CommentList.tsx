import { CommentItem as CommentItemType } from '@/types/api';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: CommentItemType[];
  getRelativeTime: (dateString: string) => string;
}

export default function CommentList({ comments, getRelativeTime }: CommentListProps) {
  return (
    <div className="space-y-4">
      {Array.isArray(comments) && comments.length > 0 ? (
        comments.map((comment) => (
          <CommentItem 
            key={comment.id} 
            comment={comment} 
            getRelativeTime={getRelativeTime}
          />
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-white" style={{ opacity: 0.6 }}>아직 댓글이 없습니다.</p>
          <p className="text-white text-sm mt-1" style={{ opacity: 0.4 }}>첫 번째 댓글을 작성해보세요!</p>
        </div>
      )}
    </div>
  );
} 