import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Input from './Input';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    session: Session;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess, session }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    // Reset state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setPassword('');
                setError('');
                setIsChecking(false);
            }, 300); // Wait for exit animation
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsChecking(true);

        if (password === '01927539878') {
             setTimeout(() => {
                onSuccess();
             }, 500);
        } else {
            try {
                const { data, error: rpcError } = await (supabase as any).rpc('deduct_xp_for_action', {
                    p_user_id: session.user.id,
                    p_cost: 10000
                });
                if (rpcError) throw rpcError;

                const resMsg = (data as string) || '';
                if (resMsg.startsWith('Error:')) {
                    setError(resMsg);
                } else {
                    setError('Incorrect password. 10,000 XP was deducted as a penalty.');
                }

            } catch (err: any) {
                setError(err.message || 'An error occurred while processing the penalty.');
            } finally {
                 setPassword('');
                 setIsChecking(false);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                    } as any}
                    className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        {...{
                            initial: { scale: 0.9, opacity: 0 },
                            animate: { scale: 1, opacity: 1 },
                            exit: { scale: 0.9, opacity: 0 },
                            transition: { type: 'spring', stiffness: 300, damping: 25 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] w-full max-w-sm rounded-2xl shadow-xl p-6 relative flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <h2 className="text-xl font-bold text-[var(--theme-text)] mb-3 text-center">Enter Control Password</h2>
                            <p className="text-sm text-[var(--theme-text-secondary)] mb-6 text-center">Incorrect attempts will incur an XP penalty.</p>
                            
                            <div className="space-y-4">
                                <Input
                                    id="admin-password"
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    disabled={isChecking}
                                />
                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                            </div>
                            
                            <div className="mt-6 space-y-3">
                                <Button type="submit" disabled={isChecking || !password}>
                                    {isChecking ? <LoadingSpinner /> : 'Access Panel'}
                                </Button>
                                <Button variant="secondary" type="button" onClick={onClose} disabled={isChecking}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PasswordModal;
