"use client";

export default function EventHelp() {
  return (
    <section className="py-8 px-4">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">도움말 & 문의</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          궁금한 점이 있으시면 언제든 문의해주세요
        </p>
      </div>

      {/* 연락처 섹션 */}
      <div 
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-lg font-bold text-white mb-4">연락처</h3>
        <div className="space-y-0">
          <p className="text-sm text-white" style={{ opacity: 0.6 }}>010-1234-5678</p>
          <p className="text-sm text-white mb-3" style={{ opacity: 0.6 }}>contact@festival.com</p>
          <p className="text-sm text-white mb-2" style={{ opacity: 0.6 }}>서울특별시 강남구 테헤란로 123</p>
        </div>
      </div>

      {/* 자주 묻는 질문 섹션 */}
      <div 
        className="rounded-xl px-4 py-6"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <h3 className="text-lg font-bold text-white mb-4">자주 묻는 질문</h3>
        <div className="space-y-8 pt-2">
          <div>
            <p className="text-sm text-white mb-2">
              <span className="text-purple-600 font-semibold">Q. </span>
              페스티벌 입장은 언제부터 가능한가요?
            </p>
            <p className="text-sm text-white" style={{ opacity: 0.8 }}>
              <span className="font-semibold">A. </span>
              페스티벌은 오전 10시부터 입장이 가능합니다. 사전 등록하신 분들은 별도 라인을 통해 빠른 입장이 가능합니다.
            </p>
          </div>

          <div>
            <p className="text-sm text-white mb-2">
              <span className="text-purple-600 font-semibold">Q. </span>
              주차는 어떻게 하나요?
            </p>
            <p className="text-sm text-white" style={{ opacity: 0.8 }}>
              <span className="font-semibold">A. </span>
              페스티벌장 주변에 유료 주차장이 준비되어 있습니다. 대중교통 이용을 권장드립니다.
            </p>
          </div>

          <div>
            <p className="text-sm text-white mb-2">
              <span className="text-purple-600 font-semibold">Q. </span>
              음식물 반입이 가능한가요?
            </p>
            <p className="text-sm text-white" style={{ opacity: 0.8 }}>
              <span className="font-semibold">A. </span>
              페스티벌장 내에서 다양한 음식과 음료를 구매하실 수 있습니다. 외부 음식물 반입은 제한됩니다.
            </p>
          </div>

          <div>
            <p className="text-sm text-white mb-2">
              <span className="text-purple-600 font-semibold">Q. </span>
              우천 시 어떻게 되나요?
            </p>
            <p className="text-sm text-white" style={{ opacity: 0.8 }}>
              <span className="font-semibold">A. </span>
              소나기 정도는 페스티벌이 계속 진행됩니다. 폭우나 태풍 등 기상악화 시에는 공지사항을 확인해 주세요.
            </p>
          </div>

          <div>
            <p className="text-sm text-white mb-2">
              <span className="text-purple-600 font-semibold">Q. </span>
              분실물은 어디서 찾을 수 있나요?
            </p>
            <p className="text-sm text-white" style={{ opacity: 0.8 }}>
              <span className="font-semibold">A. </span>
              분실물센터는 메인 게이트 옆에 위치해 있습니다. 페스티벌 종료 후 1주일간 보관됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 