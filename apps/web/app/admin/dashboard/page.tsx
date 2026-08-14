'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DashboardData {
  totalProjects: number;
  totalCustomers: number;
  openTasks: number;
  openDiscomIssues: number;
  totalRevenue: number;
  totalBalance: number;
  totalCollected?: number;
  overdueProjectsCount?: number;
  completedCount?: number;
  inProgressCount?: number;
  stageBreakdown: { stage: string; count: number }[];
  brandBreakdown: { brand: string; count: number }[];
  recentActivity: any[];
}

const stageLabels: Record<string, string> = {
  LEAD_CAPTURED: 'Lead Captured',
  SURVEY_SCHEDULED: 'Survey Scheduled',
  SURVEY_COMPLETED: 'Survey Done',
  PO_SIGNED: 'PO Signed',
  INVOICED: 'Invoiced',
  INC_IN_PROGRESS: 'I&C In Progress',
  PLANT_INSTALLED: 'Plant Installed',
  DOC_SUBMITTED: 'Docs Submitted',
  DOC_VERIFIED: 'Docs Verified',
  METER_SEALING: 'Meter Sealing',
  DCR_FILED: 'DCR Filed',
  INST_DETAIL_SUBMITTED: 'Inst. Detail Sub.',
  PCR_FILED: 'PCR Filed',
  SUBSIDY_REDEEMED: 'Subsidy Redeemed',
  CLOSED: 'Closed',
};

const stageColors: Record<string, string> = {
  LEAD_CAPTURED: '#64748b',
  PO_SIGNED: '#3b82f6',
  INVOICED: '#8b5cf6',
  INC_IN_PROGRESS: '#f59e0b',
  CLOSED: '#10b981',
};

function formatCurrency(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?dateRange=${dateRange}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)' }}>Failed to load dashboard data. Check database connection.</p>
      </div>
    );
  }

  const maxStageCount = Math.max(...(data.stageBreakdown?.map((s) => s.count) || [1]));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Dashboard Analytics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Time-based metrics, overdue analysis, and sales performance
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/admin/crm" className="btn btn-secondary btn-sm">Master Sheet</Link>
          <Link href="/admin/crm?timeStatus=overdue" className="btn btn-danger btn-sm">⚠️ Overdue Projects ({data.overdueProjectsCount || 0})</Link>
        </div>
      </div>

      {/* Time & Date Range Filter Bar */}
      <div className="glass-card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)' }}>Time Range Filter:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'quarter', label: 'This Quarter' },
            { id: 'year', label: 'This Year' },
          ].map((item) => (
            <button
              key={item.id}
              className={`btn btn-xs ${dateRange === item.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDateRange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Total Projects</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{data.totalProjects.toLocaleString()}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>Active database</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Total Sold Price</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{formatCurrency(data.totalRevenue)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Contract value</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Amount Collected</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{formatCurrency(data.totalCollected || (data.totalRevenue - data.totalBalance))}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>Received</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Remaining Balance</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--warning)', margin: 0 }}>{formatCurrency(data.totalBalance)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem' }}>Pending collection</p>
        </div>

        <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Overdue Projects</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>{data.overdueProjectsCount || 0}</p>
          <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.5rem' }}>Pending &gt;45 days</p>
        </div>

        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.5rem' }}>Completed / Subsidy</p>
          <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{data.completedCount || 0}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>Closed on-time</p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Stage Breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Project Pipeline Stages</h2>
            <Link href="/admin/crm" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>View Master Sheet →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {data.stageBreakdown?.map((s) => {
              const pct = Math.max((s.count / maxStageCount) * 100, 3);
              const color = stageColors[s.stage] || '#6366f1';
              return (
                <div key={s.stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ width: 140, fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {stageLabels[s.stage] || s.stage}
                  </span>
                  <div style={{ flex: 1, height: 24, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 8,
                      background: `linear-gradient(90deg, ${color}, ${color}88)`,
                      transition: 'width 0.8s ease',
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                    }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {s.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1.5rem' }}>Top Solar Brands</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {data.brandBreakdown?.slice(0, 8).map((b, i) => {
              const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
              return (
                <div key={b.brand} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: colors[i % colors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{b.brand}</span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)' }}>{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Links & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Master Sheet', desc: `All ${data.totalProjects.toLocaleString()} customer & installation records`, href: '/admin/crm', color: '#3b82f6' },
            { label: 'Audit & Version History', desc: 'Login audit logs & 1-click Undo/Revert', href: '/admin/audit-logs', color: '#10b981' },
            { label: 'Overdue Filter', desc: 'View all overdue pending projects', href: '/admin/crm?timeStatus=overdue', color: '#ef4444' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="glass-card" style={{ padding: '1.25rem', textDecoration: 'none', display: 'block' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.25rem' }}>{item.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1.25rem' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {data.recentActivity?.length > 0 ? (
              data.recentActivity.slice(0, 8).map((activity: any, i: number) => (
                <div key={activity.id || i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: activity.action === 'CREATE' ? '#10b981' : activity.action === 'STAGE_CHANGED' ? '#f59e0b' : activity.action === 'REVERT' ? '#ef4444' : '#3b82f6',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {new Date(activity.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {activity.employee?.name && (
                        <span style={{ fontSize: '0.625rem', color: 'var(--accent)', fontWeight: 600 }}>by {activity.employee.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No recent activity yet. Make edits in Master Sheet to see history here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
