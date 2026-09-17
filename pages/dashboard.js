import { useEffect, useState } from 'react';
import { formatCurrency } from '../lib/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Failed to load dashboard: {error}</p>;
  if (!data) return <p>Loading…</p>;

  const stats = [
    { label: 'Total outstanding', value: formatCurrency(data.totalOutstanding) },
    { label: 'Overdue amount', value: formatCurrency(data.overdueAmount) },
    { label: 'Due in next 7 days', value: formatCurrency(data.dueInNext7Days) },
    { label: 'Expected collections this week', value: formatCurrency(data.expectedCollectionsThisWeek) },
    { label: 'Cash-flow forecast (this month)', value: formatCurrency(data.cashFlowForecast) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="text-sm text-gray-500 mb-2">High-risk customers</p>
        {data.highRiskCustomers.length === 0 ? (
          <p className="text-gray-400 text-sm">None right now.</p>
        ) : (
          <ul className="list-disc list-inside">
            {data.highRiskCustomers.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
