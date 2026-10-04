import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'बोली-साइन (BoliSign) — Indian Sign Language to Hindi Speech',
  description: 'AI-powered real-time Indian Sign Language interpreter, custom sign trainer, and Hindi speech synthesizer for the Deaf & Mute community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤟</text></svg>" />
        {/* MediaPipe Hands & Face Detection with working CDN URLs */}
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossOrigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossOrigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js" crossOrigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4/face_detection.js" crossOrigin="anonymous"></script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
