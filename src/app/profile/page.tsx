"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { UserItem } from "@/types/api";

// 탭 타입 정의
type TabType = 'events' | 'posts' | 'comments' | 'likes' | 'bookmarks';

// 이벤트 아이템 타입
interface EventItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

// 게시글 아이템 타입
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

// 댓글 아이템 타입
interface CommentItem {
  id: string;
  content: string;
  postId: string;
  postTitle?: string;
  boardType: string;
  eventId: string;
  createdAt: string;
}

function ProfilePageContent() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [isLoading, setIsLoading] = useState(false);
  
  // UserItem 타입으로 캐스팅
  const userData = user as UserItem | null;
  
  // 디버깅: 사용자 데이터 확인
  console.log('🔍 Profile Page - User Data:', userData);
  console.log('🔍 Profile Page - User Stats:', {
    eventCount: userData?.eventCount,
    postCount: userData?.postCount,
    commentCount: userData?.commentCount
  });

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // 인증되지 않은 경우 로딩 표시
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>메인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    router.back();
  };

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      router.push("/");
      logout();
    }
  };

  const handleEditProfile = () => {
    console.log("프로필 수정 클릭");
    router.push("/profile/edit");
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 실제 사용자 데이터 사용
  const userEvents: EventItem[] = Array.from({ length: userData?.eventCount || 0 }, (_, index) => ({
    id: `${index + 1}`,
    title: '서울과학기술대학교 횃불제',
    description: '서울과학기술대학교의 대표 축제인 횃불제는 동아리 연합회를 중심으로 매년 봄에 개최되는 대규모 축제입니다. 다양한 공연과 부스 활동을 통해 학생들의 창의성과 협력을 기를 수 있는 기회를 제공합니다.',
    createdAt: '2024-04-10',
    status: 'active'
  }));

  const userPosts: PostItem[] = Array.from({ length: userData?.postCount || 0 }, (_, index) => ({
    id: `${index + 1}`,
    content: '오늘 축제 정말 재미있었어요! 다음에도 참여하고 싶습니다.',
    boardType: 'free',
    eventId: '1',
    createdAt: '2024-06-15T10:30:00Z',
    likeCount: 5,
    commentCount: 3
  }));

  const userComments: CommentItem[] = Array.from({ length: userData?.commentCount || 0 }, (_, index) => ({
    id: `${index + 1}`,
    content: '정말 좋은 글이네요!',
    postId: '1',
    postTitle: '축제 후기',
    boardType: 'free',
    eventId: '1',
    createdAt: '2024-06-15T11:00:00Z'
  }));

  // 사용자 통계 정보
  const userStats = {
    eventCount: userData?.eventCount || 0,
    postCount: userData?.postCount || 0,
    commentCount: userData?.commentCount || 0
  };

  // 좋아요한 글 아이템 타입
  interface LikeItem {
    id: string;
    title?: string;
    content: string;
    boardType: string;
    eventId: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
  }

  // 북마크 아이템 타입
  interface BookmarkItem {
    id: string;
    title?: string;
    content: string;
    boardType: string;
    eventId: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
  }

  const mockLikes: LikeItem[] = [
    {
      id: '1',
      content: '정말 멋진 축제였어요! 다음에도 참여하고 싶습니다.',
      boardType: 'free',
      eventId: '1',
      createdAt: '2024-06-15T10:30:00Z',
      likeCount: 15,
      commentCount: 5
    },
    {
      id: '2',
      title: '축제 후기',
      content: '정말 좋은 경험이었습니다.',
      boardType: 'notice',
      eventId: '1',
      createdAt: '2024-06-14T15:20:00Z',
      likeCount: 8,
      commentCount: 3
    }
  ];

  const mockBookmarks: BookmarkItem[] = [
    {
      id: '1',
      title: '중요한 공지사항',
      content: '이번 주 주말에 특별한 이벤트가 있습니다.',
      boardType: 'notice',
      eventId: '1',
      createdAt: '2024-06-13T09:00:00Z',
      likeCount: 25,
      commentCount: 12
    }
  ];

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 탭 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <div className="space-y-4">
            {userEvents.length > 0 ? (
              userEvents.map((event) => (
                <div key={event.id} className="flex gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                  {/* 썸네일 이미지 */}
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-2xl">🎪</span>
                  </div>
                  
                  {/* 컨텐츠 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-lg truncate">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'active' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {event.status === 'active' ? '진행중' : '종료'}
                      </span>
                    </div>
                    <p className="text-white text-opacity-70 text-sm mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    
                    {/* 상세 정보 */}
                    <div className="flex items-center gap-4 text-xs text-white text-opacity-50">
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span>서울과학기술대학교</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🗓️</span>
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>2/200명 참가</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white text-opacity-50">만든 이벤트가 없습니다.</p>
              </div>
            )}
          </div>
        );

      case 'posts':
        return (
          <div className="space-y-4">
            {userPosts.length > 0 ? (
              userPosts.map((post) => (
                <div key={post.id} className="p-4 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">
                      {post.title || '제목 없음'}
                    </h3>
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-600 text-white">
                      {post.boardType === 'free' ? '자유게시판' : '공지사항'}
                    </span>
                  </div>
                  <p className="text-white text-opacity-70 text-sm mb-2 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white text-opacity-50">
                    <span>❤️ {post.likeCount} 💬 {post.commentCount}</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white text-opacity-50">작성한 글이 없습니다.</p>
              </div>
            )}
          </div>
        );

      case 'comments':
        return (
          <div className="space-y-4">
            {userComments.length > 0 ? (
              userComments.map((comment) => (
                <div key={comment.id} className="p-4 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10">
                  <div className="mb-2">
                    <p className="text-white text-sm font-medium mb-1">
                      {comment.postTitle ? `"${comment.postTitle}"에 댓글` : '댓글'}
                    </p>
                  </div>
                  <p className="text-white text-opacity-70 text-sm mb-2">{comment.content}</p>
                  <div className="flex items-center justify-between text-xs text-white text-opacity-50">
                    <span className="px-2 py-1 rounded-full bg-purple-600 bg-opacity-20 text-purple-300">
                      {comment.boardType === 'free' ? '자유게시판' : '공지사항'}
                    </span>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-white text-opacity-50">작성한 댓글이 없습니다.</p>
              </div>
            )}
          </div>
        );

              case 'likes':
          return (
            <div className="space-y-4">
              {mockLikes.length > 0 ? (
                mockLikes.map((like) => (
                  <div key={like.id} className="p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {like.title || '제목 없음'}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs bg-red-600 text-white">
                        ❤️ 좋아요
                      </span>
                    </div>
                    <p className="text-white text-opacity-70 text-sm mb-2 line-clamp-2">
                      {like.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white text-opacity-50">
                      <span>❤️ {like.likeCount} 💬 {like.commentCount}</span>
                      <span>{formatDate(like.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white text-opacity-50">좋아요한 글이 없습니다.</p>
                </div>
              )}
            </div>
          );

        case 'bookmarks':
          return (
            <div className="space-y-4">
              {mockBookmarks.length > 0 ? (
                mockBookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        {bookmark.title || '제목 없음'}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-600 text-white">
                        🔖 북마크
                      </span>
                    </div>
                    <p className="text-white text-opacity-70 text-sm mb-2 line-clamp-2">
                      {bookmark.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white text-opacity-50">
                      <span>❤️ {bookmark.likeCount} 💬 {bookmark.commentCount}</span>
                      <span>{formatDate(bookmark.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white text-opacity-50">북마크한 글이 없습니다.</p>
                </div>
              )}
            </div>
          );

        default:
          return null;
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="내 프로필"
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
        rightButton={
          <svg
            className="w-6 h-6 text-white"
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
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4">
        <div className="w-full">
          {/* 프로필 아바타 섹션 */}
          <div className="flex items-center mb-6">
            <div className="w-[56px] h-[56px] bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                {userData?.nickname || '사용자'}
              </h1>
              <p className="text-white font-normal text-xs" style={{ opacity: 0.6 }}>
                {userData?.email || '이메일 정보 없음'}
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="px-4 py-3 rounded-xl bg-purple-600 font-semibold text-white text-sm transition-all hover:bg-purple-700"
            >
              프로필 편집
            </button>
          </div>

          {/* 내 활동 섹션 */}
          <div className="mb-4 mt-12">
            <h2 className="text-xl font-bold text-white">내 활동</h2>
          </div>

          {/* 탭 네비게이션 캐러셀 */}
          <div className="relative mb-6">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button
                onClick={() => handleTabChange('events')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'events'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-white text-opacity-70 hover:text-opacity-90'
                }`}
              >
                <span>🗓️</span>
                <span>내가 만든 이벤트 {userEvents.length}</span>
              </button>
              <button
                onClick={() => handleTabChange('posts')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'posts'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-white text-opacity-70 hover:text-opacity-90'
                }`}
              >
                <span>✏️</span>
                <span>내가 쓴 글 {userPosts.length}</span>
              </button>
              <button
                onClick={() => handleTabChange('comments')}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === 'comments'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-white text-opacity-70 hover:text-opacity-90'
                }`}
              >
                <span>💬</span>
                <span>내가 쓴 댓글 {userComments.length}</span>
              </button>
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1">
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
      </main>
    </div>
  );
}

// 직접 내보내기 (ProtectedRoute 제거)
export default function ProfilePage() {
  return <ProfilePageContent />;
} 