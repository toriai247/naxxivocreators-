import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, Json } from '../../integrations/supabase/types';
import { 
    SearchIcon, 
    WebsiteIcon, 
    YouTubeIcon, 
    FacebookIcon, 
    InstagramIcon, 
    TwitterIcon, 
    TikTokIcon, 
    DiscordIcon, 
    TelegramIcon, 
    WhatsAppIcon, 
    LinkedInIcon, 
    GitHubIcon, 
    SpotifyIcon, 
    TwitchIcon,
    QrCodeIcon,
    LinkHubIcon,
    GoldMedalIcon,
    SilverMedalIcon,
    BronzeMedalIcon
} from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../common/Avatar';
import ConfettiExplosion from 'react-confetti-explosion';

interface UsersPageProps {
    session: Session;
    onViewProfile: (userId: string) => void;
}

type CreatorProfile = Tables<'profiles'> & {
    active_cover?: { preview_url: string | null; asset_details: Json } | null;
};

const CATEGORY_TAGS = [
    { id: 'all', label: 'All Creators', icon: '✨' },
    { id: 'top', label: '🔥 Top Creators', icon: '👑' },
    { id: 'gaming', label: '🎮 Gaming', icon: '🎮' },
    { id: 'editing', label: '🎨 Editing & AMV', icon: '🎨' },
    { id: 'music', label: '🎵 Music & Audio', icon: '🎵' },
    { id: 'vlogs', label: '🎬 Vlogs & Video', icon: '🎬' },
    { id: 'tech', label: '💻 Tech & Dev', icon: '💻' },
    { id: 'anime', label: '🍿 Anime & Series', icon: '🍿' },
];

const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

export const CreatorCard: React.FC<{
    creator: CreatorProfile;
    rank?: number;
    onViewProfile: (userId: string) => void;
}> = ({ creator, rank, onViewProfile }) => {
    // Collect non-empty social links
    const socialLinks = [
        { key: 'youtube', url: creator.youtube_url, title: 'YouTube', icon: <YouTubeIcon className="w-4 h-4"/>, color: 'hover:bg-red-600 bg-red-500/20 text-red-400 border-red-500/30' },
        { key: 'facebook', url: creator.facebook_url, title: 'Facebook', icon: <FacebookIcon className="w-4 h-4"/>, color: 'hover:bg-blue-600 bg-blue-500/20 text-blue-400 border-blue-500/30' },
        { key: 'instagram', url: creator.instagram_url, title: 'Instagram', icon: <InstagramIcon className="w-4 h-4"/>, color: 'hover:bg-pink-600 bg-pink-500/20 text-pink-400 border-pink-500/30' },
        { key: 'tiktok', url: creator.tiktok_url, title: 'TikTok', icon: <TikTokIcon className="w-4 h-4"/>, color: 'hover:bg-neutral-800 bg-neutral-800/60 text-white border-neutral-700' },
        { key: 'twitter', url: creator.twitter_url, title: 'Twitter / X', icon: <TwitterIcon className="w-4 h-4"/>, color: 'hover:bg-neutral-800 bg-neutral-800/60 text-white border-neutral-700' },
        { key: 'website', url: creator.website_url, title: 'Website', icon: <WebsiteIcon className="w-4 h-4"/>, color: 'hover:bg-indigo-600 bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
        { key: 'discord', url: creator.discord_url, title: 'Discord', icon: <DiscordIcon className="w-4 h-4"/>, color: 'hover:bg-indigo-600 bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
        { key: 'spotify', url: creator.spotify_url, title: 'Spotify', icon: <SpotifyIcon className="w-4 h-4"/>, color: 'hover:bg-green-600 bg-green-500/20 text-green-400 border-green-500/30' },
        { key: 'github', url: creator.github_url, title: 'GitHub', icon: <GitHubIcon className="w-4 h-4"/>, color: 'hover:bg-neutral-800 bg-neutral-800/60 text-white border-neutral-700' },
        { key: 'twitch', url: creator.twitch_url, title: 'Twitch', icon: <TwitchIcon className="w-4 h-4"/>, color: 'hover:bg-purple-600 bg-purple-500/20 text-purple-400 border-purple-500/30' },
    ].filter(s => !!s.url);

    // Extract keyword tags
    const keywords = creator.content_keywords 
        ? creator.content_keywords.split(',').map(k => k.trim()).filter(Boolean)
        : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative bg-[var(--theme-card-bg)] rounded-3xl border border-gray-200/20 dark:border-gray-800/80 shadow-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10 flex flex-col justify-between"
        >
            {/* Header / Cover Banner Backdrop */}
            <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
                {creator.cover_url ? (
                    <img src={creator.cover_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600 via-purple-600 to-pink-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-card-bg)] via-black/30 to-transparent" />

                {/* Optional Rank Badge */}
                {rank && rank <= 3 && (
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/50 flex items-center gap-1.5 shadow-lg">
                        <span className="text-xs font-black text-amber-400">
                            {rank === 1 ? '👑 #1 CREATOR' : rank === 2 ? '⚔️ #2 TOP' : '🛡️ #3 TOP'}
                        </span>
                    </div>
                )}
            </div>

            {/* Profile Info Container */}
            <div className="px-5 pb-5 relative pt-12 flex-1 flex flex-col">
                {/* Floating Avatar */}
                <div 
                    onClick={() => onViewProfile(creator.id)}
                    className="absolute -top-12 left-5 w-20 h-20 rounded-2xl p-1 bg-[var(--theme-card-bg)] shadow-xl cursor-pointer border-2 border-indigo-500/40 group-hover:border-indigo-400 transition-colors"
                >
                    <Avatar
                        photoUrl={creator.photo_url}
                        name={creator.username}
                        activeCover={creator.active_cover}
                        size="lg"
                        containerClassName="w-full h-full rounded-xl overflow-hidden"
                    />
                </div>

                {/* Top Right Quick Bio Action */}
                <div className="absolute -top-5 right-5 flex items-center gap-2">
                    <button
                        onClick={() => onViewProfile(creator.id)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-[11px] shadow-lg shadow-indigo-500/20 flex items-center gap-1 transition-transform active:scale-95"
                    >
                        <span>Visit Profile</span>
                        <span>→</span>
                    </button>
                </div>

                {/* Name & Handle */}
                <div className="mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 
                            onClick={() => onViewProfile(creator.id)}
                            className="font-black text-base text-[var(--theme-text)] hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                            {creator.name || creator.username}
                        </h3>
                        <span className="text-blue-500 text-sm font-bold" title="Verified Creator">✓</span>
                    </div>
                    <p className="text-xs font-bold text-indigo-400">
                        @{creator.username}
                    </p>
                </div>

                {/* Tagline / Bio */}
                {creator.bio_tagline ? (
                    <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2 italic mb-3 bg-[var(--theme-card-bg-alt)] px-3 py-1.5 rounded-xl border border-gray-500/10">
                        "{creator.bio_tagline}"
                    </p>
                ) : creator.bio ? (
                    <p className="text-xs text-[var(--theme-text-secondary)] line-clamp-2 mb-3 leading-relaxed">
                        {creator.bio}
                    </p>
                ) : null}

                {/* Content Keyword Tags */}
                {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {keywords.map((tag, idx) => (
                            <span 
                                key={idx}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="mb-3">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            #General Content Creator
                        </span>
                    </div>
                )}

                {/* Social Channels Direct Quick Links Bar */}
                <div className="mt-auto pt-3 border-t border-gray-500/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap overflow-hidden max-w-[210px]">
                        {socialLinks.length > 0 ? (
                            socialLinks.slice(0, 5).map(social => (
                                <a
                                    key={social.key}
                                    href={ensureProtocol(social.url!)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`Visit ${social.title}`}
                                    className={`p-1.5 rounded-lg border transition-transform hover:scale-110 active:scale-95 ${social.color}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {social.icon}
                                </a>
                            ))
                        ) : (
                            <span className="text-[10px] text-gray-500 font-semibold">No direct channels linked</span>
                        )}
                        {socialLinks.length > 5 && (
                            <span className="text-[10px] font-extrabold text-indigo-400 px-1 py-0.5">
                                +{socialLinks.length - 5}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => onViewProfile(creator.id)}
                        className="p-1.5 rounded-xl bg-[var(--theme-card-bg-alt)] border border-gray-500/20 text-gray-300 hover:text-white hover:border-indigo-500 text-xs font-extrabold flex items-center gap-1"
                    >
                        <LinkHubIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Bio Hub</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const UsersPage: React.FC<UsersPageProps> = ({ session, onViewProfile }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [creators, setCreators] = useState<CreatorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExploding, setIsExploding] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchCreators = async () => {
            setLoading(true);
            try {
                let { data, error } = await supabase
                    .from('profiles')
                    .select('*, active_cover:active_cover_id(preview_url, asset_details)');
                
                if (error) {
                    console.warn("Fallback query without active_cover join:", error.message);
                    const fallback = await supabase
                        .from('profiles')
                        .select('*');
                    data = fallback.data as any;
                    error = fallback.error;
                }

                if (error) {
                    console.error("Failed to load creators:", error);
                } else {
                    setCreators((data as CreatorProfile[]) || []);
                }
            } catch (err) {
                console.error("Error fetching creators:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCreators();
    }, []);

    // Filter Creators
    const filteredCreators = useMemo(() => {
        let list = [...creators];

        // Search query filter (Name, Username, Bio, Bio Tagline, Content Keywords)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(c => 
                (c.name && c.name.toLowerCase().includes(q)) || 
                (c.username && c.username.toLowerCase().includes(q)) ||
                (c.bio && c.bio.toLowerCase().includes(q)) ||
                (c.bio_tagline && c.bio_tagline.toLowerCase().includes(q)) ||
                (c.content_keywords && c.content_keywords.toLowerCase().includes(q))
            );
        }

        // Category Tag filter
        if (selectedCategory !== 'all') {
            if (selectedCategory === 'top') {
                list = list.slice(0, 10);
            } else {
                list = list.filter(c => {
                    const kw = (c.content_keywords || '').toLowerCase();
                    const bio = (c.bio || '').toLowerCase();
                    const tagline = (c.bio_tagline || '').toLowerCase();
                    const fullText = `${kw} ${bio} ${tagline}`;

                    switch (selectedCategory) {
                        case 'gaming': return fullText.includes('game') || fullText.includes('gaming') || fullText.includes('play') || fullText.includes('stream');
                        case 'editing': return fullText.includes('edit') || fullText.includes('amv') || fullText.includes('design') || fullText.includes('motion');
                        case 'music': return fullText.includes('music') || fullText.includes('song') || fullText.includes('audio') || fullText.includes('beat');
                        case 'vlogs': return fullText.includes('vlog') || fullText.includes('video') || fullText.includes('youtube') || fullText.includes('creator');
                        case 'tech': return fullText.includes('tech') || fullText.includes('code') || fullText.includes('dev') || fullText.includes('software');
                        case 'anime': return fullText.includes('anime') || fullText.includes('manga') || fullText.includes('series') || fullText.includes('amv');
                        default: return true;
                    }
                });
            }
        }

        return list;
    }, [creators, searchQuery, selectedCategory]);

    const topCreators = useMemo(() => creators.slice(0, 3), [creators]);
    const myProfile = useMemo(() => creators.find(c => c.id === session.user.id), [creators, session.user.id]);

    const handleCelebrateTop = (creator: CreatorProfile) => {
        setIsExploding(true);
        setToastMessage(`🎉 Celebrating Top Creator @${creator.username}! Check out their Bio Profile! 🎉`);
        setTimeout(() => setIsExploding(false), 3000);
        setTimeout(() => setToastMessage(null), 4000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center pt-32 text-center">
                <LoadingSpinner />
                <p className="mt-4 text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                    Loading Top Creators Directory...
                </p>
            </div>
        );
    }

    return (
        <div className="pb-36 min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
            {/* Confetti Explosion Trigger */}
            {isExploding && (
                <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <ConfettiExplosion particleCount={200} width={1600} duration={3000} />
                </div>
            )}

            {/* Celebration Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        className="fixed top-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md w-auto z-[99999] mx-auto bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-extrabold px-5 py-3 rounded-2xl shadow-[0_10px_35px_rgba(245,158,11,0.6)] border border-white text-xs sm:text-sm text-center tracking-wide"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Header Banner */}
            <header className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-[var(--theme-card-bg)] pt-8 pb-10 px-4 border-b border-gray-800">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />
                
                <div className="max-w-6xl mx-auto relative z-10 px-2 sm:px-6 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3">
                                <span>✨ NAXXIVO Creator Network</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                Top Creators & Content Directory
                            </h1>
                            <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-2 max-w-2xl leading-relaxed">
                                Search creators by content keywords (e.g. Gaming, Anime AMV, Tech, Music, Vlogs) and explore their social channels & bio link hubs.
                            </p>
                        </div>

                        {myProfile && (
                            <button
                                onClick={() => onViewProfile(myProfile.id)}
                                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-500/30 border border-white/20 transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
                            >
                                <span>✨ My Creator Bio Page</span>
                            </button>
                        )}
                    </div>

                    {/* Search Input Bar */}
                    <div className="mt-8 relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-400">
                            <SearchIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search creators by name, @username, or keywords (e.g. Gaming, AMV, Music, Vlogs)..."
                            className="w-full pl-12 pr-10 py-3.5 bg-black/60 border border-indigo-500/40 focus:border-indigo-400 rounded-2xl text-sm font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 backdrop-blur-md shadow-inner transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Category Tag Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-2 scrollbar-none">
                        {CATEGORY_TAGS.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                                    selectedCategory === cat.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/25 scale-105'
                                        : 'bg-black/40 hover:bg-black/60 text-slate-300 border-gray-700/60 hover:border-gray-500'
                                }`}
                            >
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
                {/* Search / Filter Result Bar */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider text-[var(--theme-text-secondary)] flex items-center gap-2">
                        <span>Directory List</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-extrabold border border-indigo-500/30">
                            {filteredCreators.length} Creators
                        </span>
                    </h2>
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="text-xs font-bold text-indigo-400 hover:underline"
                        >
                            Reset Search Filters
                        </button>
                    )}
                </div>

                {/* Top Spotlight Spotlight Cards (Top 3) if no search active */}
                {!searchQuery && selectedCategory === 'all' && topCreators.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">👑</span>
                            <h3 className="text-base font-black text-[var(--theme-text)]">
                                Featured Top Creators
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {topCreators.map((creator, idx) => (
                                <div key={creator.id} onClick={() => handleCelebrateTop(creator)}>
                                    <CreatorCard
                                        creator={creator}
                                        rank={idx + 1}
                                        onViewProfile={onViewProfile}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Creators Grid Directory */}
                {filteredCreators.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCreators.map(creator => (
                            <CreatorCard
                                key={creator.id}
                                creator={creator}
                                onViewProfile={onViewProfile}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-[var(--theme-card-bg)] rounded-3xl border border-gray-500/20 p-8 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-4">
                            🔍
                        </div>
                        <h3 className="text-lg font-black text-[var(--theme-text)]">
                            No Creators Found
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed">
                            No creators matched "{searchQuery || selectedCategory}". Try searching for another topic like Gaming, AMV, Music, or Vlogs!
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                            className="mt-6 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-500 shadow-lg"
                        >
                            Show All Creators
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UsersPage;
