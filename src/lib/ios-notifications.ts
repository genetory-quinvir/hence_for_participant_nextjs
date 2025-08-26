// iOS PWA 전용 알림 시스템
// iOS Safari에서는 FCM을 지원하지 않으므로 대안으로 구현

export interface IOSNotificationData {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
  timestamp: number;
}

class IOSNotificationManager {
  private storageKey = 'ios_notifications';
  private isIOS: boolean;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // iOS 환경인지 확인
  isIOSDevice(): boolean {
    return this.isIOS;
  }

  // 브라우저 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    if (!this.isIOS) {
      console.log('📱 iOS 기기가 아닙니다');
      return false;
    }

    if (!('Notification' in window)) {
      console.log('📱 Notification API가 지원되지 않습니다');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('📱 iOS 알림 권한:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('📱 iOS 알림 권한 요청 실패:', error);
      return false;
    }
  }

  // 로컬 알림 표시 (iOS PWA에서만 작동)
  async showNotification(title: string, body: string, options?: Partial<NotificationOptions>): Promise<boolean> {
    if (!this.isIOS) {
      console.log('📱 iOS 기기가 아닙니다');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.log('📱 알림 권한이 없습니다');
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: options?.icon || '/icons/icon-192x192.png',
        badge: options?.badge || '/icons/icon-72x72.png',
        tag: 'ios-pwa-notification',
        requireInteraction: false,
        ...options
      });

      // 알림 클릭 처리
      notification.onclick = () => {
        notification.close();
        window.focus();
      };

      console.log('📱 iOS 알림 표시됨:', title);
      return true;
    } catch (error) {
      console.error('📱 iOS 알림 표시 실패:', error);
      return false;
    }
  }

  // 로컬 스토리지에 알림 저장 (앱이 닫혀있을 때)
  saveNotification(title: string, body: string, data?: Record<string, any>): void {
    if (!this.isIOS) return;

    try {
      const notifications = this.getStoredNotifications();
      const newNotification: IOSNotificationData = {
        title,
        body,
        timestamp: Date.now(),
        data
      };

      notifications.unshift(newNotification);
      
      // 최대 50개까지만 저장
      if (notifications.length > 50) {
        notifications.splice(50);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
      console.log('📱 알림 저장됨:', title);
    } catch (error) {
      console.error('📱 알림 저장 실패:', error);
    }
  }

  // 저장된 알림 가져오기
  getStoredNotifications(): IOSNotificationData[] {
    if (!this.isIOS) return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('📱 저장된 알림 가져오기 실패:', error);
      return [];
    }
  }

  // 저장된 알림 삭제
  clearStoredNotifications(): void {
    if (!this.isIOS) return;

    try {
      localStorage.removeItem(this.storageKey);
      console.log('📱 저장된 알림 삭제됨');
    } catch (error) {
      console.error('📱 저장된 알림 삭제 실패:', error);
    }
  }

  // 토픽 구독 시뮬레이션 (iOS에서는 로컬에서만 관리)
  subscribeToTopic(topic: string): boolean {
    if (!this.isIOS) return false;

    try {
      const subscribedTopics = this.getSubscribedTopics();
      if (!subscribedTopics.includes(topic)) {
        subscribedTopics.push(topic);
        localStorage.setItem('ios_subscribed_topics', JSON.stringify(subscribedTopics));
      }
      console.log('📱 iOS 토픽 구독됨:', topic);
      return true;
    } catch (error) {
      console.error('📱 iOS 토픽 구독 실패:', error);
      return false;
    }
  }

  // 토픽 구독 해제
  unsubscribeFromTopic(topic: string): boolean {
    if (!this.isIOS) return false;

    try {
      const subscribedTopics = this.getSubscribedTopics();
      const filteredTopics = subscribedTopics.filter(t => t !== topic);
      localStorage.setItem('ios_subscribed_topics', JSON.stringify(filteredTopics));
      console.log('📱 iOS 토픽 구독 해제됨:', topic);
      return true;
    } catch (error) {
      console.error('📱 iOS 토픽 구독 해제 실패:', error);
      return false;
    }
  }

  // 구독된 토픽 목록 가져오기
  getSubscribedTopics(): string[] {
    if (!this.isIOS) return [];

    try {
      const stored = localStorage.getItem('ios_subscribed_topics');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('📱 구독된 토픽 가져오기 실패:', error);
      return [];
    }
  }

  // 테스트 알림 보내기
  async sendTestNotification(): Promise<boolean> {
    if (!this.isIOS) return false;

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('📱 알림 권한이 없어서 테스트 알림을 보낼 수 없습니다');
      return false;
    }

    const success = await this.showNotification(
      'iOS PWA 테스트 알림',
      '이것은 iOS PWA에서 보내는 테스트 알림입니다!',
      {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      }
    );

    if (success) {
      this.saveNotification(
        'iOS PWA 테스트 알림',
        '이것은 iOS PWA에서 보내는 테스트 알림입니다!'
      );
    }

    return success;
  }
}

// 싱글톤 인스턴스
export const iosNotificationManager = new IOSNotificationManager();
