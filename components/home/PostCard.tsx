import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { PostWithDetails } from './HomePage';
import { generateAvatar } from '../../utils/helpers';
import type { Tables, TablesInsert } from '../../integrations/supabase/types';
import { motion } from 'framer-motion';
import { HeartIcon, CommentIcon, OptionsIcon, ShareIcon } from '../common/AppIcons';
import Avatar from '../common/Avatar';

type CommentWithProfile = Tables<'comments'> & {
    profiles: {
        username: string | null;
        name: string | null;
        photo_url: string | null;
    } | null;
};

interface PostCardProps {
    post: PostWithDetails;
    session: any;
    onViewProfile: (userId: string) => void;
    onOpenComments: () => void;
    isInitiallyFollowing?: boolean;
    hideFollowButton?: boolean;
}

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
        // Not a valid URL, will be treated as an image below
    }

    return null;
};


const PostCard: React.FC<PostCardProps> = ({ post, session, onViewProfile, onOpenComments, isInitiallyFollowing = false, hideFollowButton = false }) => {
    const { profiles: profile, caption, content_url, created_at, id: postId, user_id } = post;
    const timeAgo = new Date(created_at).toLocaleDateString();

    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [userHasLiked, setUserHasLiked] = useState(post.likes.some(like => like.user_id === session.user.id));
    const [isLiking, setIsLiking] = useState(false);
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    const videoDetails = content_url ? getVideoDetails(content_url) : null;
    const commentCount = post.comments[0]?.count || 0;

    const handleLikeToggle = async () => {
        if (isLiking) return;
        setIsLiking(true);

        const originallyLiked = userHasLiked;
        setLikeCount(c => originallyLiked ? c - 1 : c + 1);
        setUserHasLiked(!originallyLiked);

        try {
            if (originallyLiked) {
                await supabase.from('likes').delete().match({ user_id: session.user.id, post_id: postId });
            } else {
                const newLike: TablesInsert<'likes'> = { user_id: session.user.id, post_id: postId };
                await supabase.from('likes').insert(newLike as any);
                
                // Send notification
                if (user_id !== session.user.id) {
                    const notification: TablesInsert<'notifications'> = {
                        user_id: user_id,
                        actor_id: session.user.id,
                        type: 'POST_LIKE',
                        entity_id: String(postId)
                    };
                    await supabase.from('notifications').insert(notification as any);
                }
            }
        } catch (error: any) {
            console.error("Failed to update like status:", error.message);
            // Revert optimistic update on failure
            setLikeCount(c => originallyLiked ? c + 1 : c - 1);
            setUserHasLiked(originallyLiked);
        } finally {
            setIsLiking(false);
        }
    };

    const handleFollowToggle = async () => {
        if (isUpdatingFollow || user_id === session.user.id) return;
        setIsUpdatingFollow(true);
        const originalFollowStatus = isFollowing;
        setIsFollowing(!originalFollowStatus);

        try {
            if (originalFollowStatus) {
                await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: user_id });
            } else {
                const newFollow: TablesInsert<'follows'> = { follower_id: session.user.id, following_id: user_id };
                await supabase.from('follows').insert(newFollow as any);

                // Send notification
                const notification: TablesInsert<'notifications'> = {
                    user_id: user_id,
                    actor_id: session.user.id,
                    type: 'NEW_FOLLOWER',
                    entity_id: session.user.id
                };
                await supabase.from('notifications').insert(notification as any);
            }
        } catch (error: any) {
            console.error("Failed to update follow status:", error.message);
            setIsFollowing(originalFollowStatus); // Revert on failure
        } finally {
            setIsUpdatingFollow(false);
        }
    };

    return (
        <motion.div
            className="bg-[var(--theme-card-bg)] rounded-2xl shadow-sm"
            {...{
                initial: { opacity: 0, y: 30 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, amount: 0.3 },
                transition: { type: 'spring', duration: 0.8 },
            } as any}
        >
            {/* Card Header */}
            <div className="flex items-center justify-between p-3">
                <button onClick={() => onViewProfile(user_id)} className="flex items-center space-x-3 group">
                    <Avatar
                        photoUrl={profile?.photo_url}
                        name={profile?.name}
                        activeCover={profile?.active_cover}
                        size="sm"
                        containerClassName="group-hover:opacity-80 transition-opacity"
                    />
                    <div>
                        <p className="font-bold text-sm text-[var(--theme-text)]">{profile?.name || profile?.username}</p>
                        <p className="text-xs text-[var(--theme-text-secondary)]">{timeAgo}</p>
                    </div>
                </button>
                <div className="flex items-center space-x-2">
                    {!hideFollowButton && user_id !== session.user.id && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={isUpdatingFollow}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                isFollowing
                                    ? 'bg-transparent text-[var(--theme-text-secondary)] border border-[var(--theme-text-secondary)]/50 hover:bg-black/5 dark:hover:bg-white/5'
                                    : 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] hover:bg-[var(--theme-primary-hover)]'
                            }`}
                        >
                            {isUpdatingFollow ? '...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                    <button className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)]">
                        <OptionsIcon />
                    </button>
                </div>
            </div>

            {/* Post Content */}
            {content_url && (
                <div className="w-full aspect-video bg-[var(--theme-card-bg-alt)]">
                    {videoDetails ? (
                        <>
                            {videoDetails.platform === 'youtube' && (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoDetails.id}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            )}
                            {videoDetails.platform === 'vimeo' && (
                                <iframe
                                    className="w-full h-full"
                                    src={`https://player.vimeo.com/video/${videoDetails.id}`}
                                    title="Vimeo video player"
                                    frameBorder="0"
                                    allow="fullscreen; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            )}
                            {videoDetails.platform === 'direct' && (
                                <video key={content_url} src={videoDetails.id} controls playsInline className="w-full h-full object-cover" />
                            )}
                        </>
                    ) : (
                        <img src={content_url} alt="Post content" className="w-full h-full object-cover" />
                    )}
                </div>
            )}


            {/* Post Actions */}
            <div className="flex justify-between items-center p-3">
                <div className="flex items-center space-x-4 text-[var(--theme-text-secondary)]">
                    <button onClick={handleLikeToggle} className="flex items-center space-x-1.5 group">
                        <motion.div {...{ whileTap: { scale: 1.2 } } as any}>
                           <HeartIcon filled={userHasLiked} />
                        </motion.div>
                        <span className="text-sm font-medium group-hover:text-[var(--theme-primary)]">{likeCount}</span>
                    </button>
                    <button onClick={onOpenComments} className="flex items-center space-x-1.5 group">
                        <CommentIcon />
                        <span className="text-sm font-medium group-hover:text-[var(--theme-primary)]">{commentCount}</span>
                    </button>
                    <button className="group">
                        <ShareIcon />
                    </button>
                </div>
            </div>

            {/* Post Caption & Comments */}
            <div className="px-4 pb-4 text-sm">
                {caption && <p><span className="font-bold text-[var(--theme-text)] mr-1.5">{profile?.username}</span><span className="text-[var(--theme-text)]">{caption}</span></p>}
                {commentCount > 0 && (
                    <button onClick={onOpenComments} className="text-[var(--theme-text-secondary)] mt-1.5">
                        View all {commentCount} comments
                    </button>
                )}
            </div>
        </motion.div>
    );
};

export default PostCard;