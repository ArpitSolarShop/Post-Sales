'use client';

import { useState, useEffect } from 'react';

export default function NetMeterPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sourceFilter) params.set('source', sourceFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(`/api/net-meter?${params}`)
      .then((r) => r.json())
      .then((json) => { setFiles(json.data || []); setStats(json.stats || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sourceFilter, statusFilter, search]);

  const rilCount = files.filter((f) => f.source === 'RIL_NE').length;
  const rneCount = files.filter((f) => f.source === 'RNE').length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Net Meter Files</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Track RIL NE and RNE submissions and file status
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>RIL NE</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--info)', margin: 0 }}>{rilCount}</p>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>RNE</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)', margin: 0 }}>{rneCount}</p>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>Total</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{files.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search name, email, mobile..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: '1 1 250px', fontSize: '0.8125rem' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'RIL_NE', 'RNE'].map((s) => (
            <button key={s} className={`btn btn-xs ${sourceFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSourceFilter(s)}>
              {s === 'RIL_NE' ? 'RIL NE' : s === 'RNE' ? 'RNE' : 'All Sources'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['', 'PENDING', 'SENT', 'APPROVED'].map((s) => (
            <button key={s} className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>
              {s || 'All Status'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No records found</td></tr>
              ) : (
                files.map((f, idx) => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>{f.customerName}</td>
                    <td>{f.mobile || '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{f.email || '—'}</td>
                    <td><span className={`badge ${f.source === 'RIL_NE' ? 'badge-info' : 'badge-accent'}`}>{f.source === 'RIL_NE' ? 'RIL NE' : 'RNE'}</span></td>
                    <td>
                      <span className={`badge ${f.fileStatus === 'SENT' ? 'badge-success' : f.fileStatus === 'APPROVED' ? 'badge-info' : 'badge-warning'}`}>
                        {f.fileStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
