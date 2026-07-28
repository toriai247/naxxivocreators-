import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables } from '../../integrations/supabase/types';

type StoreItem = Pick<Tables<'store_items'>, 'name' | 'preview_url' | 'description'>;

interface ItemPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: StoreItem | null;
}

const ItemPreviewModal: React.FC<ItemPreviewModalProps> = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                    } as any}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        {...{
                            initial: { scale: 0.9, y: 20 },
                            animate: { scale: 1, y: 0 },
                            exit: { scale: 0.9, y: 20 },
                            transition: { type: 'spring', stiffness: 300, damping: 30 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] w-full max-w-sm rounded-2xl shadow-xl p-6 relative flex flex-col items-center text-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-48 h-48 bg-[var(--theme-bg)] rounded-lg flex items-center justify-center mb-4">
                            <img src={item.preview_url || ''} alt={item.name} className="object-contain max-h-full max-w-full" />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--theme-text)]">{item.name}</h2>
                        {item.description && <p className="text-sm text-[var(--theme-text-secondary)] mt-1">{item.description}</p>}
                         <button onClick={onClose} className="absolute top-3 right-3 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ItemPreviewModal;