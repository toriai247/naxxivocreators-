import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, Enums, TablesUpdate } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

type StoreItemWithSellSettings = Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url' | 'sellable' | 'sell_price' | 'sell_currency'>;

const AdminSellSettingsPage: React.FC = () => {
    const [items, setItems] = useState<StoreItemWithSellSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [changes, setChanges] = useState<Record<number, Partial<StoreItemWithSellSettings>>>({});

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('store_items')
            .select('id, name, preview_url, sellable, sell_price, sell_currency')
            .order('name');
        
        if (error) {
            alert(error.message);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);
    
    const handleItemChange = (itemId: number, field: keyof StoreItemWithSellSettings, value: any) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        );
        setChanges(prevChanges => ({
            ...prevChanges,
            [itemId]: {
                ...prevChanges[itemId],
                [field]: value
            }
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const changedIds = Object.keys(changes);

        if (changedIds.length > 0) {
            try {
                // Perform individual updates for each changed item for reliability
                const updatePromises = changedIds.map(idStr => {
                    const id = Number(idStr);
                    const itemChanges = changes[id];
                    return (supabase
                        .from('store_items') as any)
                        .update(itemChanges)
                        .eq('id', id);
                });

                const results = await Promise.all(updatePromises);
                const firstError = results.find(res => res.error);

                if (firstError) {
                    throw firstError.error;
                }

                alert('Sell settings saved successfully!');
                setChanges({});
            } catch (error: any) {
                alert(`Failed to save changes: ${error.message}`);
            }
        }
        setIsSaving(false);
    };

    const hasUnsavedChanges = Object.keys(changes).length > 0;

    return (
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--theme-text)]">Item Sell Settings</h2>
                    <p className="text-sm text-[var(--theme-text-secondary)]">Configure which items users can sell back and for how much.</p>
                </div>
                <Button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} className="w-auto px-6">
                    {isSaving ? <LoadingSpinner /> : 'Save Changes'}
                </Button>
            </div>
             {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : (
                 <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">Item</th>
                                <th className="admin-th">Sellable</th>
                                <th className="admin-th">Currency</th>
                                <th className="admin-th">Sell Price</th>
                            </tr>
                        </thead>
                        <tbody className="admin-tbody">
                            {items.map(item => (
                                <tr key={item.id} className="admin-tr">
                                    <td className="admin-td">
                                        <div className="flex items-center gap-3">
                                            <img src={item.preview_url || ''} className="w-10 h-10 object-contain bg-[var(--theme-card-bg-alt)] rounded-md"/>
                                            <span className="font-medium text-[var(--theme-text)]">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="admin-td">
                                        <input
                                            type="checkbox"
                                            checked={!!item.sellable}
                                            onChange={e => handleItemChange(item.id, 'sellable', e.target.checked)}
                                            className="h-5 w-5 rounded text-[var(--theme-primary)] bg-transparent border-[var(--theme-secondary)] focus:ring-[var(--theme-primary)]"
                                        />
                                    </td>
                                    <td className="admin-td">
                                        <select
                                            value={item.sell_currency || 'GOLD'}
                                            onChange={e => handleItemChange(item.id, 'sell_currency', e.target.value as Enums<'currency'>)}
                                            disabled={!item.sellable}
                                            className="admin-select !py-1.5"
                                        >
                                            <option value="GOLD">Gold</option>
                                            <option value="SILVER">Silver</option>
                                            <option value="DIAMOND">Diamond</option>
                                        </select>
                                    </td>
                                    <td className="admin-td">
                                        <input
                                            type="number"
                                            value={item.sell_price || 0}
                                            onChange={e => handleItemChange(item.id, 'sell_price', Number(e.target.value))}
                                            disabled={!item.sellable}
                                            className="w-28 p-1.5 border rounded-md bg-[var(--theme-card-bg-alt)] border-[var(--theme-secondary)] text-[var(--theme-text)] focus:ring-1 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminSellSettingsPage;
