'use client';

import { useState, useEffect } from 'react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees')
      .then((r) => r.json())
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading team...</p>
      </div>
    );
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const roleColors: Record<string, string> = {
    ADMIN: '#ef4444', MANAGER: '#8b5cf6', SALESPERSON: '#3b82f6',
    TECHNICIAN: '#f59e0b', OFFICE_STAFF: '#10b981',
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Team Management</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          {employees.length} team members • View schedules and workload
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {employees.map((emp) => {
          const color = roleColors[emp.role] || '#64748b';

          return (
            <div key={emp.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${color}22`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', fontWeight: 700,
                    }}>
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{emp.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{emp.email || 'No email'}</p>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    {emp._count?.assignedTasks || 0}
                  </span>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="badge" style={{ background: `${color}22`, color }}>{emp.role}</span>
                <span className={`badge ${emp.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {emp.schedule && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.75rem' }}>Weekly Schedule</p>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {days.map((day, i) => {
                      const value = emp.schedule[day];
                      const isWO = value?.toUpperCase() === 'WO';
                      return (
                        <div
                          key={day}
                          style={{
                            flex: 1, textAlign: 'center', padding: '0.375rem 0',
                            borderRadius: 6, fontSize: '0.625rem', fontWeight: 700,
                            background: isWO ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-2)',
                            color: isWO ? 'var(--danger)' : 'var(--text-muted)',
                            border: `1px solid ${isWO ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                          }}
                          title={isWO ? 'Week Off' : 'Working'}
                        >
                          {dayLabels[i]}
                          {isWO && <div style={{ fontSize: '0.5rem', marginTop: 1 }}>OFF</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
