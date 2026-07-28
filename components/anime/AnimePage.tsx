import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon, AddIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimePageProps {
    onBack: () => void;
    onViewSeries: (seriesId: number) => void;
    onCreateSeries: () => void;
    onCreateEpisode: () => void;
}

type AnimeSeries = Pick<Tables<'anime_series'>, 'id' | 'title' | 'thumbnail_url'>;

const AnimePage: React.FC<AnimePageProps> = ({ onBack, onViewSeries, onCreateSeries, onCreateEpisode }) => {
    const [series, setSeries] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFabMenuOpen, setFabMenuOpen] = useState(false);

    useEffect(() => {
        const fetchSeries = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('anime_series').select('id, title, thumbnail_url').order('created_at', { ascending: false });
                if (error) throw error;
                setSeries(data || []);
            } catch (err: any) {
                setError(err.message || "Failed to load anime series.");
            } finally {
                setLoading(false);
            }
        };
        fetchSeries();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Watch Anime</h1>
                <div className="w-6"></div> {/* Placeholder for centering */}
            </header>

            <main className="p-4">
                {loading && <div className="flex justify-center pt-20"><LoadingSpinner /></div>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loading && (
                    series.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {series.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    {...{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0 },
                                        transition: { delay: index * 0.05 }
                                    } as any}
                                >
                                    <button onClick={() => onViewSeries(item.id)} className="w-full text-left group">
                                        <div className="aspect-[3/4] bg-[var(--theme-secondary)]/40 rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
                                            {item.thumbnail_url && <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />}
                                        </div>
                                        <p className="font-semibold mt-2 text-sm text-[var(--theme-text)] truncate">{item.title}</p>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <h2 className="text-xl font-semibold text-[var(--theme-text)]">No Anime Here Yet</h2>
                            <p className="text-[var(--theme-text-secondary)] mt-2">Be the first to create a new series!</p>
                        </div>
                    )
                )}
            </main>

            <div className="fixed bottom-24 right-6 z-20">
                 <AnimatePresence>
                    {isFabMenuOpen && (
                        <motion.div
                            key="fab-menu"
                            {...{
                                initial: { opacity: 0, y: 10 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: 10 }
                            } as any}
                            className="flex flex-col items-end space-y-3 mb-3"
                        >
                            <button onClick={onCreateEpisode} className="flex items-center bg-[var(--theme-card-bg)] shadow-lg rounded-full px-4 py-2 text-sm font-medium text-[var(--theme-text-secondary)] hover:bg-gray-100 dark:hover:bg-opacity-80">
                                Add Episode
                            </button>
                            <button onClick={onCreateSeries} className="flex items-center bg-[var(--theme-card-bg)] shadow-lg rounded-full px-4 py-2 text-sm font-medium text-[var(--theme-text-secondary)] hover:bg-gray-100 dark:hover:bg-opacity-80">
                                Create Series
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button
                    onClick={() => setFabMenuOpen(!isFabMenuOpen)}
                    className="w-14 h-14 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-full flex items-center justify-center shadow-lg hover:bg-[var(--theme-primary-hover)]"
                    {...{
                        whileHover: { scale: 1.1 },
                        animate: { rotate: isFabMenuOpen ? 45 : 0 }
                    } as any}
                >
                    <AddIcon />
                </motion.button>
            </div>
        </div>
    );
};

export default AnimePage;