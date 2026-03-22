// // ============================================================
// // app/layout.tsx — Root layout with sidebar + navbar
// // ============================================================

// import type { Metadata } from 'next';
// import './globals.css';
// import ClientLayout from '@/components/ClientLayout';

// export const metadata: Metadata = {
//   title: 'NexusAI — Investment Intelligence Platform',
//   description: 'Multi-asset AI-powered investment intelligence dashboard',
//   icons: { icon: '/favicon.ico' },
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" className="dark">
//       <body>
//         <ClientLayout>{children}</ClientLayout>
//       </body>
//     </html>
//   );
// }

import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import { AuthProvider } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'NexusAI — Investment Intelligence Platform',
  description: 'Multi-asset AI-powered investment intelligence dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}