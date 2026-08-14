'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/Toast';
import { useSession } from 'next-auth/react';

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  SALESPERSON: 'Salesperson',
  TECHNICIAN: 'Technician',
  OFFICE_STAFF: 'Office Staff',
};

const roleColors: Record<string, string> = {
  ADMIN: '#ef4444',
  MANAGER: '#8b5cf6',
  SALESPERSON: '#3b82f6',
  TECHNICIAN: '#f59e0b',
  OFFICE_STAFF: '#10b981',
};

export default function UsersPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        setUsers(await res.json());
      } else {
        showToast('Failed to fetch user list', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error loading users', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user's active/paused status
  const handleToggleStatus = async (userItem: any) => {
    if (userItem.id === currentUser?.id) {
      showToast('You cannot deactivate your own account', 'warning');
      return;
    }

    const nextStatus = !userItem.isActive;
    const actionText = nextStatus ? 'activate' : 'pause';
    if (!confirm(`Are you sure you want to ${actionText} ${userItem.name}'s account?`)) return;

    try {
      const res = await fetch(`/api/employees/${userItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });

      if (res.ok) {
        showToast(`${userItem.name} has been ${nextStatus ? 'activated' : 'paused'}`, 'success');
        fetchUsers();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.error || 'Failed to update user status', 'error');
      }
    } catch (err) {
      showToast('Error sending request', 'error');
    }
  };

  // Delete user account
  const handleDeleteUser = async (userItem: any) => {
    if (userItem.id === currentUser?.id) {
      showToast('You cannot delete your own account', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${userItem.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/employees/${userItem.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(`User ${userItem.name} has been deleted`, 'success');
        fetchUsers();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.error || 'Failed to delete user', 'error');
      }
    } catch (err) {
      showToast('Error deleting user', 'error');
    }
  };

  // Filter users based on search string and role
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Team & User Directory</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Add, edit, pause, and delete team members and adjust their system roles
          </p>
        </div>
        <div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Team Member
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            className="input"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: 160, fontSize: '0.8125rem' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All System Roles</option>
          {Object.entries(roleLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {(search || roleFilter) && (
          <button className="btn btn-xs btn-danger" onClick={() => { setSearch(''); setRoleFilter(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 45 }}>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Tasks</th>
                <th>Created At</th>
                <th style={{ width: 180, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading team directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No team members found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const color = roleColors[u.role] || '#64748b';
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {u.name}
                          {isSelf && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem' }}>
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{u.email || '—'}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span className="badge" style={{ background: `${color}22`, color }}>
                          {roleLabels[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td>{u._count?.assignedTasks || 0}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setSelectedUser(u)}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn btn-xs ${u.isActive ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            title={u.isActive ? 'Pause login access' : 'Activate login access'}
                          >
                            {u.isActive ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isSelf}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <EditUserModal
          userItem={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={() => {
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'TECHNICIAN',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Name and email are required fields', 'warning');
      return;
    }
    if (!form.password || form.password.length < 6) {
      showToast('Password must be at least 6 characters long', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showToast('New team member created successfully', 'success');
        onAdded();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to create team member', 'error');
      }
    } catch (err) {
      showToast('Network error — please check connection', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, val: any) => setForm({ ...form, [field]: val });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Add New Team Member</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
              <input
                className="input"
                placeholder="e.g. Arpit Sharma"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
              <input
                className="input"
                type="email"
                placeholder="e.g. arpit@arpitsolar.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Password * (Min 6 characters)</label>
              <input
                className="input"
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
              <input
                className="input"
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>System Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
              >
                {Object.entries(roleLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="isActiveAdd"
                checked={form.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="isActiveAdd" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>
                Enable account access immediately (Active status)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ userItem, onClose, onSaved }: { userItem: any; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const [form, setForm] = useState({
    name: userItem.name || '',
    email: userItem.email || '',
    phone: userItem.phone || '',
    password: '', // blank by default unless changing
    role: userItem.role || 'TECHNICIAN',
    isActive: userItem.isActive !== undefined ? userItem.isActive : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      showToast('Name and email are required fields', 'warning');
      return;
    }

    const payload: any = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      isActive: form.isActive,
    };

    if (form.password) {
      if (form.password.length < 6) {
        showToast('New password must be at least 6 characters long', 'warning');
        return;
      }
      payload.password = form.password;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${userItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('User updated successfully', 'success');
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      showToast('Network error — please check connection', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, val: any) => setForm({ ...form, [field]: val });
  const isSelf = userItem.id === currentUser?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Edit Team Member</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>New Password (leave blank to keep unchanged)</label>
              <input
                className="input"
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>System Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                disabled={isSelf}
                title={isSelf ? 'You cannot change your own role' : undefined}
              >
                {Object.entries(roleLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="isActiveEdit"
                checked={form.isActive}
                onChange={(e) => update('isActive', e.target.checked)}
                disabled={isSelf}
                style={{ width: 16, height: 16, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                title={isSelf ? 'You cannot deactivate your own account' : undefined}
              />
              <label htmlFor="isActiveEdit" style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelf ? 'var(--text-muted)' : 'var(--foreground)', cursor: isSelf ? 'not-allowed' : 'pointer' }}>
                Account access enabled (Active status)
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
