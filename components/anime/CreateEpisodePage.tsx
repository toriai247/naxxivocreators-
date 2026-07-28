import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, TablesInsert } from '../../integrations/supabase/types';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon, PlayIcon } from '../common/AppIcons';
import { motion } from 'framer-motion';


interface CreateEpisodePageProps {
    onBack: () => void;
    onEpisodeCreated: () => void;
}

type AnimeSeriesStub = Pick<Tables<'anime_series'>, 'id' | 'title' | 'thumbnail_url'>;

const CreateEpisodePage: React.FC<CreateEpisodePageProps> = ({ onBack, onEpisodeCreated }) => {
    const [seriesList, setSeriesList] = useState<AnimeSeriesStub[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState('');
    const [episodeNumber, setEpisodeNumber] = useState('');
    const [title, setTitle] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSeries = async () => {
            const { data, error } = await supabase.from('anime_series').select('id, title, thumbnail_url').order('title');
            if (error) {
                console.error("Failed to fetch series list:", error);
            } else {
                const list = (data as any) || [];
                setSeriesList(list);
                if (list.length > 0) {
                    setSelectedSeriesId(String(list[0].id));
                }
            }
        };
        fetchSeries();
    }, []);

    const selectedSeriesThumbnail = useMemo(() => {
        return seriesList.find(s => String(s.id) === selectedSeriesId)?.thumbnail_url || null;
    }, [seriesList, selectedSeriesId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newEpisode: TablesInsert<'anime_episodes'> = {
                series_id: Number(selectedSeriesId),
                episode_number: Number(episodeNumber),
                title: title || null,
                video_url: videoUrl,
            };

            const { error: insertError } = await supabase.from('anime_episodes').insert(newEpisode as any);
            if (insertError) throw insertError;
            
            onEpisodeCreated();

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <motion.div 
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
            } as any}
            className="min-h-screen bg-[var(--theme-bg)]"
        >
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-[var(--theme-card-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Add New Episode</h1>
                <div className="w-6"></div>
            </header>

            <main className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                     {/* Live Preview Column */}
                    <div className="flex flex-col items-center">
                        <h2 className="font-bold text-lg text-[var(--theme-text)] mb-3">Live Preview</h2>
                        <div className="w-full max-w-xs aspect-[16/9] bg-[var(--theme-card-bg)] rounded-2xl shadow-lg overflow-hidden relative flex items-center justify-center p-4">
                            {selectedSeriesThumbnail ? (
                                <img src={selectedSeriesThumbnail} alt="Series thumbnail preview" className="absolute inset-0 w-full h-full object-cover blur-sm brightness-50" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-yellow-500/10"></div>
                            )}
                            <div className="relative z-10 w-full p-3 bg-black/30 rounded-lg flex items-center">
                                <div className="w-16 h-16 bg-[var(--theme-secondary)]/40 text-[var(--theme-text-secondary)] rounded-md flex items-center justify-center font-bold text-2xl flex-shrink-0">
                                    {episodeNumber || '?'}
                                </div>
                                <div className="ml-4 text-left flex-grow overflow-hidden">
                                    <p className="font-medium truncate text-white h-6">{title || 'Episode Title'}</p>
                                    <p className="text-sm text-gray-300">Episode {episodeNumber || '?'}</p>
                                </div>
                                <div className="ml-2 text-white/70">
                                    <PlayIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Form Column */}
                    <div>
                        {seriesList.length === 0 ? (
                            <div className="flex justify-center pt-20"><LoadingSpinner/></div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--theme-card-bg)] p-6 rounded-lg shadow-sm">
                                <div>
                                    <label htmlFor="series" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Series</label>
                                    <select
                                        id="series"
                                        value={selectedSeriesId}
                                        onChange={e => setSelectedSeriesId(e.target.value)}
                                        className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border-transparent border rounded-lg text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm"
                                        required
                                    >
                                        {seriesList.map(series => (
                                            <option key={series.id} value={series.id}>{series.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input id="episodeNumber" label="Episode Number" type="number" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} required disabled={loading} />
                                <Input id="episodeTitle" label="Episode Title (Optional)" type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={loading} />
                                <Input id="videoUrl" label="Video URL" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} required disabled={loading} placeholder="https://..." />

                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                
                                <div className="pt-2">
                                    <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Episode'}</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </motion.div>
    );
};

export default CreateEpisodePage;