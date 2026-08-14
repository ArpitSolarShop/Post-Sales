'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/Toast';

const stageLabels: Record<string, string> = {
  LEAD_CAPTURED: 'Lead', SURVEY_SCHEDULED: 'Survey Sched.', SURVEY_COMPLETED: 'Survey Done',
  PO_SIGNED: 'PO Signed', INVOICED: 'Invoiced', INC_IN_PROGRESS: 'I&C Progress',
  PLANT_INSTALLED: 'Installed', DOC_SUBMITTED: 'Docs Sub.', DOC_VERIFIED: 'Docs OK',
  METER_SEALING: 'Sealing', DCR_FILED: 'DCR', INST_DETAIL_SUBMITTED: 'Inst. Detail',
  PCR_FILED: 'PCR', SUBSIDY_REDEEMED: 'Subsidy', CLOSED: 'Closed',
};

const stageBadge: Record<string, string> = {
  LEAD_CAPTURED: 'badge-neutral', PO_SIGNED: 'badge-info', INVOICED: 'badge-accent',
  INC_IN_PROGRESS: 'badge-warning', CLOSED: 'badge-success', PLANT_INSTALLED: 'badge-info',
  SUBSIDY_REDEEMED: 'badge-success', DCR_FILED: 'badge-accent',
};

function formatCurrency(val: number | null) {
  if (val === null || val === undefined) return '—';
  return `₹${val.toLocaleString('en-IN')}`;
}

export default function CRMPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [poFilter, setPoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // View Mode: 'compact' vs 'excel' (all 28 columns)
  const [viewMode, setViewMode] = useState<'compact' | 'excel'>('compact');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeStatus, setTimeStatus] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(search && { search }),
        ...(stageFilter && { stage: stageFilter }),
        ...(divisionFilter && { division: divisionFilter }),
        ...(poFilter && { poStatus: poFilter }),
        ...(dateRange && { dateRange }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(timeStatus && { timeStatus }),
      });
      const res = await fetch(`/api/projects?${params}`);
      const json = await res.json();
      setProjects(json.data || []);
      setPagination(json.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, divisionFilter, poFilter, dateRange, startDate, endDate, timeStatus]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Read URL query params on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ts = urlParams.get('timeStatus');
      if (ts) setTimeStatus(ts);
    }
  }, []);

  // Debounced search input
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleExportCSV = () => {
    const headers = [
      'Name', 'Calling No', 'Mobile', 'CA No', 'Division', 'Capacity (kW)',
      'Source of Lead', 'Brand/Model', 'Referral', 'Location', 'Survey',
      'Amount', 'Balance', 'PO Signed', 'Sold By', 'Invoice Date', 'I&C Stage',
      'Plant Status', 'Net Meter Status', 'Doc Submitted', 'Document Status',
      'Meter Type/SL', 'Sealing/Indent', 'DCR', 'Inst Detail Sub',
      'PCR', 'Subsidy Redeem'
    ];

    const rows = projects.map((p) => [
      p.customer?.name || '',
      p.customer?.callingNo || '',
      p.customer?.mobile || '',
      p.customer?.caNumber || '',
      p.customer?.division || '',
      p.capacity || '',
      p.sourceOfLead || '',
      p.brandModel || '',
      p.referral || '',
      p.customer?.location || '',
      p.surveyStatus || '',
      p.amount || '',
      p.balance || '',
      p.poSigned || '',
      p.soldBy || '',
      p.invoiceDate ? new Date(p.invoiceDate).toLocaleDateString() : '',
      p.incStage || '',
      p.plantStatus || '',
      p.status || '',
      p.docSubmitted || '',
      p.documentStatus || '',
      p.meterTypeSl || '',
      p.sealingIndent || '',
      p.dcr || '',
      p.instDetailSub || '',
      p.pcr || '',
      p.subsidyRedeem || ''
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `master_sheet_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer record?')) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Record deleted successfully', 'success');
        setSelectedProject(null);
        fetchProjects();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          showToast('Only Admin/Manager can delete records', 'error');
        } else {
          showToast(data.error || 'Failed to delete project', 'error');
        }
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Master Sheet</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
            {pagination.total.toLocaleString()} customer & solar installation records (Excel Master Sheet 1:1)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            <button
              className={`btn btn-xs ${viewMode === 'compact' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 6, background: viewMode === 'compact' ? undefined : 'transparent' }}
              onClick={() => setViewMode('compact')}
            >
              Compact View
            </button>
            <button
              className={`btn btn-xs ${viewMode === 'excel' ? 'btn-primary' : ''}`}
              style={{ borderRadius: 6, background: viewMode === 'excel' ? undefined : 'transparent' }}
              onClick={() => setViewMode('excel')}
            >
              Full Excel View (28 Cols)
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add New Customer
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <input
            className="input"
            placeholder="Search name, mobile, CA, location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ fontSize: '0.8125rem' }}
          />
        </div>
        <select className="input" style={{ width: 'auto', minWidth: 120, fontSize: '0.8125rem' }} value={dateRange} onChange={(e) => { setDateRange(e.target.value); setStartDate(''); setEndDate(''); setPage(1); }}>
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>

        {/* Custom Start & End Date Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
          <input
            type="date"
            className="input"
            style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setDateRange(''); setPage(1); }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
          <input
            type="date"
            className="input"
            style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setDateRange(''); setPage(1); }}
          />
        </div>

        <select className="input" style={{ width: 'auto', minWidth: 140, fontSize: '0.8125rem' }} value={timeStatus} onChange={(e) => { setTimeStatus(e.target.value); setPage(1); }}>
          <option value="">All Time Statuses</option>
          <option value="overdue">⚠️ Overdue (&gt;45 days)</option>
          <option value="dueSoon">⏳ Due Soon (15-45d)</option>
          <option value="completed">✅ Completed / Redeemed</option>
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 130, fontSize: '0.8125rem' }} value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}>
          <option value="">All Pipeline Stages</option>
          {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 110, fontSize: '0.8125rem' }} value={divisionFilter} onChange={(e) => { setDivisionFilter(e.target.value); setPage(1); }}>
          <option value="">All Divisions</option>
          {['EDD-1','EDD-2','EDD-3','EUDD-1','EUDD-2','EUDD-3','EUDD-4','EUDD-5','EUDD-6','EUDD-7','EUDD-8','RDD-2'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="input" style={{ width: 'auto', minWidth: 110, fontSize: '0.8125rem' }} value={poFilter} onChange={(e) => { setPoFilter(e.target.value); setPage(1); }}>
          <option value="">All PO Statuses</option>
          <option value="signed">Signed</option>
          <option value="No">No</option>
          <option value="LMB2">LMB2</option>
        </select>
        {(search || stageFilter || divisionFilter || poFilter || dateRange || startDate || endDate || timeStatus) && (
          <button className="btn btn-xs btn-danger" onClick={() => { setSearchInput(''); setSearch(''); setStageFilter(''); setDivisionFilter(''); setPoFilter(''); setDateRange(''); setStartDate(''); setEndDate(''); setTimeStatus(''); setPage(1); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
          <table className="data-table">
            <thead>
              {viewMode === 'compact' ? (
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>CA No.</th>
                  <th>Division</th>
                  <th>Capacity</th>
                  <th>Brand/Model</th>
                  <th>Sold Price (Amount)</th>
                  <th>Remaining Balance</th>
                  <th>PO Status</th>
                  <th>Pipeline Stage</th>
                  <th>Action</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Name</th>
                  <th>Calling No</th>
                  <th>Mobile</th>
                  <th>CA No</th>
                  <th>Division</th>
                  <th>Capacity</th>
                  <th>Lead Source</th>
                  <th>Brand/Model</th>
                  <th>Referral</th>
                  <th>Location</th>
                  <th>Survey</th>
                  <th>Sold Price (Amount)</th>
                  <th>Remaining Balance</th>
                  <th>PO Signed</th>
                  <th>Sold By</th>
                  <th>Invoice Date</th>
                  <th>I&C Stage</th>
                  <th>Plant Status</th>
                  <th>Net Meter Stage</th>
                  <th>Doc Sub</th>
                  <th>Doc Status</th>
                  <th>Meter SL</th>
                  <th>Sealing/Indent</th>
                  <th>DCR</th>
                  <th>Inst Detail</th>
                  <th>PCR</th>
                  <th>Subsidy</th>
                  <th>Action</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={viewMode === 'compact' ? 12 : 28} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={viewMode === 'compact' ? 12 : 28} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No records found matching filters</td></tr>
              ) : (
                projects.map((p, idx) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedProject(p)}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{(page - 1) * 50 + idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--foreground)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.customer?.name}
                    </td>

                    {viewMode === 'compact' ? (
                      <>
                        <td>{p.customer?.mobile || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{p.customer?.caNumber || '—'}</td>
                        <td><span className="badge badge-neutral">{p.customer?.division || '—'}</span></td>
                        <td>{p.capacity ? `${p.capacity} kW` : '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.brandModel || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                        <td style={{ fontWeight: 600, color: p.balance && p.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{formatCurrency(p.balance)}</td>
                        <td>
                          {p.poSigned ? (
                            <span className={`badge ${p.poSigned.toLowerCase().includes('signed') ? 'badge-success' : p.poSigned.toLowerCase() === 'no' ? 'badge-danger' : 'badge-warning'}`}>
                              {p.poSigned}
                            </span>
                          ) : '—'}
                        </td>
                        <td><span className={`badge ${stageBadge[p.stage] || 'badge-neutral'}`}>{stageLabels[p.stage] || p.stage}</span></td>
                      </>
                    ) : (
                      <>
                        <td>{p.customer?.callingNo || '—'}</td>
                        <td>{p.customer?.mobile || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{p.customer?.caNumber || '—'}</td>
                        <td><span className="badge badge-neutral">{p.customer?.division || '—'}</span></td>
                        <td>{p.capacity ? `${p.capacity} kW` : '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.sourceOfLead || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.brandModel || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.referral || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.customer?.location || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.surveyStatus || '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                        <td style={{ fontWeight: 600, color: p.balance && p.balance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{formatCurrency(p.balance)}</td>
                        <td>
                          {p.poSigned ? (
                            <span className={`badge ${p.poSigned.toLowerCase().includes('signed') ? 'badge-success' : p.poSigned.toLowerCase() === 'no' ? 'badge-danger' : 'badge-warning'}`}>
                              {p.poSigned}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '0.75rem' }}>{p.soldBy || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.invoiceDate ? new Date(p.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.incStage || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.plantStatus || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.status || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.docSubmitted || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.documentStatus || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.meterTypeSl || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.sealingIndent || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.dcr || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.instDetailSub || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.pcr || '—'}</td>
                        <td style={{ fontSize: '0.75rem' }}>{p.subsidyRedeem || '—'}</td>
                      </>
                    )}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-xs btn-secondary" onClick={() => setSelectedProject(p)}>
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Page {page} of {pagination.totalPages} • {pagination.total} total
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary btn-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <button className="btn btn-secondary btn-xs" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && <AddCustomerModal onClose={() => setShowAddModal(false)} onAdded={() => { setShowAddModal(false); fetchProjects(); showToast('New customer record created', 'success'); }} />}

      {/* Edit / Detail Drawer Modal */}
      {selectedProject && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onSaved={() => { setSelectedProject(null); fetchProjects(); }}
          onDelete={() => handleDelete(selectedProject.id)}
        />
      )}
    </div>
  );
}

function AddCustomerModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { showToast('Customer Name is required', 'warning'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) onAdded();
      else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to create record', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.25rem' }}>Add New MasterSheet Record</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Customer Name *</label>
              <input className="input" value={form.name || ''} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Calling No</label>
              <input className="input" value={form.callingNo || ''} onChange={(e) => update('callingNo', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mobile No</label>
              <input className="input" value={form.mobile || ''} onChange={(e) => update('mobile', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CA Number</label>
              <input className="input" value={form.caNumber || ''} onChange={(e) => update('caNumber', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Division</label>
              <select className="input" value={form.division || ''} onChange={(e) => update('division', e.target.value)}>
                <option value="">Select...</option>
                {['EDD-1','EDD-2','EDD-3','EUDD-1','EUDD-2','EUDD-3','EUDD-4','EUDD-5','EUDD-6','EUDD-7','EUDD-8','RDD-2'].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Capacity (kW)</label>
              <input className="input" type="number" step="0.01" value={form.capacity || ''} onChange={(e) => update('capacity', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Source of Lead</label>
              <input className="input" value={form.sourceOfLead || ''} onChange={(e) => update('sourceOfLead', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Brand/Model</label>
              <input className="input" value={form.brandModel || ''} onChange={(e) => update('brandModel', e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Referral</label>
              <input className="input" value={form.referral || ''} onChange={(e) => update('referral', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Location</label>
              <input className="input" value={form.location || ''} onChange={(e) => update('location', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PO Signed</label>
              <select className="input" value={form.poSigned || ''} onChange={(e) => update('poSigned', e.target.value)}>
                <option value="">Select...</option>
                <option value="signed">signed</option>
                <option value="No">No</option>
                <option value="LMB2">LMB2</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Amount (₹)</label>
              <input className="input" type="number" value={form.amount || ''} onChange={(e) => update('amount', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Balance (₹)</label>
              <input className="input" type="number" value={form.balance || ''} onChange={(e) => update('balance', e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Pipeline Stage</label>
              <select className="input" value={form.stage || 'LEAD_CAPTURED'} onChange={(e) => update('stage', e.target.value)}>
                {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Create Customer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProjectModal({ project, onClose, onSaved, onDelete }: { project: any; onClose: () => void; onSaved: () => void; onDelete: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<any>({
    name: project.customer?.name || '',
    callingNo: project.customer?.callingNo || '',
    mobile: project.customer?.mobile || '',
    caNumber: project.customer?.caNumber || '',
    division: project.customer?.division || '',
    location: project.customer?.location || '',
    capacity: project.capacity || '',
    sourceOfLead: project.sourceOfLead || '',
    brandModel: project.brandModel || '',
    referral: project.referral || '',
    surveyStatus: project.surveyStatus || '',
    amount: project.amount || '',
    balance: project.balance || '',
    poSigned: project.poSigned || '',
    soldBy: project.soldBy || '',
    invoiceDate: project.invoiceDate ? new Date(project.invoiceDate).toISOString().slice(0, 10) : '',
    incStage: project.incStage || '',
    plantStatus: project.plantStatus || '',
    status: project.status || '',
    docSubmitted: project.docSubmitted || '',
    documentStatus: project.documentStatus || '',
    meterTypeSl: project.meterTypeSl || '',
    sealingIndent: project.sealingIndent || '',
    dcr: project.dcr || '',
    instDetailSub: project.instDetailSub || '',
    pcr: project.pcr || '',
    subsidyRedeem: project.subsidyRedeem || '',
    stage: project.stage || 'LEAD_CAPTURED',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Record updated successfully', 'success');
        onSaved();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to update record', 'error');
      }
    } catch (err) {
      showToast('Network error — please try again', 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              MasterSheet Record Details
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              CA Number: {project.customer?.caNumber || 'N/A'} • ID: {project.id.slice(0, 8)}
            </p>
          </div>
          <button className="btn btn-xs btn-danger" onClick={onDelete}>Delete Record</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer Profile Section */}
          <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', margin: '0 0 0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. Customer Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Customer Name</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Calling No</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.callingNo} onChange={(e) => update('callingNo', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mobile No</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.mobile} onChange={(e) => update('mobile', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>CA Number</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.caNumber} onChange={(e) => update('caNumber', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Division</label>
                <select className="input" style={{ fontSize: '0.8125rem' }} value={form.division} onChange={(e) => update('division', e.target.value)}>
                  <option value="">Select...</option>
                  {['EDD-1','EDD-2','EDD-3','EUDD-1','EUDD-2','EUDD-3','EUDD-4','EUDD-5','EUDD-6','EUDD-7','EUDD-8','RDD-2'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Location</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
            </div>
          </div>

          {/* System & Sales Section */}
          <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', margin: '0 0 0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              2. System Capacity & Commercials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Capacity (kW)</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} type="number" step="0.01" value={form.capacity} onChange={(e) => update('capacity', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Brand/Model</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.brandModel} onChange={(e) => update('brandModel', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Source of Lead</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.sourceOfLead} onChange={(e) => update('sourceOfLead', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Referral</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.referral} onChange={(e) => update('referral', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Sold Price / Amount (₹)</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Remaining Balance to Collect (₹)</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} type="number" value={form.balance} onChange={(e) => update('balance', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Sold By</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.soldBy} onChange={(e) => update('soldBy', e.target.value)} />
              </div>
            </div>

            {/* Collected amount summary callout */}
            {form.amount !== '' && form.balance !== '' && (
              <div style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Amount Collected So Far:</span>
                <span style={{ fontSize: '0.9375rem', color: '#34d399', fontWeight: 800 }}>
                  ₹{(parseFloat(form.amount || '0') - parseFloat(form.balance || '0')).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Installation & Net Metering Status */}
          <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', margin: '0 0 0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              3. Installation & Net Metering Workflow
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Pipeline Stage</label>
                <select className="input" style={{ fontSize: '0.8125rem' }} value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                  {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PO Signed</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.poSigned} onChange={(e) => update('poSigned', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Invoice Date</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} type="date" value={form.invoiceDate} onChange={(e) => update('invoiceDate', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>I&C Stage</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.incStage} onChange={(e) => update('incStage', e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Plant Status</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.plantStatus} onChange={(e) => update('plantStatus', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Net Meter Stage (Col S)</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.status} onChange={(e) => update('status', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Doc Submitted</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.docSubmitted} onChange={(e) => update('docSubmitted', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Document Status</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.documentStatus} onChange={(e) => update('documentStatus', e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Meter Type/SL</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.meterTypeSl} onChange={(e) => update('meterTypeSl', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Sealing/Indent</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.sealingIndent} onChange={(e) => update('sealingIndent', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>DCR</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.dcr} onChange={(e) => update('dcr', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Inst Detail Sub</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.instDetailSub} onChange={(e) => update('instDetailSub', e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>PCR</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.pcr} onChange={(e) => update('pcr', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Subsidy Redeem</label>
                <input className="input" style={{ fontSize: '0.8125rem' }} value={form.subsidyRedeem} onChange={(e) => update('subsidyRedeem', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
