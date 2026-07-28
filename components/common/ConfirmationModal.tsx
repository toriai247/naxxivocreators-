import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isConfirming = false,
}) => {
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
                        className="bg-[var(--theme-card-bg)] w-full max-w-sm rounded-2xl shadow-xl p-6 relative flex flex-col text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-bold text-[var(--theme-text)] mb-3">{title}</h2>
                        <p className="text-sm text-[var(--theme-text-secondary)] mb-6">{message}</p>
                        
                        <div className="space-y-3">
                            <Button onClick={onConfirm} disabled={isConfirming}>
                                {isConfirming ? <LoadingSpinner /> : confirmText}
                            </Button>
                            <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
                                {cancelText}
                            </Button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
