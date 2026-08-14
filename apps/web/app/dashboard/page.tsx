import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/');

  const user = session.user;
  const role = (user as any).role || 'user';

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        {/* Welcome Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '2.5rem',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.25)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
            </svg>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
            Welcome, {user?.name || user?.email}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 1.5rem' }}>
            Arpit Solar Management System
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 10,
            background: role === 'ADMIN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${role === 'ADMIN' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            marginBottom: '1.5rem',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: role === 'ADMIN' ? '#10b981' : '#f59e0b',
            }} />
            <span style={{
              fontSize: '0.8125rem', fontWeight: 700,
              color: role === 'ADMIN' ? '#34d399' : '#fbbf24',
            }}>
              {role} Access
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {role === 'ADMIN' || role === 'MANAGER' ? (
              <Link
                href="/admin/dashboard"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.75rem', borderRadius: 12,
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  color: '#1a1a1a', fontWeight: 700, fontSize: '0.875rem',
                  textDecoration: 'none', transition: 'all 0.3s',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
                }}
              >
                Go to Admin Dashboard →
              </Link>
            ) : (
              <div style={{
                padding: '1rem 1.5rem', borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}>
                <p style={{ fontSize: '0.8125rem', color: '#fbbf24', margin: 0 }}>
                  You have standard user access. Contact your administrator for elevated permissions.
                </p>
              </div>
            )}
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.75rem', borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8', fontWeight: 600, fontSize: '0.875rem',
                textDecoration: 'none', transition: 'all 0.3s',
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
