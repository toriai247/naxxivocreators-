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
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[var(--theme-text)]">Bazaar Items</h2>
                <button 
                    onClick={handleCreateNew}
                    className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    Create New Item
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">Name</th>
                                <th className="admin-th">Category</th>
                                <th className="admin-th">Price (XP)</th>
                                <th className="admin-th">Status</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="admin-tbody">
                            {items.map(item => (
                                <tr key={item.id} className="admin-tr">
                                    <td className="admin-td font-medium text-[var(--theme-text)]">{item.name}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)] capitalize">{item.category?.replace(/_/g, ' ').toLowerCase() || 'N/A'}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{item.price.toLocaleString()}</td>
                                    <td className="admin-td">
                                        <span className={`status-badge ${item.is_active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                                            {item.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
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