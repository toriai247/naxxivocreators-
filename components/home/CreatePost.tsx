import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import Button from '../common/Button';
import type { TablesInsert } from '../../integrations/supabase/types';
import { DirectImageUrlInput } from '../common/DirectImageUrlInput';

interface CreatePostProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, onPostCreated }) => {
    const [caption, setCaption] = useState('');
    const [contentUrl, setContentUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to post.");
            
            const newPost: TablesInsert<'posts'> = {
                caption,
                content_url: contentUrl || null,
                user_id: user.id
            };
            
            const { error: insertError } = await supabase
                .from('posts')
                .insert(newPost as any);
            
            if (insertError) throw insertError;

            // Reset form and close modal
            setCaption('');
            setContentUrl('');
            onPostCreated();

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--theme-card-bg)] w-full max-w-lg rounded-2xl shadow-xl p-6 relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" aria-label="Close">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-[var(--theme-text)] mb-6 text-center">Create a New Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="caption" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-2">Caption</label>
                        <textarea
                            id="caption"
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            placeholder="Share a memory..."
                            rows={4}
                            className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border-transparent border rounded-lg text-[var(--theme-text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm transition-all duration-300"
                            disabled={loading}
                        />
                    </div>
                     <div>
                        <DirectImageUrlInput
                            id="contentUrl"
                            value={contentUrl}
                            onChange={setContentUrl}
                            label="Attach Animated GIF or Photo"
                            placeholder="https://i.ibb.co/... or click '⚡ Upload GIF/Image' to auto-generate"
                            disabled={loading}
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center" role="alert">{error}</p>}

                    <div className="pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Posting...' : 'Share Post'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePost;