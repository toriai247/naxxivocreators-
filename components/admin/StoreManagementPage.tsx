import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, TablesInsert, TablesUpdate } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import ProductFormModal from './ProductFormModal';

type Product = Tables<'products'>;

interface StoreManagementPageProps {
    session: Session;
}

const StoreManagementPage: React.FC<StoreManagementPageProps> = ({ session }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('created_at');
        if (error) {
            console.error("Failed to fetch products:", error);
            alert(`Error: ${error.message}`);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleCreateNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (productData: Partial<Product>) => {
        try {
            // The productData from the modal is already correctly structured.
            // We just ensure the price is a number.
            const payload = {
                ...productData,
                price: Number(productData.price) || 0,
            };
            
            // `upsert` handles both creating (if id is missing) and updating.
            const { error } = await supabase.from('products').upsert(payload as any).select();
            
            if (error) throw error;
            
            setIsModalOpen(false);
            await fetchProducts(); // Refresh the list
        } catch (error: any) {
            console.error('Failed to save product:', error);
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
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[var(--theme-text)]">Top-Up Products</h2>
                <button 
                    onClick={handleCreateNew}
                    className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    Create New Product
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
                                <th className="admin-th">Type</th>
                                <th className="admin-th">Price</th>
                                <th className="admin-th">XP</th>
                                <th className="admin-th">Status</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="admin-tbody">
                            {products.map(product => {
                                const details = product.details as any;
                                return (
                                <tr key={product.id} className="admin-tr">
                                    <td className="admin-td font-medium text-[var(--theme-text)]">{product.name}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)] capitalize">{product.product_type}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">${product.price.toFixed(2)}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">
                                        {product.product_type === 'package' ? details?.xp_amount?.toLocaleString() : 
                                         `${details?.initial_xp?.toLocaleString() || 0} + ${details?.daily_xp?.toLocaleString() || 0}/day`
                                        }
                                    </td>
                                    <td className="admin-td">
                                        <span className={`status-badge ${product.is_active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => handleEdit(product)} className="btn-edit">Edit</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            {isModalOpen && (
                <ProductFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveProduct}
                    productToEdit={editingProduct}
                />
            )}
        </div>
    );
};

export default StoreManagementPage;