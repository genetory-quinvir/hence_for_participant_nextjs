"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import CommonActionSheet from "@/components/CommonActionSheet";
import { UserItem, BoardItem, CommentItem } from "@/types/api";
import { getUserProfile, getUserPosts, getUserComments, deleteBoard, deleteComment } from "@/lib/api";
import { getFormattedTime } from "@/utils/time";
import PostHeader from "@/components/common/PostHeader";
import Image from "next/image";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

// 탭 타입 정의
type TabType = 'posts' | 'comments';

// 스켈레톤 컴포넌트
const SkeletonPulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// 스켈레톤 카드 컴포넌트
const SkeletonCard = () => (
  <div className="rounded-xl overflow-hidden mb-4">
    <div className="px-2 py-4 h-full flex flex-col relative">
      <div className="absolute" style={{ bottom: '0px', left: '0px', right: '0px', borderBottom: '1px solid rgb(229, 231, 235)' }}></div>
      
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center mb-3">
        <SkeletonPulse className="w-8 h-8 rounded-full mr-3" />
        <div className="flex-1">
          <SkeletonPulse className="w-20 h4 mb-1" />
          <SkeletonPulse className="w-16 h-3" />
        </div>
      </div>
      
      {/* 내용 스켈레톤 */}
      <div className="flex-1">
        <SkeletonPulse className="w-full h-4 mb-2" />
        <SkeletonPulse className="w-3/4 h-4 mb-2" />
        <SkeletonPulse className="w-1/2 h-4" />
      </div>
      
      {/* 액션 버튼 스켈레톤 */}
      <div className="mt-auto pt-3 mb-2">
        <div className="flex items-center space-x-4">
          <SkeletonPulse className="w-12 h-3" />
          <SkeletonPulse className="w-12 h-3" />
        </div>
      </div>
    </div>
  </div>
);

// 로딩 스켈레톤 컴포넌트
const LoadingSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-0">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);



// 프로바이더 아이콘 컴포넌트
const ProviderIcon = ({ provider }: { provider?: string }) => {
  if (!provider || provider.toLowerCase() === 'email') return null;
  
  return (
    <img 
      src={`/images/icon_${provider.toLowerCase()}.png`}
      alt={`${provider} 아이콘`}
      className="w-4 h-4 mr-2"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
};

// 프로바이더 텍스트 컴포넌트
const ProviderText = ({ provider }: { provider?: string }) => {
  if (!provider || provider.toLowerCase() === 'email') return null;
  
  const providerNames = {
    naver: '네이버',
    google: '구글',
    kakao: '카카오'
  };
  
  return (
    <span className="text-black font-normal text-sm" style={{ opacity: 0.6 }}>
      {providerNames[provider.toLowerCase() as keyof typeof providerNames] || provider}로 연결되어 있음
    </span>
  );
};

function ProfilePageContent() {
  const { navigate, goBack } = useSimpleNavigation();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const tabContainerRef = useRef<HTMLDivElement>(null);
  
  // 상태 관리
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [profileData, setProfileData] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPosts, setUserPosts] = useState<BoardItem[]>([]);
  const [userComments, setUserComments] = useState<CommentItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // 무한 스크롤 관련 상태
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [postsHasNext, setPostsHasNext] = useState(true);
  const [commentsHasNext, setCommentsHasNext] = useState(true);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  
  // Ref 관리
  const isMounted = useRef(false);
  const hasLoadedProfile = useRef(false);
  const hasLoadedActivity = useRef(false);
  
  // 삭제 관련 상태
  const [showPostActionSheet, setShowPostActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BoardItem | null>(null);
  const [showCommentActionSheet, setShowCommentActionSheet] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 메모이제이션된 값들
  const finalUserData = useMemo(() => profileData || user, [profileData, user]);
  
  const userStats = useMemo(() => ({
    eventCount: finalUserData?.eventCount || 0,
    postCount: finalUserData?.postCount || 0,
    commentCount: finalUserData?.commentCount || 0
  }), [finalUserData]);

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isAuthenticated || !user || hasLoadedProfile.current) return;
      
      try {
        setIsLoading(true);
        const result = await getUserProfile();
        
        if (result.success && result.data) {
          setProfileData(result.data);
        } else if (result.error === 'AUTH_REQUIRED') {
          logout();
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isAuthenticated, user, logout]);

  // 사용자 활동 데이터 가져오기 (초기 로드)
  useEffect(() => {
    const loadUserActivity = async () => {
      if (!profileData?.id || hasLoadedActivity.current) return;

      hasLoadedActivity.current = true;

      // 게시글과 댓글 데이터를 병렬로 로드
      const loadData = async () => {
        setPostsLoading(true);
        setCommentsLoading(true);
        
        try {
          const [postsResult, commentsResult] = await Promise.all([
            getUserPosts(profileData.id, null, 20),
            getUserComments(profileData.id, null, 20)
          ]);

          if (postsResult.success && postsResult.data) {
            setUserPosts(postsResult.data);
            setPostsHasNext(postsResult.hasNext || false);
            setPostsCursor(postsResult.nextCursor || null);
          }

          if (commentsResult.success && commentsResult.data) {
            setUserComments(commentsResult.data);
            setCommentsHasNext(commentsResult.hasNext || false);
            setCommentsCursor(commentsResult.nextCursor || null);
          }
        } catch (error) {
          console.error('활동 데이터 로드 실패:', error);
        } finally {
          setPostsLoading(false);
          setCommentsLoading(false);
        }
      };

      loadData();
    };

    loadUserActivity();
  }, [profileData?.id]);

  // 무한 스크롤 함수들
  const loadMorePosts = useCallback(async () => {
    if (!profileData?.id || postsLoadingMore || !postsHasNext || !postsCursor) return;

    try {
      setPostsLoadingMore(true);
      
      const result = await getUserPosts(profileData.id, postsCursor, 20);
      
      if (result.success && result.data) {
        setUserPosts(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.data!.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPostsHasNext(result.hasNext || false);
        setPostsCursor(result.nextCursor || null);
      }
    } catch (error) {
      console.error('추가 게시글 로드 실패:', error);
    } finally {
      setPostsLoadingMore(false);
    }
  }, [profileData?.id, postsLoadingMore, postsHasNext, postsCursor]);

  const loadMoreComments = useCallback(async () => {
    if (!profileData?.id || commentsLoadingMore || !commentsHasNext || !commentsCursor) return;

    try {
      setCommentsLoadingMore(true);
      
      const result = await getUserComments(profileData.id, commentsCursor, 20);
      
      if (result.success && result.data) {
        setUserComments(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.data!.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setCommentsHasNext(result.hasNext || false);
        setCommentsCursor(result.nextCursor || null);
      }
    } catch (error) {
      console.error('추가 댓글 로드 실패:', error);
    } finally {
      setCommentsLoadingMore(false);
    }
  }, [profileData?.id, commentsLoadingMore, commentsHasNext, commentsCursor]);

  // 스크롤 감지
  const handleScroll = useCallback(() => {
    const scrollContainer = document.querySelector('.scrollbar-hide');
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage >= 0.8) {
      switch (activeTab) {
        case 'posts':
          if (postsHasNext && !postsLoadingMore) {
            loadMorePosts();
          }
          break;
        case 'comments':
          if (commentsHasNext && !commentsLoadingMore) {
            loadMoreComments();
          }
          break;
      }
    }
  }, [activeTab, postsHasNext, commentsHasNext, postsLoadingMore, commentsLoadingMore, loadMorePosts, loadMoreComments]);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const scrollContainer = document.querySelector('.scrollbar-hide');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasLoadedProfile.current = false;
      hasLoadedActivity.current = false;
    };
  }, []);

  // 이벤트 핸들러들
  const handleLogout = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  const handleEditProfile = useCallback(() => {
    navigate("/profile/edit");
  }, [navigate]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    scrollActiveTabToCenter(tab);
  }, []);

  const handleBackClick = useCallback(() => {
    goBack();
  }, [goBack]);

  // 게시글 더보기 클릭 핸들러
  const handlePostMoreClick = useCallback((post: BoardItem) => {
    setSelectedPost(post);
    setShowPostActionSheet(true);
  }, []);

  // 댓글 더보기 클릭 핸들러
  const handleCommentMoreClick = useCallback((comment: CommentItem) => {
    setSelectedComment(comment);
    setShowCommentActionSheet(true);
  }, []);

  // 게시글 액션 클릭 핸들러
  const handlePostActionClick = useCallback(async (action: 'delete') => {
    if (!selectedPost) return;
    
    setShowPostActionSheet(false);
    
    if (action === 'delete') {
      if (confirm('정말로 이 글을 삭제하시겠습니까?')) {
        try {
          setIsDeleting(true);
          const result = await deleteBoard(selectedPost.eventId, selectedPost.type.toLowerCase(), selectedPost.id);
          
          if (result.success) {
            showToast('게시글이 삭제되었습니다.', 'success');
            // 게시글 목록에서 제거
            setUserPosts(prev => prev.filter(post => post.id !== selectedPost.id));
            // 통계 업데이트
            setProfileData(prev => prev ? { ...prev, postCount: (prev.postCount || 1) - 1 } : prev);
          } else {
            if (result.error?.includes('로그인이 만료')) {
              showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
              navigate('/sign');
            } else {
              showToast(result.error || '게시글 삭제에 실패했습니다.', 'error');
            }
          }
        } catch (error) {
          console.error('게시글 삭제 오류:', error);
          showToast('게시글 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
          setIsDeleting(false);
        }
      }
    }
  }, [selectedPost, showToast, navigate]);

  // 댓글 액션 클릭 핸들러
  const handleCommentActionClick = useCallback(async (action: 'delete') => {
    if (!selectedComment) return;
    
    setShowCommentActionSheet(false);
    
    if (action === 'delete') {
      if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        try {
          setIsDeleting(true);
          const result = await deleteComment(selectedComment.eventId, 'free', selectedComment.postId || '', selectedComment.id);
          
          if (result.success) {
            showToast('댓글이 삭제되었습니다.', 'success');
            // 댓글 목록에서 제거
            setUserComments(prev => prev.filter(comment => comment.id !== selectedComment.id));
            // 통계 업데이트
            setProfileData(prev => prev ? { ...prev, commentCount: (prev.commentCount || 1) - 1 } : prev);
          } else {
            if (result.error?.includes('로그인이 만료')) {
              showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
              navigate('/sign');
            } else {
              showToast(result.error || '댓글 삭제에 실패했습니다.', 'error');
            }
          }
        } catch (error) {
          console.error('댓글 삭제 오류:', error);
          showToast('댓글 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
          setIsDeleting(false);
        }
      }
    }
  }, [selectedComment, showToast, navigate]);

  // 액션 시트 닫기 핸들러들
  const handleClosePostActionSheet = useCallback(() => {
    setShowPostActionSheet(false);
    setSelectedPost(null);
  }, []);

  const handleCloseCommentActionSheet = useCallback(() => {
    setShowCommentActionSheet(false);
    setSelectedComment(null);
  }, []);

  // 탭 스크롤 함수
  const scrollActiveTabToCenter = useCallback((tab: TabType) => {
    setTimeout(() => {
      try {
        const tabContainer = tabContainerRef.current;
        if (!tabContainer) return;

        const activeTabElement = tabContainer.querySelector(`[data-tab="${tab}"]`) as HTMLElement;
        if (!activeTabElement) return;

        const containerWidth = tabContainer.clientWidth;
        const tabLeft = activeTabElement.offsetLeft;
        const tabWidth = activeTabElement.clientWidth;
        const scrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);
        
        tabContainer.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      } catch (error) {
        console.error('탭 스크롤 오류:', error);
      }
    }, 100);
  }, []);

  // 인증 로딩 상태
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="fixed inset-0 bg-white text-black flex flex-col overflow-hidden">
        {/* 네비게이션바 스켈레톤 */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <SkeletonPulse className="w-6 h-6" />
          <SkeletonPulse className="w-20 h-6" />
          <SkeletonPulse className="w-6 h-6" />
        </div>

        {/* 메인 컨텐츠 스켈레톤 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            <div className="w-full flex flex-col">
              {/* 프로필 아바타 섹션 스켈레톤 */}
              <div className="flex items-center mb-6">
                <div className="mr-3">
                  <SkeletonPulse className="w-16 h-16 rounded-full" />
                </div>
                <div className="flex-1 w-auto">
                  <SkeletonPulse className="w-32 h-6 mb-2" />
                  <SkeletonPulse className="w-48 h-4" />
                </div>
                <div className="flex items-center space-x-2">
                  <SkeletonPulse className="w-16 h-8 rounded-lg" />
                </div>
              </div>

              {/* 내 활동 섹션 스켈레톤 */}
              <div className="mt-4">
                <SkeletonPulse className="w-24 h-6 mb-4" />
              </div>

              {/* 탭 네비게이션 스켈레톤 */}
              <div className="relative mb-4">
                <div className="flex gap-2">
                  <SkeletonPulse className="w-32 h-12 rounded-xl" />
                  <SkeletonPulse className="w-32 h-12 rounded-xl" />
                </div>
              </div>

              {/* 탭 컨텐츠 스켈레톤 */}
              <div className="flex-1 min-h-0">
                <LoadingSkeleton count={3} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <div className="space-y-0">
            {postsLoading ? (
              <LoadingSkeleton count={3} />
            ) : userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div
                  key={post.id}
                  data-post-id={post.id}
                  className={`rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    post.type === 'NOTICE' 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'hover:bg-white hover:bg-opacity-5'
                  }`}
                  style={{ 
                    backgroundColor: post.type === 'NOTICE' 
                      ? 'white' 
                      : 'rgba(255, 255, 255, 0.05)' 
                  }}
                  onClick={() => {
                    navigate(`/board/${post.id}?type=${post.type.toLowerCase()}&eventId=${post.eventId}`);
                  }}
                >
                  <div className="px-2 py-4 h-full flex flex-col relative">
                    {/* 보더 - 양쪽 인셋 적용 */}
                    <div className="absolute" style={{ bottom: '0px', left: '0px', right: '0px', borderBottom: '1px solid rgb(229, 231, 235)' }}></div>
                    
                    {/* 게시글 헤더 (커뮤니티에서만 표시) */}
                    {post.type !== 'NOTICE' && (
                      <>
                        {/* 디버깅용 시간 표시 */}
                        <PostHeader 
                          nickname={post.user?.nickname}
                          profileImageUrl={post.user?.profileImageUrl || undefined}
                          className=""
                          showMoreButton={true}
                          isNotice={post.type === 'NOTICE'}
                          onMoreClick={() => handlePostMoreClick(post)}
                        />
                      </>
                    )}
                    
                    {/* 공지사항인 경우 EventNotice 스타일 적용 */}
                    {post.type === 'NOTICE' ? (
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3 mt-2">
                          <img 
                            src="/images/icon_notice.png" 
                            alt="공지사항 아이콘" 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-gray-500 font-regular">
                            {post.createdAt ? getFormattedTime(post.createdAt) : ''}
                          </span>
                        </div>
                        
                        <h3 className="text-black font-bold text-lg mb-1 line-clamp-2">
                          {post.title || '제목 없음'}
                        </h3>
                        
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {post.content || '내용 없음'}
                        </p>
                      </div>
                    ) : (
                      /* 커뮤니티인 경우 내용과 이미지 표시 */
                      <div className="flex-1 flex space-x-3">
                        <div className="flex-1 min-w-0">
                          {post.content && (
                            <div className="text-md text-black font-regular line-clamp-3 whitespace-pre-wrap mt-2">
                              {post.content}
                            </div>
                          )}
                        </div>
                        
                        {/* 이미지가 있는 경우 */}
                        {post.images && post.images.length > 0 && (
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                              <Image 
                                src={post.images[0]} 
                                alt="게시글 이미지"
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="w-full h-full flex items-center justify-center hidden">
                                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* 액션 버튼 - 고정 높이 */}
                    <div className="mt-auto pt-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <svg 
                              className={`w-4 h-4 mr-1 ${post.isLiked ? 'text-purple-600' : 'text-black'}`} 
                              style={{ opacity: post.isLiked ? 1 : 0.6 }} 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span className={`text-xs font-regular ${post.isLiked ? 'text-purple-600' : 'text-black'}`} style={{ opacity: post.isLiked ? 1 : 0.8 }}>
                              {post.likeCount || 0}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black mr-1" style={{ opacity: 0.6 }}>
                              <path fillRule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-regular text-black" style={{ opacity: 0.8 }}>
                              {post.commentCount || 0}
                            </span>
                          </div>
                        </div>
                        
                        {/* 날짜 - 오른쪽 정렬 */}
                        {post.createdAt && (
                          <span className="text-xs text-gray-500 font-regular">
                            {getFormattedTime(post.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-black text-opacity-50">작성한 글이 없습니다.</p>
              </div>
            )}
            
            {/* 추가 로딩 인디케이터 */}
            {postsLoadingMore && <LoadingSkeleton count={2} />}
            
            {/* 더 이상 데이터가 없을 때 */}
            {!postsHasNext && userPosts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                  모든 게시글을 불러왔습니다
                </p>
              </div>
            )}
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-0">
            {commentsLoading ? (
              <LoadingSkeleton count={3} />
            ) : userComments.length > 0 ? (
              userComments.map((comment) => (
                <div 
                  key={comment.id} 
                  data-comment-id={comment.id}
                  className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:bg-white hover:bg-opacity-5"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  onClick={() => {
                    if (comment.postId) {
                      navigate(`/board/${comment.postId}?eventId=${comment.eventId}`);
                    }
                  }}
                >
                  <div className="px-2 py-4 h-full flex flex-col relative">
                    {/* 보더 - 양쪽 인셋 적용 */}
                    <div className="absolute" style={{ bottom: '0px', left: '0px', right: '0px', borderBottom: '1px solid rgb(229, 231, 235)' }}></div>
                    
                    {/* 댓글 헤더 */}
                    <>
                      {/* 디버깅용 시간 표시 */}                      
                      {/* 댓글 헤더 - 글 디테일과 동일한 방식 */}
                      <div className="flex items-center space-x-3 mb-3">
                        <CommonProfileView
                          profileImageUrl={comment.user?.profileImageUrl}
                          nickname={comment.user?.nickname || '익명'}
                          size="md"
                          showBorder={true}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-black font-semibold text-sm">
                                {comment.user?.nickname || '익명'}
                              </span>
                            </div>
                            
                            {/* 댓글 더보기 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommentMoreClick(comment);
                              }}
                              className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                    
                    {/* 댓글 내용 */}
                    <div className="flex-1">
                      <div className="text-md text-black font-regular whitespace-pre-wrap line-clamp-3">
                        {comment.content || ''}
                      </div>
                    </div>
                    
                    {/* 원본 게시글 보기 링크와 날짜 */}
                    <div className="mt-auto pt-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-black mr-1" style={{ opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="text-xs font-regular text-black" style={{ opacity: 0.8 }}>
                            원본 게시글 보기
                          </span>
                        </div>
                        
                        {/* 날짜 - 오른쪽 정렬 */}
                        {comment.createdAt && (
                          <span className="text-xs text-gray-500 font-regular">
                            {getFormattedTime(comment.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-black text-opacity-50">작성한 댓글이 없습니다.</p>
              </div>
            )}
            
            {/* 추가 로딩 인디케이터 */}
            {commentsLoadingMore && <LoadingSkeleton count={2} />}
            
            {/* 더 이상 데이터가 없을 때 */}
            {!commentsHasNext && userComments.length > 0 && (
              <div className="text-center py-8">
                <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                  모든 댓글을 불러왔습니다
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white text-black flex flex-col overflow-hidden">
      {/* 최대 너비 제한 컨테이너 */}
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
        {/* 네비게이션바 */}
        <CommonNavigationBar
          title="프로필"
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
          rightButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          onLeftClick={handleBackClick}
          onRightClick={handleLogout}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          fixedHeight={true}
          sticky={false}
        />

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-hide" style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom) + 16px)'
          }}>
            <div className="w-full flex flex-col">
              {/* 프로필 아바타 섹션 */}
              <div className="flex items-center mb-6">
                <div className="mr-3">
                  <CommonProfileView
                    profileImageUrl={finalUserData?.profileImageUrl}
                    nickname={finalUserData?.nickname}
                    size="xl"
                    showBorder={true}
                  />
                </div>
                <div className="flex-1 w-auto">
                  <h1 className="text-xl font-bold text-black text-md">
                    {finalUserData?.nickname || '사용자'}
                  </h1>
                  {finalUserData?.provider?.toLowerCase() === 'email' ? (
                    <p className="text-black font-normal text-sm" style={{ opacity: 0.6 }}>
                      {finalUserData?.email || '이메일 정보 없음'}
                    </p>
                  ) : (
                    <div className="flex items-center">
                      <ProviderIcon provider={finalUserData?.provider} />
                      <ProviderText provider={finalUserData?.provider} />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 rounded-lg bg-purple-100 font-semibold text-purple-700 text-sm transition-all"
                  >
                    편집
                  </button>
                </div>
              </div>

              {/* 내 활동 섹션 */}
              <div className="mt-4">
                <h2 className="text-xl font-bold text-black mb-4">내 활동</h2>
              </div>

              {/* 탭 네비게이션 캐러셀 */}
              <div className="relative mb-4">
                <div ref={tabContainerRef} className="flex gap-2 overflow-x-auto" style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}>
                  <button
                    data-tab="posts"
                    onClick={() => handleTabChange('posts')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'posts'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>내가 쓴 글 <span className="font-bold">{userStats.postCount}</span></span>
                  </button>
                  <button
                    data-tab="comments"
                    onClick={() => handleTabChange('comments')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === 'comments'
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>내가 쓴 댓글 <span className="font-bold">{userStats.commentCount}</span></span>
                  </button>
                </div>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="flex-1 min-h-0">
                {isLoading ? (
                  <LoadingSkeleton count={3} />
                ) : (
                  renderTabContent()
                )}
              </div>
            </div>
          </div>
        </main>

        {/* 게시글 액션 시트 */}
        <CommonActionSheet
          isOpen={showPostActionSheet}
          onClose={handleClosePostActionSheet}
          items={[
            {
              label: "삭제하기",
              onClick: () => handlePostActionClick('delete'),
              variant: 'destructive'
            }
          ]}
        />

        {/* 댓글 액션 시트 */}
        <CommonActionSheet
          isOpen={showCommentActionSheet}
          onClose={handleCloseCommentActionSheet}
          items={[
            {
              label: "삭제하기",
              onClick: () => handleCommentActionClick('delete'),
              variant: 'destructive'
            }
          ]}
        />
      </div>
    </div>
  );
}

// 직접 내보내기
export default function ProfilePage() {
  return <ProfilePageContent />;
} 