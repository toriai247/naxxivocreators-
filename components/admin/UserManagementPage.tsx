import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { generateAvatar } from '../../utils/helpers';
import UserAccountPage from './UserAccountPage';

type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url' | 'status' | 'xp_balance' | 'is_admin' | 'created_at'>;

interface UserManagementPageProps {
    session: Session;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ session }) => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'banned'>('all');
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('profiles').select('id, name, username, photo_url, status, xp_balance, is_admin, created_at').order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
        }

        let { data, error } = await query;

        if (error) {
            console.warn("Retrying admin users fetch with basic columns:", error.message);
            const fallback = await supabase.from('profiles').select('id, name, username, photo_url, xp_balance, created_at').order('created_at', { ascending: false });
            data = fallback.data as any;
            error = fallback.error;
        }

        if (error) {
            console.error("Failed to fetch users:", error);
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }, [searchTerm]);

    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            fetchUsers();
        }, 200);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm, fetchUsers]);
    
    const handleViewUser = (userId: string) => {
        setViewingUserId(userId);
    };

    const filteredUsers = users.filter(user => {
        if (filterRole === 'admin') return user.is_admin;
        if (filterRole === 'banned') return user.status === 'banned';
        return true;
    });
    
    if (viewingUserId) {
        return <UserAccountPage 
            userId={viewingUserId} 
            session={session} 
            onBack={() => {
                setViewingUserId(null);
                fetchUsers();
            }} 
        />;
    }

    return (
        <div className="space-y-3 font-sans">
            {/* Control Bar */}
            <div className="bg-yellow-400 border border-slate-900 p-3 text-slate-950 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Search by Name, Username, or UUID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-900 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 font-bold"
                    />
                </div>

                {/* Filter Box Buttons */}
                <div className="flex items-center space-x-1 shrink-0 font-mono">
                    <button
                        onClick={() => setFilterRole('all')}
                        className={`px-3 py-1.5 text-xs border font-black transition-none ${
                            filterRole === 'all'
                                ? 'bg-slate-900 text-yellow-400 border-slate-900'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                        ALL ({users.length})
                    </button>
                    <button
                        onClick={() => setFilterRole('admin')}
                        className={`px-3 py-1.5 text-xs border font-black transition-none ${
                            filterRole === 'admin'
                                ? 'bg-slate-900 text-yellow-400 border-slate-900'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                        ADMINS ({users.filter(u => u.is_admin).length})
                    </button>
                    <button
                        onClick={() => setFilterRole('banned')}
                        className={`px-3 py-1.5 text-xs border font-black transition-none ${
                            filterRole === 'banned'
                                ? 'bg-rose-600 text-white border-rose-800'
                                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                        BANNED ({users.filter(u => u.status === 'banned').length})
                    </button>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center items-center py-12 text-slate-500 text-xs font-mono"><LoadingSpinner /></div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 text-center text-xs text-slate-500 font-mono">
                    NO USER RECORDS MATCHING THE CURRENT QUERY
                </div>
            ) : (
                <div className="border border-slate-200 bg-white overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider font-mono">
                                <th className="p-3 border-r border-slate-200">User Identity</th>
                                <th className="p-3 border-r border-slate-200">UUID</th>
                                <th className="p-3 border-r border-slate-200">Status</th>
                                <th className="p-3 border-r border-slate-200">XP Balance</th>
                                <th className="p-3 border-r border-slate-200">Role</th>
                                <th className="p-3 border-r border-slate-200">Created</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-yellow-50/60 transition-none">
                                    <td className="p-3 border-r border-slate-200">
                                        <div className="flex items-center space-x-2.5">
                                            <img className="h-8 w-8 border border-slate-300 object-cover shrink-0" src={user.photo_url || generateAvatar(user.username)} alt="" />
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 truncate">{user.name || user.username}</div>
                                                <div className="text-[10px] text-slate-500 font-mono truncate">@{user.username || 'no-username'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono text-[10px] text-slate-500">
                                        {user.id.substring(0, 12)}...
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono">
                                        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                                            user.status === 'banned'
                                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        }`}>
                                            {user.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-bold text-yellow-700 font-mono">
                                        {(user.xp_balance || 0).toLocaleString()} XP
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono">
                                        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                                            user.is_admin ? 'bg-yellow-400 text-slate-950 border-slate-900' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {user.is_admin ? 'ADMIN' : 'USER'}
                                        </span>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-[10px] text-slate-500 font-mono">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleViewUser(user.id)} 
                                            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-slate-900 text-[10px] font-black active:bg-yellow-500 transition-none font-mono"
                                        >
                                            [MANAGE]
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;