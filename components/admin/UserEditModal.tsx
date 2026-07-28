import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables, Enums } from '../../integrations/supabase/types';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Input from '../common/Input';

type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'status' | 'xp_balance' | 'gold_coins' | 'silver_coins' | 'diamond_coins' | 'is_admin'>;

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { 
        isAdmin: boolean; 
        status: Enums<'profile_status'>; 
        xpAdjustment: number;
        goldAdjustment: number;
        silverAdjustment: number;
        diamondAdjustment: number;
    }, notes: string) => Promise<void>;
    userToEdit: Profile;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
    const [isAdmin, setIsAdmin] = useState(!!userToEdit.is_admin);
    const [status, setStatus] = useState<Enums<'profile_status'>>(userToEdit.status);
    const [xpAdjustment, setXpAdjustment] = useState(0);
    const [goldAdjustment, setGoldAdjustment] = useState(0);
    const [silverAdjustment, setSilverAdjustment] = useState(0);
    const [diamondAdjustment, setDiamondAdjustment] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const hasChanges = isAdmin !== !!userToEdit.is_admin || status !== userToEdit.status || xpAdjustment !== 0 || goldAdjustment !== 0 || silverAdjustment !== 0 || diamondAdjustment !== 0;

    useEffect(() => {
        setIsAdmin(!!userToEdit.is_admin);
        setStatus(userToEdit.status);
        setXpAdjustment(0);
        setGoldAdjustment(0);
        setSilverAdjustment(0);
        setDiamondAdjustment(0);
        setNotes('');
    }, [userToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasChanges && !notes.trim()) {
            alert('Please provide notes explaining the reason for the changes.');
            return;
        }
        setIsSaving(true);
        await onSave({ isAdmin, status, xpAdjustment, goldAdjustment, silverAdjustment, diamondAdjustment }, notes);
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
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">Edit User: {userToEdit.name || userToEdit.username}</h2>
                                <p className="text-sm text-[var(--theme-text-secondary)]">@{userToEdit.username}</p>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="role" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Role</label>
                                        <select id="role" value={isAdmin ? 'admin' : 'user'} onChange={(e) => setIsAdmin(e.target.value === 'admin')} className="admin-select">
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Status</label>
                                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as Enums<'profile_status'>)} className="admin-select">
                                            <option value="active">Active</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="p-3 bg-[var(--theme-card-bg-alt)]/50 rounded-md">
                                    <h4 className="font-semibold mb-2 text-[var(--theme-text)]/90">Adjust Balances</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input id="xpAdjustment" label="XP" type="number" value={xpAdjustment} onChange={(e) => setXpAdjustment(parseInt(e.target.value, 10) || 0)} placeholder="e.g., 500 or -100" />
                                        <Input id="goldAdjustment" label="Gold Coins" type="number" value={goldAdjustment} onChange={(e) => setGoldAdjustment(parseInt(e.target.value, 10) || 0)} />
                                        <Input id="silverAdjustment" label="Silver Coins" type="number" value={silverAdjustment} onChange={(e) => setSilverAdjustment(parseInt(e.target.value, 10) || 0)} />
                                        <Input id="diamondAdjustment" label="Diamonds" type="number" value={diamondAdjustment} onChange={(e) => setDiamondAdjustment(parseInt(e.target.value, 10) || 0)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-[var(--theme-text-secondary)]">
                                        <p>New: {(userToEdit.xp_balance + xpAdjustment).toLocaleString()}</p>
                                        <p>New: {((userToEdit.gold_coins || 0) + goldAdjustment).toLocaleString()}</p>
                                        <p>New: {((userToEdit.silver_coins || 0) + silverAdjustment).toLocaleString()}</p>
                                        <p>New: {((userToEdit.diamond_coins || 0) + diamondAdjustment).toLocaleString()}</p>
                                    </div>
                                </div>

                                 <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Admin Notes (Required for changes)</label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="admin-textarea"
                                        rows={3}
                                        placeholder="e.g., Rewarded user for contest participation."
                                        required={hasChanges}
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-black/20 flex justify-end space-x-3 border-t border-[var(--theme-secondary)]">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving || !hasChanges} className="w-auto px-6">
                                    {isSaving ? <LoadingSpinner /> : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UserEditModal;