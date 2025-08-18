import { BoardItem } from '@/types/api';
import PostHeader from '@/components/common/PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';

interface PostDetailProps {
  post: BoardItem;
  isFreeBoardPost: boolean;
  formatDate: (dateString: string) => string;
  eventId: string;
  boardType: string;
  onLikeToggle?: (newLikeCount: number, isLiked: boolean) => void;
  onMoreClick?: () => void;
}

export default function PostDetail({ post, isFreeBoardPost, formatDate, eventId, boardType, onLikeToggle, onMoreClick }: PostDetailProps) {
  return (
    <>
      {/* 게시글 헤더 */}
      {isFreeBoardPost ? (
        // 자유게시판: 프로필과 닉네임 표시
        post.user && (
          <PostHeader 
            nickname={post.user.nickname}
            profileImageUrl={post.user.profileImageUrl || undefined}
            createdAt={post.createdAt}
            size="md"
            className="mb-4 mt-4"
            showMoreButton={true}
            onMoreClick={onMoreClick}
          />
        )
      ) : (
        // 공지사항: 공지사항 라벨과 날짜 표시
        <PostHeader 
          createdAt={post.createdAt}
          size="md"
          className="mb-4 mt-4"
          showMoreButton={true}
          isNotice={true}
          onMoreClick={onMoreClick}
        />
      )}

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