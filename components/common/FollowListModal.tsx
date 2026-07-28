import React from 'react';
import type { Tables, Json } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';
import { generateAvatar } from '../../utils/helpers';
import Avatar from './Avatar';

type ProfileStub = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url'> & {
    active_cover: { preview_url: string | null; asset_details: Json } | null;
};

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    users: ProfileStub[];
    loading: boolean;
    onViewProfile: (userId: string) => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ isOpen, onClose, title, users, loading, onViewProfile }) => {
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
                            <h2 className="text-xl font-bold text-[var(--theme-text)]">{title}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto max-h-[60vh] pr-2 space-y-3">
                            {loading ? (
                                <div className="flex justify-center items-center h-32">
                                    <LoadingSpinner />
                                </div>
                            ) : users.length > 0 ? (
                                users.map(user => (
                                    <button 
                                        key={user.id}
                                        onClick={() => onViewProfile(user.id)}
                                        className="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-opacity-50 transition-colors"
                                    >
                                        <Avatar
                                            photoUrl={user.photo_url}
                                            name={user.name || user.username}
                                            activeCover={user.active_cover}
                                            size="sm"
                                            containerClassName="flex-shrink-0"
                                        />
                                        <div className="ml-3 text-left">
                                            <p className="font-semibold text-[var(--theme-text)] truncate">{user.name || user.username}</p>
                                            <p className="text-sm text-[var(--theme-text-secondary)] truncate">@{user.username}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-[var(--theme-text-secondary)] py-10">No users to display.</p>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FollowListModal;