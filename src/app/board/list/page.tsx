"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BoardItem } from "@/types/api";
import { getBoardList, getAccessToken, deleteBoard } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostHeader from "@/components/common/PostHeader";
import { useSimpleNavigation } from "@/utils/navigation";
import Image from "next/image";
import { useImageGallery } from "@/hooks/useImageGallery";
import ImageGallery from "@/components/common/ImageGallery";
import CommonActionSheet from "@/components/CommonActionSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

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

  // 24시간 이상 지난 경우 날짜로 표시
  return date.toLocaleDateString('ko-KR');
};

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
  const isMounted = useRef(true);
  const hasCalledApi = useRef(false);

  // 인증 훅
  const { user } = useAuth();
  const { showToast } = useToast();

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 이벤트 ID와 타입 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';
  const type = searchParams.get('type') || 'free'; // 'free' 또는 'notice'

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        setCursor(null);
        setHasNext(true);
        
        const result = await getBoardList(eventId, type, null, 20);
        
        if (result.success && result.data) {
          setPosts(result.data.items);
          setHasNext(result.data.hasNext);
          setCursor(result.data.nextCursor || null);
        } else {
          setError(result.error || '게시글을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error("게시글 로드 오류:", err);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [eventId, type]);

  // 추가 데이터 로딩
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext || !cursor) return;

    try {
      setLoadingMore(true);
      
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
        console.error("추가 데이터 로드 실패:", result.error);
      }
    } catch (err) {
      console.error("추가 데이터 로드 오류:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [eventId, type, hasNext, loadingMore, cursor]);

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
    const url = `/board/${post.id}?type=${type}&eventId=${post.eventId || eventId}`;
    router.push(url);
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
        router.push(`/board/edit/${selectedPost.id}?type=${type}&eventId=${selectedPost.eventId || eventId}`);
        break;
      case 'delete':
        if (confirm('정말로 이 글을 삭제하시겠습니까?')) {
          try {
            const result = await deleteBoard(eventId, type, selectedPost.id);
            if (result.success) {
              showToast('게시글이 삭제되었습니다.', 'success');
              // 목록에서 삭제된 게시글 제거
              setPosts(prev => prev.filter(post => post.id !== selectedPost.id));
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
          console.log('게시글 신고:', selectedPost.id);
        }
        break;
    }
  };

  const handleCloseActionSheet = () => {
    setShowActionSheet(false);
    setSelectedPost(null);
  };

  const handleWriteClick = () => {
    // 공지사항은 글쓰기 불가
    if (type === 'notice') {
      showToast('공지사항은 관리자만 작성할 수 있습니다.', 'warning');
      return;
    }
    
    // 로그인 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    router.push(`/board/write?eventId=${eventId}&from=boardList`);
  };

  const handleBackClick = () => {
    router.back();
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
              className="w-6 h-6 text-white"
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
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
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
        <div className="space-y-2" style={{ paddingBottom: 'min(24px, env(safe-area-inset-bottom) + 24px)' }}>
        {sortedPosts.length > 0 ? (
          sortedPosts.map((post) => (
            <div
              key={post.id}
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
              <div className="px-6 py-2 h-full flex flex-col">
                {/* 게시글 헤더 (커뮤니티에서만 표시) */}
                {type !== 'notice' && (
                  <PostHeader 
                    nickname={post.user?.nickname}
                    profileImageUrl={post.user?.profileImageUrl || undefined}
                    createdAt={post.createdAt}
                    className="mb-4"
                    showMoreButton={true}
                    isNotice={type === 'notice'}
                    onMoreClick={() => handleMoreClick(post)}
                  />
                )}
                
                {/* 공지사항인 경우 EventNotice 스타일 적용 */}
                {type === 'notice' ? (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <img 
                        src="/images/icon_notice.png" 
                        alt="공지사항 아이콘" 
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs text-gray-500 font-regular">
                        {post.createdAt ? getRelativeTime(post.createdAt) : ''}
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
                        <div className="text-md text-black font-regular line-clamp-3 whitespace-pre-wrap">
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
                <div className="mt-auto pt-3">
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
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white mr-1" style={{ opacity: 0.6 }}>
                        <path fillRule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-regular text-white" style={{ opacity: 0.8 }}>
                        {post.commentCount || 0}
                      </span>
                    </div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ),
                  onClick: () => handleActionClick('report'),
                  variant: 'destructive'
                }
              ]
        }
      />

      {/* 플로팅 글쓰기 버튼 (커뮤니티에서만 표시) */}
      {type === 'free' && (
        <button
          onClick={handleWriteClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
          style={{ 
            bottom: 'max(24px, env(safe-area-inset-bottom) + 24px)',
            right: 'max(24px, env(safe-area-inset-right) + 24px)'
          }}
        >
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// 로딩 컴포넌트
function BoardListLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>게시글 목록을 불러오는 중...</p>
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