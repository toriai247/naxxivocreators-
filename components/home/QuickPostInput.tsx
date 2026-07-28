import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import type { TablesInsert, Json } from '../../integrations/supabase/types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { DirectImageUrlInput } from '../common/DirectImageUrlInput';

interface QuickPostInputProps {
    session: Session;
    onPostCreated: () => void;
}

type CurrentUserProfile = {
    photo_url: string | null;
    username: string;
    active_cover: { preview_url: string | null; asset_details: Json } | null;
};


const QuickPostInput: React.FC<QuickPostInputProps> = ({ session, onPostCreated }) => {
    const [caption, setCaption] = useState('');
    const [contentUrl, setContentUrl] = useState('');
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

    useEffect(() => {
        const fetchMyProfile = async () => {
            let { data, error } = await supabase
                .from('profiles')
                .select('username, photo_url, active_cover:active_cover_id(preview_url, asset_details)')
                .eq('id', session.user.id)
                .single();
            if (error || !data) {
                const fallback = await supabase
                    .from('profiles')
                    .select('username, photo_url')
                    .eq('id', session.user.id)
                    .single();
                data = fallback.data as any;
            }
            if (data) {
                setProfile(data as any);
            }
        };
        fetchMyProfile();
    }, [session.user.id]);

    const handlePost = async () => {
        if ((!caption.trim() && !contentUrl) || isPosting) return;

        setIsPosting(true);
        try {
            const newPost: TablesInsert<'posts'> = {
                user_id: session.user.id,
                caption: caption.trim() || null,
                content_url: contentUrl || null,
            };
            const { error } = await supabase.from('posts').insert(newPost as any);
            if (error) throw error;
            setCaption('');
            setContentUrl('');
            setShowMediaInput(false);
            onPostCreated();
        } catch (error: any) {
            console.error("Failed to create post:", error);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="bg-[var(--theme-card-bg)] p-3 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center space-x-3">
                <Avatar 
                    photoUrl={profile?.photo_url} 
                    name={profile?.username}
                    activeCover={profile?.active_cover}
                    size="sm"
                />
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
                    placeholder="Share your epic moments or attach an animated GIF..."
                    className="flex-grow bg-[var(--theme-bg)] border-transparent rounded-full text-[var(--theme-text)] placeholder-gray-500 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] transition-all"
                    disabled={isPosting}
                />
                <button
                    type="button"
                    onClick={() => setShowMediaInput(!showMediaInput)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1 ${
                        showMediaInput || contentUrl 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'bg-[var(--theme-bg)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-purple-500/10'
                    }`}
                    title="Attach Animated GIF or Photo via ImgBB Direct Uploader"
                >
                    <span>⚡ GIF/Photo</span>
                    {contentUrl && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>}
                </button>
                <AnimatePresence>
                {(caption.trim() || contentUrl) && (
                     <motion.div 
                        {...{
                            initial: { opacity: 0, width: 0 },
                            animate: { opacity: 1, width: 'auto' },
                            exit: { opacity: 0, width: 0 },
                            transition: { type: 'spring', stiffness: 500, damping: 30 },
                        } as any}
                        className="overflow-hidden"
                    >
                         <Button
                            size="small"
                            className="w-auto px-4 ml-1"
                            onClick={handlePost}
                            disabled={isPosting}
                         >
                            {isPosting ? '...' : 'Post'}
                         </Button>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {(showMediaInput || contentUrl) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-gray-200/40 dark:border-gray-800/40 px-1"
                    >
                        <DirectImageUrlInput
                            value={contentUrl}
                            onChange={setContentUrl}
                            label="Attach Animated GIF or Photo to Post"
                            placeholder="https://i.ibb.co/... or click '⚡ Upload GIF/Image' to auto-generate"
                            helperText="✨ Upload any Animated GIF (.gif) or image from your device to automatically generate a direct URL and attach it to your post!"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuickPostInput;