import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, Json, TablesInsert, TablesUpdate, Enums } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon, GoldCoinIcon, SilverCoinIcon, DiamondIcon, TrophyIcon } from '../common/AppIcons';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import UserEditModal from './UserEditModal';
import { formatXp } from '../../utils/helpers';
import ConfirmationModal from '../common/ConfirmationModal';
import ManageCollectionModal from './ManageCollectionModal';
import ManageSubscriptionModal from './ManageSubscriptionModal';

interface UserAccountPageProps {
    userId: string;
    session: Session;
    onBack: () => void;
}

type FullUserProfile = Tables<'profiles'> & {
    inventory: (Tables<'user_inventory'> & { store_items: Pick<Tables<'store_items'>, 'name' | 'preview_url'> | null })[];
    subscriptions: (Tables<'user_subscriptions'> & { products: Pick<Tables<'products'>, 'name'> | null })[];
    posts: Pick<Tables<'posts'>, 'id' | 'caption' | 'created_at'>[];
};

const SectionCard = ({ title, children, actions, className }: { title: string, children: React.ReactNode, actions?: React.ReactNode, className?: string }) => (
    <div className={`bg-white p-4 border border-slate-200 font-sans text-slate-900 shadow-sm ${className}`}>
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                <span>{title}</span>
            </h3>
            {actions && <div>{actions}</div>}
        </div>
        <div>{children}</div>
    </div>
);

const UserAccountPage: React.FC<UserAccountPageProps> = ({ userId, session, onBack }) => {
    const [userData, setUserData] = useState<FullUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'delete', sub: any } | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [profileRes, inventoryRes, subsRes, postsRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('user_inventory').select('*, store_items(name, preview_url)').eq('user_id', userId).limit(12),
                supabase.from('user_subscriptions').select('*, products(name)').eq('user_id', userId).eq('is_active', true),
                supabase.from('posts').select('id, caption, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
            ]);

            if (profileRes.error) throw profileRes.error;
            const fullData: FullUserProfile = {
                ...(profileRes.data as any),
                inventory: inventoryRes.data || [],
                subscriptions: subsRes.data || [],
                posts: postsRes.data || []
            };
            setUserData(fullData);
        } catch (err: any) {
            setError(err.message || 'Failed to load user data.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveUser = async (updatedData: any, notes: string) => {
        if (!userData) return;
        const adminId = session.user.id;
        const changes: { action: string, details: any }[] = [];
        const profileUpdatePayload: TablesUpdate<'profiles'> = {};

        // Compare and log changes for balances
        if (updatedData.xpAdjustment !== 0) {
            const newXp = userData.xp_balance + updatedData.xpAdjustment;
            changes.push({ action: 'xp_adjustment', details: { from: userData.xp_balance, to: newXp, adjustment: updatedData.xpAdjustment } });
            profileUpdatePayload.xp_balance = newXp;
        }
        if (updatedData.goldAdjustment !== 0) {
            const newGold = (userData.gold_coins || 0) + updatedData.goldAdjustment;
            changes.push({ action: 'gold_adjustment', details: { from: userData.gold_coins, to: newGold, adjustment: updatedData.goldAdjustment } });
            profileUpdatePayload.gold_coins = newGold;
        }
        // ... similar checks for silver and diamond...
         if (updatedData.silverAdjustment !== 0) {
            const newSilver = (userData.silver_coins || 0) + updatedData.silverAdjustment;
            changes.push({ action: 'silver_adjustment', details: { from: userData.silver_coins, to: newSilver, adjustment: updatedData.silverAdjustment } });
            profileUpdatePayload.silver_coins = newSilver;
        }
         if (updatedData.diamondAdjustment !== 0) {
            const newDiamond = (userData.diamond_coins || 0) + updatedData.diamondAdjustment;
            changes.push({ action: 'diamond_adjustment', details: { from: userData.diamond_coins, to: newDiamond, adjustment: updatedData.diamondAdjustment } });
            profileUpdatePayload.diamond_coins = newDiamond;
        }

        // Compare and log changes for profile info
        if (updatedData.isAdmin !== !!userData.is_admin) {
            changes.push({ action: 'admin_status_change', details: { from: !!userData.is_admin, to: updatedData.isAdmin } });
            profileUpdatePayload.is_admin = updatedData.isAdmin;
        }
        if (updatedData.status !== userData.status) {
            changes.push({ action: 'status_change', details: { from: userData.status, to: updatedData.status } });
            profileUpdatePayload.status = updatedData.status;
        }

        try {
            if (Object.keys(profileUpdatePayload).length > 0) {
                 const { error: profileError } = await (supabase.from('profiles') as any).update(profileUpdatePayload).eq('id', userId);
                 if (profileError) throw profileError;
            }
            if(changes.length > 0) {
                const auditLogPayloads: TablesInsert<'admin_audit_log'>[] = changes.map(change => ({
                    admin_user_id: adminId, target_id: userId, action: `${change.action}: ${notes}`, details: change.details,
                }));
                const { error: logError } = await (supabase.from('admin_audit_log') as any).insert(auditLogPayloads);
                if (logError) throw logError;
            }
            alert("User updated successfully!");
        } catch (error: any) {
            alert(`Failed to update user: ${error.message}`);
        } finally {
            setIsEditModalOpen(false);
            fetchData();
        }
    };
    
    const handleSubscriptionAction = async () => {
        if (!confirmAction) return;
        const { type, sub } = confirmAction;

        try {
            if (type === 'deactivate') {
                const { error } = await (supabase.from('user_subscriptions') as any).update({ is_active: false }).eq('id', sub.id);
                if (error) throw error;
                alert('Subscription deactivated.');
            } else if (type === 'delete') {
                const { error } = await supabase.from('user_subscriptions').delete().eq('id', sub.id);
                if (error) throw error;
                alert('Subscription deleted permanently.');
            }
            fetchData();
        } catch (error: any) {
            alert(`Action failed: ${error.message}`);
        } finally {
            setConfirmAction(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    if (error || !userData) return <div className="p-4 text-red-500">{error || 'User not found'} <button onClick={onBack}>Back</button></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-[var(--theme-card-bg-alt)]"><BackArrowIcon /></button>
                <div className="flex items-center gap-3">
                    <Avatar photoUrl={userData.photo_url} name={userData.username} size="lg"/>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--theme-text)]">{userData.name}</h2>
                        <p className="text-sm text-[var(--theme-text-secondary)]">@{userData.username}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* FIX: The SectionCard component requires children. I have wrapped the content within the component. */}
                    <SectionCard title="User Details" actions={<Button size="small" onClick={() => setIsEditModalOpen(true)} className="w-auto px-4">Edit</Button>}>
                        <div className="space-y-2 text-sm text-[var(--theme-text)]/90">
                            <p><strong>Status:</strong> <span className={`status-badge capitalize ${userData.status === 'active' ? 'status-badge-active' : 'status-badge-banned'}`}>{userData.status}</span></p>
                            <p><strong>Role:</strong> {userData.is_admin ? 'Admin' : 'User'}</p>
                            <p><strong>Bio:</strong> {userData.bio || 'Not set.'}</p>
                        </div>
                    </SectionCard>
                    
                     {/* FIX: The SectionCard component requires children. I have wrapped the content within the component. */}
                     <SectionCard title="Balances">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-lg"><TrophyIcon className="w-6 h-6 text-violet-500"/><div><p className="text-xs text-[var(--theme-text-secondary)]">XP</p><p className="font-bold text-[var(--theme-text)]">{formatXp(userData.xp_balance)}</p></div></div>
                            <div className="flex items-center gap-3 bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-lg"><GoldCoinIcon className="w-6 h-6 text-yellow-500"/><div><p className="text-xs text-[var(--theme-text-secondary)]">Gold</p><p className="font-bold text-[var(--theme-text)]">{formatXp(userData.gold_coins || 0)}</p></div></div>
                            <div className="flex items-center gap-3 bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-lg"><SilverCoinIcon className="w-6 h-6 text-gray-400"/><div><p className="text-xs text-[var(--theme-text-secondary)]">Silver</p><p className="font-bold text-[var(--theme-text)]">{formatXp(userData.silver_coins || 0)}</p></div></div>
                            <div className="flex items-center gap-3 bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-lg"><DiamondIcon className="w-6 h-6 text-cyan-400"/><div><p className="text-xs text-[var(--theme-text-secondary)]">Diamond</p><p className="font-bold text-[var(--theme-text)]">{formatXp(userData.diamond_coins || 0)}</p></div></div>
                        </div>
                    </SectionCard>

                    {/* FIX: The SectionCard component requires children. I have wrapped the content within the component. */}
                    <SectionCard title="Active Subscriptions" actions={<Button size="small" className="w-auto px-4" onClick={() => setIsSubscriptionModalOpen(true)}>Add Sub</Button>}>
                        {userData.subscriptions.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {userData.subscriptions.map(sub => (
                                    <li key={sub.id} className="flex justify-between items-center p-2 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                                        <span className="text-[var(--theme-text)]/90">{sub.products?.name} (ends {new Date(sub.end_date).toLocaleDateString()})</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setConfirmAction({ type: 'deactivate', sub })} className="text-yellow-500 hover:text-yellow-400 text-xs font-semibold">Deactivate</button>
                                            <button onClick={() => setConfirmAction({ type: 'delete', sub })} className="text-red-500 hover:text-red-400 text-xs font-semibold">Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-[var(--theme-text-secondary)]">No active subscriptions.</p>}
                    </SectionCard>
                </div>
                <div className="space-y-6">
                     {/* FIX: The SectionCard component requires children. I have wrapped the content within the component. */}
                     <SectionCard title="Collection" actions={<Button size="small" onClick={() => setIsCollectionModalOpen(true)} className="w-auto px-4">Manage</Button>}>
                        {userData.inventory.length > 0 ? (
                            <div className="grid grid-cols-4 gap-3">
                                {userData.inventory.map(item => item.store_items && (
                                    <div key={item.id} title={item.store_items.name} className="aspect-square bg-[var(--theme-card-bg-alt)] rounded-lg flex items-center justify-center p-1">
                                        <img src={item.store_items.preview_url || ''} alt={item.store_items.name} className="max-w-full max-h-full object-contain"/>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-[var(--theme-text-secondary)]">User has no items.</p>}
                    </SectionCard>

                    {/* FIX: The SectionCard component requires children. I have wrapped the content within the component. */}
                    <SectionCard title="Recent Posts">
                        {userData.posts.length > 0 ? (
                            <ul className="space-y-3">
                                {userData.posts.map(post => <li key={post.id} className="text-sm p-2 bg-[var(--theme-card-bg-alt)]/50 rounded-md truncate text-[var(--theme-text)]/90">"{post.caption || 'No caption'}"</li>)}
                            </ul>
                        ) : <p className="text-sm text-[var(--theme-text-secondary)]">User has not made any posts.</p>}
                    </SectionCard>
                </div>
            </div>

             {isEditModalOpen && (
                <UserEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveUser}
                    userToEdit={userData}
                />
            )}
             {isCollectionModalOpen && (
                <ManageCollectionModal
                    isOpen={isCollectionModalOpen}
                    onClose={() => setIsCollectionModalOpen(false)}
                    userId={userId}
                    onUpdate={fetchData}
                />
            )}
            {isSubscriptionModalOpen && (
                 <ManageSubscriptionModal
                    isOpen={isSubscriptionModalOpen}
                    onClose={() => setIsSubscriptionModalOpen(false)}
                    userId={userId}
                    onUpdate={fetchData}
                />
            )}
            <ConfirmationModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleSubscriptionAction}
                title={`Confirm ${confirmAction?.type}`}
                message={`Are you sure you want to ${confirmAction?.type} the subscription for "${confirmAction?.sub.products?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default UserAccountPage;
