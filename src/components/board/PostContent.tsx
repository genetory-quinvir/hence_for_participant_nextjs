import { BoardItem } from '@/types/api';

interface PostContentProps {
  post: BoardItem;
  isFreeBoardPost: boolean;
}

export default function PostContent({ post, isFreeBoardPost }: PostContentProps) {
  return (
    <div className="mb-8 mt-4">
      {isFreeBoardPost && 'images' in post && post.images && post.images.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col space-y-3">
            {post.images.map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`게시글 이미지 ${index + 1}`}
                className="w-full h-auto rounded-lg object-contain"
              />
            ))}
          </div>
        </div>
      )}

      <div className="text-md leading-relaxed whitespace-pre-wrap text-white">
        {post.content}
      </div>
    </div>
  );
} 