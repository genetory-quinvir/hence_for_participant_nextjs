"use client";

import { useState } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CommentForm({ onSubmit, isSubmitting = false }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await onSubmit(content.trim());
      setContent(''); // 성공 시 입력 필드 초기화
    } catch (error) {
      console.error('댓글 작성 오류:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  return (
    <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <textarea
        placeholder="댓글을 작성해주세요..."
        className="w-full bg-transparent border-none outline-none resize-none text-lg comment-textarea"
        style={{ 
          color: 'white',
          opacity: 0.9
        }}
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isSubmitting}
      />
      <div className="flex justify-end mt-3">
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className={`px-6 py-3 rounded-lg text-md font-medium transition-colors ${
            isSubmitting || !content.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isSubmitting ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
    </div>
  );
} 