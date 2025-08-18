"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BoardItem, CommentItem } from "@/types/api";
import { getBoardDetail, getComments, createComment, getAccessToken, deleteBoard } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostDetail from "@/components/board/PostDetail";
import CommentSection from "@/components/board/CommentSection";
import { useSimpleNavigation } from "@/utils/navigation";
import CommonActionSheet from "@/components/CommonActionSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

function BoardDetailContent() {
  const params = useParams();
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<BoardItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  // 인증 훅
  const { user } = useAuth();
  const { showToast } = useToast();

  // URL에서 타입 확인 (free 또는 notice)
  const postType = searchParams.get('type') || 'free';

  // 게시글 상세 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [params.id]);

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
  }, [params.id, postType, searchParams.get('eventId')]);



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
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
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
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
          // 현재 페이지 URL을 쿼리 파라미터로 전달
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          showToast(result.error || '댓글 작성에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      showToast('댓글 작성 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    goBack();
  };

  const handleMoreClick = () => {
    setShowActionSheet(true);
  };

  const handleActionClick = async (action: 'edit' | 'delete' | 'report') => {
    if (!post) return;
    
    setShowActionSheet(false);
    
    switch (action) {
      case 'edit':
        // 수정 페이지로 이동
        const eventId = searchParams.get('eventId') || 'default-event';
        navigate(`/board/edit/${post.id}?type=${postType}&eventId=${eventId}`);
        break;
      case 'delete':
        if (confirm('정말로 이 글을 삭제하시겠습니까?')) {
          try {
            const eventId = searchParams.get('eventId') || 'default-event';
            const result = await deleteBoard(eventId, postType, post.id);
            if (result.success) {
              showToast('게시글이 삭제되었습니다.', 'success');
              goBack(); // 삭제 후 뒤로가기
            } else {
              showToast(result.error || '게시글 삭제에 실패했습니다.', 'error');
            }
          } catch (error) {
            console.error('게시글 삭제 오류:', error);
            showToast('게시글 삭제 중 오류가 발생했습니다.', 'error');
          }
        }
        break;
      case 'report':
        if (confirm('이 글을 신고하시겠습니까?')) {
          // TODO: 신고 API 호출
          console.log('게시글 신고:', post.id);
        }
        break;
    }
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
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
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
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
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
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
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />
      
      <div className={`pl-4 pr-6 ${isFreeBoardPost ? 'py-2' : 'py-2'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* 게시글 디테일 */}
        <PostDetail 
          post={post} 
          isFreeBoardPost={isFreeBoardPost} 
          formatDate={formatDate}
          eventId={searchParams.get('eventId') || 'default-event'}
          boardType={postType}
          onMoreClick={handleMoreClick}
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

      {/* 액션시트 */}
      <CommonActionSheet
        isOpen={showActionSheet}
        onClose={handleCloseActionSheet}
        items={
          post && user && post.user?.id === user.id
            ? [
                {
                  label: "수정하기",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ),
                  onClick: () => handleActionClick('edit')
                },
                {
                  label: "삭제하기",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ),
                  onClick: () => handleActionClick('delete'),
                  variant: 'destructive'
                }
              ]
            : [
                {
                  label: "신고하기",
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ),
                  onClick: () => handleActionClick('report'),
                  variant: 'destructive'
                }
              ]
        }
      />
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