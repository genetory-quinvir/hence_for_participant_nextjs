import { FreeBoardItem, NoticeItem } from '@/types/api';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostActions from './PostActions';

interface PostDetailProps {
  post: FreeBoardItem | NoticeItem;
  isFreeBoardPost: boolean;
  formatDate: (dateString: string) => string;
}

export default function PostDetail({ post, isFreeBoardPost, formatDate }: PostDetailProps) {
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

      {/* 자유게시판인 경우 좋아요, 댓글 표시 */}
      {isFreeBoardPost && (
        <PostActions post={post as FreeBoardItem} />
      )}
    </>
  );
} 