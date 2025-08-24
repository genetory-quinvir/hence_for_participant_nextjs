"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BoardItem, CommentItem } from "@/types/api";
import { getBoardDetail, getComments, createComment, getAccessToken, deleteBoard, toggleLike } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useSimpleNavigation } from "@/utils/navigation";
import CommonActionSheet from "@/components/CommonActionSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { useImageGallery } from "@/hooks/useImageGallery";
import ImageGallery from "@/components/common/ImageGallery";

function BoardDetailContent() {
  const params = useParams();
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // URL에서 타입 확인 (free 또는 notice)
  const postType = searchParams.get('type') || 'free';
  
  // 상태 관리
  const [post, setPost] = useState<BoardItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isLiking, setIsLiking] = useState(false);

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 게시글 상세 정보 및 댓글 로드
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const eventId = searchParams.get('eventId') || 'default-event';
        const postId = params.id as string;
        
        // 게시글 상세 정보 로드
        const result = await getBoardDetail(eventId, postType, postId);
        
        if (result.success && result.data) {
          setPost(result.data);
          
          // 댓글 로드
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

  // 상대적 시간 표시 함수
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

    return date.toLocaleDateString('ko-KR');
  };

  // 페이지 제목 가져오기
  const getPageTitle = () => {
    if (postType === 'free') {
      return '자유게시판';
    } else if (postType === 'notice') {
      return '공지사항';
    }
    return '게시글';
  };

  // 댓글 작성 핸들러
  const handleSubmitComment = async (content: string) => {
    try {
      // 인증 상태 확인
      const accessToken = getAccessToken();
      if (!accessToken) {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      setIsSubmitting(true);
      const eventId = searchParams.get('eventId') || 'default-event';
      const postId = params.id as string;
      
      const result = await createComment(eventId, postType, postId, content);
      
      if (result.success) {
        // 댓글 목록 새로고침
        const commentsResult = await getComments(eventId, postType, postId);
        if (commentsResult.success && commentsResult.data) {
          setComments(commentsResult.data);
        }
        setCommentContent('');
      } else {
        if (result.error?.includes('로그인이 만료')) {
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
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

  // 액션 핸들러들
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
              goBack();
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
          console.log('게시글 신고:', post.id);
        }
        break;
    }
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageIndex: number) => {
    if (post?.images && post.images.length > 0) {
      openGallery(post.images, imageIndex);
    }
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async () => {
    if (!post) return;

    try {
      // 인증 상태 확인
      const accessToken = getAccessToken();
      if (!accessToken) {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      setIsLiking(true);
      const eventId = searchParams.get('eventId') || 'default-event';
      const postId = params.id as string;
      
      const result = await toggleLike(eventId, postType, postId, post.isLiked || false);
      
      if (result.success) {
        // 로컬 상태 업데이트
        setPost(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            isLiked: result.updatedIsLiked !== undefined ? result.updatedIsLiked : !prev.isLiked,
            likeCount: result.updatedLikeCount !== undefined ? result.updatedLikeCount : (prev.isLiked ? (prev.likeCount || 0) - 1 : (prev.likeCount || 0) + 1)
          };
        });
      } else {
        if (result.error?.includes('로그인이 만료')) {
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          showToast(result.error || '좋아요 처리에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />
        
        {/* 게시글 상세 스켈레톤 */}
        <div className="px-4 py-6 pb-8">
          {/* 게시글 헤더 스켈레톤 */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* 제목 스켈레톤 */}
          <div className="mb-8 space-y-2">
            <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-1/2 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* 이미지 스켈레톤 */}
          <div className="mb-8 space-y-4">
            <div className="w-full h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
            <div className="w-full h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
          
          {/* 내용 스켈레톤 */}
          <div className="mb-8 space-y-3">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* 액션 버튼 스켈레톤 */}
          <div className="flex items-center justify-between py-4 mb-8 border-b border-gray-100">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 댓글 섹션 헤더 스켈레톤 */}
          <div className="mb-6">
            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* 댓글 입력 스켈레톤 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
            <div className="w-full h-20 bg-white rounded-xl animate-pulse"></div>
            <div className="flex justify-end mt-4">
              <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* 댓글 목록 스켈레톤 */}
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 text-lg">{error || "게시글을 찾을 수 없습니다."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden " style={{ paddingBottom: 'min(24px, env(safe-area-inset-bottom) + 24px)' }}>
      {/* 최대 너비 제한 컨테이너 */}
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar 
        title={getPageTitle()}
        leftButton={
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
        fixedHeight={true}
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col overflow-y-auto scrollbar-hide" style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="px-4 py-6 pb-8">
          {/* 게시글 헤더 */}
          <div className="flex items-center space-x-2 mb-8">
            <CommonProfileView
              profileImageUrl={post.user?.profileImageUrl}
              nickname={post.user?.nickname || '익명'}
              size="md"
              showBorder={true}
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  {postType === 'notice' ? (
                    <span className="text-black font-semibold text-md">운영위원회</span>
                  ) : (
                    <span className="text-black font-semibold text-md">
                      {post.user?.nickname || '익명'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 제목 */}
          {post.title && (
            <div className="mb-8">
              <h1 className="text-black font-bold text-md leading-tight">
                {post.title}
              </h1>
            </div>
          )}
          
          {/* 이미지 */}
          {post.images && post.images.length > 0 && (
            <div className="mb-8 space-y-4">
              {post.images.map((image, index) => (
                <div key={index} className="rounded-2xl overflow-hidden">
                  <img 
                    src={image} 
                    alt={`게시글 이미지 ${index + 1}`}
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(index)}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* 내용 */}
          <div className="mb-8">
            <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
              {post.content || '내용 없음'}
            </div>
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex items-center justify-between py-4 mb-8 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <button 
                className={`flex items-center transition-colors ${
                  isLiking ? 'opacity-50 cursor-not-allowed' : post.isLiked ? 'hover:text-purple-800' : 'hover:text-purple-600'
                } ${post.isLiked ? 'text-purple-700' : 'text-black'}`}
                onClick={handleLikeToggle}
                disabled={isLiking}
              >
                {post.isLiked ? (
                  <svg 
                    className="w-4 h-4 mr-1 text-purple-700" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg 
                    className="w-4 h-4 mr-1 text-black" 
                    style={{ opacity: 0.6 }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                )}
                <span className={`text-xs font-regular ${post.isLiked ? 'text-purple-700' : 'text-black'}`} style={{ opacity: post.isLiked ? 1 : 0.8 }}>
                  {post.likeCount || 0}
                </span>
              </button>
              
              <div className="flex items-center">
                <svg 
                  className="w-4 h-4 text-black mr-1" 
                  style={{ opacity: 0.6 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs font-regular text-black" style={{ opacity: 0.8 }}>
                  {comments.length}
                </span>
              </div>
            </div>
            
            {/* 날짜 - 오른쪽 정렬 */}
            {post.createdAt && (
              <span className="text-xs text-gray-500 font-regular">
                {getRelativeTime(post.createdAt)}
              </span>
            )}
          </div>

          {/* 댓글 섹션 헤더 */}
          <div className="mb-6">
            <h2 className="text-black font-bold text-xl">댓글</h2>
          </div>

          {/* 댓글 입력 */}
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
            <textarea 
              placeholder="댓글을 입력하세요..." 
              className="w-full p-4 rounded-xl resize-none bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent border border-gray-200"
              rows={3}
              style={{ minHeight: '80px' }}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <button 
                className={`px-6 py-3 rounded-lg text-md font-bold transition-colors ${
                  commentContent.trim() 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!commentContent.trim() || isSubmitting}
                onClick={() => handleSubmitComment(commentContent)}
              >
                {isSubmitting ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="space-y-6 mb-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-4">
                  <CommonProfileView
                    profileImageUrl={comment.user?.profileImageUrl}
                    nickname={comment.user?.nickname || '익명'}
                    size="md"
                    showBorder={true}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-black font-bold text-sm">
                        {comment.user?.nickname || '익명'}
                      </span>
                      <span className="text-gray-400 text-xs font-medium">
                        {comment.createdAt ? getRelativeTime(comment.createdAt) : ''}
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500 text-base font-medium mb-1">아직 댓글이 없습니다</p>
                <p className="text-gray-400 text-sm">첫 번째 댓글을 작성해보세요!</p>
              </div>
            )}
          </div>
          
        </div>
      </main>

      {/* 액션 시트 */}
      <CommonActionSheet
        isOpen={showActionSheet}
        onClose={handleCloseActionSheet}
        items={[
          { 
            label: '수정', 
            onClick: () => handleActionClick('edit'),
            variant: 'default'
          },
          { 
            label: '삭제', 
            onClick: () => handleActionClick('delete'),
            variant: 'destructive'
          },
          { 
            label: '신고', 
            onClick: () => handleActionClick('report'),
            variant: 'default'
          }
        ]}
      />

      {/* 이미지 갤러리 */}
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeGallery}
      />
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function BoardDetailLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-black text-sm" style={{ opacity: 0.7 }}>게시글을 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function BoardDetailPage() {
  return (
    <Suspense fallback={<BoardDetailLoading />}>
      <BoardDetailContent />
    </Suspense>
  );
}