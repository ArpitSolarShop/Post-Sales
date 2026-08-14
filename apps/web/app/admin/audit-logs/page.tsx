'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';

export default function AuditLogsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'auth' | 'data'>('data');
  const [authLogs, setAuthLogs] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs?type=all&limit=100');
      const data = await res.json();
      setAuthLogs(data.authLogs || []);
      setActivityLogs(data.activityLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleRevert = async (log: any) => {
    if (!log.projectId) { showToast('No project associated with this edit', 'warning'); return; }
    if (!confirm(`Are you sure you want to revert "${log.description}"?`)) return;

    setRevertingId(log.id);
    try {
      const res = await fetch(`/api/projects/${log.projectId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: log.id }),
      });
      if (res.ok) {
        showToast('Successfully reverted to previous version!', 'success');
        fetchLogs();
      } else {
        showToast('Failed to revert change', 'error');
      }
    } catch (err) {
      showToast('Error reverting version', 'error');
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>System Audit & Version History</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          Track user logins, field-level change history, and revert past edits
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn btn-sm ${activeTab === 'data' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('data')}
        >
          Data Changes & Version History ({activityLogs.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'auth' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('auth')}
        >
          User Logins & Security Audit ({authLogs.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'data' ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Customer / CA No</th>
                  <th>Action</th>
                  <th>Field</th>
                  <th>Previous Value</th>
                  <th>New Value</th>
                  <th>User</th>
                  <th style={{ textAlign: 'right' }}>Undo / Revert</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading version logs...</td></tr>
                ) : activityLogs.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No data change logs yet. Make an edit in Master Sheet to see version history.</td></tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        {log.project?.customer?.name || 'System'}
                        {log.project?.customer?.caNumber && (
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            CA: {log.project.customer.caNumber}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${log.action === 'REVERT' ? 'badge-warning' : log.action === 'STAGE_CHANGED' ? 'badge-accent' : 'badge-info'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--accent)' }}>
                        {log.fieldName || 'Multiple'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--danger)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.oldValue || '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--success)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.newValue || '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {log.employee?.name || 'Admin'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {log.previousState && log.action !== 'REVERT' ? (
                          <button
                            className="btn btn-xs btn-secondary"
                            disabled={revertingId === log.id}
                            onClick={() => handleRevert(log)}
                          >
                            {revertingId === log.id ? 'Reverting...' : '↩ Revert'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Email</th>
                  <th>User Name</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading login audit logs...</td></tr>
                ) : authLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No login logs recorded yet. Log in to generate audit logs.</td></tr>
                ) : (
                  authLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>{log.userEmail}</td>
                      <td>{log.userName || '—'}</td>
                      <td>
                        {log.role ? <span className="badge badge-info">{log.role}</span> : '—'}
                      </td>
                      <td>
                        <span className={`badge ${log.action === 'LOGIN_SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.details || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
