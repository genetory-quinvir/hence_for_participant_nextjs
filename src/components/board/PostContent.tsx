import { BoardItem } from '@/types/api';
import { useImageGallery } from '@/hooks/useImageGallery';
import ImageGallery from '@/components/common/ImageGallery';

interface PostContentProps {
  post: BoardItem;
  isFreeBoardPost: boolean;
}

export default function PostContent({ post, isFreeBoardPost }: PostContentProps) {
  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 이미지 클릭 핸들러
  const handleImageClick = (imageIndex: number) => {
    if (post.images && post.images.length > 0) {
      openGallery(post.images, imageIndex);
    }
  };

  return (
    <div className="mb-8 mt-4">
      {/* 공지사항 제목 */}
      {!isFreeBoardPost && post.title && (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">{post.title}</h1>
        </div>
      )}
      {isFreeBoardPost && 'images' in post && post.images && post.images.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-col space-y-3">
            {post.images.map((image: string, index: number) => (
              <div key={index} className="w-full rounded-lg overflow-hidden cursor-pointer" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                <img
                  src={image}
                  alt={`게시글 이미지 ${index + 1}`}
                  className="w-full h-auto object-contain"
                  onClick={() => handleImageClick(index)}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-full h-32 flex items-center justify-center hidden">
                  <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-md leading-relaxed whitespace-pre-wrap text-white">
        {post.content}
      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeGallery}
      />
    </div>
  );
} 