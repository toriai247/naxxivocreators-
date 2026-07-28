import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { BackArrowIcon, CoinIcon, UploadIcon, CheckCircleIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import { formatXp } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, Enums, Json } from '../../integrations/supabase/types';
import type { Session } from '@supabase/auth-js';
import ConfirmationModal from '../common/ConfirmationModal';

interface StorePageProps {
    onBack: () => void;
    session: Session;
    onNavigateToUploadCover: () => void;
    showNotification: (details: any) => void;
}

type StoreItem = Tables<'store_items'> & {
    profiles: { username: string } | null;
};

const ItemCard: React.FC<{ item: StoreItem, onPurchase: (item: StoreItem) => void, isOwned: boolean, canAfford: boolean }> = ({ item, onPurchase, isOwned, canAfford }) => {

    const handlePurchase = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPurchase(item);
    };

    return (
        <motion.div
            {...{
                layout: true,
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.8 },
                transition: { type: 'spring', stiffness: 300, damping: 25 },
            } as any}
            className={`bg-[var(--theme-card-bg)] rounded-2xl shadow-sm overflow-hidden flex flex-col relative`}
        >
            {isOwned && (
                 <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" /> Owned
                </div>
            )}
            <div className={`w-full h-32 bg-[var(--theme-bg)] flex items-center justify-center p-2 relative`}>
                <img src={item.preview_url || undefined} alt={item.name} className="object-contain max-h-full max-w-full" />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className={`font-bold text-[var(--theme-text)]`}>{item.name}</h3>
                {item.created_by_user_id && item.profiles && <p className="text-xs text-[var(--theme-text-secondary)]">by @{item.profiles.username}</p>}
                <p className="text-xs text-[var(--theme-text-secondary)] flex-grow mt-1">{item.description}</p>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center font-bold text-lg text-[var(--theme-primary)]">
                        <CoinIcon className="w-5 h-5 mr-1" />
                        <span>{item.price > 0 ? formatXp(item.price) : 'Free'}</span>
                    </div>
                     <Button onClick={handlePurchase} disabled={isOwned || !canAfford} size="small" className="w-auto px-4 !h-9">
                        {isOwned ? 'Owned' : 'Purchase'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};


const StorePage: React.FC<StorePageProps> = ({ onBack, session, onNavigateToUploadCover, showNotification }) => {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<StoreItem[]>([]);
    const [ownedItemIds, setOwnedItemIds] = useState<Set<number>>(new Set());
    const [userXp, setUserXp] = useState(0);
    const [confirmingPurchase, setConfirmingPurchase] = useState<StoreItem | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, inventoryRes, profileRes] = await Promise.all([
                supabase.from('store_items').select('*, profiles:created_by_user_id(username)').eq('is_active', true).eq('is_approved', true),
                supabase.from('user_inventory').select('item_id').eq('user_id', session.user.id),
                supabase.from('profiles').select('xp_balance').eq('id', session.user.id).single()
            ]);

            if (itemsRes.error) throw itemsRes.error;
            setItems((itemsRes.data as any) || []);

            if (inventoryRes.error) throw inventoryRes.error;
            setOwnedItemIds(new Set((inventoryRes.data as any[])?.map(i => i.item_id) || []));

            if (profileRes.error) throw profileRes.error;
            setUserXp((profileRes.data as any)?.xp_balance ?? 0);

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Error', message: `Error loading store: ${err.message}` });
        } finally {
            setLoading(false);
        }
    }, [session.user.id, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePurchaseClick = (item: StoreItem) => {
        setConfirmingPurchase(item);
    };

    const handleConfirmPurchase = async () => {
        if (!confirmingPurchase) return;

        setIsPurchasing(true);
        const { data, error } = await (supabase as any).rpc('buy_store_item', { p_item_id: confirmingPurchase.id });
        
        const resText = (data as string) || '';
        if (error) {
            showNotification({ type: 'error', title: 'Purchase Failed', message: error.message });
        } else if (resText.startsWith('Error:')) {
            showNotification({ type: 'error', title: 'Purchase Failed', message: resText });
        } else {
            showNotification({ type: 'success', title: 'Purchase Successful!', message: resText || `You now own ${confirmingPurchase.name}.` });
            await fetchData(); // Refresh data after purchase
        }
        setIsPurchasing(false);
        setConfirmingPurchase(null);
    };

    const filteredItems = items.filter(item => item.category === 'PROFILE_COVER');


    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">The Bazaar</h1>
                <div className="w-auto flex items-center gap-1 text-sm font-bold bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] px-3 py-1.5 rounded-full">
                    <CoinIcon className="w-5 h-5"/>
                    {formatXp(userXp)}
                </div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
                 {loading ? (
                     <div className="flex justify-center pt-20"><LoadingSpinner /></div>
                 ) : (
                    <motion.div {...{layout:true} as any} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                        <AnimatePresence>
                            <motion.button
                                {...{
                                    layout: true,
                                    initial: { opacity: 0, scale: 0.8 },
                                    animate: { opacity: 1, scale: 1 },
                                    exit: { opacity: 0, scale: 0.8 },
                                } as any}
                                onClick={onNavigateToUploadCover}
                                className="bg-[var(--theme-card-bg)] rounded-2xl shadow-sm flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[var(--theme-secondary)]/50 hover:border-[var(--theme-primary)] transition-colors min-h-[210px]"
                            >
                                <UploadIcon className="w-10 h-10 text-[var(--theme-primary)]"/>
                                <h3 className="font-bold text-[var(--theme-text)] mt-2">Upload Your Own</h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] mt-1">Cost: 25,000 XP</p>
                            </motion.button>
                            {filteredItems.map(item => (
                                <ItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onPurchase={handlePurchaseClick} 
                                    isOwned={ownedItemIds.has(item.id)}
                                    canAfford={userXp >= item.price}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                 )}
            </main>
            
            {confirmingPurchase && (
                <ConfirmationModal
                    isOpen={!!confirmingPurchase}
                    onClose={() => setConfirmingPurchase(null)}
                    onConfirm={handleConfirmPurchase}
                    title="Confirm Purchase"
                    message={`Are you sure you want to buy "${confirmingPurchase.name}" for ${confirmingPurchase.price} XP?`}
                    confirmText="Yes, Buy Now"
                    isConfirming={isPurchasing}
                />
            )}
        </div>
    );
};

export default StorePage;