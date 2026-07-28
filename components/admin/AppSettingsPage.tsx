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

    if (loading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                     <h2 className="text-2xl font-bold text-[var(--theme-text)]">Application Settings</h2>
                     <p className="text-[var(--theme-text-secondary)] mt-1">Manage global settings for the application. Be careful, these changes are live.</p>
                 </div>
                 <Button onClick={handleInitializeDefaults} variant="secondary" size="small" className="w-auto px-4 whitespace-nowrap bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30">
                     ⚡ Initialize / Reset Defaults in DB
                 </Button>
             </div>
            <div className="space-y-6 pt-6">
                {settings.map(setting => (
                    <div key={setting.key} className="p-4 border border-[var(--theme-secondary)] rounded-lg bg-[var(--theme-card-bg-alt)]/50">
                        <h3 className="font-semibold text-lg capitalize text-[var(--theme-text)]/90">{setting.key.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-[var(--theme-text-secondary)] mb-2">{setting.description}</p>
                        {editingKey === setting.key ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="json-textarea"
                                    rows={8}
                                />
                                <div className="flex space-x-2">
                                    <Button onClick={() => handleSave(setting.key)} size="small" className="w-auto px-4">Save</Button>
                                    <Button onClick={handleCancel} variant="secondary" size="small" className="w-auto px-4">Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <pre className="json-textarea p-3 text-sm overflow-x-auto text-[var(--theme-text-secondary)]">
                                    {JSON.stringify(setting.value, null, 2)}
                                </pre>
                                <button onClick={() => handleEdit(setting)} className="text-sm font-semibold mt-2 btn-edit">Edit</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AppSettingsPage;