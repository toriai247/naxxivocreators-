import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import { ProfileIcon, CreditCardIcon, CoinIcon, CheckCircleIcon } from '../common/AppIcons';

const StatCard = ({ title, value, icon, iconClass }: { title: string, value: string | number, icon: React.ReactNode, iconClass: string }) => (
    <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-sm border border-[var(--theme-secondary)] flex items-center space-x-4 transition-all hover:shadow-lg hover:-translate-y-1">
        <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${iconClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-[var(--theme-text-secondary)] text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-[var(--theme-text)]">{value}</p>
        </div>
    </div>
);


const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        activeSubscriptions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const { data, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats');

                if (rpcError) {
                    console.warn("RPC get_admin_dashboard_stats failed, falling back to direct queries:", rpcError.message);
                    
                    const [usersRes, paymentsRes, subsRes, approvedPaymentsRes] = await Promise.all([
                        supabase.from('profiles').select('id', { count: 'exact', head: true }),
                        supabase.from('manual_payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                        supabase.from('user_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
                        supabase.from('manual_payments').select('amount').eq('status', 'approved')
                    ]);

                    const totalUsers = usersRes.count || 0;
                    const pendingPayments = paymentsRes.count || 0;
                    const activeSubscriptions = subsRes.count || 0;
                    const totalRevenue = (approvedPaymentsRes.data || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

                    setStats({
                        totalUsers,
                        pendingPayments,
                        totalRevenue,
                        activeSubscriptions
                    });
                } else if (data) {
                    setStats(data as any);
                }
            } catch (err: any) {
                console.error("Failed to fetch dashboard stats:", err);
                setError(err.message || "An unexpected error occurred while fetching dashboard data.");
            } finally {
                setLoading(false);
            }
        };
    
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    }

    if (error) {
        return (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                <p className="font-bold">Error Loading Dashboard</p>
                <p>{error}</p>
                <p className="text-sm mt-2">This is likely due to incorrect database permissions (RLS). Please ensure you have run the latest SQL script provided to fix database policies and functions.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.totalUsers} icon={<ProfileIcon className="w-8 h-8"/>} iconClass="bg-blue-100 text-blue-600" />
            <StatCard title="Pending Payments" value={stats.pendingPayments} icon={<CreditCardIcon className="w-8 h-8"/>} iconClass="bg-yellow-100 text-yellow-600" />
            <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={<CoinIcon className="w-8 h-8"/>} iconClass="bg-green-100 text-green-600" />
            <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={<CheckCircleIcon className="w-8 h-8"/>} iconClass="bg-purple-100 text-purple-600" />
        </div>
    );
};

export default AdminDashboard;