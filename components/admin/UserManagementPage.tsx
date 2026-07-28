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
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm, fetchUsers]);
    
    const handleViewUser = (userId: string) => {
        setViewingUserId(userId);
    };
    
    if (viewingUserId) {
        return <UserAccountPage 
            userId={viewingUserId} 
            session={session} 
            onBack={() => {
                setViewingUserId(null);
                fetchUsers(); // Refetch list in case of changes
            }} 
        />;
    }

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, username, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border border-[var(--theme-input-border)] rounded-lg bg-white text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] transition-shadow"
                />
            </div>
            {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">User</th>
                                <th className="admin-th">Status</th>
                                <th className="admin-th">XP Balance</th>
                                <th className="admin-th">Role</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="admin-tbody">
                            {users.map(user => (
                                <tr key={user.id} className="admin-tr">
                                    <td className="admin-td">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={user.photo_url || generateAvatar(user.username)} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-[var(--theme-text)]">{user.name || user.username}</div>
                                                <div className="text-sm text-[var(--theme-text-secondary)]">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="admin-td">
                                        <span className={`status-badge capitalize ${
                                            user.status === 'active' ? 'status-badge-active' : 'status-badge-banned'
                                        }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{user.xp_balance.toLocaleString()}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)] capitalize">
                                        {user.is_admin ? 'Admin' : 'User'}
                                    </td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => handleViewUser(user.id)} className="btn-edit">Manage</button>
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