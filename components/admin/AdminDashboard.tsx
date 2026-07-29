import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import { ProfileIcon, CreditCardIcon, CoinIcon, CheckCircleIcon } from '../common/AppIcons';

const RefreshIcon = ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const StatBox = ({ title, value, tag, icon, accent }: { title: string, value: string | number, tag: string, icon: React.ReactNode, accent: string }) => (
    <div className={`bg-white border ${accent} p-4 flex flex-col justify-between font-sans shadow-sm relative overflow-hidden`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 pt-1">
            <div className="flex items-center space-x-2">
                <span className="text-slate-700 p-1 bg-yellow-100 border border-yellow-300">{icon}</span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-slate-900 font-bold font-mono">
                {tag}
            </span>
        </div>
        <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
            <div className="text-[10px] text-emerald-700 font-bold font-mono flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> LIVE
            </div>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
        totalProducts: 0,
        totalBazaarItems: 0,
        totalTasks: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats');

            const [usersRes, paymentsRes, subsRes, approvedPaymentsRes, productsRes, bazaarRes, tasksRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }),
                supabase.from('manual_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('manual_payments').select('amount').eq('status', 'approved'),
                supabase.from('products').select('id', { count: 'exact', head: true }),
                supabase.from('store_items').select('id', { count: 'exact', head: true }),
                supabase.from('tasks').select('id', { count: 'exact', head: true }),
            ]);

            const totalUsers = usersRes.count || 0;
            const pendingPayments = paymentsRes.count || 0;
            const activeSubscriptions = subsRes.count || 0;
            const totalRevenue = (approvedPaymentsRes.data || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

            setStats({
                totalUsers,
                pendingPayments,
                totalRevenue,
                activeSubscriptions,
                totalProducts: productsRes.count || 0,
                totalBazaarItems: bazaarRes.count || 0,
                totalTasks: tasksRes.count || 0,
            });
        } catch (err: any) {
            console.error("Failed to fetch dashboard stats:", err);
            setError(err.message || "An unexpected error occurred while fetching dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-16 font-mono text-slate-400 space-y-3">
                <LoadingSpinner />
                <span className="text-xs">LOADING REAL-TIME DASHBOARD METRICS...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 p-4 font-mono text-xs space-y-2" role="alert">
                <p className="font-bold text-rose-300">[!] ERROR LOADING METRICS</p>
                <p>{error}</p>
                <button 
                    onClick={fetchStats}
                    className="px-3 py-1 bg-rose-900 border border-rose-700 text-rose-100 font-bold hover:bg-rose-800"
                >
                    RETRY FETCH
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 font-sans">
            {/* Header control box */}
            <div className="bg-yellow-400 border border-slate-900 text-slate-950 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div>
                    <h2 className="text-sm font-black text-slate-950 tracking-wider uppercase font-mono">SYSTEM OVERVIEW & METRICS</h2>
                    <p className="text-[11px] text-slate-800 font-bold mt-0.5">Live database metrics, pending payment requests, user counts & store inventory</p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-900 text-xs font-black flex items-center gap-1.5 transition-none font-mono"
                >
                    <RefreshIcon className="w-3.5 h-3.5" />
                    <span>REFRESH STATS</span>
                </button>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatBox title="Total Users" value={stats.totalUsers} tag="USR" icon={<ProfileIcon className="w-4 h-4"/>} accent="border-slate-200 hover:border-yellow-400" />
                <StatBox title="Pending Payments" value={stats.pendingPayments} tag="QUEUE" icon={<CreditCardIcon className="w-4 h-4"/>} accent="border-slate-200 hover:border-yellow-400" />
                <StatBox title="Approved Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} tag="USD" icon={<CoinIcon className="w-4 h-4"/>} accent="border-slate-200 hover:border-yellow-400" />
                <StatBox title="Active Subscriptions" value={stats.activeSubscriptions} tag="SUB" icon={<CheckCircleIcon className="w-4 h-4"/>} accent="border-slate-200 hover:border-yellow-400" />
            </div>

            {/* System Details Box */}
            <div className="bg-white border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span className="font-mono uppercase text-slate-800">STORE & SYSTEM MODULE INVENTORY</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-mono font-bold">[STATUS: ONLINE]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 border border-slate-200">
                        <div className="text-[11px] text-slate-600 font-bold uppercase font-mono">TOP-UP PRODUCTS</div>
                        <div className="text-xl font-black text-slate-900 mt-1">{stats.totalProducts} Packages</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Active in Store Management</div>
                    </div>

                    <div className="bg-slate-50 p-3.5 border border-slate-200">
                        <div className="text-[11px] text-slate-600 font-bold uppercase font-mono">BAZAAR ITEMS</div>
                        <div className="text-xl font-black text-slate-900 mt-1">{stats.totalBazaarItems} Digital Items</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Avatars, Covers, Collectibles</div>
                    </div>

                    <div className="bg-slate-50 p-3.5 border border-slate-200">
                        <div className="text-[11px] text-slate-600 font-bold uppercase font-mono">ACTIVE TASKS</div>
                        <div className="text-xl font-black text-slate-900 mt-1">{stats.totalTasks} System Tasks</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Task Engine Configured</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;