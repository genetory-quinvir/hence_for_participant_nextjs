"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BoardItem } from "@/types/api";
import { getBoardList, getAccessToken, deleteBoard, toggleLike } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostHeader from "@/components/common/PostHeader";
import { useSimpleNavigation } from "@/utils/navigation";
import { getRelativeTime } from "@/utils/time";
import Image from "next/image";
import { useImageGallery } from "@/hooks/useImageGallery";
import ImageGallery from "@/components/common/ImageGallery";
import CommonActionSheet from "@/components/CommonActionSheet";
import CommonConfirmModal from "@/components/common/CommonConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

function BoardListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { navigate, goBack } = useSimpleNavigation();
  const [posts, setPosts] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BoardItem | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BoardItem | null>(null);

  // 인증 훅
  const { user } = useAuth();
  const { showToast } = useToast();

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 이벤트 ID와 타입 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';
  const type = searchParams.get('type') || 'free'; // 'free' 또는 'notice'

  // 글쓰기 버튼 렌더링 조건
  const shouldShowWriteButton = type === 'free' || (type === 'notice' && user && (user.role === 'admin' || user.role === 'host'));

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        setCursor(null);
        setHasNext(true);
        
        // 인증 상태 확인
        const accessToken = getAccessToken();
        if (!accessToken) {
          showToast('로그인이 필요합니다.', 'warning');
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }
        
        const result = await getBoardList(eventId, type, null, 20);
        
        if (result.success && result.data) {
          setPosts(result.data.items);
          setHasNext(result.data.hasNext);
          setCursor(result.data.nextCursor || null);
        } else {
          if (result.error?.includes('로그인이 만료')) {
            showToast('로그인이 만료되었습니다.', 'warning');
            const currentUrl = window.location.pathname + window.location.search;
            navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
          } else {
            setError(result.error || '게시글을 불러오는데 실패했습니다.');
          }
        }
      } catch (err) {
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [eventId, type, router, showToast]);

  // 추가 데이터 로딩
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext || !cursor) return;

    try {
      setLoadingMore(true);
      
      // 인증 상태 확인
      const accessToken = getAccessToken();
      if (!accessToken) {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        const currentUrl = window.location.pathname + window.location.search;
        router.push(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }
      
      const result = await getBoardList(eventId, type, cursor, 20);
      
      if (result.success && result.data) {
        setPosts(prev => {
          // 중복 제거를 위해 기존 ID들과 비교
          const existingIds = new Set(prev.map((item: BoardItem) => item.id));
          const newItems = result.data!.items.filter((item: BoardItem) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setHasNext(result.data.hasNext);
        setCursor(result.data.nextCursor || null);
              } else {
          if (result.error?.includes('로그인이 만료')) {
            showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
            const currentUrl = window.location.pathname + window.location.search;
            router.push(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
          }
        }
      } catch (err) {
        // 추가 데이터 로드 실패 시 조용히 처리
      } finally {
      setLoadingMore(false);
    }
  }, [eventId, type, hasNext, loadingMore, cursor, router, showToast]);

  // 스크롤 감지
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // 스크롤이 컨테이너 하단 200px 이내에 도달했을 때 추가 로딩
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handlePostClick = (post: BoardItem) => {
    // 선택된 카드를 화면 중앙으로 스크롤
    const postElement = document.querySelector(`[data-post-id="${post.id}"]`) as HTMLElement;
    if (postElement && scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const elementRect = postElement.getBoundingClientRect();
      const containerCenter = containerRect.height / 2;
      const elementCenter = elementRect.top + elementRect.height / 2;
      const scrollOffset = elementCenter - containerCenter;
      
      scrollContainerRef.current.scrollBy({
        top: scrollOffset,
        behavior: 'smooth'
      });
    }
    
    const url = `/board/${post.id}?type=${type}&eventId=${post.eventId || eventId}`;
    navigate(url);
  };

  const handleMoreClick = (post: BoardItem) => {
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  const handleActionClick = async (action: 'edit' | 'delete' | 'report') => {
    if (!selectedPost) return;
    
    setShowActionSheet(false);
    
    switch (action) {
      case 'edit':
        // 수정 페이지로 이동
        navigate(`/board/edit/${selectedPost.id}?type=${type}&eventId=${selectedPost.eventId || eventId}`);
        break;
      case 'delete':
        setPostToDelete(selectedPost);
        setShowDeleteConfirm(true);
        break;
      case 'report':
        if (confirm('이 글을 신고하시겠습니까?')) {
          // TODO: 신고 API 호출
          showToast('신고가 접수되었습니다.', 'success');
        }
        break;
    }
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    setSelectedPost(null);
  };

  // 실제 삭제 처리 함수
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      const result = await deleteBoard(eventId, type, postToDelete.id);
      if (result.success) {
        showToast('게시글이 삭제되었습니다.', 'success');
        // 목록에서 삭제된 게시글 제거
        setPosts(prev => prev.filter(post => post.id !== postToDelete.id));
      } else {
        showToast(result.error || '게시글 삭제에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      showToast('게시글 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setPostToDelete(null);
      setShowActionSheet(false);
      setSelectedPost(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setPostToDelete(null);
  };

  // 좋아요 토글 핸들러
  const handleLikeToggle = async (post: BoardItem) => {
    try {
      // 인증 상태 확인
      const accessToken = getAccessToken();
      if (!accessToken) {
        showToast('로그인이 필요합니다.', 'warning');
        const currentUrl = window.location.pathname + window.location.search;
        navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }

      setIsLiking(true);
      const postId = post.id;
      
      const result = await toggleLike(eventId, type, postId, post.isLiked || false);
      
      if (result.success) {
        // 로컬 상태 업데이트
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: result.updatedIsLiked !== undefined ? result.updatedIsLiked : !p.isLiked,
              likeCount: result.updatedLikeCount !== undefined ? result.updatedLikeCount : (p.isLiked ? (p.likeCount || 0) - 1 : (p.likeCount || 0) + 1)
            };
          }
          return p;
        }));
      } else {
        if (result.error?.includes('로그인이 만료')) {
          showToast('로그인이 만료되었습니다.', 'warning');
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          showToast(result.error || '좋아요 처리에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      showToast('좋아요 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleWriteClick = () => {
    // 로그인 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast('로그인이 필요합니다.', 'warning');
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // 공지사항은 admin, host 역할만 작성 가능
    if (type === 'notice') {
      if (!user || (user.role !== 'admin' && user.role !== 'host')) {
        showToast('공지사항은 관리자만 작성할 수 있습니다.', 'warning');
        return;
      }
    }
    
    navigate(`/board/write?eventId=${eventId}&type=${type}&from=boardList`);
  };

  const handleBackClick = () => {
    goBack();
  };

  // 정렬된 게시글 목록
  const sortedPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    const sorted = [...posts];
    
    switch (sortBy) {
      case 'latest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      default:
        return sorted;
    }
  }, [posts, sortBy]);

  // 이미지 클릭 핸들러
  const handleImageClick = (post: BoardItem, imageIndex: number = 0) => {
    if (post.images && post.images.length > 0) {
      openGallery(post.images, imageIndex);
    }
  };

  // 페이지 제목과 빈 상태 메시지
  const pageTitle = type === 'notice' ? '공지사항' : '커뮤니티';
  const emptyMessage = type === 'notice' 
    ? { title: '아직 공지사항이 없습니다', subtitle: '새로운 공지사항을 기다려주세요!' }
    : { title: '아직 게시글이 없습니다', subtitle: '첫 번째 게시글을 작성해보세요!' };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <CommonNavigationBar 
          title={pageTitle}
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
        
        {/* 정렬 드롭다운 스켈레톤 (커뮤니티에서만 표시) */}
        {type === 'free' && (
          <div className="px-4">
            <div className="flex justify-end mb-2">
              <div className="relative mt-2">
                <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 게시글 스켈레톤 리스트 */}
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="px-6 py-2">
              <div className="flex flex-col space-y-3">
                {/* 게시글 헤더 스켈레톤 (커뮤니티에서만 표시) */}
                {type !== 'notice' && (
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                )}
                
                {/* 공지사항 스켈레톤 */}
                {type === 'notice' ? (
                  <div className="space-y-3">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ) : (
                  /* 커뮤니티 스켈레톤 */
                  <div className="flex space-x-3">
                    <div className="flex-1 space-y-2">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    
                    {/* 이미지 스켈레톤 */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                )}
                
                {/* 액션 버튼 스켈레톤 */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* 구분선 */}
              <div className="border-b border-gray-100 mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title={pageTitle}
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
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <CommonNavigationBar 
        title={pageTitle}
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
        rightButton={
          shouldShowWriteButton ? (
            <button
              onClick={handleWriteClick}
              className="px-3 py-1.5 text-purple-600 hover:text-purple-700 text-sm font-bold transition-all duration-200 hover:scale-105"
            >
              글쓰기
            </button>
          ) : null
        }
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
        fixedHeight={true}
      />
    
    {/* 정렬 드롭다운 (커뮤니티에서만 표시) */}
    {type === 'free' && (
      <div className="px-4">
        <div className="flex justify-end mb-2">
          <div className="relative mt-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular')}
              className="py-2 text-sm font-regular text-gray-400 appearance-none cursor-pointer focus:outline-none rounded-lg pr-8"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23000000' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                color: 'gray-400'
              }}
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
            </select>
          </div>
        </div>
      </div>
    )}
      
    {/* 게시글 세로 리스트 */}
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto scrollbar-hide" 
      style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div className="space-y-0" style={{ paddingBottom: 'min(24px, env(safe-area-inset-bottom) + 24px)' }}>
      {sortedPosts.length > 0 ? (
        sortedPosts.map((post) => (
          <div
            key={post.id}
            data-post-id={post.id}
            className={`rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
              type === 'notice' 
                ? 'bg-white hover:bg-gray-50' 
                : 'hover:bg-white hover:bg-opacity-5'
            }`}
            style={{ 
              backgroundColor: type === 'notice' 
                ? 'white' 
                : 'rgba(255, 255, 255, 0.05)' 
            }}
            onClick={() => handlePostClick(post)}
          >
            <div className="px-6 py-4 h-full flex flex-col relative">
              {/* 보더 - 양쪽 인셋 적용 */}
              <div className="absolute" style={{ bottom: '0px', left: '24px', right: '24px', borderBottom: '1px solid rgb(229, 231, 235)' }}></div>
              {/* 게시글 헤더 (커뮤니티에서만 표시) */}
              {type !== 'notice' && (
                <PostHeader 
                  nickname={post.user?.nickname}
                  profileImageUrl={post.user?.profileImageUrl || undefined}
                  className="mb-6"
                  showMoreButton={true}
                  isNotice={type === 'notice'}
                  onMoreClick={() => handleMoreClick(post)}
                />
              )}
              
              {/* 공지사항인 경우 EventNotice 스타일 적용 */}
              {type === 'notice' ? (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <div className="flex items-center">
                      <img 
                        src="/images/icon_notice.png" 
                        alt="공지사항 아이콘" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* 공지사항 더보기 버튼 (admin/host만 표시) */}
                    {user && (user.role === 'admin' || user.role === 'host') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoreClick(post);
                        }}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <svg 
                          className="w-5 h-5 text-black" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" 
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <h3 className="text-black font-bold text-md mb-3 line-clamp-2">
                    {post.title || '제목 없음'}
                  </h3>
                  
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {post.content || '내용 없음'}
                  </p>
                </div>
              ) : (
                /* 커뮤니티인 경우 내용과 이미지 표시 */
                <div className="flex-1 flex space-x-4">
                  <div className="flex-1 min-w-0">
                    {post.content ? (
                      <div className="text-md text-black font-regular line-clamp-3 whitespace-pre-wrap mt-3">
                        {post.content}
                      </div>
                    ) : (
                      <div className="text-md text-gray-500 font-regular line-clamp-3 whitespace-pre-wrap mt-3">
                        내용이 없습니다
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(post, 0);
                          }}
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
              <div className="mt-auto pt-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button 
                      className={`flex items-center transition-colors ${
                        isLiking ? 'opacity-50 cursor-not-allowed' : post.isLiked ? 'hover:text-purple-800' : 'hover:text-purple-600'
                      } ${post.isLiked ? 'text-purple-700' : 'text-black'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeToggle(post);
                      }}
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
                        {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* 날짜 - 오른쪽 정렬 */}
                  <span className="text-xs text-gray-500 font-regular">
                    {post.createdAt ? getRelativeTime(post.createdAt) : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-white text-lg mb-2">{emptyMessage.title}</p>
          <p className="text-white text-sm" style={{ opacity: 0.6 }}>
            {emptyMessage.subtitle}
          </p>
        </div>
      )}
      
      {/* 추가 로딩 인디케이터 */}
      {loadingMore && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-black text-sm" style={{ opacity: 0.6 }}>
            더 많은 게시글을 불러오는 중...
          </p>
        </div>
      )}
      
      {/* 더 이상 데이터가 없을 때 */}
      {!hasNext && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-black text-sm" style={{ opacity: 0.6 }}>
            모든 게시글을 불러왔습니다
          </p>
        </div>
      )}
      </div>
    </div>

    {/* 이미지 갤러리 */}
    <ImageGallery
      images={images}
      initialIndex={initialIndex}
      isOpen={isOpen}
      onClose={closeGallery}
    />

    {/* 액션시트 */}
    <CommonActionSheet
      isOpen={showActionSheet}
      onClose={handleCloseActionSheet}
      items={
        selectedPost && user && selectedPost.user?.id === user.id
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ),
                onClick: () => handleActionClick('report'),
                variant: 'destructive'
              }
            ]
      }
    />

    {/* 삭제 확인 모달 */}
    <CommonConfirmModal
      isOpen={showDeleteConfirm}
      title="게시글 삭제"
      message="정말로 이 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다."
      confirmText="삭제"
      cancelText="취소"
      onConfirm={handleConfirmDelete}
      onCancel={handleCancelDelete}
      variant="destructive"
    />
    </div>
  );
}

// 로딩 컴포넌트
function BoardListLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* 네비게이션바 스켈레톤 */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 flex justify-center">
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-6 h-6"></div>
      </div>
      
      {/* 게시글 스켈레톤 리스트 */}
      <div className="space-y-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="px-6 py-2">
            <div className="flex flex-col space-y-3">
              {/* 게시글 헤더 스켈레톤 */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* 내용 스켈레톤 */}
              <div className="flex space-x-3">
                <div className="flex-1 space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* 이미지 스켈레톤 */}
                <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              
              {/* 액션 버튼 스켈레톤 */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-6 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* 구분선 */}
            <div className="border-b border-gray-100 mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function BoardListPage() {
  return (
    <Suspense fallback={<BoardListLoading />}>
      <BoardListContent />
    </Suspense>
  );
}