'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminStats } from '@/lib/api';

interface AdminStatsData {
  userStats: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  };
  couponStats: {
    totalCoupons: number;
    usedCoupons: number;
    unusedCoupons: number;
    usageRate: number;
  };
  vendorStats: {
    totalVendors: number;
    activeVendors: number;
    topVendors: Array<{
      id: string;
      name: string;
      usageCount: number;
    }>;
  };
}

export default function AdminStatsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<AdminStatsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin 권한 검증
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // 로컬 스토리지에서 사용자 정보 확인
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          alert('로그인이 필요합니다.');
          router.push('/sign');
          return;
        }

        const user = JSON.parse(userData);
        
        if (user.role === 'admin') {
          setIsAdmin(true);
          await loadStatsData('3158612a-6764-11f0-aaae-6de7418cfa45');
        } else {
          const userRole = user.role || '없음';
          alert(`관리자 권한이 필요합니다.\n현재 role: "${userRole}"\n필요한 role: "admin"`);
          router.push('/');
        }
      } catch (error) {
        console.error('Admin 권한 확인 실패:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  // 통계 데이터 로드
  const loadStatsData = async (eventId: string) => {
    setIsLoadingStats(true);
    setError(null);
    
    try {
      const result = await getAdminStats(eventId);
      
      if (result.success && result.data) {
        setStatsData(result.data);
      } else {
        setError(result.error || '통계 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleRefresh = () => {
    loadStatsData('3158612a-6764-11f0-aaae-6de7418cfa45');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackClick}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">관리자 통계</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoadingStats}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isLoadingStats ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoadingStats ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">통계 데이터를 불러오는 중...</p>
          </div>
        ) : statsData ? (
          <div className="space-y-8">
            {/* 사용자 통계 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">사용자 가입 통계</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{statsData.userStats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">전체 사용자</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{statsData.userStats.newUsersToday.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">오늘 가입</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{statsData.userStats.newUsersThisWeek.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">이번 주 가입</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{statsData.userStats.newUsersThisMonth.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">이번 달 가입</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 쿠폰 통계 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">쿠폰 사용 현황</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{statsData.couponStats.totalCoupons.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">전체 쿠폰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{statsData.couponStats.usedCoupons.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">사용된 쿠폰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600">{statsData.couponStats.unusedCoupons.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">미사용 쿠폰</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{statsData.couponStats.usageRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500 mt-1">사용률</div>
                  </div>
                </div>
                
                {/* 사용률 프로그레스 바 */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>쿠폰 사용률</span>
                    <span>{statsData.couponStats.usageRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(statsData.couponStats.usageRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 벤더 통계 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">푸드트럭 현황</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{statsData.vendorStats.totalVendors.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">전체 푸드트럭</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{statsData.vendorStats.activeVendors.toLocaleString()}</div>
                    <div className="text-sm text-gray-500 mt-1">활성 푸드트럭</div>
                  </div>
                </div>

                {/* 인기 푸드트럭 TOP 5 */}
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-4">인기 푸드트럭 TOP 5</h3>
                  <div className="space-y-3">
                    {statsData.vendorStats.topVendors.slice(0, 5).map((vendor, index) => (
                      <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-600">#{index + 1}</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {vendor.usageCount}회 사용
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">통계 데이터가 없습니다</h3>
            <p className="text-gray-500">새로고침 버튼을 눌러 데이터를 불러와주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
