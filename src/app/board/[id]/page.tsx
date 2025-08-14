"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BoardItem, CommentItem } from "@/types/api";
import { getBoardDetail, getComments, createComment, getAccessToken } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostDetail from "@/components/board/PostDetail";
import CommentSection from "@/components/board/CommentSection";
import { useSimpleNavigation, SimpleNavigation } from "@/utils/navigation";

function BoardDetailContent() {
  const params = useParams();
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<BoardItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL에서 타입 확인 (free 또는 notice)
  const postType = searchParams.get('type') || 'free';

  // 게시글 상세 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    if (params.id) {
      const currentPath = window.location.pathname + window.location.search;
      SimpleNavigation.addPage(currentPath);
    }
  }, [params.id, searchParams]);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // URL에서 event_id를 가져오기 위해 searchParams 사용
        const eventId = searchParams.get('eventId') || 'default-event';
        const postId = params.id as string;
        
        // API 호출
        const result = await getBoardDetail(eventId, postType, postId);
        
        if (result.success && result.data) {
          console.log('🔍 게시글 상세 정보 로드:', {
            id: result.data.id,
            isLiked: result.data.isLiked,
            likeCount: result.data.likeCount,
            type: result.data.type
          });
          setPost(result.data);
          
          // 자유게시판인 경우 댓글도 가져오기
          if (postType === 'free') {
            try {
              const commentsResult = await getComments(eventId, postType, postId);
              if (commentsResult.success && commentsResult.data) {
                setComments(commentsResult.data);
              } else {
                setComments([]);
              }
            } catch (err) {
              console.error("댓글 로드 오류:", err);
              setComments([]);
            }
          } else {
            setComments([]);
          }
        } else {
          setError(result.error || "게시글을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("게시글 로드 오류:", err);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPostDetail();
    }
  }, [params.id, postType, searchParams]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}초 전`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }

    // 24시간 이상 지난 경우 날짜로 표시
    return date.toLocaleDateString('ko-KR');
  };



  const handleBackClick = () => {
    console.log('🔄 뒤로가기 처리');
    goBack();
  };

  const getPageTitle = () => {
    if (postType === 'free') {
      return '자유게시판';
    } else if (postType === 'notice') {
      return '공지사항';
    }
    return '게시글';
  };

  const handleSubmitComment = async (content: string) => {
    try {
      // 인증 상태 확인
      const accessToken = getAccessToken();
      if (!accessToken) {
        alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        // 현재 페이지 URL을 쿼리 파라미터로 전달
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      setIsSubmitting(true);
      const eventId = searchParams.get('eventId') || 'default-event';
      const postId = params.id as string;
      
      const result = await createComment(eventId, postType, postId, content);
      
      if (result.success) {
        // 댓글 작성 성공 시 댓글 목록 새로고침
        const commentsResult = await getComments(eventId, postType, postId);
        if (commentsResult.success && commentsResult.data) {
          setComments(commentsResult.data);
        }
      } else {
        if (result.error?.includes('로그인이 만료')) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          // 현재 페이지 URL을 쿼리 파라미터로 전달
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          alert(result.error || '댓글 작성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">{error || "게시글을 찾을 수 없습니다."}</div>
        </div>
      </div>
    );
  }

  // post가 로드된 후에만 isFreeBoardPost 계산
  const isFreeBoardPost = post && postType === 'free';

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title={getPageTitle()}
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
      />
      
            <div className={`pl-4 pr-6 ${isFreeBoardPost ? 'py-2' : 'py-2'}`}>
        {/* 게시글 디테일 */}
        <PostDetail 
          post={post} 
          isFreeBoardPost={isFreeBoardPost} 
          formatDate={formatDate}
          eventId={searchParams.get('eventId') || 'default-event'}
          boardType={postType}
          onLikeToggle={async (newLikeCount, isLiked) => {
            // 좋아요 상태 변경 후 게시글 상세 정보 새로고침
            try {
              const eventId = searchParams.get('eventId') || 'default-event';
              const postId = params.id as string;
              
              const result = await getBoardDetail(eventId, postType, postId);
              if (result.success && result.data) {
                setPost(result.data);
              }
            } catch (error) {
              console.error('게시글 새로고침 오류:', error);
              // 새로고침 실패 시 로컬 상태로 업데이트
              setPost(prevPost => {
                if (prevPost) {
                  return {
                    ...prevPost,
                    likeCount: newLikeCount,
                    isLiked: isLiked
                  };
                }
                return prevPost;
              });
            }
          }}
        />

        {/* 댓글 섹션 (자유게시판인 경우만) */}
        {isFreeBoardPost && (
          <CommentSection 
            comments={comments} 
            getRelativeTime={getRelativeTime} 
            onSubmitComment={handleSubmitComment}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function BoardDetailLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>게시글을 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function BoardDetailPage() {
  return (
    <Suspense fallback={<BoardDetailLoading />}>
      <BoardDetailContent />
    </Suspense>
  );
}