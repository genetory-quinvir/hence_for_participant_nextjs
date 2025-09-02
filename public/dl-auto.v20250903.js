/* /public/dl-auto.v20250903.js */
(function () {
  window.dataLayer = window.dataLayer || [];

  // URL 파라미터(session 보존)
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id') || '';
  const qrEntry = urlParams.get('qr_entry') === 'true';
  
  // 페이지 로드 시 자동 이벤트
  function autoTrackPageView() {
    const page = document.body.getAttribute('data-dl-page');
    if (page) {
      window.dataLayer.push({
        event: 'page_view',
        page: page,
        event_id: eventId,
        qr_entry: qrEntry
      });
    }
  }

  // 로그인 모달 노출 추적
  function trackLoginModalView() {
    const loginModal = document.querySelector('[data-dl-expose="login_modal_view"]');
    if (loginModal) {
      const fromStep = loginModal.getAttribute('data-from-step');
      window.dataLayer.push({
        event: 'login_modal_view',
        from_step: fromStep,
        event_id: eventId,
        qr_entry: qrEntry
      });
    }
  }

  // CTA 클릭 추적
  function trackCTAClick(element) {
    const event = element.getAttribute('data-dl-event');
    const ctaId = element.getAttribute('data-cta-id');
    const dest = element.getAttribute('data-dest');
    const fromStep = element.getAttribute('data-from-step');
    
    if (event) {
      window.dataLayer.push({
        event: event,
        cta_id: ctaId,
        dest: dest,
        from_step: fromStep,
        event_id: eventId,
        qr_entry: qrEntry
      });
    }
  }

  // 소셜 로그인 시작 추적
  function trackAuthStart(provider) {
    window.dataLayer.push({
      event: 'auth_start',
      provider: provider,
      event_id: eventId,
      qr_entry: qrEntry
    });
  }

  // 소셜 로그인 CTA 클릭 추적
  function trackAuthCTAClick(element) {
    const provider = element.getAttribute('data-provider');
    const fromStep = document.body.getAttribute('data-dl-page') || 'unknown';
    
    window.dataLayer.push({
      event: 'auth_cta_click',
      provider: provider,
      from_step: fromStep,
      event_id: eventId,
      qr_entry: qrEntry
    });

    // auth_start 자동 동반
    if (provider) {
      trackAuthStart(provider);
    }
  }

  // 폼 제출 추적
  function trackFormSubmit(form) {
    const submitEvent = form.getAttribute('data-dl-submit');
    if (submitEvent) {
      window.dataLayer.push({
        event: submitEvent,
        event_id: eventId,
        qr_entry: qrEntry
      });
    }
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // CTA 클릭 추적
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-dl-event]');
      if (target) {
        if (target.getAttribute('data-dl-event') === 'auth_cta_click') {
          trackAuthCTAClick(target);
        } else {
          trackCTAClick(target);
        }
      }
    });

    // 폼 제출 추적
    document.addEventListener('submit', function(e) {
      trackFormSubmit(e.target);
    });

    // 로그인 모달 노출 추적 (Intersection Observer)
    const loginModal = document.querySelector('[data-dl-expose="login_modal_view"]');
    if (loginModal && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            trackLoginModalView();
            observer.unobserve(entry.target);
          }
        });
      });
      observer.observe(loginModal);
    }
  }

  // 전역 함수 등록
  window.__dl = {
    pushDL: function(eventName, data) {
      window.dataLayer.push({
        event: eventName,
        ...data,
        event_id: eventId,
        qr_entry: qrEntry
      });
    }
  };

  // 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      autoTrackPageView();
      setupEventListeners();
    });
  } else {
    autoTrackPageView();
    setupEventListeners();
  }

  // SPA 라우팅 대응
  if (window.history && window.history.pushState) {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(function() {
        autoTrackPageView();
        setupEventListeners();
      }, 100);
    };
    
    window.history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setTimeout(function() {
        autoTrackPageView();
        setupEventListeners();
      }, 100);
    };
  }
})();
