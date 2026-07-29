import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, TablesUpdate, TablesInsert } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import StoreItemFormModal from './StoreItemFormModal';

type StoreItem = Tables<'store_items'>;

interface AdminStoreItemsPageProps {
    session: Session;
}

const AdminStoreItemsPage: React.FC<AdminStoreItemsPageProps> = ({ session }) => {
    const [items, setItems] = useState<StoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('store_items').select('*').order('created_at');
        if (error) {
            console.error("Failed to fetch store items:", error);
            alert(`Error: ${error.message}`);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: StoreItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveItem = async (itemData: Partial<StoreItem>) => {
        try {
            const payload: TablesUpdate<'store_items'> = {
                name: itemData.name,
                description: itemData.description,
                category: itemData.category,
                price: Number(itemData.price) || 0,
                preview_url: itemData.preview_url,
                asset_details: itemData.asset_details,
                is_active: itemData.is_active,
                is_approved: itemData.is_approved,
            };
            
            if (editingItem) { // If we are editing, update the existing item
                const { error } = await (supabase
                    .from('store_items') as any)
                    .update(payload)
                    .eq('id', editingItem.id);
                if (error) throw error;
            } else { // Otherwise, insert a new item
                const insertPayload: TablesInsert<'store_items'> = {
                    name: payload.name!,
                    category: payload.category!,
                    description: payload.description,
                    price: payload.price,
                    preview_url: payload.preview_url,
                    asset_details: payload.asset_details,
                    is_active: payload.is_active,
                    is_approved: payload.is_approved,
                    created_by_user_id: null, // Admin-created items
                };
                const { error } = await (supabase
                    .from('store_items') as any)
                    .insert(insertPayload);
                if (error) throw error;
            }
            
            setIsModalOpen(false);
            await fetchItems();
        } catch (error: any) {
            console.error('Failed to save store item:', error);
            let detailMessage = 'An unknown error occurred.';
            if (error) {
                if (error.message) {
                    detailMessage = `Message: ${error.message}`;
                    if (error.details) detailMessage += `\nDetails: ${error.details}`;
                    if (error.hint) detailMessage += `\nHint: ${error.hint}`;
                    if (error.code) detailMessage += `\nCode: ${error.code}`;
                } else {
                    try {
                        detailMessage = JSON.stringify(error, null, 2);
                    } catch {
                        detailMessage = "Could not stringify the error object. Check the console for more details.";
                    }
                }
            }
            alert(`Save failed: ${detailMessage}`);
        }
    };

    return (
        <div className="space-y-3 font-sans">
            {/* Control Bar */}
            <div className="bg-yellow-400 border border-slate-900 p-3.5 text-slate-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
                <div>
                    <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono">BAZAAR DIGITAL STORE ITEMS</h2>
                    <p className="text-[10px] text-slate-800 font-mono font-bold">Manage digital collectibles, profile frames, avatars, themes & pricing</p>
                </div>
                <button 
                    onClick={handleCreateNew}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-900 text-xs font-black transition-none font-mono"
                >
                    + CREATE NEW ITEM
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12 text-slate-500 text-xs font-mono"><LoadingSpinner /></div>
            ) : items.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 text-center text-xs text-slate-500 font-mono">
                    NO STORE ITEMS FOUND IN THE DATABASE
                </div>
            ) : (
                <div className="border border-slate-200 bg-white overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider font-mono">
                                <th className="p-3 border-r border-slate-200">Preview</th>
                                <th className="p-3 border-r border-slate-200">Item Name & ID</th>
                                <th className="p-3 border-r border-slate-200">Category</th>
                                <th className="p-3 border-r border-slate-200">Price (XP)</th>
                                <th className="p-3 border-r border-slate-200">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-yellow-50/60 transition-none">
                                    <td className="p-3 border-r border-slate-200 w-12">
                                        <div className="w-8 h-8 bg-slate-50 border border-slate-300 flex items-center justify-center overflow-hidden">
                                            {item.preview_url ? (
                                                <img src={item.preview_url} alt={item.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <span className="text-[9px] text-slate-400 font-bold font-mono">N/A</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 border-r border-slate-200">
                                        <div className="font-bold text-slate-900">{item.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{item.id.substring(0, 10)}...</div>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono">
                                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                                            {item.category?.replace(/_/g, ' ') || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-bold text-yellow-700 font-mono">
                                        {Number(item.price).toLocaleString()} XP
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono">
                                        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                                            item.is_active
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-slate-900 text-[10px] font-black active:bg-yellow-500 transition-none font-mono"
                                        >
                                            [EDIT ITEM]
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <StoreItemFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveItem}
                    itemToEdit={editingItem}
                />
            )}
        </div>
    );
};

export default AdminStoreItemsPage;