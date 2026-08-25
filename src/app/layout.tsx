import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LIFEQUEST — инкременталка твоей жизни',
  description: 'Финансовый трекер: доходы, расходы, цели, рост',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/500.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono/700.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/600.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css" />
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}