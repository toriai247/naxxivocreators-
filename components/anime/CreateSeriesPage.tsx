import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { TablesInsert } from '../../integrations/supabase/types';
import Button from '../common/Button';
import Input from '../common/Input';
import { BackArrowIcon } from '../common/AppIcons';
import { motion } from 'framer-motion';

interface CreateSeriesPageProps {
    onBack: () => void;
    onSeriesCreated: () => void;
}

const CreateSeriesPage: React.FC<CreateSeriesPageProps> = ({ onBack, onSeriesCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("You must be logged in.");

            const newSeries: TablesInsert<'anime_series'> = {
                title,
                description,
                thumbnail_url: thumbnailUrl || null,
                banner_url: bannerUrl || null,
                user_id: user.id
            };

            const { error: insertError } = await supabase.from('anime_series').insert(newSeries as any);
            if (insertError) throw insertError;

            onSeriesCreated();

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
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Create New Series</h1>
                <div className="w-6"></div> {/* Placeholder */}
            </header>
            
            <main className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Live Preview Column */}
                    <div className="flex flex-col items-center">
                        <h2 className="font-bold text-lg text-[var(--theme-text)] mb-3">Live Preview</h2>
                        <div className="w-full max-w-xs aspect-[9/13] bg-[var(--theme-card-bg)] rounded-2xl shadow-lg overflow-hidden relative flex items-center justify-center p-4">
                            {bannerUrl ? (
                                <img src={bannerUrl} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover blur-sm brightness-50" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-yellow-500/10"></div>
                            )}
                             <div className="relative z-10 w-full text-center flex flex-col items-center">
                                <div className="w-48 aspect-[3/4] bg-[var(--theme-secondary)]/40 rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                                    {thumbnailUrl ? (
                                        <img src={thumbnailUrl} alt={title || 'Series Thumbnail'} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-[var(--theme-text-secondary)]">🖼️</span>
                                    )}
                                </div>
                                <p className="font-semibold mt-3 text-base text-white truncate w-full px-2 break-words h-6">
                                    {title || 'Series Title'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Column */}
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--theme-card-bg)] p-6 rounded-lg shadow-sm">
                            <Input id="title" label="Series Title" type="text" value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Description</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border-transparent border rounded-lg text-[var(--theme-text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm"
                                    disabled={loading}
                                />
                            </div>
                            <Input id="thumbnailUrl" label="Thumbnail URL" type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} disabled={loading} placeholder="https://..." />
                            <Input id="bannerUrl" label="Banner URL (Optional)" type="url" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} disabled={loading} placeholder="https://..." />

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            
                            <div className="pt-2">
                                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Series'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </motion.div>
    );
};

export default CreateSeriesPage;