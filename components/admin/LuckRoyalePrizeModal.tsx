import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, Enums, TablesInsert } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Input from '../common/Input';

interface LuckRoyalePrizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type StoreItem = Pick<Tables<'store_items'>, 'id' | 'name'>;

const LuckRoyalePrizeModal: React.FC<LuckRoyalePrizeModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
    const [prizeType, setPrizeType] = useState<Enums<'luck_royale_prize_type'>>('ITEM');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [currencyType, setCurrencyType] = useState<Enums<'currency'>>('GOLD');
    const [currencyAmount, setCurrencyAmount] = useState(100);
    const [poolCurrency, setPoolCurrency] = useState<Enums<'currency'>>('GOLD');
    const [rarity, setRarity] = useState<Enums<'luck_royale_rarity'>>('COMMON');
    const [loadingItems, setLoadingItems] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchStoreItems = async () => {
                setLoadingItems(true);
                const { data, error } = await supabase
                    .from('store_items')
                    .select('id, name')
                    .eq('is_active', true)
                    .order('name');
                if (error) {
                    alert('Could not load store items.');
                } else {
                    const list = (data as any) || [];
                    setStoreItems(list);
                    if (list.length > 0) {
                        setSelectedItemId(String(list[0].id));
                    }
                }
                setLoadingItems(false);
            };
            fetchStoreItems();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let newPrize: Partial<TablesInsert<'luck_royale_prizes'>> = {
                rarity: rarity,
                currency: poolCurrency,
                prize_type: prizeType,
            };

            if (prizeType === 'ITEM') {
                newPrize.item_id = Number(selectedItemId);
            } else {
                newPrize.currency_type = currencyType;
                newPrize.currency_amount = Number(currencyAmount);
            }

            const { error } = await supabase.from('luck_royale_prizes').insert(newPrize as any);
            if (error) throw error;
            
            onSuccess();
            onClose();

        } catch (error: any) {
            alert(`Failed to add prize: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
                     <motion.div
                        {...{
                            initial: { opacity: 0, y: -50 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 50 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-lg w-full flex flex-col border border-[var(--theme-secondary)]"
                        onClick={e => e.stopPropagation()}
                     >
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-[var(--theme-secondary)]">
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">Add Prize to Pool</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {loadingItems ? <LoadingSpinner/> : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Prize Type</label>
                                            <select value={prizeType} onChange={e => setPrizeType(e.target.value as any)} className="admin-select">
                                                <option value="ITEM">Store Item</option>
                                                <option value="CURRENCY">Currency</option>
                                            </select>
                                        </div>
                                        {prizeType === 'ITEM' ? (
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Store Item</label>
                                                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="admin-select">
                                                    {storeItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Currency</label>
                                                     <select value={currencyType} onChange={e => setCurrencyType(e.target.value as any)} className="admin-select">
                                                        <option value="GOLD">Gold</option>
                                                        <option value="SILVER">Silver</option>
                                                        <option value="DIAMOND">Diamond</option>
                                                    </select>
                                                </div>
                                                <Input id="currencyAmount" label="Amount" type="number" value={currencyAmount} onChange={e => setCurrencyAmount(Number(e.target.value))} />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Rarity</label>
                                            <select value={rarity} onChange={e => setRarity(e.target.value as any)} className="admin-select">
                                                <option value="COMMON">COMMON (High Chance)</option>
                                                <option value="RARE">RARE (Medium Chance)</option>
                                                <option value="LEGENDARY">LEGENDARY (Low Chance)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Add to Pool</label>
                                            <select value={poolCurrency} onChange={e => setPoolCurrency(e.target.value as any)} className="admin-select">
                                                <option value="GOLD">Gold Pool</option>
                                                <option value="SILVER">Silver Pool</option>
                                                <option value="DIAMOND">Diamond Pool</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="p-4 bg-black/20 flex justify-end space-x-3 border-t border-[var(--theme-secondary)]">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving || loadingItems} className="w-auto px-6">
                                    {isSaving ? <LoadingSpinner/> : 'Add Prize'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default LuckRoyalePrizeModal;