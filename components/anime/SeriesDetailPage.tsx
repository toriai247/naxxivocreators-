import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon, PlayIcon } from '../common/AppIcons';
import { motion } from 'framer-motion';

interface SeriesDetailPageProps {
    seriesId: number;
    onBack: () => void;
}

// Define more specific types for the data being fetched.
type SeriesData = Pick<Tables<'anime_series'>, 'id' | 'title' | 'description' | 'banner_url' | 'thumbnail_url'>;
type EpisodeData = Pick<Tables<'anime_episodes'>, 'id' | 'episode_number' | 'title' | 'video_url'>;


const getVideoDetails = (url: string): { platform: 'youtube' | 'vimeo' | 'direct'; id: string } | null => {
    if (!url) return null;

    let match;

    // YouTube: covers watch, shorts, youtu.be, and embed links
    match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return { platform: 'youtube', id: match[1] };
    
    // Vimeo: covers vimeo.com/ID and vimeo.com/video/ID
    match = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (match && match[1]) return { platform: 'vimeo', id: match[1] };

    // Direct video file link
    try {
        const path = new URL(url).pathname.toLowerCase();
        if (['.mp4', '.webm', '.ogg', '.mov'].some(ext => path.endsWith(ext))) {
            return { platform: 'direct', id: url };
        }
    } catch (e) {
        // Not a valid URL
    }

    return null;
};


const SeriesDetailPage: React.FC<SeriesDetailPageProps> = ({ seriesId, onBack }) => {
    const [series, setSeries] = useState<SeriesData | null>(null);
    const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
    const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!seriesId) return;
        const fetchDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: seriesData, error: seriesError } = await supabase
                    .from('anime_series')
                    .select('id, title, description, banner_url, thumbnail_url')
                    .eq('id', seriesId)
                    .single();

                if (seriesError) throw seriesError;
                setSeries(seriesData as any);

                const { data: episodesData, error: episodesError } = await supabase
                    .from('anime_episodes')
                    .select('id, episode_number, title, video_url')
                    .eq('series_id', seriesId)
                    .order('episode_number', { ascending: true });

                if (episodesError) throw episodesError;
                setEpisodes((episodesData as any) || []);

            } catch (err: any) {
                setError(err.message || "Failed to load series details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [seriesId]);
    
    const videoDetails = selectedEpisodeUrl ? getVideoDetails(selectedEpisodeUrl) : null;


    if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner /></div>;
    if (error) return <div className="text-center pt-20 text-red-500">{error}</div>;
    if (!series) return <div className="text-center pt-20 text-gray-500 dark:text-gray-400">Series not found.</div>;

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <div className="relative">
                {selectedEpisodeUrl ? (
                    <div className="w-full aspect-video bg-black flex items-center justify-center">
                       {videoDetails?.platform === 'youtube' ? (
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${videoDetails.id}?autoplay=1`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        ) : videoDetails?.platform === 'vimeo' ? (
                            <iframe
                                className="w-full h-full"
                                src={`https://player.vimeo.com/video/${videoDetails.id}?autoplay=1`}
                                title="Vimeo video player"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : videoDetails?.platform === 'direct' ? (
                             <video
                                key={selectedEpisodeUrl}
                                src={videoDetails.id}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full"
                            />
                        ) : (
                             <div className="text-white text-center p-4">
                                <p className="font-semibold">Unsupported or Invalid Video URL</p>
                                <p className="text-sm text-gray-400 break-all mt-2">{selectedEpisodeUrl}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full aspect-video bg-gray-300 relative">
                        {series.banner_url && <img src={series.banner_url} alt={`${series.title} banner`} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-black/30"></div>
                    </div>
                )}
                 <button onClick={onBack} className="absolute top-3 left-3 bg-black/40 text-white rounded-full p-2 hover:bg-black/60 transition-colors z-10">
                    <BackArrowIcon />
                 </button>
            </div>
            
            <div className="p-4">
                <h1 className="text-2xl font-bold text-[var(--theme-text)]">{series.title}</h1>
                {series.description && <p className="text-[var(--theme-text-secondary)] mt-2 text-sm">{series.description}</p>}
            </div>

            <div className="p-4 pt-2">
                <h2 className="text-lg font-semibold mb-3 text-[var(--theme-text)]">Episodes</h2>
                <div className="space-y-2">
                    {episodes.length > 0 ? episodes.map(ep => (
                        <motion.button
                            key={ep.id}
                            onClick={() => setSelectedEpisodeUrl(ep.video_url)}
                            className="w-full flex items-center p-3 bg-[var(--theme-card-bg)] rounded-lg hover:bg-opacity-80 transition-colors"
                            {...{ whileTap: { scale: 0.98 } } as any}
                        >
                            <div className="w-10 h-10 bg-[var(--theme-secondary)]/40 text-[var(--theme-text-secondary)] rounded-md flex items-center justify-center font-bold text-lg flex-shrink-0">
                                {ep.episode_number}
                            </div>
                            <div className="ml-4 text-left flex-grow overflow-hidden">
                                <p className="font-medium truncate text-[var(--theme-text)]">{ep.title || `Episode ${ep.episode_number}`}</p>
                            </div>
                            <div className="ml-2 text-[var(--theme-primary)]">
                                <PlayIcon className="w-5 h-5" />
                            </div>
                        </motion.button>
                    )) : (
                        <p className="text-[var(--theme-text-secondary)]">No episodes have been added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeriesDetailPage;