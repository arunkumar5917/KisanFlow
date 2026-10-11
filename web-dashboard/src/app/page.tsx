'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin, Users, Clock, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Loader2, RefreshCw, BarChart3, Map, Zap,
  ChevronRight, ChevronLeft, Play, Pause, Settings,
  Bell, Menu, X, Sun, Moon, Download, Upload,
} from 'lucide-react';

interface Centre {
  id: string;
  code: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  capacityPerSlot: number;
  activeCounters: number;
  status: 'NORMAL' | 'MODERATE' | 'HEAVY' | 'SEVERE' | 'INACTIVE';
  currentQueue: number;
  estimatedWait: number;
  utilization: number;
}

interface QueueMetrics {
  centreId: string;
  centreName: string;
  nowServing: number;
  totalWaiting: number;
  activeCounters: number;
  avgProcessingMin: number;
  estimatedWaitMin: number;
  status: Centre['status'];
}

interface CongestionPrediction {
  centreId: string;
  centreName: string;
  date: string;
  expectedArrivals: number;
  slotCapacity: number;
  overloadRisk: boolean;
  riskScore: number;
  recommendation: string;
  suggestedTransferCentre?: string;
  suggestedTransferCentreName?: string;
  waitTimeSavingsMin?: number;
  reasoningChain: string[];
}

interface AnalyticsSummary {
  totalCentres: number;
  totalBookingsToday: number;
  totalProcuredQuintals: number;
  avgWaitTimeMin: number;
  avgTurnaroundTimeMin: number;
  noShowRate: number;
  rejectionRate: number;
  centreUtilization: Record<string, number>;
}

const MOCK_CENTRES: Centre[] = [
  { id: 'centre-001', code: 'KRN001', name: 'Karnal Mandi', district: 'Karnal', state: 'Haryana', latitude: 29.6857, longitude: 76.9905, capacityPerSlot: 25, activeCounters: 4, status: 'NORMAL', currentQueue: 8, estimatedWait: 15, utilization: 65 },
  { id: 'centre-002', code: 'PNP001', name: 'Panipat Centre', district: 'Panipat', state: 'Haryana', latitude: 29.3909, longitude: 76.9635, capacityPerSlot: 20, activeCounters: 3, status: 'MODERATE', currentQueue: 18, estimatedWait: 35, utilization: 85 },
  { id: 'centre-003', code: 'KKR001', name: 'Kurukshetra Depot', district: 'Kurukshetra', state: 'Haryana', latitude: 29.9695, longitude: 76.8783, capacityPerSlot: 30, activeCounters: 5, status: 'NORMAL', currentQueue: 12, estimatedWait: 20, utilization: 55 },
  { id: 'centre-004', code: 'AMB001', name: 'Ambala Hub', district: 'Ambala', state: 'Haryana', latitude: 30.3752, longitude: 76.7821, capacityPerSlot: 20, activeCounters: 3, status: 'HEAVY', currentQueue: 28, estimatedWait: 55, utilization: 95 },
];

const STATUS_COLORS: Record<Centre['status'], string> = {
  NORMAL: 'var(--color-normal)',
  MODERATE: 'var(--color-moderate)',
  HEAVY: 'var(--color-heavy)',
  SEVERE: 'var(--color-severe)',
  INACTIVE: 'var(--color-inactive)',
};

const STATUS_LABELS: Record<Centre['status'], string> = {
  NORMAL: 'Normal',
  MODERATE: 'Moderate',
  HEAVY: 'Heavy',
  SEVERE: 'Severe Congestion',
  INACTIVE: 'Inactive',
};

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'map' | 'queue' | 'capacity' | 'ai' | 'analytics' | 'demo'>('map');
  const [centres, setCentres] = useState<Centre[]>(MOCK_CENTRES);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics[]>([]);
  const [congestionPredictions, setCongestionPredictions] = useState<CongestionPrediction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [demoRunning, setDemoRunning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 500));
      
      setQueueMetrics(MOCK_CENTRES.map(c => ({
        centreId: c.id,
        centreName: c.name,
        nowServing: Math.floor(Math.random() * 5) + 1,
        totalWaiting: c.currentQueue,
        activeCounters: c.activeCounters,
        avgProcessingMin: 8,
        estimatedWaitMin: c.estimatedWait,
        status: c.status,
      })));

      setCongestionPredictions([
        {
          centreId: 'centre-004',
          centreName: 'Ambala Hub',
          date: new Date().toISOString().split('T')[0],
          expectedArrivals: 42,
          slotCapacity: 20,
          overloadRisk: true,
          riskScore: 85,
          recommendation: 'Divert 22 farmers to Karnal Mandi (12km away) - saves 35 min avg wait',
          suggestedTransferCentre: 'centre-001',
          suggestedTransferCentreName: 'Karnal Mandi',
          waitTimeSavingsMin: 35,
          reasoningChain: [
            'Input Parameters: Current registrations (42), slot capacity (20), active counters (3)',
            'Processing: Capacity utilization = 42/20 = 210% (threshold: 115%)',
            'Output: Overload risk = YES, Risk score = 85',
            'Recommendation: Redistribute to Karnal Mandi (utilization 65%, distance 12km)',
            'Disclaimer: Simulated synthetic data for demonstration',
          ],
        },
        {
          centreId: 'centre-002',
          centreName: 'Panipat Centre',
          date: new Date().toISOString().split('T')[0],
          expectedArrivals: 28,
          slotCapacity: 20,
          overloadRisk: true,
          riskScore: 65,
          recommendation: 'Monitor closely. Consider opening additional counter.',
          reasoningChain: [
            'Input Parameters: Current registrations (28), slot capacity (20), active counters (3)',
            'Processing: Capacity utilization = 28/20 = 140% (threshold: 115%)',
            'Output: Overload risk = YES, Risk score = 65',
            'Recommendation: Open 4th counter or redistribute 8 farmers',
            'Disclaimer: Simulated synthetic data for demonstration',
          ],
        },
      ]);

      setAnalytics({
        totalCentres: 4,
        totalBookingsToday: 156,
        totalProcuredQuintals: 4235.5,
        avgWaitTimeMin: 28.5,
        avgTurnaroundTimeMin: 65.2,
        noShowRate: 8.2,
        rejectionRate: 3.1,
        centreUtilization: {
          'Karnal Mandi': 65,
          'Panipat Centre': 85,
          'Kurukshetra Depot': 55,
          'Ambala Hub': 95,
        },
      });

      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startDemo = () => {
    setDemoRunning(true);
    setDemoStep(0);
    const steps = [
      'Farmer registers and declares 45 quintals wheat',
      'AI recommends Karnal Mandi (5.2km, 15min wait)',
      'Slot booked: 10:00-12:00, Token TK-20260117-084 generated',
      'Farmer arrives, officer checks in via QR scan',
      'Quality check: 11.8% moisture, Grade A accepted',
      'Weighment: Gross 5200kg, Tare 700kg, Net 45.00 quintals',
      'Procurement completed, receipt RCP-20260117-ABC123',
      'Payment initiated: ₹1,02,375 @ MSP ₹2,275/quintal',
      'Payment processed → Credited to bank account',
      'AI detects Ambala congestion, recommends redistribution',
    ];
    let current = 0;
    const timer = setInterval(() => {
      if (current < steps.length) {
        setDemoStep(current);
        current++;
      } else {
        clearInterval(timer);
        setDemoRunning(false);
      }
    }, 1800);
  };

  const getStatusBadge = (status: Centre['status']) => (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <span className={`status-indicator status-${status.toLowerCase()}`} style={{ marginRight: 6 }} />
      {STATUS_LABELS[status]}
    </span>
  );

  const ViewTabs = () => (
    <div className="flex gap-sm overflow-x-auto pb-sm" role="tablist">
      {[
        { id: 'map', label: 'Centre Map', icon: MapPin },
        { id: 'queue', label: 'Live Queue', icon: Users },
        { id: 'capacity', label: 'Capacity', icon: TrendingUp },
        { id: 'ai', label: 'AI Predictions', icon: Zap },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'demo', label: '3-Min Demo', icon: Play },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeView === id}
          onClick={() => setActiveView(id as typeof activeView)}
          className={`btn ${activeView === id ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap flex items-center gap-sm`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );

  const CentreMapView = () => (
    <div className="grid grid-auto">
      {centres.map((centre) => (
        <div
          key={centre.id}
          className="card"
          onClick={() => setSelectedCentre(centre)}
          style={{ cursor: 'pointer' }}
        >
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-bold text-lg">{centre.name}</h3>
              <p className="text-sm text-muted">{centre.code} • {centre.district}, {centre.state}</p>
            </div>
            {getStatusBadge(centre.status)}
          </div>
          
          <div className="grid grid-2 gap-md mb-md">
            <div>
              <p className="text-sm text-muted">Queue Length</p>
              <p className="font-bold text-2xl">{centre.currentQueue}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Est. Wait</p>
              <p className="font-bold text-2xl text-accent">{centre.estimatedWait} min</p>
            </div>
            <div>
              <p className="text-sm text-muted">Active Counters</p>
              <p className="font-bold text-2xl">{centre.activeCounters}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Utilization</p>
              <p className="font-bold text-2xl">{centre.utilization}%</p>
            </div>
          </div>

          <div className="flex gap-sm pt-md border-t border-[var(--color-border-primary)]">
            <button className="btn btn-secondary flex-1 text-sm" onClick={(e) => { e.stopPropagation(); setSelectedCentre(centre); }}>
              View Details
            </button>
            <button className="btn btn-primary flex-1 text-sm" onClick={(e) => { e.stopPropagation(); }}>
              <Zap size={14} /> AI Insight
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const QueueMonitoringView = () => (
    <div className="grid grid-auto">
      {queueMetrics.map((q) => (
        <div key={q.centreId} className="card">
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-bold text-lg">{q.centreName}</h3>
              <p className="text-sm text-muted">Now Serving: Token #{q.nowServing}</p>
            </div>
            {getStatusBadge(q.status)}
          </div>

          <div className="grid grid-3 gap-md mb-md">
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Waiting</p>
              <p className="font-bold text-2xl">{q.totalWaiting}</p>
            </div>
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Counters</p>
              <p className="font-bold text-2xl">{q.activeCounters}</p>
            </div>
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Avg Processing</p>
              <p className="font-bold text-2xl">{q.avgProcessingMin} min</p>
            </div>
          </div>

          <div className="flex items-center gap-md">
            <div className="flex-1 h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-accent-primary)] transition-all duration-500"
                style={{ width: `${Math.min(100, (q.totalWaiting / (q.activeCounters * 10)) * 100)}%` }}
              />
            </div>
            <span className="font-mono font-bold text-accent">{q.estimatedWaitMin} min</span>
          </div>
        </div>
      ))}
    </div>
  );

  const CapacityMonitoringView = () => (
    <div className="grid grid-auto">
      {centres.map((centre) => (
        <div key={centre.id} className="card">
          <div className="flex justify-between items-start mb-md">
            <h3 className="font-bold text-lg">{centre.name}</h3>
            {getStatusBadge(centre.status)}
          </div>
          
          <div className="mb-md">
            <div className="flex justify-between text-sm mb-sm">
              <span>Utilization</span>
              <span className="font-bold">{centre.utilization}%</span>
            </div>
            <div className="h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${centre.utilization}%`,
                  background: centre.utilization > 90 ? 'var(--color-danger)' : 
                             centre.utilization > 75 ? 'var(--color-warning)' : 'var(--color-success)'
                }}
              />
            </div>
          </div>

          <div className="grid grid-2 gap-sm text-sm">
            <div><span className="text-muted">Slot Capacity:</span> <span className="font-semibold">{centre.capacityPerSlot}</span></div>
            <div><span className="text-muted">Active Counters:</span> <span className="font-semibold">{centre.activeCounters}</span></div>
            <div><span className="text-muted">Current Queue:</span> <span className="font-semibold">{centre.currentQueue}</span></div>
            <div><span className="text-muted">Est. Wait:</span> <span className="font-semibold text-accent">{centre.estimatedWait} min</span></div>
          </div>

          {centre.utilization > 85 && (
            <div className="mt-md p-sm bg-[var(--color-warning-bg)] border border-[var(--color-warning)] rounded-lg text-sm text-[var(--color-warning)]">
              <AlertTriangle size={14} className="inline-block mr-sm" />
              <strong>High Utilization Alert:</strong> Consider opening additional counters or redistributing farmers.
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const AIPredictionsView = () => (
    <div className="grid grid-auto">
      {congestionPredictions.map((pred, idx) => (
        <div key={pred.centreId} className="card">
          <div className="flex justify-between items-start mb-md">
            <div>
              <h3 className="font-bold text-lg">{pred.centreName}</h3>
              <p className="text-sm text-muted">Date: {new Date(pred.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <span className={`badge ${pred.overloadRisk ? 'badge-severe' : 'badge-normal'}`}>
              {pred.overloadRisk ? 'OVERLOAD RISK' : 'Normal'}
            </span>
          </div>

          <div className="grid grid-3 gap-md mb-md">
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Expected Arrivals</p>
              <p className="font-bold text-2xl text-[var(--color-danger)]">{pred.expectedArrivals}</p>
            </div>
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Slot Capacity</p>
              <p className="font-bold text-2xl">{pred.slotCapacity}</p>
            </div>
            <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
              <p className="text-sm text-muted">Risk Score</p>
              <p className="font-bold text-2xl text-[var(--color-danger)]">{pred.riskScore}/100</p>
            </div>
          </div>

          <div className="mb-md p-sm bg-[var(--color-info-bg)] border border-[var(--color-info)] rounded-lg">
            <p className="font-semibold text-[var(--color-info)] mb-sm">Recommendation:</p>
            <p className="text-sm">{pred.recommendation}</p>
            {pred.suggestedTransferCentreName && (
              <p className="text-sm mt-sm text-[var(--color-accent-primary)]">
                → Transfer to: {pred.suggestedTransferCentreName} (saves ~{pred.waitTimeSavingsMin} min)
              </p>
            )}
          </div>

          <details className="mt-md">
            <summary className="cursor-pointer text-sm text-accent hover:underline flex items-center gap-sm">
              <ChevronRight size={14} />
              View Reasoning Chain
            </summary>
            <div className="mt-md p-sm bg-[var(--color-bg-secondary)] rounded-lg font-mono text-xs space-y-sm">
              {pred.reasoningChain.map((step, i) => (
                <div key={i} className="flex gap-sm">
                  <span className="text-muted font-bold">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );

  const AnalyticsView = () => {
    if (!analytics) return <div className="animate-pulse">Loading...</div>;

    return (
      <div className="grid grid-auto">
        <div className="grid grid-4 gap-md">
          {[
            { label: 'Total Centres', value: analytics.totalCentres, icon: MapPin, color: 'var(--color-accent-primary)' },
            { label: 'Bookings Today', value: analytics.totalBookingsToday, icon: Users, color: 'var(--color-success)' },
            { label: 'Procured (Qtls)', value: analytics.totalProcuredQuintals.toLocaleString(), icon: TrendingUp, color: 'var(--color-warning)' },
            { label: 'Avg Wait Time', value: `${analytics.avgWaitTimeMin} min`, icon: Clock, color: 'var(--color-info)' },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-sm" style={{ background: stat.color + '20' }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <p className="font-bold text-2xl font-mono">{stat.value}</p>
              <p className="text-sm text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-md">Centre Utilization</h3>
          <div className="space-y-sm">
            {Object.entries(analytics.centreUtilization).map(([name, util]) => (
              <div key={name} className="flex items-center gap-md">
                <span className="w-48 text-sm">{name}</span>
                <div className="flex-1 h-3 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${util}%`,
                      background: util > 90 ? 'var(--color-danger)' : 
                                 util > 75 ? 'var(--color-warning)' : 'var(--color-success)'
                    }}
                  />
                </div>
                <span className="font-mono font-bold w-16 text-right">{util}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-2 gap-md">
          <div className="card">
            <h3 className="font-bold text-lg mb-md">No-Show Rate</h3>
            <p className="font-bold text-3xl text-[var(--color-warning)]">{analytics.noShowRate}%</p>
            <p className="text-sm text-muted">Target: < 5%</p>
          </div>
          <div className="card">
            <h3 className="font-bold text-lg mb-md">Rejection Rate</h3>
            <p className="font-bold text-3xl text-[var(--color-danger)]">{analytics.rejectionRate}%</p>
            <p className="text-sm text-muted">Target: < 2%</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-lg mb-md">Avg Turnaround Time</h3>
          <p className="font-bold text-3xl text-accent">{analytics.avgTurnaroundTimeMin} min</p>
          <p className="text-sm text-muted">From check-in to payment completion</p>
        </div>
      </div>
    );
  };

  const DemoView = () => (
    <div className="card text-center" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="mb-lg">
        <Play size={64} className="mx-auto text-accent mb-md" />
        <h2 className="text-2xl font-bold mb-sm">3-Minute End-to-End Demo</h2>
        <p className="text-muted">Experience the complete farmer-to-payment journey</p>
      </div>

      <div className="space-y-sm text-left mb-lg">
        {[
          '1. Farmer Registration & Produce Declaration',
          '2. AI-Powered Centre Recommendation',
          '3. Slot Booking & QR Token Generation',
          '4. Live Queue Tracking (Real-time)',
          '5. Officer QR Check-In',
          '6. Quality Inspection (Moisture/FM/Damage)',
          '7. Weighment (Gross/Tare/Net)',
          '8. Procurement Completion & Receipt',
          '9. Payment Processing → Bank Credit',
          '10. AI Congestion Alert & Redistribution',
        ].map((step, i) => (
          <div key={i} className={`flex items-center gap-sm p-sm rounded-lg transition-colors ${
            demoRunning && demoStep === i ? 'bg-[var(--color-accent-primary)] bg-opacity-10 border border-[var(--color-accent-primary)]' : ''
          }`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm ${
              demoRunning && demoStep === i ? 'bg-[var(--color-accent-primary)] text-[var(--color-bg-primary)]' : 
              demoRunning && demoStep > i ? 'bg-[var(--color-success)] text-white' : 
              'bg-[var(--color-bg-secondary)] text-muted'
            }`}>
              {demoRunning && demoStep > i ? <CheckCircle size={14} /> : i + 1}
            </span>
            <span className={demoRunning && demoStep === i ? 'font-semibold text-accent' : ''}>{step}</span>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary w-full text-lg py-lg"
        onClick={startDemo}
        disabled={demoRunning}
      >
        {demoRunning ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Running Demo... Step {demoStep + 1} of 10
          </>
        ) : (
          <>
            <Play size={20} />
            Start 3-Minute Demo
          </>
        )}
      </button>

      {demoRunning && (
        <div className="mt-md p-sm bg-[var(--color-bg-secondary)] rounded-lg text-sm text-muted">
          Current: {demoStep < 10 ? [
            'Farmer registers and declares 45 quintals wheat',
            'AI recommends Karnal Mandi (5.2km, 15min wait)',
            'Slot booked: 10:00-12:00, Token TK-20260117-084 generated',
            'Farmer arrives, officer checks in via QR scan',
            'Quality check: 11.8% moisture, Grade A accepted',
            'Weighment: Gross 5200kg, Tare 700kg, Net 45.00 quintals',
            'Procurement completed, receipt RCP-20260117-ABC123',
            'Payment initiated: ₹1,02,375 @ MSP ₹2,275/quintal',
            'Payment processed → Credited to bank account',
            'AI detects Ambala congestion, recommends redistribution',
          ][demoStep] : 'Demo Complete'}
        </div>
      )}
    </div>
  );

  const renderView = () => {
    switch (activeView) {
      case 'map': return <CentreMapView />;
      case 'queue': return <QueueMonitoringView />;
      case 'capacity': return <CapacityMonitoringView />;
      case 'ai': return <AIPredictionsView />;
      case 'analytics': return <AnalyticsView />;
      case 'demo': return <DemoView />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] sticky top-0 z-50">
        <div className="max-w-full mx-auto px-lg py-md flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-primary)' }}>
              <MapPin size={20} style={{ color: 'var(--color-bg-primary)' }} />
            </div>
            <div>
              <h1 className="font-bold text-xl">Smart Agricultural Procurement Platform</h1>
              <p className="text-xs text-muted">Government Command Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-md">
            <div className="hidden md:flex items-center gap-sm text-sm text-muted">
              <span id="clock"></span>
            </div>
            <button className="btn btn-ghost p-sm" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <button className="btn btn-ghost p-sm" aria-label="Settings">
              <Settings size={20} />
            </button>
          </div>
        </div>
        <div className="px-lg pb-lg">
          <ViewTabs />
        </div>
      </header>

      <main className="max-w-full mx-auto px-lg py-lg">
        {selectedCentre && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50" onClick={() => setSelectedCentre(null)}>
            <div className="card w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-md">
                <div>
                  <h2 className="font-bold text-xl">{selectedCentre.name}</h2>
                  <p className="text-sm text-muted">{selectedCentre.code} • {selectedCentre.district}, {selectedCentre.state}</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setSelectedCentre(null)}>
                  <X size={20} />
                </button>
              </div>
              
              {getStatusBadge(selectedCentre.status)}
              
              <div className="grid grid-2 gap-md mt-md mb-md">
                <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
                  <p className="text-sm text-muted">Queue Length</p>
                  <p className="font-bold text-2xl">{selectedCentre.currentQueue}</p>
                </div>
                <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
                  <p className="text-sm text-muted">Est. Wait</p>
                  <p className="font-bold text-2xl text-accent">{selectedCentre.estimatedWait} min</p>
                </div>
                <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
                  <p className="text-sm text-muted">Utilization</p>
                  <p className="font-bold text-2xl">{selectedCentre.utilization}%</p>
                </div>
                <div className="text-center p-sm bg-[var(--color-bg-secondary)] rounded-lg">
                  <p className="text-sm text-muted">Counters</p>
                  <p className="font-bold text-2xl">{selectedCentre.activeCounters}</p>
                </div>
              </div>

              <div className="space-y-sm text-sm">
                <div className="flex justify-between"><span className="text-muted">Address:</span> <span>{selectedCentre.address}</span></div>
                <div className="flex justify-between"><span className="text-muted">Coordinates:</span> <span className="font-mono">{selectedCentre.latitude.toFixed(4)}, {selectedCentre.longitude.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-muted">Slot Capacity:</span> <span>{selectedCentre.capacityPerSlot} per slot</span></div>
              </div>
            </div>
          </div>
        )}

        {renderView()}
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            function updateClock() {
              const el = document.getElementById('clock');
              if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
            setInterval(updateClock, 1000);
            updateClock();
          `,
        }}
      />
    </div>
  );
}