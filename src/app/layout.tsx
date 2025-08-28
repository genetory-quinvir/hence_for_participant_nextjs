import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DayProvider } from "@/contexts/DayContext";
import { ToastProvider } from "@/components/common/Toast";
import { ForegroundMessageHandler } from "@/components/common/ForegroundMessageHandler";

export const metadata: Metadata = {
  title: "HENCE X 서울과학기술대학교",
  description: "HENCE와 함께하는 서울과학기술대학교 횃불제",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HENCE X 서울과학기술대학교"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    shortcut: "/favicon.ico"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Hence Event" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        
        {/* 파비콘 캐시 방지를 위한 명시적 설정 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icons/icon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="font-sans antialiased bg-white text-black">
        <div className="mx-auto w-full max-w-lg min-h-screen bg-white" style={{ maxWidth: '700px' }}>
          <AuthProvider>
            <DayProvider>
              <ToastProvider>
                <ForegroundMessageHandler />
                {children}
              </ToastProvider>
            </DayProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
