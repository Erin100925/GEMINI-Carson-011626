import React from 'react';
import { Metrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
  metrics: Metrics;
}

const Dashboard: React.FC<Props> = ({ metrics }) => {
  const providerData = Object.entries(metrics.providerCalls).map(([name, value]) => ({
    name,
    calls: value
  }));

  // Simulated timeseries data based on total runs
  const activityData = Array.from({ length: 5 }, (_, i) => ({
    day: `Day ${i + 1}`,
    runs: Math.max(0, metrics.totalRuns - (5 - i) * 2) + Math.floor(Math.random() * 5)
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
      <div className="bg-surface/50 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur">
        <h3 className="text-xl font-bold mb-4">Provider Usage</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-primary)' }}
                itemStyle={{ color: 'var(--color-text)' }}
              />
              <Bar dataKey="calls" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface/50 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur">
        <h3 className="text-xl font-bold mb-4">Review Activity</h3>
        <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="day" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} />
              <Tooltip 
                 contentStyle={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-primary)' }}
                 itemStyle={{ color: 'var(--color-text)' }}
              />
              <Line type="monotone" dataKey="runs" stroke="var(--color-accent)" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface/50 p-6 rounded-xl border border-white/10 shadow-lg backdrop-blur col-span-1 md:col-span-2 flex justify-around">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{metrics.totalRuns}</div>
            <div className="text-sm opacity-70">Total Runs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">{metrics.tokensUsed}</div>
            <div className="text-sm opacity-70">Tokens Used</div>
          </div>
          <div className="text-center">
             <div className="text-3xl font-bold text-secondary">{metrics.lastRunDuration.toFixed(2)}s</div>
             <div className="text-sm opacity-70">Last Latency</div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
