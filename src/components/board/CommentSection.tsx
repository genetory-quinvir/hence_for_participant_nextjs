"use client";

import { useState, useMemo } from 'react';
import { CommentItem as CommentItemType } from '@/types/api';
import CommentForm from './CommentForm';
import CommentList from './CommentList';

interface CommentSectionProps {
  comments: CommentItemType[];
  getRelativeTime: (dateString: string) => string;
  onSubmitComment: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

type SortType = 'latest' | 'popular';

export default function CommentSection({ 
  comments, 
  getRelativeTime, 
  onSubmitComment, 
  isSubmitting = false 
}: CommentSectionProps) {
  const [sortType, setSortType] = useState<SortType>('latest');

  // 댓글 정렬
  const sortedComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    
    const sorted = [...comments];
    
    if (sortType === 'latest') {
      // 최신순: createdAt 기준 내림차순
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortType === 'popular') {
      // 인기순: 좋아요 수 기준 (현재는 좋아요 기능이 없으므로 최신순과 동일)
      // TODO: 좋아요 기능 추가 시 likeCount 기준으로 정렬
      return sorted.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    
    return sorted;
  }, [comments, sortType]);

  return (
    <div>
      <div className="mb-3 mt-4">
        <h3 className="text-lg font-bold">댓글 ({Array.isArray(comments) ? comments.length : 0})</h3>
      </div>
      
      {/* 댓글 작성 폼 */}
      <CommentForm onSubmit={onSubmitComment} isSubmitting={isSubmitting} />

      {/* 댓글 목록 */}
      <CommentList comments={sortedComments} getRelativeTime={getRelativeTime} />
    </div>
  );
} 