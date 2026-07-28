import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, Json } from '../../integrations/supabase/types';
import { TrophyIcon, GoldCoinIcon, DiamondIcon, SilverCoinIcon, GoldMedalIcon, SilverMedalIcon, BronzeMedalIcon, SearchIcon } from '../common/AppIcons';
import { formatXp } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../common/Avatar';
import ConfettiExplosion from 'react-confetti-explosion';

interface UsersPageProps {
    session: Session;
    onViewProfile: (userId: string) => void;
}

type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url' | 'xp_balance' | 'gold_coins' | 'silver_coins' | 'diamond_coins'> & {
    active_cover: { preview_url: string | null, asset_details: Json } | null;
};
type LeaderboardCategory = 'xp' | 'gold' | 'silver' | 'diamond';
type TierFilter = 'all' | 'top10' | 'top50';

const getCategoryData = (user: Profile, category: LeaderboardCategory) => {
    switch(category) {
        case 'gold': return { value: user.gold_coins ?? 0, icon: <GoldCoinIcon className="w-4 h-4 text-yellow-500 inline"/>, label: 'Gold Coins', colorClass: 'text-yellow-500', bgGlow: 'from-amber-500/20 to-yellow-500/5', borderGlow: 'border-yellow-500/30' };
        case 'silver': return { value: user.silver_coins ?? 0, icon: <SilverCoinIcon className="w-4 h-4 text-slate-300 inline"/>, label: 'Silver Coins', colorClass: 'text-slate-300', bgGlow: 'from-slate-400/20 to-gray-500/5', borderGlow: 'border-slate-400/30' };
        case 'diamond': return { value: user.diamond_coins ?? 0, icon: <DiamondIcon className="w-4 h-4 text-cyan-400 inline"/>, label: 'Diamonds', colorClass: 'text-cyan-400', bgGlow: 'from-cyan-500/20 to-blue-500/5', borderGlow: 'border-cyan-500/30' };
        case 'xp':
        default: return { value: user.xp_balance, icon: <TrophyIcon className="w-4 h-4 text-violet-400 inline"/>, label: 'Arena XP', colorClass: 'text-violet-400', bgGlow: 'from-violet-600/20 to-purple-600/5', borderGlow: 'border-violet-500/30' };
    }
};

const getTierBadge = (rank: number) => {
    if (rank === 1) return { label: '👑 KING OF ARENA', bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.6)]' };
    if (rank === 2) return { label: '⚔️ GRANDMASTER', bg: 'bg-gradient-to-r from-slate-300 to-slate-100 text-slate-900 font-bold' };
    if (rank === 3) return { label: '🛡️ ELITE WARRIOR', bg: 'bg-gradient-to-r from-amber-700 to-orange-600 text-white font-bold' };
    if (rank <= 10) return { label: '🔥 MASTER', bg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' };
    if (rank <= 25) return { label: '💎 DIAMOND', bg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' };
    if (rank <= 50) return { label: '⚡ PLATINUM', bg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' };
    return { label: '🎮 CHALLENGER', bg: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' };
};

const PodiumUser: React.FC<{
    user: Profile;
    rank: number;
    category: LeaderboardCategory;
    onViewProfile: (userId: string) => void;
    onCelebrate: (user: Profile, rank: number) => void;
}> = ({ user, rank, category, onViewProfile, onCelebrate }) => {
    const isFirst = rank === 1;
    const categoryData = getCategoryData(user, category);
    
    let medalIcon;
    let rankTitle;
    switch (rank) {
        case 1:
            medalIcon = <GoldMedalIcon className="w-12 h-12 absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_8px_rgba(234,179,8,0.6)]" />;
            rankTitle = "CHAMPION";
            break;
        case 2:
            medalIcon = <SilverMedalIcon className="w-10 h-10 absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_6px_rgba(148,163,184,0.5)]" />;
            rankTitle = "RUNNER UP";
            break;
        case 3:
            medalIcon = <BronzeMedalIcon className="w-10 h-10 absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_4px_6px_rgba(217,119,6,0.5)]" />;
            rankTitle = "THIRD PLACE";
            break;
        default:
            medalIcon = null;
            rankTitle = "";
    }
    
    return (
        <motion.div
            onClick={() => {
                if (isFirst) onCelebrate(user, rank);
                onViewProfile(user.id);
            }}
            className={`flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:scale-105 ${isFirst ? 'w-2/5 z-10 -mt-6' : 'w-1/3'}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: rank * 0.1 }}
        >
            <div className="relative mb-4">
                {isFirst && (
                    <motion.div 
                        animate={{ y: [0, -6, 0], rotate: [0, -5, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 text-2xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                    >
                        👑
                    </motion.div>
                )}
                
                <div className={`relative rounded-full p-1.5 ${
                    rank === 1 ? 'bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.6)]' :
                    rank === 2 ? 'bg-gradient-to-tr from-slate-300 via-slate-400 to-slate-200 shadow-[0_0_15px_rgba(148,163,184,0.4)]' :
                    'bg-gradient-to-tr from-amber-700 via-orange-500 to-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.4)]'
                }`}>
                    <Avatar
                        photoUrl={user.photo_url}
                        name={user.username}
                        activeCover={user.active_cover}
                        size={isFirst ? "xl" : "lg"}
                        containerClassName="rounded-full overflow-hidden"
                        imageClassName="border-4 border-[var(--theme-card-bg)]"
                    />
                </div>
                {medalIcon}
            </div>

            <div className={`w-full px-2 py-2 rounded-xl border backdrop-blur-md ${
                rank === 1 ? 'bg-gradient-to-b from-amber-500/15 to-transparent border-amber-500/40 shadow-lg' :
                rank === 2 ? 'bg-gradient-to-b from-slate-400/10 to-transparent border-slate-400/30' :
                'bg-gradient-to-b from-amber-700/10 to-transparent border-amber-700/30'
            }`}>
                <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                    rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                    rank === 2 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40' :
                    'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                }`}>
                    {rankTitle}
                </span>
                <p className="font-bold text-sm text-[var(--theme-text)] mt-1 truncate max-w-[110px] mx-auto">
                    {user.name || user.username}
                </p>
                <div className="mt-1 inline-flex items-center gap-1.5 bg-[var(--theme-card-bg)]/80 px-2.5 py-1 rounded-full border border-[var(--theme-secondary)] shadow-sm">
                    {categoryData.icon}
                    <span className={`text-xs font-black ${categoryData.colorClass}`}>
                        {formatXp(categoryData.value)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const ListUserRow: React.FC<{ 
    user: Profile; 
    rank: number; 
    category: LeaderboardCategory; 
    onViewProfile: (userId: string) => void;
    isCurrentUser: boolean;
}> = ({ user, rank, category, onViewProfile, isCurrentUser }) => {
    const categoryData = getCategoryData(user, category);
    const tier = getTierBadge(rank);
    
    return (
        <motion.button
            onClick={() => onViewProfile(user.id)}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 text-left border ${
                isCurrentUser ? 
                'bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-yellow-500/15 border-yellow-500/60 shadow-[0_0_15px_rgba(240,185,11,0.2)]' : 
                'bg-[var(--theme-card-bg)] hover:bg-[var(--theme-card-bg-alt)] border-[var(--theme-secondary)] shadow-sm hover:shadow-md'
            }`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    rank <= 10 ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-sm' : 
                    isCurrentUser ? 'bg-yellow-500 text-black' : 'bg-[var(--theme-secondary)] text-[var(--theme-text-secondary)]'
                }`}>
                    #{rank}
                </div>
                
                <Avatar
                    photoUrl={user.photo_url}
                    name={user.username}
                    activeCover={user.active_cover}
                    size="md"
                    containerClassName="flex-shrink-0"
                />
                
                <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2">
                        <p className={`truncate font-bold text-sm ${isCurrentUser ? 'text-yellow-500' : 'text-[var(--theme-text)]'}`}>
                            {user.name || user.username}
                        </p>
                        {isCurrentUser && (
                            <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                YOU
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--theme-text-secondary)] truncate">
                            @{user.username}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tier.bg} hidden sm:inline-block`}>
                            {tier.label}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <div className="flex items-center gap-1.5 bg-[var(--theme-card-bg-alt)] px-3 py-1.5 rounded-xl border border-[var(--theme-secondary)]">
                    {categoryData.icon}
                    <span className={`text-sm font-black ${categoryData.colorClass}`}>
                        {formatXp(categoryData.value)}
                    </span>
                </div>
            </div>
        </motion.button>
    );
};

const MyRankBanner: React.FC<{
    myRankInfo: { user: Profile; rank: number } | null; 
    category: LeaderboardCategory; 
    onViewProfile: (userId: string) => void;
}> = ({ myRankInfo, category, onViewProfile }) => {
    if (!myRankInfo) return null;
    
    const { user, rank } = myRankInfo;
    const categoryData = getCategoryData(user, category);

    return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40"
        >
            <div 
                onClick={() => onViewProfile(user.id)}
                className="flex items-center justify-between p-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl border border-purple-500/50 shadow-[0_8px_30px_rgba(168,85,247,0.35)] backdrop-blur-lg cursor-pointer hover:border-yellow-500/60 transition-all duration-300"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-md flex-shrink-0">
                        #{rank}
                    </div>
                    <Avatar photoUrl={user.photo_url} name={user.username} activeCover={user.active_cover} size="sm" />
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-extrabold text-sm text-yellow-400">Your Standing</p>
                            <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded border border-purple-500/40">
                                TOP {(rank <= 10) ? '10' : (rank <= 50) ? '50' : 'ARENA'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-300 truncate font-medium">@{user.username}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                        {categoryData.icon}
                        <span className="text-sm font-black text-white">
                            {formatXp(categoryData.value)}
                        </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-purple-300 hover:bg-purple-600/50 transition-colors">
                        ➔
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const UsersPage: React.FC<UsersPageProps> = ({ session, onViewProfile }) => {
    const [category, setCategory] = useState<LeaderboardCategory>('xp');
    const [tierFilter, setTierFilter] = useState<TierFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExploding, setIsExploding] = useState(false);
    const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            let { data, error } = await supabase
                .from('profiles')
                .select('id, name, username, photo_url, xp_balance, gold_coins, silver_coins, diamond_coins, active_cover:active_cover_id(preview_url, asset_details)');
            
            if (error) {
                console.warn("Retrying fetch without active_cover join:", error.message);
                const fallback = await supabase
                    .from('profiles')
                    .select('id, name, username, photo_url, xp_balance, gold_coins, silver_coins, diamond_coins, active_cover_id');
                data = fallback.data as any;
                error = fallback.error;
            }

            if (error) {
                console.warn("Retrying fetch basic profile columns:", error.message);
                const basic = await supabase
                    .from('profiles')
                    .select('id, name, username, photo_url, xp_balance, gold_coins, silver_coins, diamond_coins');
                data = basic.data as any;
                error = basic.error;
            }

            if (error) {
                console.error("Failed to fetch users:", error);
            } else {
                setUsers((data as any) || []);
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);
    
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            const valA = getCategoryData(a, category).value;
            const valB = getCategoryData(b, category).value;
            return valB - valA;
        });
    }, [users, category]);
    
    const filteredUsers = useMemo(() => {
        let list = sortedUsers;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(u => 
                (u.name && u.name.toLowerCase().includes(q)) || 
                (u.username && u.username.toLowerCase().includes(q))
            );
        }
        if (tierFilter === 'top10') {
            list = list.filter((_, idx) => idx < 10);
        } else if (tierFilter === 'top50') {
            list = list.filter((_, idx) => idx < 50);
        }
        return list;
    }, [sortedUsers, searchQuery, tierFilter]);

    const topThree = useMemo(() => sortedUsers.slice(0, 3), [sortedUsers]);
    const myRankInfo = useMemo(() => {
        const myIndex = sortedUsers.findIndex(u => u.id === session.user.id);
        if (myIndex === -1) return null;
        return { user: sortedUsers[myIndex], rank: myIndex + 1 };
    }, [sortedUsers, session.user.id]);

    const categories: { id: LeaderboardCategory; label: string; icon: React.ReactNode }[] = [
        { id: 'xp', label: 'Arena XP', icon: <TrophyIcon className="w-4 h-4 text-violet-400" /> },
        { id: 'gold', label: 'Gold Coins', icon: <GoldCoinIcon className="w-4 h-4 text-yellow-500" /> },
        { id: 'silver', label: 'Silver Coins', icon: <SilverCoinIcon className="w-4 h-4 text-slate-300" /> },
        { id: 'diamond', label: 'Diamonds', icon: <DiamondIcon className="w-4 h-4 text-cyan-400" /> },
    ];

    const handleCelebrate = (user: Profile, rank: number) => {
        setIsExploding(true);
        setCelebrationToast(`🎉 All Hail Champion ${user.name || user.username}! #1 in ${category.toUpperCase()}! 🎉`);
        setTimeout(() => setIsExploding(false), 3000);
        setTimeout(() => setCelebrationToast(null), 4000);
    };

    if (loading) {
        return <div className="flex justify-center pt-32"><LoadingSpinner /></div>;
    }

    const currentCatInfo = getCategoryData(users[0] || { xp_balance: 0, gold_coins: 0, silver_coins: 0, diamond_coins: 0 }, category);

    return (
        <div className="pb-36 min-h-screen bg-[var(--theme-bg)]">
            {/* Confetti Explosion Trigger */}
            {isExploding && (
                <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <ConfettiExplosion particleCount={200} width={1600} duration={3000} />
                </div>
            )}

            {/* Celebration Toast */}
            <AnimatePresence>
                {celebrationToast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-extrabold px-6 py-3 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.8)] border border-white text-sm md:text-base text-center max-w-md w-[90%]"
                    >
                        {celebrationToast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Banner Section */}
            <header className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-purple-950 to-[var(--theme-card-bg)] pt-6 pb-8 px-4 border-b border-[var(--theme-secondary)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.2),transparent_70%)] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10 px-2 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-600 to-purple-600 flex items-center justify-center shadow-lg text-2xl">
                                🏆
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-logo text-2xl md:text-3xl font-black text-white tracking-wide">
                                        LEADERBOARD
                                    </h1>
                                    <span className="animate-pulse bg-gradient-to-r from-red-500 to-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                        ⚡ SEASON 1
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium">
                                    Dominate the arena, claim daily rewards, and build your legacy!
                                </p>
                            </div>
                        </div>

                        {/* Stats Overview Pill */}
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white text-xs">
                            <div className="text-center">
                                <span className="block font-black text-yellow-400">{sortedUsers.length}</span>
                                <span className="text-[10px] text-slate-400">Warriors</span>
                            </div>
                            <div className="h-6 w-px bg-white/20" />
                            <div className="text-center">
                                <span className="block font-black text-purple-300">#{myRankInfo?.rank || '-'}</span>
                                <span className="text-[10px] text-slate-400">Your Rank</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Selector Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        {categories.map(cat => {
                            const isActive = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setCategory(cat.id);
                                        setSearchQuery('');
                                    }}
                                    className={`relative flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                                        isActive ? 'text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="lb-category-pill"
                                            className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-xl border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        {cat.icon}
                                        {cat.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
                {/* Search & Tier Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    {/* Search Bar */}
                    <div className="relative flex-grow max-w-md">
                        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--theme-text-secondary)]" />
                        <input
                            type="text"
                            placeholder={`Search players by name or username...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 bg-[var(--theme-card-bg)] border border-[var(--theme-secondary)] rounded-xl text-sm font-medium text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--theme-secondary)] flex items-center justify-center text-xs font-bold text-[var(--theme-text-secondary)] hover:bg-[var(--theme-secondary-hover)]"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-[var(--theme-card-bg)] p-1 rounded-xl border border-[var(--theme-secondary)] self-start sm:self-auto shadow-sm">
                        {(['all', 'top10', 'top50'] as TierFilter[]).map((tier) => (
                            <button
                                key={tier}
                                onClick={() => setTierFilter(tier)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    tierFilter === tier 
                                    ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-sm font-black' 
                                    : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-card-bg-alt)]'
                                }`}
                            >
                                {tier === 'all' ? '🌐 All Arena' : tier === 'top10' ? '🔥 Top 10' : '⚡ Top 50'}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={`${category}-${tierFilter}-${searchQuery ? 'search' : 'no-search'}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Top 3 Podium (Only show when not searching or if search results include top players) */}
                        {!searchQuery && tierFilter === 'all' && topThree.length >= 3 && (
                            <div className={`relative mb-8 rounded-3xl p-6 bg-gradient-to-b ${currentCatInfo.bgGlow} border ${currentCatInfo.borderGlow} shadow-xl backdrop-blur-sm overflow-hidden`}>
                                <div className="absolute top-3 right-4 text-xs font-black text-[var(--theme-text-secondary)] flex items-center gap-1.5 uppercase tracking-wider">
                                    <span>🌟 HALL OF CHAMPIONS</span>
                                </div>
                                <div className="flex justify-center items-end gap-2 sm:gap-6 pt-10 pb-4 max-w-2xl mx-auto">
                                    {topThree[1] && <PodiumUser user={topThree[1]} rank={2} category={category} onViewProfile={onViewProfile} onCelebrate={handleCelebrate} />}
                                    {topThree[0] && <PodiumUser user={topThree[0]} rank={1} category={category} onViewProfile={onViewProfile} onCelebrate={handleCelebrate} />}
                                    {topThree[2] && <PodiumUser user={topThree[2]} rank={3} category={category} onViewProfile={onViewProfile} onCelebrate={handleCelebrate} />}
                                </div>
                            </div>
                        )}

                        {/* Leaderboard List Header */}
                        <div className="flex items-center justify-between px-3 py-2 text-xs font-extrabold text-[var(--theme-text-secondary)] uppercase tracking-wider border-b border-[var(--theme-secondary)] mb-3">
                            <span className="pl-2">Rank & Warrior</span>
                            <span>Score</span>
                        </div>

                        {/* List Row Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            <AnimatePresence>
                                {filteredUsers.map((user) => {
                                    const originalRank = sortedUsers.findIndex(u => u.id === user.id) + 1;
                                    // If we are showing podium and no search is active, skip top 3 in list to avoid duplicates
                                    if (!searchQuery && tierFilter === 'all' && originalRank <= 3) {
                                        return null;
                                    }
                                    return (
                                        <ListUserRow 
                                            key={user.id} 
                                            user={user} 
                                            rank={originalRank} 
                                            category={category} 
                                            onViewProfile={onViewProfile}
                                            isCurrentUser={user.id === session.user.id}
                                        />
                                    );
                                })}
                            </AnimatePresence>

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-16 bg-[var(--theme-card-bg)] rounded-3xl border border-dashed border-[var(--theme-secondary)] p-8">
                                    <div className="text-4xl mb-3">🔍</div>
                                    <h3 className="text-lg font-bold text-[var(--theme-text)]">No Warriors Found</h3>
                                    <p className="text-sm text-[var(--theme-text-secondary)] mt-1 max-w-sm mx-auto">
                                        We couldn't find any players matching "{searchQuery}". Try searching for a different username!
                                    </p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4 px-5 py-2 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Floating My Rank Banner */}
            <AnimatePresence>
                {myRankInfo && <MyRankBanner myRankInfo={myRankInfo} category={category} onViewProfile={onViewProfile} />}
            </AnimatePresence>
        </div>
    );
};

export default UsersPage;

