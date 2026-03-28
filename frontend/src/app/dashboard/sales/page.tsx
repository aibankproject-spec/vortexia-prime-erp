'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ChartCard, BarChart } from '@/components/charts/ChartWrapper';
import { Plus, Target, TrendingUp, ArrowUpRight, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-surface-100', qualified: 'bg-blue-50', proposal: 'bg-amber-50',
  negotiation: 'bg-purple-50', won: 'bg-emerald-50', lost: 'bg-red-50',
};

export default function SalesPage() {
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ title: '', client: '', stage: 'lead', expectedValue: '', probability: '10', source: 'cold_call', expectedCloseDate: '' });

  const fetchData = async () => {
    try {
      const [pRes, oRes] = await Promise.all([api.get('/sales/pipeline'), api.get('/sales/opportunities?limit=50')]);
      setPipeline(pRes.data.data);
      setOpportunities(oRes.data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/sales/opportunities', {
        ...createForm,
        expectedValue: parseFloat(createForm.expectedValue) || 0,
        probability: parseInt(createForm.probability) || 10,
        expectedCloseDate: createForm.expectedCloseDate || undefined,
      });
      toast.success('Opportunity created');
      setShowCreateModal(false);
      setCreateForm({ title: '', client: '', stage: 'lead', expectedValue: '', probability: '10', source: 'cold_call', expectedCloseDate: '' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleStageChange = async (oppId: string, newStage: string) => {
    try {
      const body: any = { stage: newStage };
      if (newStage === 'won') body.probability = 100;
      if (newStage === 'lost') {
        body.probability = 0;
        body.lossReason = 'other';
      }
      await api.put(`/sales/opportunities/${oppId}`, body);
      toast.success(`Moved to ${newStage}`);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const stageOrder = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  const sortedPipeline = stageOrder.map(stage => pipeline.find(p => p._id === stage) || { _id: stage, count: 0, totalValue: 0, weightedValue: 0 });
  const totalPipelineValue = pipeline.filter(p => !['won', 'lost'].includes(p._id)).reduce((s, p) => s + p.totalValue, 0);
  const wonValue = pipeline.find(p => p._id === 'won')?.totalValue || 0;
  const totalDeals = pipeline.reduce((s, p) => s + p.count, 0);
  const wonDeals = pipeline.find(p => p._id === 'won')?.count || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Sales Pipeline</h1>
          <p className="text-sm text-surface-500 mt-1">Track deals and opportunities</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={async () => { const { data } = await api.get('/clients?limit=100'); setClients(data.data); setShowCreateModal(true); }}>New Opportunity</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <StatCard title="Pipeline Value" value={formatCurrency(totalPipelineValue)} icon={<DollarSign className="w-5 h-5" />} color="blue" />
        <StatCard title="Won Deals" value={formatCurrency(wonValue)} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatCard title="Active Deals" value={String(pipeline.filter(p => !['won', 'lost'].includes(p._id)).reduce((s, p) => s + p.count, 0))} icon={<Target className="w-5 h-5" />} color="purple" />
        <StatCard title="Win Rate" value={`${totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0}%`} icon={<ArrowUpRight className="w-5 h-5" />} color="teal" />
      </div>

      {/* Pipeline Kanban */}
      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4">Pipeline Stages</h3>
        <div className="grid grid-cols-6 gap-4">
          {sortedPipeline.map((stage) => (
            <div key={stage._id} className={cn('rounded-xl p-4', STAGE_COLORS[stage._id] || 'bg-surface-50')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-surface-600">{stage._id}</span>
                <span className="text-xs font-bold bg-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm">{stage.count}</span>
              </div>
              <p className="text-lg font-bold text-surface-900">{formatCurrency(stage.totalValue)}</p>
              <p className="text-xs text-surface-500 mt-1">Weighted: {formatCurrency(stage.weightedValue)}</p>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {opportunities.filter((o: any) => o.stage === stage._id).slice(0, 5).map((opp: any) => (
                  <div key={opp._id} className="bg-white rounded-lg p-3 shadow-sm border border-surface-100 text-xs">
                    <p className="font-semibold text-surface-900 truncate">{opp.title}</p>
                    <p className="text-surface-500 mt-0.5">{opp.client?.companyName}</p>
                    <p className="font-semibold text-brand-600 mt-1">{formatCurrency(opp.expectedValue)}</p>
                    {!['won', 'lost'].includes(opp.stage) && (
                      <div className="flex gap-1 mt-2">
                        {stageOrder.indexOf(opp.stage) < 4 && (
                          <button onClick={() => handleStageChange(opp._id, stageOrder[stageOrder.indexOf(opp.stage) + 1])} className="px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded text-[10px] font-medium hover:bg-brand-100">Advance</button>
                        )}
                        <button onClick={() => handleStageChange(opp._id, 'won')} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium hover:bg-emerald-100">Won</button>
                        <button onClick={() => handleStageChange(opp._id, 'lost')} className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium hover:bg-red-100">Lost</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChartCard title="Pipeline by Stage" subtitle="Value distribution across stages">
        <BarChart data={{
          labels: sortedPipeline.filter(s => !['won', 'lost'].includes(s._id)).map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)),
          values: sortedPipeline.filter(s => !['won', 'lost'].includes(s._id)).map(s => s.totalValue),
        }} />
      </ChartCard>

      {/* Create Opportunity Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Opportunity" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Title" required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="e.g., SABIC Valve Replacement Project" /></div>
          <Select label="Client" required options={clients.map((c: any) => ({ value: c._id, label: c.companyName }))} value={createForm.client} onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })} placeholder="Select client" />
          <Select label="Stage" options={stageOrder.filter(s => s !== 'lost').map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} value={createForm.stage} onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })} />
          <Input label="Expected Value (QAR)" type="number" value={createForm.expectedValue} onChange={(e) => setCreateForm({ ...createForm, expectedValue: e.target.value })} placeholder="0.00" />
          <Input label="Probability (%)" type="number" min="0" max="100" value={createForm.probability} onChange={(e) => setCreateForm({ ...createForm, probability: e.target.value })} />
          <Select label="Source" options={['website', 'referral', 'trade_show', 'cold_call', 'email', 'existing_client', 'other'].map(s => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))} value={createForm.source} onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })} />
          <Input label="Expected Close Date" type="date" value={createForm.expectedCloseDate} onChange={(e) => setCreateForm({ ...createForm, expectedCloseDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-100">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Opportunity</Button>
        </div>
      </Modal>
    </div>
  );
}
