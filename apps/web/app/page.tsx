import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton, LoginButton } from './auth-buttons';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If logged in, redirect to admin dashboard
  if (session?.user) {
    redirect('/admin/dashboard');
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem',
          boxShadow: '0 20px 60px rgba(245, 158, 11, 0.3)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
          Arpit Solar
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#94a3b8', margin: '0 0 2.5rem' }}>
          Solar Installation Management System
        </p>

        <Link
          href="/api/auth/signin"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 2.5rem', borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#1a1a1a', fontWeight: 700, fontSize: '1rem',
            textDecoration: 'none', transition: 'all 0.3s',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.25)',
          }}
        >
          Sign In to Dashboard
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </Link>

        <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '2rem' }}>
          Authorized personnel only. Contact your administrator for access.
        </p>
      </div>
    </main>
  );
}
