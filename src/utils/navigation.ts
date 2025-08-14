import { useRouter } from "next/navigation";

// 가장 단순한 네비게이션 훅
export function useSimpleNavigation() {
  const router = useRouter();

  // 페이지 이동
  const navigate = (path: string) => {
    router.push(path);
  };

  // 뒤로가기 (항상 브라우저 기본 동작)
  const goBack = () => {
    router.back();
  };

  // 페이지 교체 (히스토리에 추가하지 않음)
  const replace = (path: string) => {
    router.replace(path);
  };

  return {
    navigate,
    goBack,
    replace,
  };
} 