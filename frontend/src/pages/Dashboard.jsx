// src/pages/Dashboard.jsx - Admin overview
import { useState, useEffect } from 'react';
import { getOverview } from '../api/dashboard';

function Stat({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-border bg-ink-raised p-6">
      <p className="font-mono text-[11px] text-muted tracking-widest uppercase mb-2">{label}</p>
      <p className="font-display text-3xl font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub && <p className="font-mono text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await getOverview();
        if (on) setData(res);
      } catch (err) {
        if (on) setError('Could not load. Are you logged in as admin?');
        console.error(err);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const revenue = data ? `$${(data.revenue_cents / 100).toFixed(2)}` : '—';

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">// dashboard</p>
      <h1 className="font-display text-3xl font-bold mb-10">Overview</h1>

      {loading && <p className="font-mono text-sm text-muted">Loading…</p>}
      {error && <p className="font-mono text-sm text-red-300">{error}</p>}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat
            label="Revenue"
            value={revenue}
            sub={`${data.unlocks} unlock${data.unlocks === 1 ? '' : 's'} sold`}
            accent="#6EE7B7"
          />
          <Stat
            label="Subscribers"
            value={data.subscribers_active}
            sub={data.subscribers_pending ? `${data.subscribers_pending} pending confirm` : 'all confirmed'}
            accent="#E8B339"
          />
          <Stat
            label="Total views"
            value={data.total_views}
            sub="across all posts"
          />
          <Stat
            label="Posts"
            value={data.posts_published}
            sub={`${data.posts_total} total (incl. drafts)`}
          />
          <Stat
            label="Unlocks"
            value={data.unlocks}
            sub="premium purchases"
          />
        </div>
      )}
    </div>
  );
}

export default Dashboard;