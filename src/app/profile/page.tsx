"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { UserItem, EventItem, BoardItem, CommentItem } from "@/types/api";
import { getUserProfile, getUserEvents, getUserPosts, getUserComments, getPostByCommentId } from "@/lib/api";
import PostHeader from "@/components/common/PostHeader";
import Image from "next/image";
import { useSimpleNavigation } from "@/utils/navigation";

// 탭 타입 정의
type TabType = 'events' | 'posts' | 'comments';

// 로컬 PostItem 타입 (BoardItem과 구분)
interface PostItem {
  id: string;
  title?: string;
  content: string;
  boardType: string;
  eventId: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

function ProfilePageContent() {
  const { navigate, goBack } = useSimpleNavigation();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const tabContainerRef = useRef<HTMLDivElement>(null);
  
  // 모든 useState 훅들을 최상단에 배치
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [profileData, setProfileData] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [userEvents, setUserEvents] = useState<EventItem[]>([]);
  const [userPosts, setUserPosts] = useState<BoardItem[]>([]);
  const [userComments, setUserComments] = useState<CommentItem[]>([]);
  // const [eventsLoading, setEventsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // 무한 스크롤 관련 상태
  // const [eventsCursor, setEventsCursor] = useState<string | null>(null);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  // const [eventsHasNext, setEventsHasNext] = useState(true);
  const [postsHasNext, setPostsHasNext] = useState(true);
  const [commentsHasNext, setCommentsHasNext] = useState(true);
  // const [eventsLoadingMore, setEventsLoadingMore] = useState(false);
  const [postsLoadingMore, setPostsLoadingMore] = useState(false);
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false);
  
  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isAuthenticated || !user) return;
      
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
      // profileData가 로드된 후에만 실행
      if (!profileData?.id) return;

      console.log('🔄 사용자 활동 데이터 로드 시작:', profileData.id);

      // 이벤트 데이터 로드 (주석처리)
      // setEventsLoading(true);
      // setEventsCursor(null);
      // setEventsHasNext(true);
      // try {
      //   const eventsResult = await getUserEvents(profileData.id, null, 20);
      //   if (eventsResult.success && eventsResult.data) {
      //     setUserEvents(eventsResult.data);
      //     setEventsHasNext(eventsResult.hasNext || false);
      //     setEventsCursor(eventsResult.nextCursor || null);
      //   }
      // } catch (error) {
      //   console.error('이벤트 로드 실패:', error);
      // } finally {
      //   setEventsLoading(false);
      // }

      // 게시글 데이터 로드
      setPostsLoading(true);
      setPostsCursor(null);
      setPostsHasNext(true);
      try {
        const postsResult = await getUserPosts(profileData.id, null, 20);
        if (postsResult.success && postsResult.data) {
          setUserPosts(postsResult.data);
          setPostsHasNext(postsResult.hasNext || false);
          setPostsCursor(postsResult.nextCursor || null);
        }
      } catch (error) {
        console.error('게시글 로드 실패:', error);
      } finally {
        setPostsLoading(false);
      }

      // 댓글 데이터 로드
      setCommentsLoading(true);
      setCommentsCursor(null);
      setCommentsHasNext(true);
      try {
        const commentsResult = await getUserComments(profileData.id, null, 20);
        if (commentsResult.success && commentsResult.data) {
          setUserComments(commentsResult.data);
          setCommentsHasNext(commentsResult.hasNext || false);
          setCommentsCursor(commentsResult.nextCursor || null);
        }
      } catch (error) {
        console.error('댓글 로드 실패:', error);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadUserActivity();
  }, [profileData?.id]); // profileData.id만 의존

  // 무한 스크롤 함수들
  // const loadMoreEvents = useCallback(async () => {
  //   if (!profileData?.id || eventsLoadingMore || !eventsHasNext || !eventsCursor) return;

  //   try {
  //     setEventsLoadingMore(true);
      
  //     const result = await getUserEvents(profileData.id, eventsCursor, 20);
      
  //     if (result.success && result.data) {
  //       setUserEvents(prev => {
  //         // 중복 제거를 위해 기존 ID들과 비교
  //         const existingIds = new Set(prev.map(item => item.id));
  //         const newItems = result.data!.filter(item => !existingIds.has(item.id!));
  //         return [...prev, ...newItems];
  //       });
  //       setEventsHasNext(result.hasNext || false);
  //       setEventsCursor(result.nextCursor || null);
  //     }
  //   } catch (error) {
  //     console.error('추가 이벤트 로드 실패:', error);
  //   } finally {
  //     setEventsLoadingMore(false);
  //   }
  // }, [profileData?.id, eventsLoadingMore, eventsHasNext, eventsCursor]);

  const loadMorePosts = useCallback(async () => {
    if (!profileData?.id || postsLoadingMore || !postsHasNext || !postsCursor) return;

    try {
      setPostsLoadingMore(true);
      
      const result = await getUserPosts(profileData.id, postsCursor, 20);
      
      if (result.success && result.data) {
        setUserPosts(prev => {
          // 중복 제거를 위해 기존 ID들과 비교
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
          // 중복 제거를 위해 기존 ID들과 비교
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
    if (!scrollContainer) {
      console.log('❌ 스크롤 컨테이너를 찾을 수 없습니다');
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer as HTMLElement;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    console.log('📜 스크롤 상태:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollPercentage,
      activeTab,
      hasNext: {
        // events: eventsHasNext,
        posts: postsHasNext,
        comments: commentsHasNext
      },
      loading: {
        // events: eventsLoadingMore,
        posts: postsLoadingMore,
        comments: commentsLoadingMore
      }
    });
    
    // 스크롤이 80% 이상일 때 추가 로드
    if (scrollPercentage >= 0.8) {
      console.log('🔄 무한 스크롤 트리거:', activeTab);
      
      switch (activeTab) {
        // case 'events':
        //   if (eventsHasNext && !eventsLoadingMore) {
        //     console.log('📥 이벤트 추가 로드 시작');
        //     loadMoreEvents();
        //   }
        //   break;
        case 'posts':
          if (postsHasNext && !postsLoadingMore) {
            console.log('📥 게시글 추가 로드 시작');
            loadMorePosts();
          }
          break;
        case 'comments':
          if (commentsHasNext && !commentsLoadingMore) {
            console.log('📥 댓글 추가 로드 시작');
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
      console.log('📜 스크롤 이벤트 리스너 등록:', activeTab);
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        console.log('📜 스크롤 이벤트 리스너 제거:', activeTab);
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    } else {
      console.log('❌ 스크롤 컨테이너를 찾을 수 없어 이벤트 리스너를 등록하지 않습니다');
    }
  }, [activeTab, handleScroll]); // activeTab만 의존

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  // 프로필 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [profileData?.id]);

  // 이벤트 핸들러들
  const handleLogout = () => {
    navigate("/settings");
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    scrollActiveTabToCenter(tab);
  };

  const handleBackClick = () => {
    goBack();
  };

  // 탭 스크롤 함수
  const scrollActiveTabToCenter = (tab: TabType) => {
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
  };

  // 사용자 데이터
  const finalUserData = profileData || user;
  const userStats = {
    eventCount: finalUserData?.eventCount || 0,
    postCount: finalUserData?.postCount || 0,
    commentCount: finalUserData?.commentCount || 0
  };

  // 로딩 상태
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {authLoading ? '인증 확인 중...' : '메인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      // case 'events':
      //   return (
      //     <div className="space-y-4">
      //       {eventsLoading ? (
      //         <div className="text-center py-8">
      //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
      //           <p className="text-white text-opacity-50">이벤트 로딩 중...</p>
      //         </div>
      //       ) : userEvents.length > 0 ? (
      //         userEvents.map((event) => (
      //           <div 
      //             key={event.id} 
      //             className="p-4 bg-opacity-5 rounded-xl cursor-pointer transition-all hover:bg-opacity-10" 
      //             style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      //             onClick={() => {
      //               navigate(`/event/${event.id}`);
      //             }}
      //           >
      //             <div className="flex items-start gap-3 mb-3">
      //               {/* 이벤트 이미지 또는 기본 아이콘 */}
      //               {event.imageUrl ? (
      //                 <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
      //                   <Image 
      //                     src={event.imageUrl} 
      //                     alt="이벤트 이미지"
      //                     width={48}
      //                     height={48}
      //                     className="w-full h-full object-cover"
      //                     onError={(e) => {
      //                           e.currentTarget.style.display = 'none';
      //                           e.currentTarget.nextElementSibling?.classList.remove('hidden');
      //                         }}
      //                   />
      //                   <div className="w-full h-full flex items-center justify-center hidden">
      //                     <span className="text-white text-lg">🎪</span>
      //                   </div>
      //                 </div>
      //               ) : (
      //                 <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
      //                   <span className="text-white text-lg">🎪</span>
      //                 </div>
      //               )}
      //               <div className="flex-1 min-w-0">
      //                 <h3 className="text-white font-bold text-lg truncate">{event.title || '제목 없음'}</h3>
      //               </div>
      //             </div>
      //             <p className="text-white text-opacity-70 text-md mb-4 mt-4 line-clamp-2">
      //               {event.description || '설명이 없습니다.'}
      //             </p>
      //             <div className="space-y-2 text-xs text-white text-opacity-50">
      //               <div className="flex items-center gap-2">
      //                 <span className="font-light text-sm" style={{ opacity: 0.6 }}>장소</span>
      //                 <span className="font-light text-sm">{event.location || '장소 정보 없음'}</span>
      //               </div>
      //               <div className="flex items-center gap-2">
      //                 <span className="font-light text-sm" style={{ opacity: 0.6 }}>일정</span>
      //                 <span className="font-light text-sm">{event.startDate ? formatDate(event.startDate) : '일정 정보 없음'}</span>
      //               </div>
      //               <div className="flex items-center gap-2">
      //                 <span className="font-light text-sm" style={{ opacity: 0.6 }}>참여</span>
      //                 <span className="font-light text-sm">{event.participantCount || 0}/{event.maxParticipantCount || 0}명 참가</span>
      //               </div>
      //             </div>
      //           </div>
      //         ))
      //       ) : (
      //         <div className="text-center py-8">
      //           <p className="text-white text-opacity-50">만든 이벤트가 없습니다.</p>
      //         </div>
      //       )}
            
      //       {/* 추가 로딩 인디케이터 */}
      //       {eventsLoadingMore && (
      //         <div className="text-center py-8">
      //           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
      //           <p className="text-white text-sm" style={{ opacity: 0.6 }}>
      //             더 많은 이벤트를 불러오는 중...
      //           </p>
      //         </div>
      //       )}
            
      //       {/* 더 이상 데이터가 없을 때 */}
      //       {!eventsHasNext && userEvents.length > 0 && (
      //         <div className="text-center py-8">
      //           <p className="text-white text-sm" style={{ opacity: 0.6 }}>
      //             모든 이벤트를 불러왔습니다
      //           </p>
      //         </div>
      //       )}
      //     </div>
      //   );

      case 'posts':
        return (
          <div className="space-y-0">
            {postsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-black text-opacity-50">게시글 로딩 중...</p>
              </div>
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
                      <PostHeader 
                        nickname={post.user?.nickname}
                        profileImageUrl={post.user?.profileImageUrl || undefined}
                        createdAt={post.createdAt}
                        className=""
                        showMoreButton={true}
                        isNotice={post.type === 'NOTICE'}
                        onMoreClick={() => {
                          // TODO: 더보기 메뉴 표시
                          console.log('더보기 클릭');
                        }}
                      />
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
            {postsLoadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                  더 많은 게시글을 불러오는 중...
                </p>
              </div>
            )}
            
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-black text-opacity-50">댓글 로딩 중...</p>
              </div>
            ) : userComments.length > 0 ? (
              userComments.map((comment) => (
                <div 
                  key={comment.id} 
                  data-comment-id={comment.id}
                  className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:bg-white hover:bg-opacity-5"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  onClick={() => {
                    // 댓글의 postId와 eventId를 사용하여 게시글 상세 화면으로 이동
                    if (comment.postId) {
                      navigate(`/board/${comment.postId}?eventId=${comment.eventId}`);
                    }
                  }}
                >
                  <div className="px-2 py-4 h-full flex flex-col relative">
                    {/* 보더 - 양쪽 인셋 적용 */}
                    <div className="absolute" style={{ bottom: '0px', left: '0px', right: '0px', borderBottom: '1px solid rgb(229, 231, 235)' }}></div>
                    
                    {/* 댓글 헤더 */}
                    <PostHeader 
                      nickname={comment.user?.nickname}
                      profileImageUrl={comment.user?.profileImageUrl || undefined}
                      createdAt={comment.createdAt}
                      className="mb-3"
                      showMoreButton={true}
                      onMoreClick={() => {
                        // TODO: 댓글 더보기 메뉴 표시
                        console.log('댓글 더보기 클릭');
                      }}
                    />
                    
                    {/* 댓글 내용 */}
                    <div className="flex-1">
                      <div className="text-md text-black font-regular whitespace-pre-wrap line-clamp-3">
                        {comment.content || ''}
                      </div>
                    </div>
                    
                    {/* 원본 게시글 보기 링크 */}
                    <div className="mt-auto pt-3 mb-2">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-black mr-1" style={{ opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-xs font-regular text-black" style={{ opacity: 0.8 }}>
                          원본 게시글 보기
                        </span>
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
            {commentsLoadingMore && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto mb-2"></div>
                <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                  더 많은 댓글을 불러오는 중...
                </p>
              </div>
            )}
            
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
              <p className="text-black font-normal text-sm" style={{ opacity: 0.6 }}>
                {finalUserData?.email || '이메일 정보 없음'}
              </p>
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
              {/* <button
                data-tab="events"
                onClick={() => handleTabChange('events')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'events'
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
            <span>내가 만든 이벤트 <span className="font-bold">{userStats.eventCount}</span></span>
              </button> */}
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
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-opacity-50">로딩 중...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

// 직접 내보내기
export default function ProfilePage() {
  return <ProfilePageContent />;
} 