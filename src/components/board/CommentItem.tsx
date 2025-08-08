import { CommentItem as CommentItemType } from '@/types/api';

interface CommentItemProps {
  comment: CommentItemType;
  getRelativeTime: (dateString: string) => string;
}

export default function CommentItem({ comment, getRelativeTime }: CommentItemProps) {
  return (
    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
          {comment.user?.profileImageUrl && comment.user.profileImageUrl !== null ? (
            <img 
              src={comment.user.profileImageUrl} 
              alt={comment.user.nickname || '사용자'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-md font-bold">
              {(comment.user?.nickname || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-md text-white mb-1">
            {comment.user?.nickname || '익명'}
          </div>
          <div className="text-sm text-white mb-5" style={{ opacity: 0.6 }}>
            {comment.createdAt ? getRelativeTime(comment.createdAt) : ''}
          </div>
          <p className="text-xl text-white mb-2" style={{ opacity: 0.9 }}>{comment.content || ''}</p>
        </div>
      </div>
    </div>
  );
} 