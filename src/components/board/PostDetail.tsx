import { BoardItem } from '@/types/api';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';

interface PostDetailProps {
  post: BoardItem;
  isFreeBoardPost: boolean;
  formatDate: (dateString: string) => string;
  eventId: string;
  boardType: string;
  onLikeToggle?: (newLikeCount: number, isLiked: boolean) => void;
}

export default function PostDetail({ post, isFreeBoardPost, formatDate, eventId, boardType, onLikeToggle }: PostDetailProps) {
  return (
    <>
      {/* 게시글 헤더 */}
      <PostHeader 
        post={post} 
        isFreeBoardPost={isFreeBoardPost} 
        formatDate={formatDate} 
      />

      {/* 게시글 내용 */}
      <PostContent post={post} isFreeBoardPost={isFreeBoardPost} />

      {/* 좋아요, 댓글 표시 (자유게시판과 공지사항 모두) */}
      <PostActions 
        post={post} 
        eventId={eventId}
        boardType={boardType}
        onLikeToggle={onLikeToggle}
      />
    </>
  );
} 