/**
 * 공정한 추첨 알고리즘 유틸리티
 */

export interface RaffleParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventId: string;
  registeredAt: string;
  isWinner?: boolean;
}

/**
 * Fisher-Yates 셔플 알고리즘을 사용한 공정한 추첨
 * @param participants 참여자 목록
 * @param maxWinners 당첨자 수
 * @returns 당첨자 목록
 */
export function fairRaffle(participants: RaffleParticipant[], maxWinners: number): RaffleParticipant[] {
  if (participants.length === 0 || maxWinners <= 0) {
    return [];
  }

  if (maxWinners >= participants.length) {
    return [...participants];
  }

  // 배열 복사 (원본 보호)
  const shuffled = [...participants];
  
  // Fisher-Yates 셔플 알고리즘
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 0부터 i까지의 랜덤한 인덱스 선택
    const j = Math.floor(Math.random() * (i + 1));
    
    // 요소 교환
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // 앞에서부터 maxWinners만큼 선택
  return shuffled.slice(0, maxWinners);
}

/**
 * 시드 기반 추첨 (재현 가능한 추첨)
 * @param participants 참여자 목록
 * @param maxWinners 당첨자 수
 * @param seed 시드 값
 * @returns 당첨자 목록
 */
export function seededRaffle(
  participants: RaffleParticipant[], 
  maxWinners: number, 
  seed: string
): RaffleParticipant[] {
  if (participants.length === 0 || maxWinners <= 0) {
    return [];
  }

  if (maxWinners >= participants.length) {
    return [...participants];
  }

  // 시드 기반 의사난수 생성기
  const seededRandom = createSeededRandom(seed);
  
  const shuffled = [...participants];
  
  // Fisher-Yates 셔플 (시드 기반)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, maxWinners);
}

/**
 * 시드 기반 의사난수 생성기
 * @param seed 시드 문자열
 * @returns 0-1 사이의 난수 생성 함수
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
}

/**
 * 가중치 기반 추첨 (참여 횟수나 기타 요소에 따른 가중치)
 * @param participants 참여자 목록
 * @param maxWinners 당첨자 수
 * @param weightFunction 가중치 계산 함수
 * @returns 당첨자 목록
 */
export function weightedRaffle(
  participants: RaffleParticipant[],
  maxWinners: number,
  weightFunction: (participant: RaffleParticipant) => number
): RaffleParticipant[] {
  if (participants.length === 0 || maxWinners <= 0) {
    return [];
  }

  if (maxWinners >= participants.length) {
    return [...participants];
  }

  // 가중치 배열 생성
  const weights = participants.map(weightFunction);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  if (totalWeight === 0) {
    // 모든 가중치가 0이면 균등 추첨
    return fairRaffle(participants, maxWinners);
  }

  const winners: RaffleParticipant[] = [];
  const remainingParticipants = [...participants];
  const remainingWeights = [...weights];

  for (let i = 0; i < maxWinners && remainingParticipants.length > 0; i++) {
    // 가중치 기반 선택
    const random = Math.random() * remainingWeights.reduce((sum, w) => sum + w, 0);
    let currentWeight = 0;
    let selectedIndex = 0;

    for (let j = 0; j < remainingWeights.length; j++) {
      currentWeight += remainingWeights[j];
      if (random <= currentWeight) {
        selectedIndex = j;
        break;
      }
    }

    // 선택된 참여자를 당첨자에 추가
    winners.push(remainingParticipants[selectedIndex]);
    
    // 선택된 참여자 제거
    remainingParticipants.splice(selectedIndex, 1);
    remainingWeights.splice(selectedIndex, 1);
  }

  return winners;
}

/**
 * 추첨 결과 검증
 * @param participants 전체 참여자
 * @param winners 당첨자 목록
 * @param maxWinners 최대 당첨자 수
 * @returns 검증 결과
 */
export function validateRaffleResult(
  participants: RaffleParticipant[],
  winners: RaffleParticipant[],
  maxWinners: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 당첨자 수 검증
  if (winners.length > maxWinners) {
    errors.push(`당첨자 수가 최대 허용 수(${maxWinners})를 초과했습니다.`);
  }

  // 중복 당첨자 검증
  const winnerIds = new Set(winners.map(w => w.id));
  if (winnerIds.size !== winners.length) {
    errors.push('중복된 당첨자가 있습니다.');
  }

  // 참여자 목록에 없는 당첨자 검증
  const participantIds = new Set(participants.map(p => p.id));
  for (const winner of winners) {
    if (!participantIds.has(winner.id)) {
      errors.push(`당첨자 ${winner.name}이 참여자 목록에 없습니다.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 추첨 통계 생성
 * @param participants 전체 참여자
 * @param winners 당첨자 목록
 * @returns 추첨 통계
 */
export function generateRaffleStats(
  participants: RaffleParticipant[],
  winners: RaffleParticipant[]
): {
  totalParticipants: number;
  totalWinners: number;
  winRate: number;
  averageRegistrationTime: string;
  winnerDetails: Array<{
    name: string;
    email: string;
    registeredAt: string;
    daysSinceRegistration: number;
  }>;
} {
  const totalParticipants = participants.length;
  const totalWinners = winners.length;
  const winRate = totalParticipants > 0 ? (totalWinners / totalParticipants) * 100 : 0;

  // 평균 등록 시간 계산
  const now = new Date();
  const totalDays = participants.reduce((sum, p) => {
    const regDate = new Date(p.registeredAt);
    const daysDiff = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + daysDiff;
  }, 0);
  const averageDays = totalParticipants > 0 ? Math.round(totalDays / totalParticipants) : 0;

  // 당첨자 상세 정보
  const winnerDetails = winners.map(winner => {
    const regDate = new Date(winner.registeredAt);
    const daysSinceRegistration = Math.floor((now.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      name: winner.name,
      email: winner.email,
      registeredAt: winner.registeredAt,
      daysSinceRegistration
    };
  });

  return {
    totalParticipants,
    totalWinners,
    winRate: Math.round(winRate * 100) / 100,
    averageRegistrationTime: `${averageDays}일 전`,
    winnerDetails
  };
}
