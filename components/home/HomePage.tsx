import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import PostCard from './PostCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Logo from '../common/Logo';
import { SearchIcon, BellIcon } from '../common/AppIcons';
import CommentModal from './CommentModal';
import QuickPostInput from './QuickPostInput';
import type { Tables, Json } from '../../integrations/supabase/types';
import { generateAvatar } from '../../utils/helpers';
import Avatar from '../common/Avatar';

interface HomePageProps {
    session: any;
    onViewProfile: (userId: string) => void;
    refreshKey: number;
    onOpenSearch: () => void;
    onOpenNotifications: () => void;
    unreadNotificationCount: number;
}

export type PostWithDetails = {
    id: number;
    created_at: string;
    caption: string | null;
    content_url: string | null;
    user_id: string;
    status: Tables<'posts'>['status'];
    profiles: {
        username: string | null;
        name: string | null;
        photo_url: string | null;
        active_cover: { preview_url: string | null; asset_details: Json } | null;
    } | null;
    likes: Array<{ user_id: string }>;
    comments: Array<{ count: number }>;
};

type SuggestedUser = Pick<Tables<'profiles'>, 'id' | 'name' | 'photo_url' | 'username'> & {
    active_cover: { preview_url: string | null; asset_details: Json } | null;
};

const SuggestedUsers: React.FC<{ onViewProfile: (userId: string) => void }> = ({ onViewProfile }) => {
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            let { data, error } = await supabase
                .from('profiles')
                .select('id, name, photo_url, username, active_cover:active_cover_id(preview_url, asset_details)')
                .order('xp_balance', { ascending: false })
                .limit(10);
            if (error || !data) {
                const fallback = await supabase
                    .from('profiles')
                    .select('id, name, photo_url, username')
                    .order('xp_balance', { ascending: false })
                    .limit(10);
                data = fallback.data as any;
            }
            if (data) setUsers(data as any[]);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    if (loading) return null;

    return (
        <div className="mb-4">
            <h2 className="font-bold text-[var(--theme-text)] mb-2">Top Gamers</h2>
            <div className="flex space-x-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
                {users.map(user => (
                    <button key={user.id} onClick={() => onViewProfile(user.id)} className="flex flex-col items-center space-y-1 text-center flex-shrink-0 w-20">
                        <div className="w-16 h-16 rounded-full p-0.5 flex items-center justify-center bg-gradient-to-tr from-[var(--theme-primary)] to-[var(--theme-secondary)]">
                            <Avatar
                                photoUrl={user.photo_url}
                                name={user.username}
                                activeCover={user.active_cover}
                                containerClassName="w-full h-full"
                                imageClassName="p-0.5 bg-[var(--theme-card-bg)]"
                            />
                        </div>
                        <p className="text-xs text-[var(--theme-text-secondary)] truncate w-full">{user.name || user.username}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const HomePage: React.FC<HomePageProps> = ({ session, onViewProfile, refreshKey, onOpenSearch, onOpenNotifications, unreadNotificationCount }) => {
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentModalPost, setCommentModalPost] = useState<PostWithDetails | null>(null);
    const myId = session.user.id;

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [postsPromise, followsPromise] = await Promise.all([
                 supabase
                    .from('posts')
                    .select(`
                        id,
                        created_at,
                        caption,
                        content_url,
                        user_id,
                        status,
                        profiles (
                            username,
                            name,
                            photo_url,
                            active_cover:active_cover_id(preview_url, asset_details)
                        ),
                        likes ( user_id ),
                        comments ( count )
                    `)
                    .order('created_at', { ascending: false }),
                supabase.from('follows').select('following_id').eq('follower_id', myId)
            ]);
            
            const { data: postData, error: postsError } = postsPromise;
            if (postsError) throw postsError;
            setPosts((postData as any) || []);

            const { data: followsData, error: followsError } = followsPromise;
            if (followsError) throw followsError;
            if (followsData) {
                setFollowingSet(new Set((followsData as any[]).map(f => f.following_id)));
            }


        } catch (error: any) {
            setError(error.message || "Failed to fetch posts.");
        } finally {
            setLoading(false);
        }
    }, [myId]);

    useEffect(() => {
        fetchPosts();
    }, [session, refreshKey, myId, fetchPosts]);
    
    const handleCommentAdded = useCallback((postId: number) => {
        setPosts(currentPosts => 
            currentPosts.map(p => {
                if (p.id === postId) {
                    const newCommentCount = (p.comments[0]?.count ?? 0) + 1;
                    return { ...p, comments: [{ count: newCommentCount }] };
                }
                return p;
            })
        );
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center pt-20">
                <LoadingSpinner />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center pt-20 text-red-500" role="alert">
                <p>Error loading feed: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <header className="flex justify-between items-center pl-24 sm:pl-28 pr-1 py-1">
                <div className="text-xl sm:text-2xl font-bold">
                  <Logo/>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={onOpenSearch} className="p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-card-bg-alt)] transition-colors">
                        <SearchIcon />
                    </button>
                    <button onClick={onOpenNotifications} className="relative p-1.5 rounded-lg text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] hover:bg-[var(--theme-card-bg-alt)] transition-colors">
                        <BellIcon />
                        {unreadNotificationCount > 0 && (
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--theme-bg)]" />
                        )}
                    </button>
                </div>
            </header>

            <SuggestedUsers onViewProfile={onViewProfile} />

             <QuickPostInput session={session} onPostCreated={fetchPosts} />
            
            <div className="space-y-6 pt-4">
                {posts.length > 0 ? (
                    posts.map(post => 
                        <PostCard
                            key={post.id}
                            post={post}
                            session={session}
                            onViewProfile={onViewProfile}
                            onOpenComments={() => setCommentModalPost(post)}
                            isInitiallyFollowing={followingSet.has(post.user_id)}
                        />)
                ) : (
                    <div className="text-center py-16 px-4 bg-[var(--theme-card-bg-alt)] rounded-2xl">
                        <h2 className="text-xl font-semibold text-[var(--theme-text)]">The feed is empty!</h2>
                        <p className="text-[var(--theme-text-secondary)] mt-2">Be the first to share something with the community.</p>
                    </div>
                )}
            </div>
             {commentModalPost && (
                <CommentModal
                    postId={commentModalPost.id}
                    postOwnerId={commentModalPost.user_id}
                    session={session}
                    onClose={() => setCommentModalPost(null)}
                    onCommentAdded={handleCommentAdded}
                />
            )}
        </div>
    );
};

export default HomePage;