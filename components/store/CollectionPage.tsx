import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { BackArrowIcon, CheckCircleIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, Enums, Json } from '../../integrations/supabase/types';
import type { Session } from '@supabase/auth-js';


interface CollectionPageProps {
    onBack: () => void;
    session: Session;
    showNotification: (details: any) => void;
}

type InventoryItem = Tables<'user_inventory'> & {
    store_items: Pick<Tables<'store_items'>, 'id' | 'name' | 'description' | 'preview_url' | 'category' | 'asset_details'> | null
};


const InventoryCard: React.FC<{ item: InventoryItem, onEquip: (item: InventoryItem) => void, isEquipped: boolean }> = ({ item, onEquip, isEquipped }) => {
    
    if (!item.store_items) return null;

    return (
        <motion.div
            {...{
                layout: true,
                initial: { opacity: 0, scale: 0.8 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.8 },
                transition: { type: 'spring', stiffness: 300, damping: 25 },
            } as any}
            className="bg-[var(--theme-card-bg)] rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
            <div className="w-full h-32 bg-[var(--theme-bg)] flex items-center justify-center p-2">
                <img src={item.store_items.preview_url || undefined} alt={item.store_items.name} className={`object-contain max-h-full max-w-full ${item.store_items.category === 'PROFILE_COVER' ? 'h-24 w-24' : ''}`} />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-[var(--theme-text)]">{item.store_items.name}</h3>
                <p className="text-xs text-[var(--theme-text-secondary)] flex-grow mt-1">{item.store_items.description}</p>
                 <div className="flex items-center gap-2 mt-3">
                    <Button 
                        onClick={() => onEquip(item)} 
                        size="small" 
                        variant={isEquipped ? 'secondary' : 'primary'}
                        className="flex-grow"
                    >
                        {isEquipped ? <><CheckCircleIcon className="mr-2" /> Equipped</> : 'Equip'}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

const CollectionPage: React.FC<CollectionPageProps> = ({ onBack, session, showNotification }) => {
    const [ownedItems, setOwnedItems] = useState<InventoryItem[]>([]);
    const [equippedItemIds, setEquippedItemIds] = useState<{ cover: number | null }>({ cover: null });
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [inventoryRes, profileRes] = await Promise.all([
                 supabase.from('user_inventory')
                    .select(`*, store_items (id, name, description, preview_url, category, asset_details)`)
                    .eq('user_id', session.user.id),
                supabase.from('profiles')
                    .select('active_cover_id')
                    .eq('id', session.user.id)
                    .single()
            ]);

            if (inventoryRes.error) throw inventoryRes.error;
            setOwnedItems(inventoryRes.data || []);

            if (profileRes.error) throw profileRes.error;
            const prof = profileRes.data as any;
            setEquippedItemIds({
                cover: prof?.active_cover_id ?? null,
            });

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Error', message: `Error loading collection: ${err.message}`});
        } finally {
            setLoading(false);
        }
    }, [session.user.id, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEquip = async (item: InventoryItem) => {
        const { data, error } = await (supabase as any).rpc('equip_inventory_item', { p_inventory_id: item.id });
        if(error) {
            showNotification({ type: 'error', title: 'Error', message: `Failed to equip item: ${error.message}`});
        } else {
            showNotification({ type: 'success', title: 'Success', message: data });
            await fetchData(); // Refresh to show new equipped state
        }
    };

    const filteredItems = ownedItems.filter(item => item.store_items?.category === 'PROFILE_COVER');

    const isEquipped = (item: InventoryItem): boolean => {
        if (!item.store_items) return false;
        return item.store_items.category === 'PROFILE_COVER' && equippedItemIds.cover === item.item_id;
    }

    return (
        <>
            <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
                <header className="flex-shrink-0 flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                    <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                    <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">My Inventory</h1>
                    <div className="w-6"></div>
                </header>

                <main className="flex-grow overflow-y-auto p-4 sm:p-8 max-w-7xl mx-auto w-full">
                    {loading ? <div className="flex justify-center pt-20"><LoadingSpinner /></div> : 
                     filteredItems.length > 0 ? (
                        <motion.div {...{layout:true} as any} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                            <AnimatePresence>
                                {filteredItems.map(item => (
                                    <InventoryCard 
                                        key={item.id} 
                                        item={item} 
                                        onEquip={handleEquip}
                                        isEquipped={isEquipped(item)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="text-center py-20 text-[var(--theme-text-secondary)]">
                            <p>You don't own any items.</p>
                            <p className="text-sm">Visit The Bazaar to get new items!</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default CollectionPage;