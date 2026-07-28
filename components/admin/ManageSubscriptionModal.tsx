import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, TablesInsert, Enums } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Input from '../common/Input';

interface ManageSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onUpdate: () => void;
}

type SubscriptionProduct = Pick<Tables<'products'>, 'id' | 'name' | 'details'>;

const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({ isOpen, onClose, userId, onUpdate }) => {
    const [subProducts, setSubProducts] = useState<SubscriptionProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [duration, setDuration] = useState(30);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchProducts = async () => {
                setLoading(true);
                const { data, error } = await supabase.from('products').select('id, name, details').eq('product_type', 'subscription').eq('is_active', true);
                if (error) {
                    alert('Failed to load subscription products.');
                } else {
                    const list = (data as any) || [];
                    setSubProducts(list);
                    if (list.length > 0) {
                        setSelectedProductId(String(list[0].id));
                    }
                }
                setLoading(false);
            };
            fetchProducts();
        }
    }, [isOpen]);
    
    const handleAddSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + duration);
            
            const newSub: TablesInsert<'user_subscriptions'> = {
                user_id: userId,
                product_id: Number(selectedProductId),
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                is_active: true,
            };

            const { error } = await (supabase.from('user_subscriptions') as any).insert(newSub);
            if(error) throw error;
            
            alert('Subscription added successfully!');
            onUpdate();
            onClose();

        } catch (error: any) {
            alert(`Failed to add subscription: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        {...{ initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 50 } } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-lg w-full flex flex-col border border-[var(--theme-secondary)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleAddSubscription}>
                            <header className="p-6 border-b border-[var(--theme-secondary)]">
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">Add Subscription</h2>
                            </header>
                             <main className="p-6 space-y-4">
                                {loading ? <LoadingSpinner/> : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Subscription Plan</label>
                                            <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="admin-select">
                                                {subProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <Input
                                            id="duration"
                                            label="Duration (days)"
                                            type="number"
                                            value={duration}
                                            onChange={e => setDuration(Number(e.target.value))}
                                            required
                                        />
                                    </>
                                )}
                            </main>
                            <footer className="p-4 bg-black/20 flex justify-end space-x-3 border-t border-[var(--theme-secondary)]">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving || loading} className="w-auto px-6">
                                    {isSaving ? <LoadingSpinner /> : 'Add Subscription'}
                                </Button>
                            </footer>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
export default ManageSubscriptionModal;