import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { generateAvatar } from '../../utils/helpers';

type CoverForApproval = Tables<'store_items'> & {
    profiles: { name: string, username: string, photo_url: string | null } | null;
};

const AdminCoverApprovalPage: React.FC<{ session: Session }> = ({ session }) => {
    const [covers, setCovers] = useState<CoverForApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchPendingCovers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('store_items')
                .select('*, profiles:created_by_user_id(name, username, photo_url)')
                .eq('is_approved', false)
                .eq('category', 'PROFILE_COVER')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setCovers((data as any) || []);
        } catch (error: any) {
            alert(`Failed to fetch covers: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingCovers();
    }, [fetchPendingCovers]);

    const handleApproval = async (itemId: number, shouldApprove: boolean) => {
        setProcessingId(itemId);
        try {
            if (shouldApprove) {
                const { error } = await (supabase
                    .from('store_items') as any)
                    .update({ is_approved: true, is_active: true })
                    .eq('id', itemId);
                if (error) throw error;
            } else {
                // To reject, we delete the item. Consider deleting from storage too.
                const { error } = await supabase
                    .from('store_items')
                    .delete()
                    .eq('id', itemId);
                if (error) throw error;
            }
            await fetchPendingCovers();
        } catch (error: any) {
            alert(`Action failed: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
            <h2 className="text-2xl font-bold text-[var(--theme-text)] mb-4">Profile Cover Approvals</h2>
            {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : covers.length === 0 ? (
                <p className="text-[var(--theme-text-secondary)]">No pending covers to review.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {covers.map(cover => (
                         <div key={cover.id} className="bg-[var(--theme-card-bg-alt)] rounded-xl shadow-lg border border-[var(--theme-secondary)] overflow-hidden flex flex-col">
                            <div className="p-4 bg-[var(--theme-bg)] flex flex-col items-center justify-center">
                                <div className="relative w-40 h-40">
                                    <img src={generateAvatar(cover.profiles?.username || '')} alt="Sample Avatar" className="w-32 h-32 rounded-full object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
                                    <img src={cover.preview_url || undefined} alt="Cover Preview" className="w-full h-full object-contain absolute inset-0"/>
                                </div>
                            </div>
                            <div className="p-4 flex-grow">
                                <h3 className="font-bold text-lg text-[var(--theme-text)]">{cover.name}</h3>
                                <p className="text-sm text-[var(--theme-text-secondary)] mt-1">{cover.description}</p>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--theme-secondary)]">
                                    <img src={cover.profiles?.photo_url || generateAvatar(cover.profiles?.username || '')} className="w-8 h-8 rounded-full" alt="creator avatar"/>
                                    <div>
                                        <p className="text-sm font-semibold text-[var(--theme-text)]/90">{cover.profiles?.name || cover.profiles?.username}</p>
                                        <p className="text-xs text-[var(--theme-text-secondary)]">@{cover.profiles?.username}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-black/20 flex items-center gap-2">
                                <button
                                    onClick={() => handleApproval(cover.id, true)}
                                    disabled={processingId === cover.id}
                                    className="flex-1 px-3 py-2 btn-success text-sm font-semibold rounded-lg disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {processingId === cover.id ? <LoadingSpinner/> : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleApproval(cover.id, false)}
                                    disabled={processingId === cover.id}
                                    className="flex-1 px-3 py-2 btn-danger text-sm font-semibold rounded-lg disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {processingId === cover.id ? '...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCoverApprovalPage;