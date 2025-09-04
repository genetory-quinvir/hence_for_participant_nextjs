"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { saveTokens } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { replace } = useSimpleNavigation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUserInfo, setManualUserInfo] = useState({
    social_user_id: '',
    email: '',
    name: '',
    nickname: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const redirectUrl = searchParams.get('redirect');
        const clientRedirectUrl = searchParams.get('clientRedirect');
        
        console.log('로그인 콜백 처리:', { 
          code, 
          provider, 
          isNewUser, 
          redirectUrl, 
          clientRedirectUrl
        });
        console.log('전체 URL 파라미터:', window.location.search);
        console.log('clientRedirect 파라미터 존재 여부:', !!clientRedirectUrl);
        
        // URL 파라미터 디버깅을 위한 상세 로그
        const allUrlParams = Object.fromEntries(new URLSearchParams(window.location.search));
        console.log('URL 파라미터 상세 분석:', {
          hasCode: !!code,
          hasProvider: !!provider,
          hasIsNewUser: isNewUser !== undefined,
          allParams: allUrlParams,
          fullUrl: window.location.href,
          searchString: window.location.search
        });

        // 외부 소셜 로그인 서비스에서 제공하는 모든 파라미터 로깅
        console.log('🔍 외부 소셜 로그인 서비스에서 제공된 모든 파라미터:');
        Object.entries(allUrlParams).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // 필수 파라미터 검증 - code와 provider만 있으면 진행
        // 사용자 정보는 verify API에서 code를 통해 조회
        console.log('🔍 파라미터 검증 결과:', {
          hasCode: !!code,
          hasProvider: !!provider,
          hasIsNewUser: isNewUser !== undefined
        });

        console.log('✅ verify API를 통해 사용자 정보를 조회합니다.');

        // 1단계: verify API 직접 호출
        const verifyUrl = `https://api.hence.events/api/v1/auth/social/verify/${code}`;
        const verifyRequestBody = {
          provider: provider.toUpperCase(),
          isNewUser
        };
        
        console.log('🔍 ===== VERIFY API 호출 시작 =====');
        console.log('🔍 verify URL:', verifyUrl);
        console.log('🔍 verify 요청 데이터:', JSON.stringify(verifyRequestBody, null, 2));
        console.log('🔍 요청 시간:', new Date().toISOString());
        
        const verifyResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyRequestBody),
        });
        
        console.log('🔍 ===== VERIFY API 응답 수신 =====');
        console.log('🔍 응답 상태:', verifyResponse.status, verifyResponse.statusText);
        console.log('🔍 응답 헤더:', Object.fromEntries(verifyResponse.headers.entries()));
        console.log('🔍 응답 시간:', new Date().toISOString());
        
        const verifyResult = await verifyResponse.json();
        console.log('👤 ===== VERIFY API 응답 데이터 =====');
        console.log('👤 전체 응답 데이터:', JSON.stringify(verifyResult, null, 2));
        console.log('👤 응답 데이터 타입:', typeof verifyResult);
        console.log('👤 응답 데이터 키들:', Object.keys(verifyResult));
        
        console.log('✅ ===== VERIFY 사용자 정보 분석 =====');
        console.log('✅ hasData:', !!verifyResult.data);
        console.log('✅ hasId:', !!verifyResult.id);
        console.log('✅ hasEmail:', !!(verifyResult.data?.email || verifyResult.email));
        console.log('✅ hasName:', !!(verifyResult.data?.name || verifyResult.name));
        console.log('✅ hasNickname:', !!(verifyResult.data?.nickname || verifyResult.nickname));
        
        // 사용자 정보 상세 분석
        if (verifyResult.data) {
          console.log('📋 verifyResult.data 상세:', JSON.stringify(verifyResult.data, null, 2));
          console.log('📋 data.id:', verifyResult.data.id);
          console.log('📋 data.email:', verifyResult.data.email);
          console.log('📋 data.name:', verifyResult.data.name);
          console.log('📋 data.nickname:', verifyResult.data.nickname);
        }
        
        if (verifyResult.id) {
          console.log('📋 verifyResult.id:', verifyResult.id);
        }
        if (verifyResult.email) {
          console.log('📋 verifyResult.email:', verifyResult.email);
        }
        if (verifyResult.name) {
          console.log('📋 verifyResult.name:', verifyResult.name);
        }
        if (verifyResult.nickname) {
          console.log('📋 verifyResult.nickname:', verifyResult.nickname);
        }

        if (!verifyResponse.ok) {
          console.error('❌ ===== VERIFY API 실패 =====');
          console.error('❌ 응답 상태:', verifyResponse.status, verifyResponse.statusText);
          console.error('❌ 응답 헤더:', Object.fromEntries(verifyResponse.headers.entries()));
          console.error('❌ 응답 데이터:', JSON.stringify(verifyResult, null, 2));
          console.error('❌ 요청 URL:', verifyUrl);
          console.error('❌ 요청 데이터:', JSON.stringify(verifyRequestBody, null, 2));
          console.error('❌ 실패 시간:', new Date().toISOString());
          
          // 401 에러인 경우 특별 처리
          if (verifyResponse.status === 401) {
            console.error('🔐 ===== 401 UNAUTHORIZED 에러 =====');
            console.error('🔐 code가 유효하지 않거나 만료되었을 수 있습니다.');
            console.error('🔐 code 값:', code);
            console.error('🔐 provider 값:', provider);
            console.error('🔐 isNewUser 값:', isNewUser);
            console.error('🔐 요청 URL:', verifyUrl);
            console.error('🔐 요청 body:', JSON.stringify(verifyRequestBody, null, 2));
            
            setError('인증 실패: code가 유효하지 않거나 만료되었습니다. 새로운 소셜 로그인을 시도해주세요.');
            return;
          }
          
          setError(`사용자 정보 조회 실패 (${verifyResponse.status}: ${verifyResponse.statusText})`);
          return;
        }

        // 2단계: verify된 사용자 정보로 회원가입/로그인 처리
        console.log('🚀 ===== 회원가입/로그인 처리 시작 =====');
        const externalUrl = `https://api-participant.hence.events/auth/callback`;
        console.log('🚀 회원가입/로그인 처리 URL:', externalUrl);
        
        // verify에서 가져온 사용자 정보로 회원가입/로그인 요청
        const requestBody = {
          code,
          provider: provider.toUpperCase(),
          // verify에서 가져온 사용자 정보 (필수!)
          social_user_id: verifyResult.data?.id || verifyResult.id,
          email: verifyResult.data?.email || verifyResult.email,
          name: verifyResult.data?.name || verifyResult.name,
          nickname: verifyResult.data?.nickname || verifyResult.nickname,
          // 추가 정보
          ...(isNewUser !== undefined && { isNewUser })
        };

        console.log('🚀 ===== 회원가입/로그인 요청 데이터 =====');
        console.log('🚀 전체 요청 데이터:', JSON.stringify(requestBody, null, 2));
        console.log('📝 ===== verify에서 가져온 사용자 정보 =====');
        console.log('📝 social_user_id:', requestBody.social_user_id);
        console.log('📝 email:', requestBody.email);
        console.log('📝 name:', requestBody.name);
        console.log('📝 nickname:', requestBody.nickname);
        console.log('📝 isNewUser:', requestBody.isNewUser);
        console.log('📝 요청 시간:', new Date().toISOString());

        const response = await fetch(externalUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('🔍 ===== 외부 API 응답 수신 =====');
        console.log('🔍 응답 상태:', response.status, response.statusText);
        console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()));
        console.log('🔍 응답 시간:', new Date().toISOString());
        
        const result = await response.json();
        console.log('🔍 ===== 외부 API 응답 데이터 =====');
        console.log('🔍 전체 응답 데이터:', JSON.stringify(result, null, 2));
        console.log('🔍 응답 데이터 타입:', typeof result);
        console.log('🔍 응답 데이터 키들:', Object.keys(result));
        
        // 외부 API 응답 상세 분석
        console.log('🔍 ===== 외부 API 응답 분석 =====');
        console.log('🔍 status:', response.status);
        console.log('🔍 ok:', response.ok);
        console.log('🔍 hasSuccess:', 'success' in result);
        console.log('🔍 hasData:', 'data' in result);
        console.log('🔍 hasAccessToken:', 'access_token' in result || 'accessToken' in result);
        console.log('🔍 hasRefreshToken:', 'refresh_token' in result || 'refreshToken' in result);
        console.log('🔍 hasError:', 'error' in result || 'message' in result);
        
        if (result.success) {
          console.log('✅ 로그인 성공!');
          console.log('✅ success 값:', result.success);
        }
        if (result.data) {
          console.log('✅ 사용자 데이터 있음:', JSON.stringify(result.data, null, 2));
        }
        if (result.access_token) {
          console.log('✅ 액세스 토큰 있음:', result.access_token.substring(0, 20) + '...');
        }
        if (result.refresh_token) {
          console.log('✅ 리프레시 토큰 있음:', result.refresh_token.substring(0, 20) + '...');
        }
        if (result.error) {
          console.log('❌ 에러 있음:', result.error);
        }

        if (response.ok) {
          // 외부 API 응답 구조에 따라 처리
          if (result.success) {
            console.log("소셜 로그인 성공:", result.data);

            // 토큰들 저장
            saveTokens(result.access_token, result.refresh_token);

            // AuthContext에 로그인 상태 업데이트
            if (result.data) {
              login(
                {
                  id: result.data.id || '1',
                  name: result.data.nickname || '사용자',
                  nickname: result.data.nickname || '사용자',
                  email: result.data.email || '',
                },
                result.access_token,
                result.refresh_token
              );
            }

            // 성공 데이터 저장 및 성공 화면 표시
            setSuccessData({
              userData: result.data,
              redirectUrl: sessionStorage.getItem('socialLoginRedirectUrl'),
              clientRedirectUrl: clientRedirectUrl
            });
            setShowSuccessMessage(true);
            setIsProcessing(false);
            
            console.log('✅ 로그인 성공! 콘솔 로그를 확인한 후 "계속하기" 버튼을 클릭하세요.');
          } else if (result.data && result.code === 200) {
            // 성공 응답이지만 success 필드가 없는 경우
            console.log("소셜 로그인 성공 (대체 응답 구조):", result.data);
            
            const userData = result.data.user || result.data;
            const accessToken = result.data.token?.accessToken || result.data.accessToken;
            const refreshToken = result.data.token?.refreshToken || result.data.refreshToken;
            
            // 토큰들 저장
            saveTokens(accessToken, refreshToken);

            // AuthContext에 로그인 상태 업데이트
            if (userData) {
              login(
                {
                  id: userData.id || '1',
                  name: userData.nickname || '사용자',
                  nickname: userData.nickname || '사용자',
                  email: userData.email || '',
                },
                accessToken,
                refreshToken
              );
            }

            // 성공 데이터 저장 및 성공 화면 표시
            setSuccessData({
              userData: userData,
              redirectUrl: sessionStorage.getItem('socialLoginRedirectUrl'),
              clientRedirectUrl: clientRedirectUrl
            });
            setShowSuccessMessage(true);
            setIsProcessing(false);
            
            console.log('✅ 로그인 성공! 콘솔 로그를 확인한 후 "계속하기" 버튼을 클릭하세요.');
          } else {
            console.error('❌ ===== 로그인 실패 =====');
            console.error('❌ 응답 상태:', response.status, response.statusText);
            console.error('❌ 응답 데이터:', JSON.stringify(result, null, 2));
            console.error('❌ 실패 시간:', new Date().toISOString());
            
            const errorMessage = result.error || result.message || '로그인에 실패했습니다.';
            setError(`${errorMessage} (상태: ${response.status || 'unknown'})`);
          }
        } else {
          console.error('❌ ===== 외부 API 호출 실패 =====');
          console.error('❌ 응답 상태:', response.status, response.statusText);
          console.error('❌ 응답 헤더:', Object.fromEntries(response.headers.entries()));
          console.error('❌ 응답 데이터:', JSON.stringify(result, null, 2));
          console.error('❌ 요청 URL:', externalUrl);
          console.error('❌ 요청 데이터:', JSON.stringify(requestBody, null, 2));
          console.error('❌ 실패 시간:', new Date().toISOString());
          
          // 외부 API 실패 시 대안 처리
          // verify에서 가져온 사용자 정보가 있는 경우 사용 (우선순위)
          if (verifyResult.data || verifyResult.id) {
            console.log('🔄 회원가입/로그인 API 실패, verify에서 가져온 사용자 정보로 임시 로그인 처리');
            
            const tempUserData = {
              id: verifyResult.data?.id || verifyResult.id,
              email: verifyResult.data?.email || verifyResult.email,
              nickname: verifyResult.data?.nickname || verifyResult.nickname || '사용자',
              name: verifyResult.data?.name || verifyResult.name || '사용자'
            };
            
            const tempAccessToken = 'temp_token_' + Date.now();
            const tempRefreshToken = 'temp_refresh_' + Date.now();
            
            // 토큰들 저장
            saveTokens(tempAccessToken, tempRefreshToken);

            // AuthContext에 로그인 상태 업데이트
            login(
              {
                id: tempUserData.id || '1',
                name: tempUserData.name || '사용자',
                nickname: tempUserData.nickname || '사용자',
                email: tempUserData.email || '',
              },
              tempAccessToken,
              tempRefreshToken
            );

            // 성공 데이터 저장 및 성공 화면 표시
            setSuccessData({
              userData: tempUserData,
              redirectUrl: sessionStorage.getItem('socialLoginRedirectUrl'),
              clientRedirectUrl: clientRedirectUrl
            });
            setShowSuccessMessage(true);
            setIsProcessing(false);
            
            console.log('✅ 임시 로그인 성공! (verify 정보 사용) 콘솔 로그를 확인한 후 "계속하기" 버튼을 클릭하세요.');
          } else {
            const errorMessage = result.error || result.message || `외부 API 호출 실패 (${response.status}: ${response.statusText})`;
            setError(`${errorMessage}`);
          }
        }
              } catch (error) {
          console.error('❌ ===== 로그인 콜백 처리 오류 =====');
          console.error('❌ 에러 타입:', typeof error);
          console.error('❌ 에러 객체:', error);
          console.error('❌ 에러 시간:', new Date().toISOString());
          
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.error('❌ 에러 상세:', {
            message: errorMessage,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined
          });
          
          setError(`로그인 처리 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, login, replace, showToast]);

  // 수동 사용자 정보 입력 처리
  const handleManualSubmit = async () => {
    if (!manualUserInfo.social_user_id || !manualUserInfo.email) {
      setError('소셜 사용자 ID와 이메일은 필수입니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const code = searchParams.get('code');
      const provider = searchParams.get('provider');
      
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          provider: provider?.toUpperCase(),
          social_user_id: manualUserInfo.social_user_id,
          email: manualUserInfo.email,
          name: manualUserInfo.name,
          nickname: manualUserInfo.nickname
        }),
      });

      const result = await response.json();
      
      if (result.success && result.access_token) {
        saveTokens(result.access_token, result.refresh_token);
        login(
          {
            id: result.data.id || manualUserInfo.social_user_id,
            name: result.data.nickname || manualUserInfo.name || '사용자',
            nickname: result.data.nickname || manualUserInfo.nickname || '사용자',
            email: result.data.email || manualUserInfo.email,
          },
          result.access_token,
          result.refresh_token
        );
        
        // 성공 후 성공 화면 표시
        setSuccessData({
          userData: result.data,
          redirectUrl: sessionStorage.getItem('socialLoginRedirectUrl'),
          clientRedirectUrl: null
        });
        setShowSuccessMessage(true);
        setIsProcessing(false);
        
        console.log('✅ 수동 로그인 성공! 콘솔 로그를 확인한 후 "계속하기" 버튼을 클릭하세요.');
      } else {
        setError(result.error || '수동 로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('수동 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>로그인 처리 중...</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md">
            <p className="text-xs text-blue-600 mb-2">🔍 디버깅 팁</p>
            <p className="text-xs text-blue-500">
              브라우저 개발자 도구(F12) → 콘솔 탭에서<br/>
              상세한 verify 과정을 확인할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-500 text-lg mb-4">✅ 로그인 성공!</div>
          <div className="text-sm mb-6" style={{ opacity: 0.7 }}>
            소셜 로그인이 성공적으로 완료되었습니다.
          </div>
          
          {successData?.userData && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg text-left">
              <h3 className="font-semibold text-green-800 mb-2">로그인된 사용자 정보</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">ID:</span> {successData.userData.id || '없음'}</div>
                <div><span className="font-medium">이메일:</span> {successData.userData.email || '없음'}</div>
                <div><span className="font-medium">이름:</span> {successData.userData.name || '없음'}</div>
                <div><span className="font-medium">닉네임:</span> {successData.userData.nickname || '없음'}</div>
              </div>
            </div>
          )}
          
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 mb-2">🔍 디버깅 완료</p>
            <p className="text-xs text-blue-500">
              브라우저 개발자 도구(F12) → 콘솔 탭에서<br/>
              verify 과정의 상세한 로그를 확인할 수 있습니다
            </p>
          </div>
          
          <button
            onClick={() => {
              const savedRedirectUrl = successData?.redirectUrl;
              const clientRedirectUrl = successData?.clientRedirectUrl;
              
              if (savedRedirectUrl) {
                sessionStorage.removeItem('socialLoginRedirectUrl');
                window.location.href = savedRedirectUrl;
              } else if (clientRedirectUrl) {
                const decodedUrl = decodeURIComponent(clientRedirectUrl);
                window.location.href = decodedUrl;
              } else {
                window.location.href = '/';
              }
            }}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            계속하기
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-lg mb-4">로그인 실패</div>
          <div className="text-sm mb-6" style={{ opacity: 0.7 }}>
            {error.split('\n').map((line, index) => (
              <div key={index} className={line.startsWith('•') ? 'text-left ml-4' : ''}>
                {line}
              </div>
            ))}
          </div>
          
          {!showManualForm ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                사용자 정보 수동 입력
              </button>
              <button
                onClick={() => replace('/sign')}
                className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                로그인 페이지로 돌아가기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="text-left">
              <h3 className="text-lg font-semibold mb-4">사용자 정보 입력</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">소셜 사용자 ID *</label>
                  <input
                    type="text"
                    value={manualUserInfo.social_user_id}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, social_user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="소셜 고유 ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일 *</label>
                  <input
                    type="email"
                    value={manualUserInfo.email}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이메일 주소"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이름</label>
                  <input
                    type="text"
                    value={manualUserInfo.name}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사용자 이름"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">닉네임</label>
                  <input
                    type="text"
                    value={manualUserInfo.nickname}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, nickname: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사용자 닉네임"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleManualSubmit}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '처리 중...' : '로그인 완료'}
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// 로딩 컴포넌트
function AuthCallbackLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>인증 처리 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
