'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';

export default function DiscomPage() {
  const { showToast } = useToast();
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/discom?${params}`);
      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, [statusFilter]);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/discom/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' }),
      });
      if (res.ok) {
        setIssues(issues.map((i) => i.id === id ? { ...i, status: 'CLOSED', resolvedAt: new Date().toISOString() } : i));
        showToast('Issue resolved successfully', 'success');
      } else {
        showToast('Failed to resolve issue', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    }
  };

  const openCount = issues.filter((i) => i.status !== 'CLOSED').length;
  const closedCount = issues.filter((i) => i.status === 'CLOSED').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>DISCOM Issues</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Track utility and meter issues reported by customers
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>+ New Issue</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>Open</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>{openCount}</p>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>Closed</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{closedCount}</p>
        </div>
        <div className="stat-card" style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.375rem' }}>Total</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{issues.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        {['', 'OPEN', 'CLOSED'].map((s) => (
          <button
            key={s}
            className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>CA No.</th>
                <th>Division</th>
                <th>Issue</th>
                <th>Remark</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No issues found</td></tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue.id}>
                    <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{issue.date ? new Date(issue.date).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>{issue.customerName || '—'}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{issue.caNumber || '—'}</td>
                    <td>{issue.division || '—'}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.issueDesc || '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{issue.remark || '—'}</td>
                    <td>
                      <span className={`badge ${issue.status === 'CLOSED' ? 'badge-success' : 'badge-danger'}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {issue.status !== 'CLOSED' && (
                        <button className="btn btn-xs btn-secondary" onClick={() => handleResolve(issue.id)}>
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddIssueModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchIssues(); }} />}
    </div>
  );
}

function AddIssueModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName) { showToast('Customer name is required', 'warning'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/discom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('DISCOM issue reported successfully', 'success');
        onAdded();
      } else {
        showToast('Failed to create issue', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (f: string, v: string) => setForm({ ...form, [f]: v });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem' }}>Report New DISCOM Issue</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>Customer Name</label>
              <input className="input" value={form.customerName || ''} onChange={(e) => update('customerName', e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>CA Number</label>
              <input className="input" value={form.caNumber || ''} onChange={(e) => update('caNumber', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>Mobile</label>
              <input className="input" value={form.mobile || ''} onChange={(e) => update('mobile', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.375rem' }}>Issue Description</label>
              <textarea className="input" rows={3} value={form.issueDesc || ''} onChange={(e) => update('issueDesc', e.target.value)} style={{ resize: 'vertical' }} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Submit Issue'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
