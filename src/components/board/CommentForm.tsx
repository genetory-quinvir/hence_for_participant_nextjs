export default function CommentForm() {
  return (
    <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <textarea
        placeholder="댓글을 작성해주세요..."
        className="w-full bg-transparent border-none outline-none resize-none text-lg text-white placeholder-white"
        style={{ opacity: 0.9 }}
        rows={3}
      />
      <div className="flex justify-end mt-3">
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg text-md font-medium hover:bg-purple-700 transition-colors">
          댓글 작성
        </button>
      </div>
    </div>
  );
} 