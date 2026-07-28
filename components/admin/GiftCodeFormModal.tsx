import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables } from '../../integrations/supabase/types';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';

type GiftCode = Tables<'gift_codes'>;

interface GiftCodeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (codeData: Partial<GiftCode>) => Promise<void>;
    error: string | null;
}

const generateRandomCode = (length = 7) => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const GiftCodeFormModal: React.FC<GiftCodeFormModalProps> = ({ isOpen, onClose, onSave, error }) => {
    const [formData, setFormData] = useState<Partial<GiftCode>>({
        code: generateRandomCode(),
        xp_reward: 100,
        max_uses: 100,
        max_uses_per_user: 1,
        expires_at: '',
        is_active: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'code' ? value.toUpperCase() : value)
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                ...formData,
                xp_reward: Number(formData.xp_reward),
                max_uses: formData.max_uses ? Number(formData.max_uses) : null,
                max_uses_per_user: Number(formData.max_uses_per_user),
                expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            });
        } catch (e) {
            // Error is handled by parent, we just need to stop the loading state.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
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
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">Create New Gift Code</h2>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <Input
                                    id="code"
                                    label="Code"
                                    name="code"
                                    value={formData.code || ''}
                                    onChange={handleChange}
                                    required
                                    maxLength={7}
                                    rightElement={
                                        <button type="button" onClick={() => setFormData(p => ({...p, code: generateRandomCode()}))} className="text-xs text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)] font-semibold">
                                            Generate
                                        </button>
                                    }
                                />
                                
                                <Input id="xp_reward" label="XP Reward" name="xp_reward" type="number" value={String(formData.xp_reward) || ''} onChange={handleChange} required />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Input id="max_uses" label="Max Uses (optional)" name="max_uses" type="number" value={String(formData.max_uses) || ''} onChange={handleChange} placeholder="Leave blank for unlimited"/>
                                    <Input id="max_uses_per_user" label="Max Uses Per User" name="max_uses_per_user" type="number" value={String(formData.max_uses_per_user) || ''} onChange={handleChange} required />
                                </div>
                                
                                <Input id="expires_at" label="Expires At (optional)" name="expires_at" type="date" value={String(formData.expires_at).split('T')[0] || ''} onChange={handleChange} />
                                
                                <div className="flex items-center">
                                    <input id="is_active" name="is_active" type="checkbox" checked={!!formData.is_active} onChange={handleChange} className="h-4 w-4 rounded text-[var(--theme-primary)] bg-transparent border-[var(--theme-secondary)] focus:ring-[var(--theme-primary)]" />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-[var(--theme-text)]/90">Code is Active</label>
                                </div>
                            </div>
                            {error && (
                                <div className="px-6 pb-4">
                                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                                        <p className="font-bold">Save Failed</p>
                                        <p className="text-sm whitespace-pre-wrap">{error}</p>
                                    </div>
                                </div>
                            )}
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

export default GiftCodeFormModal;