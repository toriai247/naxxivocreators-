import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, Enums } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Input from '../common/Input';
import LuckRoyalePrizeModal from './LuckRoyalePrizeModal';
import { GoldCoinIcon, SilverCoinIcon, DiamondIcon } from '../common/AppIcons';

type Prize = Tables<'luck_royale_prizes'> & {
    store_items: Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url'> | null;
};
type Costs = {
    GOLD: { single: number, ten: number },
    SILVER: { single: number, ten: number },
    DIAMOND: { single: number, ten: number },
};
type Config = {
    costs: Costs;
    duplicate_consolation: { type: string, amount: number };
    is_active: boolean;
};
type Currency = Enums<'currency'>;

const DEFAULT_LUCK_ROYALE_CONFIG: Config = {
    costs: {
        GOLD: { single: 100, ten: 900 },
        SILVER: { single: 50, ten: 450 },
        DIAMOND: { single: 10, ten: 90 }
    },
    duplicate_consolation: { type: 'GOLD', amount: 50 },
    is_active: true
};

const AdminLuckRoyalePage: React.FC<{ session: Session }> = ({ session }) => {
    const [config, setConfig] = useState<Config | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Currency>('GOLD');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [configRes, prizesRes] = await Promise.all([
                supabase.from('app_settings').select('value').eq('key', 'luck_royale_config').single(),
                supabase.from('luck_royale_prizes').select('*, store_items(id, name, preview_url)').order('created_at')
            ]);
            if (configRes.error && configRes.error.code !== 'PGRST116') {
                console.warn("Could not load luck_royale_config from DB, using default:", configRes.error.message);
            }
            setConfig(((configRes.data as any)?.value as Config) || DEFAULT_LUCK_ROYALE_CONFIG);

            if (prizesRes.error) throw prizesRes.error;
            setPrizes((prizesRes.data as any) || []);

        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCostChange = (currency: Currency, type: 'single' | 'ten', value: number) => {
        setConfig(prev => {
            if (!prev) return null;
            const newCosts = { ...prev.costs };
            newCosts[currency] = { ...newCosts[currency], [type]: value };
            return { ...prev, costs: newCosts };
        });
    };

    const handleConsolationChange = (field: 'type' | 'amount', value: string | number) => {
        setConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                duplicate_consolation: {
                    ...prev.duplicate_consolation,
                    [field]: value
                }
            };
        });
    };
    
    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            const { error } = await (supabase.from('app_settings') as any).update({ value: config }).eq('key', 'luck_royale_config');
            if (error) throw error;
            alert('Configuration saved!');
        } catch (error: any) {
            alert(`Failed to save config: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRemovePrize = async (prizeId: number) => {
        if(window.confirm('Are you sure you want to remove this prize from the pool?')) {
            const { error } = await supabase.from('luck_royale_prizes').delete().eq('id', prizeId);
            if(error) alert(error.message);
            else await fetchData();
        }
    }

    if (loading) return <div className="flex justify-center"><LoadingSpinner /></div>;
    if (!config) return <p className="text-red-500">Could not load event configuration.</p>;

    const filteredPrizes = prizes.filter(p => p.currency === activeTab);

    return (
        <div className="space-y-6">
            <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
                <h2 className="text-2xl font-bold text-[var(--theme-text)] mb-4">Event Configuration</h2>
                 <div className="space-y-4">
                    {(['GOLD', 'SILVER', 'DIAMOND'] as Currency[]).map(currency => (
                        <div key={currency} className="p-3 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                            <h3 className="font-semibold capitalize text-[var(--theme-text)]/90">{currency.toLowerCase()} Spin Costs</h3>
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <Input id={`${currency}-single-spin`} label="Single Spin" type="number" value={config.costs[currency]?.single || 0} onChange={e => handleCostChange(currency, 'single', Number(e.target.value))} />
                                <Input id={`${currency}-ten-spin`} label="10-Spin" type="number" value={config.costs[currency]?.ten || 0} onChange={e => handleCostChange(currency, 'ten', Number(e.target.value))} />
                            </div>
                        </div>
                    ))}
                     <div className="p-3 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                        <h3 className="font-semibold text-[var(--theme-text)]/90">Duplicate Consolation Prize</h3>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                                <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Type</label>
                                <select value={config.duplicate_consolation.type} onChange={e => handleConsolationChange('type', e.target.value)} className="admin-select">
                                    <option value="XP">XP</option>
                                    <option value="GOLD">Gold</option>
                                    <option value="SILVER">Silver</option>
                                    <option value="DIAMOND">Diamond</option>
                                </select>
                            </div>
                            <Input id="consolation_amount" label="Amount" type="number" value={config.duplicate_consolation.amount} onChange={e => handleConsolationChange('amount', Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-md">
                         <label htmlFor="is_active" className="text-sm font-medium text-[var(--theme-text)]/90">Event is Active</label>
                         <button type="button" onClick={() => setConfig(p => p ? {...p, is_active: !p.is_active} : null)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${config.is_active ? 'bg-[var(--theme-primary)]' : 'bg-gray-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${config.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
                 <Button onClick={handleSaveConfig} disabled={isSaving} className="mt-4">
                    {isSaving ? <LoadingSpinner/> : 'Save Configuration'}
                </Button>
            </div>
            
            <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[var(--theme-text)]">Prize Pool</h2>
                    <Button onClick={() => setIsModalOpen(true)}>Add Prize</Button>
                </div>
                <div className="border-b border-[var(--theme-secondary)] mb-4">
                    <nav className="-mb-px flex space-x-6">
                        {(['GOLD', 'SILVER', 'DIAMOND'] as Currency[]).map(currency => (
                            <button key={currency} onClick={() => setActiveTab(currency)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === currency ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:border-gray-500'}`}>
                                {currency} POOL
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="overflow-x-auto">
                    <table className="admin-table">
                         <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">Prize</th>
                                <th className="admin-th">Type</th>
                                <th className="admin-th">Rarity</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="admin-tbody">
                             {filteredPrizes.map(prize => (
                                <tr key={prize.id} className="admin-tr">
                                    <td className="admin-td">
                                        <div className="flex items-center">
                                             {prize.prize_type === 'ITEM' && prize.store_items ? (
                                                <>
                                                    <div className="flex-shrink-0 h-10 w-10 bg-[var(--theme-card-bg-alt)] rounded-md flex items-center justify-center">
                                                        <img src={prize.store_items?.preview_url || ''} alt="" className="h-8 w-8 object-contain" />
                                                    </div>
                                                    <div className="ml-4 text-sm font-medium text-[var(--theme-text)]">{prize.store_items?.name}</div>
                                                </>
                                            ) : (
                                                 <div className="flex items-center gap-2 text-[var(--theme-text)]">
                                                    {prize.currency_type === 'GOLD' && <GoldCoinIcon className="text-yellow-500"/>}
                                                    {prize.currency_type === 'SILVER' && <SilverCoinIcon className="text-gray-400"/>}
                                                    {prize.currency_type === 'DIAMOND' && <DiamondIcon className="text-cyan-400"/>}
                                                    <span className="font-semibold">{prize.currency_amount?.toLocaleString()} {prize.currency_type}</span>
                                                 </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="admin-td font-mono text-[var(--theme-text-secondary)]">{prize.prize_type}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{prize.rarity}</td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => handleRemovePrize(prize.id)} className="text-red-500 hover:text-red-400 font-semibold">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <LuckRoyalePrizeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default AdminLuckRoyalePage;