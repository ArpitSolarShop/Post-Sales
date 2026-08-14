'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';

const stages = [
  'LEAD_CAPTURED', 'SURVEY_SCHEDULED', 'SURVEY_COMPLETED',
  'PO_SIGNED', 'INVOICED', 'INC_IN_PROGRESS',
  'PLANT_INSTALLED', 'DOC_SUBMITTED', 'DOC_VERIFIED', 'METER_SEALING',
  'DCR_FILED', 'INST_DETAIL_SUBMITTED', 'PCR_FILED', 'SUBSIDY_REDEEMED', 'CLOSED',
];

const stageLabels: Record<string, string> = {
  LEAD_CAPTURED: 'Lead Captured', SURVEY_SCHEDULED: 'Survey Sched.', SURVEY_COMPLETED: 'Survey Done',
  PO_SIGNED: 'PO Signed', INVOICED: 'Invoiced',
  INC_IN_PROGRESS: 'I&C Progress', PLANT_INSTALLED: 'Plant Installed',
  DOC_SUBMITTED: 'Docs Submitted', DOC_VERIFIED: 'Docs Verified',
  METER_SEALING: 'Meter Sealing', DCR_FILED: 'DCR Filed',
  INST_DETAIL_SUBMITTED: 'Inst. Detail', PCR_FILED: 'PCR Filed',
  SUBSIDY_REDEEMED: 'Subsidy Redeemed', CLOSED: 'Closed',
};

const stageColors: Record<string, string> = {
  LEAD_CAPTURED: '#64748b', SURVEY_SCHEDULED: '#94a3b8', SURVEY_COMPLETED: '#78716c',
  PO_SIGNED: '#3b82f6', INVOICED: '#8b5cf6',
  INC_IN_PROGRESS: '#f59e0b', PLANT_INSTALLED: '#06b6d4', DOC_SUBMITTED: '#a855f7',
  DOC_VERIFIED: '#22d3ee', METER_SEALING: '#ec4899', DCR_FILED: '#f97316',
  INST_DETAIL_SUBMITTED: '#84cc16', PCR_FILED: '#14b8a6', SUBSIDY_REDEEMED: '#eab308',
  CLOSED: '#10b981',
};

export default function PipelinePage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects?limit=2000')
      .then((r) => r.json())
      .then((json) => setProjects(json.data || []))
      .catch((err) => {
        console.error(err);
        showToast('Failed to load pipeline data', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAdvance = async (projectId: string, currentStage: string) => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) return;
    const nextStage = stages[currentIndex + 1];

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(projects.map((p) => (p.id === projectId ? updated : p)));
        showToast(`Project advanced to ${stageLabels[nextStage] || nextStage}`, 'success');
      } else {
        showToast('Failed to advance project stage', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    }
  };

  // Calculate total counts for summary
  const totalProjects = projects.length;
  const completedCount = projects.filter((p) => p.stage === 'CLOSED' || p.stage === 'SUBSIDY_REDEEMED').length;
  const inProgressCount = totalProjects - completedCount;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-muted)' }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Project Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            Click to advance projects through stages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', minWidth: 90, textAlign: 'center' }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>Total</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>{totalProjects}</p>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', minWidth: 90, textAlign: 'center' }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>Active</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', margin: 0 }}>{inProgressCount}</p>
          </div>
          <div className="stat-card" style={{ padding: '0.75rem 1.25rem', minWidth: 90, textAlign: 'center' }}>
            <p style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>Done</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>{completedCount}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {stages.map((stage) => {
          const stageProjects = projects.filter((p) => p.stage === stage);
          const color = stageColors[stage] || '#6366f1';

          return (
            <div key={stage} className="kanban-column">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${color}` }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  {stageLabels[stage]}
                </h3>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, background: `${color}22`, color, padding: '0.125rem 0.5rem', borderRadius: 6 }}>
                  {stageProjects.length}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stageProjects.slice(0, 20).map((project) => (
                  <div key={project.id} className="kanban-card">
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.375rem', lineHeight: 1.3 }}>
                      {project.customer?.name?.substring(0, 30)}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {project.capacity ? `${project.capacity} kW` : 'N/A'}
                      </span>
                      {project.balance && project.balance > 0 && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--danger)', fontWeight: 600 }}>
                          ₹{project.balance.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {stage !== 'CLOSED' && (
                      <button
                        onClick={() => handleAdvance(project.id, stage)}
                        style={{
                          marginTop: '0.5rem', width: '100%', padding: '0.375rem', border: `1px solid ${color}33`,
                          background: `${color}11`, color, borderRadius: 8, fontSize: '0.6875rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => { (e.target as HTMLElement).style.background = `${color}22`; }}
                        onMouseOut={(e) => { (e.target as HTMLElement).style.background = `${color}11`; }}
                      >
                        Advance →
                      </button>
                    )}
                  </div>
                ))}
                {stageProjects.length > 20 && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                    +{stageProjects.length - 20} more
                  </p>
                )}
                {stageProjects.length === 0 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0.5rem', fontStyle: 'italic' }}>
                    No projects
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
