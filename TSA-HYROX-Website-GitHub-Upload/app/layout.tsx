import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'TSA Thunderstars | Texas Sports Academy', description: 'Live TSA Thunderstars event results and leaderboards.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
