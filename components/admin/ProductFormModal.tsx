import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables, Enums, Json } from '../../integrations/supabase/types';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';

type Product = Tables<'products'>;

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Partial<Product>) => void;
    productToEdit: Product | null;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        description: '',
        price: 0,
        product_type: 'package',
        details: { xp_amount: 0 },
        is_active: true,
        icon: '💎'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setFormData(productToEdit);
        } else {
            // Reset to default for new product
            setFormData({
                name: '', description: '', price: 0, product_type: 'package',
                details: { xp_amount: 0 },
                is_active: true, icon: '💎'
            });
        }
    }, [productToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            details: {
                ...(prev.details as object || {}),
                [name]: Number(value)
            }
        }));
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as Enums<'product_type'>;
        setFormData(prev => {
            const currentDetails = prev.details as any;
            return {
                ...prev,
                product_type: newType,
                details: newType === 'package' 
                    ? { xp_amount: currentDetails?.xp_amount || 0 } 
                    : { 
                        initial_xp: currentDetails?.initial_xp || 0, 
                        daily_xp: currentDetails?.daily_xp || 0, 
                        duration_days: currentDetails?.duration_days || 30 
                    }
            };
        });
    };
    
    const handleToggle = (name: keyof Product, value: boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        {...{
                            initial: { opacity: 0, y: -50 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 50 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-2xl w-full flex flex-col border border-[var(--theme-secondary)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-[var(--theme-secondary)]">
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">{productToEdit ? 'Edit Product' : 'Create New Product'}</h2>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <Input id="name" label="Product Name" name="name" value={formData.name || ''} onChange={handleChange} required />
                                <div>
                                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Description</label>
                                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="admin-textarea" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input id="price" label="Price ($)" name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} required />
                                    <Input id="icon" label="Icon (Emoji)" name="icon" value={formData.icon || ''} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Product Type</label>
                                    <select name="product_type" value={formData.product_type} onChange={handleTypeChange} className="admin-select">
                                        <option value="package">Package</option>
                                        <option value="subscription">Subscription</option>
                                    </select>
                                </div>
                                
                                {formData.product_type === 'package' ? (
                                    <Input id="xp_amount" label="XP Amount" name="xp_amount" type="number" value={(formData.details as any)?.xp_amount || ''} onChange={handleDetailChange} />
                                ) : (
                                    <div className="p-3 bg-[var(--theme-card-bg-alt)]/50 rounded-md space-y-3">
                                        <h4 className="font-semibold text-[var(--theme-text)]/90">Subscription Details</h4>
                                        <Input id="initial_xp" label="Initial XP on Purchase" name="initial_xp" type="number" value={(formData.details as any)?.initial_xp || ''} onChange={handleDetailChange} />
                                        <Input id="daily_xp" label="Daily XP Claim" name="daily_xp" type="number" value={(formData.details as any)?.daily_xp || ''} onChange={handleDetailChange} />
                                        <Input id="duration_days" label="Duration (days)" name="duration_days" type="number" value={(formData.details as any)?.duration_days || ''} onChange={handleDetailChange} />
                                    </div>
                                )}
                                <div className="flex items-center justify-between bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-md">
                                     <label htmlFor="is_active" className="text-sm font-medium text-[var(--theme-text)]/90">Product is Active</label>
                                     <button type="button" onClick={() => handleToggle('is_active', !formData.is_active)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${formData.is_active ? 'bg-[var(--theme-primary)]' : 'bg-gray-600'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                            </div>
                            <div className="p-4 bg-black/20 flex justify-end space-x-3 border-t border-[var(--theme-secondary)]">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="w-auto px-6">
                                    {isSaving ? <LoadingSpinner /> : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductFormModal;