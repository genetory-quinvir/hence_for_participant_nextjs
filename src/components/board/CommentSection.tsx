import { CommentItem as CommentItemType } from '@/types/api';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

interface CommentSectionProps {
  comments: CommentItemType[];
  getRelativeTime: (dateString: string) => string;
}

export default function CommentSection({ comments, getRelativeTime }: CommentSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 mt-4">댓글 ({Array.isArray(comments) ? comments.length : 0})</h3>
      
      {/* 댓글 작성 폼 */}
      <CommentForm />

      {/* 댓글 목록 */}
      <CommentList comments={comments} getRelativeTime={getRelativeTime} />
    </div>
  );
} 