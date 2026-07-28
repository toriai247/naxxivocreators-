import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { BackArrowIcon, GoldCoinIcon, SilverCoinIcon, DiamondIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, Enums, Json } from '../../integrations/supabase/types';
import type { Session } from '@supabase/auth-js';
import ConfirmationModal from '../common/ConfirmationModal';
import { formatXp } from '../../utils/helpers';

interface SellPageProps {
    onBack: () => void;
    session: Session;
    showNotification: (details: any) => void;
}

// This type now matches the structure returned by our get_sellable_inventory_items RPC
type SellableInventoryItem = {
    id: number; // This is user_inventory.id
    store_items: {
        id: number;
        name: string;
        preview_url: string | null;
        sell_price: number | null;
        sell_currency: Enums<'currency'> | null;
    }
};

const currencyIcons: Record<string, React.FC<{ className?: string }>> = {
    GOLD: GoldCoinIcon,
    SILVER: SilverCoinIcon,
    DIAMOND: DiamondIcon,
};
const currencyColors: Record<string, string> = {
    GOLD: 'text-yellow-500',
    SILVER: 'text-gray-400',
    DIAMOND: 'text-cyan-400',
};


const SellItemCard: React.FC<{ item: SellableInventoryItem, onSell: (item: SellableInventoryItem) => void }> = ({ item, onSell }) => {
    if (!item.store_items || !item.store_items.sell_price || !item.store_items.sell_currency) return null;
    
    const CurrencyIcon = currencyIcons[item.store_items.sell_currency];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className="bg-[var(--theme-card-bg)] rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
            <div className="w-full h-32 bg-[var(--theme-bg)] flex items-center justify-center p-2">
                <img src={item.store_items.preview_url || undefined} alt={item.store_items.name} className="object-contain max-h-full max-w-full h-24 w-24" />
            </div>
            <div className="p-4 flex flex-col flex-grow text-center">
                <h3 className="font-bold text-sm text-[var(--theme-text)]">{item.store_items.name}</h3>
                <div className="flex items-center justify-center font-bold text-lg my-3">
                    <CurrencyIcon className={`w-5 h-5 mr-1 ${currencyColors[item.store_items.sell_currency]}`} />
                    <span className={currencyColors[item.store_items.sell_currency]}>{item.store_items.sell_price.toLocaleString()}</span>
                </div>
                <Button 
                    onClick={() => onSell(item)} 
                    size="small" 
                    className="w-full mt-auto"
                >
                    Sell
                </Button>
            </div>
        </motion.div>
    );
};


const SellPage: React.FC<SellPageProps> = ({ onBack, session, showNotification }) => {
    const [sellableItems, setSellableItems] = useState<SellableInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [itemToSell, setItemToSell] = useState<SellableInventoryItem | null>(null);
    const [isSelling, setIsSelling] = useState(false);
    const [userBalances, setUserBalances] = useState({ GOLD: 0, SILVER: 0, DIAMOND: 0 });


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, profileRes] = await Promise.all([
                supabase.rpc('get_sellable_inventory_items'),
                supabase.from('profiles').select('gold_coins, silver_coins, diamond_coins').eq('id', session.user.id).single()
            ]);

            if (itemsRes.error) throw itemsRes.error;
            setSellableItems((itemsRes.data as any) || []);

            if (profileRes.error) throw profileRes.error;
            const prof = profileRes.data as any;
            if (prof) {
                setUserBalances({
                    GOLD: prof.gold_coins || 0,
                    SILVER: prof.silver_coins || 0,
                    DIAMOND: prof.diamond_coins || 0,
                });
            }

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Error', message: `Error loading items: ${err.message}` });
        } finally {
            setLoading(false);
        }
    }, [session.user.id, showNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSellClick = (item: SellableInventoryItem) => {
        setItemToSell(item);
    };
    
    const handleConfirmSell = async () => {
        if (!itemToSell) return;
        setIsSelling(true);
        try {
            const { data, error } = await (supabase as any).rpc('sell_item_from_inventory', {
                p_inventory_id: itemToSell.id
            });
            if (error) throw error;
            const resText = (data as string) || '';
            if (resText.startsWith('Error:')) throw new Error(resText);

            showNotification({ type: 'success', title: 'Success!', message: resText });
            
            // Re-fetch data to update balances and item list
            await fetchData();

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Sell Failed', message: err.message });
        } finally {
            setIsSelling(false);
            setItemToSell(null);
        }
    };
    
    // Group items by currency for rendering
    const groupedItems = useMemo(() => sellableItems.reduce((acc, item) => {
        const currency = item.store_items?.sell_currency;
        if (currency) {
            if (!acc[currency]) {
                acc[currency] = [];
            }
            acc[currency].push(item);
        }
        return acc;
    }, {} as Record<Enums<'currency'>, SellableInventoryItem[]>), [sellableItems]);

    const currencyOrder: Enums<'currency'>[] = ['GOLD', 'SILVER', 'DIAMOND'];


    return (
        <>
            <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                    <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                    <h1 className="text-xl font-bold text-[var(--theme-header-text)]">Pawn Shop</h1>
                    <div className="flex items-center gap-2 text-sm font-bold bg-[var(--theme-card-bg-alt)] px-3 py-1.5 rounded-full border border-[var(--theme-secondary)]">
                        <GoldCoinIcon className="w-5 h-5 text-yellow-500"/> <span className="text-[var(--theme-text)]">{formatXp(userBalances.GOLD)}</span>
                        <SilverCoinIcon className="w-5 h-5 text-gray-400 ml-1"/> <span className="text-[var(--theme-text)]">{formatXp(userBalances.SILVER)}</span>
                        <DiamondIcon className="w-5 h-5 text-cyan-400 ml-1"/> <span className="text-[var(--theme-text)]">{formatXp(userBalances.DIAMOND)}</span>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto p-4">
                    {loading ? <div className="flex justify-center pt-20"><LoadingSpinner /></div> : 
                     sellableItems.length > 0 ? (
                        <div className="space-y-6">
                            {currencyOrder.map(currency => {
                                const itemsForCurrency = groupedItems[currency];
                                if (!itemsForCurrency || itemsForCurrency.length === 0) return null;

                                const CurrencyIcon = currencyIcons[currency as Enums<'currency'>];

                                return (
                                    <section key={currency}>
                                        <h2 className={`flex items-center gap-2 text-lg font-bold mb-3 ${currencyColors[currency as Enums<'currency'>]}`}>
                                            <CurrencyIcon className="w-6 h-6" />
                                            Sell for {currency.charAt(0) + currency.slice(1).toLowerCase()}
                                        </h2>
                                        <div className="grid grid-cols-2 gap-4">
                                            <AnimatePresence>
                                                {itemsForCurrency.map(item => (
                                                    <SellItemCard 
                                                        key={item.id} 
                                                        item={item} 
                                                        onSell={handleSellClick}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 px-4 flex flex-col items-center">
                            <div className="text-4xl mb-4">💰</div>
                            <h2 className="text-xl font-semibold text-[var(--theme-text)]">Nothing to Sell</h2>
                            <p className="text-[var(--theme-text-secondary)] mt-2 max-w-xs">Items that can be sold will appear here. Admins can make items sellable in the "Sell Settings" panel.</p>
                        </div>
                    )}
                </main>
            </div>
             <ConfirmationModal
                isOpen={!!itemToSell}
                onClose={() => setItemToSell(null)}
                onConfirm={handleConfirmSell}
                title="Confirm Sale"
                message={`Are you sure you want to sell "${itemToSell?.store_items?.name}" for ${itemToSell?.store_items?.sell_price?.toLocaleString()} ${itemToSell?.store_items?.sell_currency}?`}
                confirmText="Yes, Sell Item"
                isConfirming={isSelling}
            />
        </>
    );
};

export default SellPage;