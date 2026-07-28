import React from 'react';
import type { Tables } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

type InventoryItem = Tables<'user_inventory'> & {
    store_items: Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url' | 'description'> | null;
};

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    items: InventoryItem[];
    loading: boolean;
}

const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose, username, items, loading }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                    } as any}
                    className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        {...{
                            initial: { scale: 0.9, y: 20 },
                            animate: { scale: 1, y: 0 },
                            exit: { scale: 0.9, y: 20 },
                            transition: { type: 'spring', stiffness: 300, damping: 30 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] w-full max-w-sm rounded-2xl shadow-xl p-6 relative flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[var(--theme-text)]">{username}'s Collection</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto max-h-[60vh] -mr-2 pr-2">
                            {loading ? (
                                <div className="flex justify-center items-center h-48">
                                    <LoadingSpinner />
                                </div>
                            ) : items.length > 0 ? (
                                <div className="grid grid-cols-3 gap-3">
                                    {items.map(item => item.store_items && (
                                        <div 
                                            key={item.id}
                                            className="group relative aspect-square bg-[var(--theme-bg)] rounded-lg overflow-hidden flex items-center justify-center"
                                            title={item.store_items.name}
                                        >
                                            <img
                                                src={item.store_items.preview_url || undefined}
                                                alt={item.store_items.name}
                                                className="object-contain max-h-full max-w-full"
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-xs truncate">{item.store_items.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-[var(--theme-text-secondary)] py-10">This gamer's inventory is empty.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CollectionModal;