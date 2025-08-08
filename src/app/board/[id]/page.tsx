"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FreeBoardItem, NoticeItem, CommentItem } from "@/types/api";
import { getBoardDetail, getComments } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostDetail from "@/components/board/PostDetail";
import CommentSection from "@/components/board/CommentSection";

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [post, setPost] = useState<FreeBoardItem | NoticeItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL에서 타입 확인 (free 또는 notice)
  const postType = searchParams.get('type') || 'free';

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
    router.back();
  };

  const getPageTitle = () => {
    if (postType === 'free') {
      return '자유게시판';
    } else if (postType === 'notice') {
      return '공지사항';
    }
    return '게시글';
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
      
            <div className={`pl-4 pr-6 ${isFreeBoardPost ? 'py-4' : 'py-6'}`}>
        {/* 게시글 디테일 */}
        <PostDetail 
          post={post} 
          isFreeBoardPost={isFreeBoardPost} 
          formatDate={formatDate} 
        />

        {/* 댓글 섹션 (자유게시판인 경우만) */}
        {isFreeBoardPost && (
          <CommentSection comments={comments} getRelativeTime={getRelativeTime} />
        )}
      </div>
    </div>
  );
} 