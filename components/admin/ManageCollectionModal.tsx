import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, TablesInsert } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import { DeleteIcon, AddIcon } from '../common/AppIcons';

interface ManageCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onUpdate: () => void;
}

type StoreItem = Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url'>;
type InventoryItem = Tables<'user_inventory'> & { store_items: StoreItem | null };

const ManageCollectionModal: React.FC<ManageCollectionModalProps> = ({ isOpen, onClose, userId, onUpdate }) => {
    const [allItems, setAllItems] = useState<StoreItem[]>([]);
    const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchDataForModal = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, inventoryRes] = await Promise.all([
                supabase.from('store_items').select('id, name, preview_url'),
                supabase.from('user_inventory').select('*, store_items(id, name, preview_url)').eq('user_id', userId)
            ]);
            if (itemsRes.error) throw itemsRes.error;
            setAllItems(itemsRes.data || []);
            if (inventoryRes.error) throw inventoryRes.error;
            setUserInventory(inventoryRes.data || []);
        } catch (error: any) {
            alert(`Failed to load collection data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen) {
            fetchDataForModal();
        }
    }, [isOpen, userId, fetchDataForModal]);

    const ownedItemIds = useMemo(() => new Set(userInventory.map(i => i.item_id)), [userInventory]);
    const availableItems = useMemo(() => {
        const filtered = allItems.filter(item => !ownedItemIds.has(item.id));
        if (!searchTerm) return filtered;
        return filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allItems, ownedItemIds, searchTerm]);

    const handleAddItem = async (itemId: number) => {
        const { error } = await (supabase.from('user_inventory') as any).insert({ user_id: userId, item_id: itemId });
        if (error) {
            alert(error.message);
        } else {
            await fetchDataForModal();
            onUpdate();
        }
    };

    const handleRemoveItem = async (inventoryId: number) => {
        if (window.confirm("Are you sure you want to remove this item from the user's collection?")) {
             const { error } = await (supabase as any).rpc('admin_delete_user_inventory_item', {
                inventory_id_to_delete: inventoryId
            });

            if (error) {
                alert(`Failed to remove item: ${error.message}`);
            } else {
                await fetchDataForModal();
                onUpdate();
            }
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        {...{ initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 50 } } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-4xl w-full flex flex-col h-[80vh] border border-[var(--theme-secondary)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-[var(--theme-secondary)]">
                            <h2 className="text-xl font-bold text-[var(--theme-text)]">Manage Collection</h2>
                        </header>
                        <main className="flex-grow flex flex-col md:flex-row min-h-0">
                            {/* Owned Items */}
                            <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-[var(--theme-secondary)] flex flex-col">
                                <h3 className="font-semibold mb-2 text-[var(--theme-text)]/90">Owned Items ({userInventory.length})</h3>
                                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                                    {loading ? <div className="flex justify-center items-center h-full"><LoadingSpinner/></div> : userInventory.map(item => item.store_items && (
                                        <div key={item.id} className="flex items-center p-2 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                                            <img src={item.store_items.preview_url || ''} className="w-8 h-8 object-contain"/>
                                            <span className="ml-2 text-sm flex-grow truncate text-[var(--theme-text)]">{item.store_items.name}</span>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-400 p-1"><DeleteIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             {/* Available Items */}
                            <div className="w-full md:w-1/2 p-4 flex flex-col">
                                <h3 className="font-semibold mb-2 text-[var(--theme-text)]/90">Add Items</h3>
                                <input type="text" placeholder="Search available items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 mb-2 border rounded-md bg-[var(--theme-card-bg-alt)] border-[var(--theme-secondary)] focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"/>
                                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                                    {loading ? <div className="flex justify-center items-center h-full"><LoadingSpinner/></div> : availableItems.map(item => (
                                        <div key={item.id} className="flex items-center p-2 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                                            <img src={item.preview_url || ''} className="w-8 h-8 object-contain"/>
                                            <span className="ml-2 text-sm flex-grow truncate text-[var(--theme-text)]">{item.name}</span>
                                            <button onClick={() => handleAddItem(item.id)} className="text-green-500 hover:text-green-400 p-1"><AddIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </main>
                         <footer className="p-4 bg-black/20 flex justify-end border-t border-[var(--theme-secondary)]">
                            <Button onClick={onClose} variant="secondary" className="w-auto">Close</Button>
                        </footer>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default ManageCollectionModal;