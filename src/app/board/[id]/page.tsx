"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BoardItem, CommentItem } from "@/types/api";
import { getBoardDetail, getComments, createComment, getAccessToken, deleteBoard } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
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
  const [validImages, setValidImages] = useState<string[]>([]);
  const [commentContent, setCommentContent] = useState('');

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
          
          // 댓글 가져오기 (자유게시판과 공지사항 모두)
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

  // 게시글이 로드될 때 이미지 설정
  useEffect(() => {
    if (post?.images && post.images.length > 0) {
      setValidImages(post.images);
    } else {
      setValidImages([]);
    }
  }, [post?.images]);

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
        // 입력 필드 초기화
        setCommentContent('');
        showToast('댓글이 작성되었습니다.', 'success');
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
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title={getPageTitle()}
          leftButton={
            <svg
              className="w-6 h-6 text-black"
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
          textColor="text-black"
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
    <div className="min-h-screen bg-white text-black">
      <CommonNavigationBar 
        leftButton={
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
      />

      <div className="px-4">
        <div className="flex items-center space-x-3 mb-4 mt-4">
          <CommonProfileView
            profileImageUrl={post.user?.profileImageUrl}
            nickname={post.user?.nickname || '익명'}
            size="lg"
            showBorder={true}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                {postType === 'notice' ? (
                  <span className="text-black font-semibold text-lg">
                    운영위원회
                  </span>
                ) : (
                  <span className="text-black font-semibold text-base">
                    {post.user?.nickname || '익명'}
                  </span>
                )}
              </div>
              <span className="text-black text-xs" style={{ opacity: 0.6 }}>
                {post.type === 'FREE' ? '자유게시판' : '공지사항'}
              </span>
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 my-6"></div>
        
        {/* 제목 */}
        <div className="mb-4">
          <h1 className="text-black font-bold text-lg">
            {post.title || '제목 없음'}
          </h1>
        </div>
        
        {/* 이미지가 있는 경우 */}
        {validImages.length > 0 && (
          <div className="mb-4 space-y-3">
            {validImages.map((image, index) => (
              <div key={index} className="rounded-lg overflow-hidden">
                <img 
                  src={image} 
                  alt={`게시글 이미지 ${index + 1}`}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 내용 */}
        <div className="mb-4">
          <div className="text-black text-md leading-relaxed whitespace-pre-wrap">
            {post.content || '내용 없음'}
          </div>
        </div>
        
        {/* 날짜 */}
        <div className="flex justify-end mb-4">
          <span className="text-black text-sm" style={{ opacity: 0.6 }}>
            {post.createdAt ? getRelativeTime(post.createdAt) : ''}
          </span>
        </div>
        
        {/* 좋아요, 댓글, 공유하기 버튼 */}
        <div className="flex items-center py-2 space-x-4">
          {/* 좋아요 버튼 */}
          <button className="flex items-center space-x-1 text-black">
            <svg 
              className={`w-5 h-5 ${post.isLiked ? 'text-purple-700' : 'text-black'}`}
              style={{ opacity: post.isLiked ? 1 : 0.6 }}
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className={`text-md font-normal ${post.isLiked ? 'text-purple-700' : 'text-black'}`} style={{ opacity: post.isLiked ? 1 : 0.8 }}>
              {post.likeCount || 0}
            </span>
          </button>
          
          {/* 댓글 버튼 */}
          <button className="flex items-center space-x-2 text-black">
            <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 10.5h.01m-4.01 0h.01M8 10.5h.01M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6.6a1 1 0 0 0-.69.275l-2.866 2.723A.5.5 0 0 1 8 18.635V17a1 1 0 0 0-1-1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>
            </svg>
            <span className="text-md font-normal text-black" style={{ opacity: 0.8 }}>
              {comments.length}
            </span>
          </button>
        </div>
              
        <div className="border-b border-gray-200 my-4"></div>

        {/* 댓글 입력 영역과 목록 */}
        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom) + 24px, 24px)' }}>
          {/* 댓글 입력 */}
          <div className="flex-1 min-w-0">
            <textarea 
              placeholder="댓글을 입력하세요..." 
              className="w-full p-3 rounded-md resize-none comment-textarea bg-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-700 focus:border-transparent"
              rows={3}
              style={{ minHeight: '80px' }}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button 
              className={`px-4 py-2 mt-1 rounded-md text-md font-bold ${
                commentContent.trim() 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!commentContent.trim() || isSubmitting}
              onClick={() => handleSubmitComment(commentContent)}
            >
              {isSubmitting ? '작성 중...' : '댓글 작성'}
            </button>
          </div>

          {/* 댓글 목록 */}
          <div className="mt-4">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="mb-6">
                  <div className="flex items-center space-x-2">
                    <CommonProfileView
                      profileImageUrl={comment.user?.profileImageUrl}
                      nickname={comment.user?.nickname || '익명'}
                      size="lg"
                      showBorder={true}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-black font-semibold text-sm">
                          {comment.user?.nickname || '익명'}
                        </span>
                        <span className="text-black text-xs" style={{ opacity: 0.6 }}>
                          {comment.createdAt ? getRelativeTime(comment.createdAt) : ''}
                        </span>
                      </div>
                      <div className="text-black text-sm">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm">아직 댓글이 없습니다.</div>
                <div className="text-gray-400 text-xs mt-1">첫 번째 댓글을 작성해보세요!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function BoardDetailLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
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