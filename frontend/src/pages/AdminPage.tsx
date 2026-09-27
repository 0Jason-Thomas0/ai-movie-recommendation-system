import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Film, Star, Activity, RefreshCw, Shield, Database,
  TrendingUp, Zap, Clock, CheckCircle, AlertTriangle, XCircle,
  ToggleLeft, ToggleRight, ChevronRight,
} from 'lucide-react';
import { adminService, mlopsService } from '../services/userService';
import type { AdminStats } from '../types/mlops';
import type { MLOpsStatus } from '../types/mlops';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'users' | 'mlops';

interface AdminUser {
  id: number;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
  rating_count: number;
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-text-muted text-sm mt-1">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function HealthBadge({ health }: { health: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    healthy: { icon: CheckCircle, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    untrained: { icon: XCircle, color: 'text-text-muted', bg: 'bg-white/5' },
    unknown: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const { icon: Icon, color, bg } = map[health] || map.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${color}`}>
      <Icon className="w-3 h-3" />
      {health.charAt(0).toUpperCase() + health.slice(1)}
    </span>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [mlops, setMlops] = useState<MLOpsStatus | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, u] = await Promise.all([
        adminService.getStats() as Promise<AdminStats>,
        mlopsService.getStatus() as Promise<MLOpsStatus>,
        adminService.getUsers() as Promise<AdminUser[]>,
      ]);
      setStats(s);
      setMlops(m);
      setUsers(u);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleUser = async (userId: number) => {
    try {
      await adminService.toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !u.is_active } : u));
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await mlopsService.triggerRetrain();
      toast.success(res.message || 'Retraining started!');
      setTimeout(loadData, 2000);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to start retraining');
    } finally {
      setRetraining(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'mlops', label: 'MLOps', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Admin Panel</h1>
              <p className="text-text-muted text-sm">System management &amp; monitoring</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="btn-secondary text-sm"
            disabled={loading}
            id="admin-refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-elevated p-1 rounded-xl w-fit mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-glow-red'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Total Users" value={stats?.total_users ?? '—'} icon={Users} color="text-blue-400" />
              <StatCard label="Total Movies" value={stats?.total_movies ?? '—'} icon={Film} color="text-purple-400" />
              <StatCard label="Total Ratings" value={stats?.total_ratings ?? '—'} icon={Star} color="text-accent-gold" />
              <StatCard label="Ratings Today" value={stats?.ratings_today ?? '—'} icon={TrendingUp} color="text-primary" />
              <StatCard label="Avg Rating" value={stats?.avg_rating ? `${stats.avg_rating}★` : '—'} icon={Star} color="text-accent-gold" />
              <StatCard label="New Users (7d)" value={stats?.new_users_this_week ?? '—'} icon={Users} color="text-accent-green" />
            </div>

            {/* Model + Top Movies */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Model Status */}
              <div className="glass-card p-6">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> AI Model Status
                </h2>
                {mlops ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Health</span>
                      <HealthBadge health={mlops.model_health} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Version</span>
                      <span className="text-white font-mono text-sm">{mlops.current_model_version || 'None'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Accuracy</span>
                      <span className="text-white font-semibold">
                        {mlops.recommendation_accuracy != null
                          ? `${(mlops.recommendation_accuracy * 100).toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Status</span>
                      <span className={`text-sm font-medium ${mlops.retraining_status === 'running' ? 'text-yellow-400 animate-pulse' : 'text-text-secondary'}`}>
                        {mlops.retraining_status}
                      </span>
                    </div>
                    {mlops.last_training_time && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Last Trained</span>
                        <span className="text-text-secondary text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(mlops.last_training_time).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={handleRetrain}
                      disabled={retraining || mlops.retraining_status === 'running'}
                      className="btn-primary w-full justify-center mt-4"
                      id="trigger-retrain-btn"
                    >
                      {retraining ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {retraining ? 'Starting...' : 'Trigger Retrain'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-6 rounded" />)}
                  </div>
                )}
              </div>

              {/* Top Rated Movies */}
              <div className="glass-card p-6">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent-gold" /> Top Rated Movies
                </h2>
                {stats?.top_rated_movies?.length ? (
                  <div className="space-y-3">
                    {stats.top_rated_movies.map((m, i) => (
                      <Link
                        key={m.id}
                        to={`/movies/${m.id}`}
                        className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors group"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm text-text-secondary group-hover:text-white transition-colors line-clamp-1">
                          {m.title}
                        </span>
                        <span className="text-accent-gold font-semibold text-sm">{m.avg_rating.toFixed(1)}★</span>
                        <ChevronRight className="w-3 h-3 text-text-muted group-hover:text-white transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted text-sm">No data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> User Management
              </h2>
              <span className="text-text-muted text-sm">{users.length} users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="text-left px-5 py-3 text-text-muted text-xs uppercase tracking-wider font-semibold">User</th>
                    <th className="text-left px-5 py-3 text-text-muted text-xs uppercase tracking-wider font-semibold">Role</th>
                    <th className="text-left px-5 py-3 text-text-muted text-xs uppercase tracking-wider font-semibold">Ratings</th>
                    <th className="text-left px-5 py-3 text-text-muted text-xs uppercase tracking-wider font-semibold">Joined</th>
                    <th className="text-left px-5 py-3 text-text-muted text-xs uppercase tracking-wider font-semibold">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-surface-border/50">
                          {[...Array(6)].map((_, j) => (
                            <td key={j} className="px-5 py-4">
                              <div className="skeleton h-4 rounded w-24" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : users.map((u) => (
                        <tr key={u.id} className="border-b border-surface-border/30 hover:bg-white/2 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{u.username}</p>
                                <p className="text-text-muted text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'bg-white/5 text-text-secondary border border-white/10'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-text-secondary text-sm">{u.rating_count}</td>
                          <td className="px-5 py-4 text-text-muted text-sm">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-accent-green' : 'text-red-400'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-accent-green' : 'bg-red-400'}`} />
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleToggleUser(u.id)}
                              className="btn-icon"
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {u.is_active
                                ? <ToggleRight className="w-5 h-5 text-accent-green" />
                                : <ToggleLeft className="w-5 h-5 text-text-muted" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MLOps Tab ── */}
        {activeTab === 'mlops' && (
          <div className="space-y-6">
            {/* Pipeline Controls */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Pipeline Controls
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {mlops && [
                  { label: 'Total Ratings', value: mlops.total_ratings, icon: Star },
                  { label: 'Total Users', value: mlops.total_users, icon: Users },
                  { label: 'Rated Today', value: mlops.movies_rated_today, icon: TrendingUp },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-elevated rounded-xl p-4 flex items-center gap-4">
                    <item.icon className="w-8 h-8 text-primary/60" />
                    <div>
                      <p className="text-2xl font-black text-white">{item.value}</p>
                      <p className="text-text-muted text-sm">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleRetrain}
                  disabled={retraining || mlops?.retraining_status === 'running'}
                  className="btn-primary"
                  id="mlops-retrain-btn"
                >
                  {retraining
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <RefreshCw className="w-4 h-4" />}
                  {retraining ? 'Starting Retrain...' : 'Trigger Manual Retrain'}
                </button>
                {mlops?.retraining_status === 'running' && (
                  <span className="text-yellow-400 text-sm animate-pulse flex items-center gap-1">
                    <Activity className="w-4 h-4" /> Retraining in progress...
                  </span>
                )}
              </div>
            </div>

            {/* Version History */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Model Version History
              </h2>
              {mlops?.model_versions?.length ? (
                <div className="space-y-3">
                  {[...mlops.model_versions].reverse().map((v, i) => (
                    <div key={v.version} className={`flex items-center gap-4 p-4 rounded-xl ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-surface-elevated'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-primary/20' : 'bg-white/5'}`}>
                        <Database className={`w-5 h-5 ${i === 0 ? 'text-primary' : 'text-text-muted'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">v{v.version}</span>
                          {i === 0 && <span className="badge badge-red">Latest</span>}
                          <span className="badge bg-white/5 text-text-muted border border-white/10 capitalize">{v.algorithm}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {v.accuracy != null && (
                            <span className="text-xs text-text-secondary">
                              Accuracy: <span className="text-white">{(v.accuracy * 100).toFixed(1)}%</span>
                            </span>
                          )}
                          {v.total_ratings_used != null && (
                            <span className="text-xs text-text-secondary">
                              Ratings: <span className="text-white">{v.total_ratings_used.toLocaleString()}</span>
                            </span>
                          )}
                          {v.trained_at && (
                            <span className="text-xs text-text-muted">
                              {new Date(v.trained_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted">No model versions yet. Trigger a retrain to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
