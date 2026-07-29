import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, Json, TablesUpdate } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

type AppSetting = Tables<'app_settings'>;

const REQUIRED_DEFAULT_SETTINGS: AppSetting[] = [
    {
        key: 'payment_instructions',
        description: 'Instructions and wallet addresses displayed to users for manual crypto/fiat top-ups and store checkouts.',
        value: {
            binance_pay_id: "284910385 (Example Binance Pay ID)",
            recipient_name: "Aura Store Official",
            network: "USDT / TRC20 / BEP20",
            currency: "USDT / USD"
        },
        updated_at: new Date().toISOString()
    },
    {
        key: 'luck_royale_config',
        description: 'Configuration for Luck Royale spins, pricing, and duplicate prize compensation.',
        value: {
            costs: {
                GOLD: { single: 100, ten: 900 },
                SILVER: { single: 50, ten: 450 },
                DIAMOND: { single: 10, ten: 90 }
            },
            duplicate_consolation: { type: 'GOLD', amount: 50 },
            is_active: true
        },
        updated_at: new Date().toISOString()
    }
];

const AppSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<AppSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.from('app_settings').select('*');
            if (error && error.code !== 'PGRST116') {
                console.warn("Could not fetch app_settings:", error.message);
            }
            const fetched = (data as AppSetting[]) || [];
            const merged = [...fetched];
            for (const def of REQUIRED_DEFAULT_SETTINGS) {
                if (!merged.some(s => s.key === def.key)) {
                    merged.push(def);
                }
            }
            setSettings(merged);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleEdit = (setting: AppSetting) => {
        setEditingKey(setting.key);
        setEditValue(JSON.stringify(setting.value, null, 2));
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSave = async (key: string) => {
        let parsedValue: Json;
        try {
            parsedValue = JSON.parse(editValue);
        } catch (e) {
            alert('Invalid JSON format.');
            return;
        }

        const settingMeta = REQUIRED_DEFAULT_SETTINGS.find(s => s.key === key);
        const description = settings.find(s => s.key === key)?.description || settingMeta?.description || 'Application setting';

        const { error: updateError } = await (supabase
            .from('app_settings') as any)
            .upsert({ key, value: parsedValue, description }, { onConflict: 'key' });
        
        if (updateError) {
            alert(`Failed to save: ${updateError.message}`);
        } else {
            alert('Settings saved successfully!');
            setEditingKey(null);
            await fetchSettings();
        }
    };

    const handleInitializeDefaults = async () => {
        setLoading(true);
        try {
            for (const def of REQUIRED_DEFAULT_SETTINGS) {
                await (supabase.from('app_settings') as any).upsert({
                    key: def.key,
                    description: def.description,
                    value: def.value
                }, { onConflict: 'key' });
            }
            alert("Default settings (Payment Instructions & Luck Royale Config) seeded successfully into database!");
            await fetchSettings();
        } catch (e: any) {
            alert("Failed to seed defaults: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-12 text-slate-400 text-xs font-mono"><LoadingSpinner /></div>;
    if (error) return <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono">{error}</div>;

    return (
        <div className="space-y-4 font-sans">
            {/* Control Bar */}
            <div className="bg-yellow-400 border border-slate-900 p-3.5 text-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                    <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono">GLOBAL SYSTEM & APP CONFIGURATION</h2>
                    <p className="text-[10px] text-slate-800 font-mono font-bold">Live JSON configuration for payment wallets, Luck Royale mechanics, and app flags</p>
                </div>
                <button 
                    onClick={handleInitializeDefaults} 
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-900 text-xs font-black transition-none font-mono"
                >
                    [SEED / RESET DEFAULTS]
                </button>
            </div>

            {/* Settings Cards List */}
            <div className="space-y-3">
                {settings.map(setting => (
                    <div key={setting.key} className="p-4 border border-slate-200 bg-white space-y-2 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div>
                                <span className="text-xs font-black text-slate-900 uppercase tracking-wide font-mono">
                                    {setting.key.replace(/_/g, ' ')}
                                </span>
                                <span className="ml-2 text-[10px] px-2 py-0.5 bg-yellow-100 border border-yellow-300 text-slate-900 font-bold font-mono">
                                    KEY: {setting.key}
                                </span>
                            </div>
                            {editingKey !== setting.key && (
                                <button 
                                    onClick={() => handleEdit(setting)} 
                                    className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-slate-900 text-[10px] font-black active:bg-yellow-500 transition-none font-mono"
                                >
                                    [EDIT CONFIG]
                                </button>
                            )}
                        </div>

                        <p className="text-[11px] text-slate-600">{setting.description}</p>

                        {editingKey === setting.key ? (
                            <div className="space-y-2 pt-2">
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-3 bg-slate-900 text-yellow-300 border border-slate-900 font-mono text-xs focus:outline-none"
                                    rows={10}
                                />
                                <div className="flex space-x-2 font-mono">
                                    <button 
                                        onClick={() => handleSave(setting.key)} 
                                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border border-emerald-700 transition-none"
                                    >
                                        [SAVE CONFIG]
                                    </button>
                                    <button 
                                        onClick={handleCancel} 
                                        className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs border border-slate-300 transition-none"
                                    >
                                        [CANCEL]
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <pre className="p-3 bg-slate-900 border border-slate-900 text-[11px] text-yellow-400 font-mono overflow-x-auto">
                                {JSON.stringify(setting.value, null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppSettingsPage;