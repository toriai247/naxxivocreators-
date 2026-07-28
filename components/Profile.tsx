import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../integrations/supabase/client';
import Button from './common/Button';
import type { Tables, TablesInsert, Json } from '../integrations/supabase/types';
import { formatXp } from '../utils/helpers';
import LoadingSpinner from './common/LoadingSpinner';
import { 
    BackArrowIcon, SettingsIcon, MusicNoteIcon, ToolsIcon, GoldCoinIcon, SilverCoinIcon, 
    DiamondIcon, WebsiteIcon, YouTubeIcon, FacebookIcon, TrophyIcon,
    InstagramIcon, TwitterIcon, TikTokIcon, DiscordIcon,
    LinkHubIcon, QrCodeIcon, ShareIcon
} from './common/AppIcons';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import ItemPreviewModal from './profile/ItemPreviewModal';
import BioLinkHubModal from './profile/BioLinkHubModal';
import SmartQrCodeModal from './profile/SmartQrCodeModal';


// --- Types --- //
type UserInventoryItem = Tables<'user_inventory'> & {
    store_items: Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url' | 'description'> | null;
};
type StoreItem = Pick<Tables<'store_items'>, 'id' | 'asset_details' | 'preview_url'>;

// --- Profile Component --- //
interface ProfileProps {
    session: Session;
    userId: string;
    onBack?: () => void;
    onMessage?: (user: { id: string; name: string; photo_url: string | null; active_cover: { preview_url: string | null; asset_details: Json; } | null; }) => void;
    onNavigateToSettings: () => void;
    onNavigateToTools: () => void;
    onViewProfile: (userId: string) => void;
}
type ProfileData = Tables<'profiles'> & {
    selected_music: { music_url: string } | null;
    profile_gifs: { gif_url: string } | null;
    active_cover?: StoreItem | null;
};
const ensureProtocol = (url: string) => {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        return `https://${url}`;
    }
    return url;
};

const SocialLink = ({ href, children, brandColorClass, label }: { href: string; children: React.ReactNode; brandColorClass: string; label?: string }) => (
    <motion.a 
        href={ensureProtocol(href)} 
        target="_blank" 
        rel="noopener noreferrer" 
        title={label}
        className={`group relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--theme-card-bg-alt)] border border-gray-200/20 dark:border-gray-700/30 text-[var(--theme-text-secondary)] rounded-full transition-all duration-300 hover:text-white hover:scale-110 hover:shadow-lg ${brandColorClass}`}
        {...{
            variants: {
                hidden: { opacity: 0, scale: 0.5, y: 10 },
                visible: { opacity: 1, scale: 1, y: 0 },
            },
            whileHover: { y: -3 }
        } as any}
    >
        {children}
        {label && (
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 text-white text-[10px] font-bold rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                {label}
            </span>
        )}
    </motion.a>
);

interface ProfileHeaderWithAudioFxProps {
    profile: ProfileData;
    isPlaying: boolean;
    setIsPlaying: (val: boolean) => void;
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
    itemVariants: Variants;
    children?: React.ReactNode;
}

const ProfileHeaderWithAudioFx: React.FC<ProfileHeaderWithAudioFxProps> = ({
    profile,
    isPlaying,
    setIsPlaying,
    audioRef,
    itemVariants,
    children
}) => {
    const [beatScale, setBeatScale] = useState(1);
    const [beatGlow, setBeatGlow] = useState(0);
    const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(16).fill(10));
    const [beatFxEnabled, setBeatFxEnabled] = useState(true);
    const [isHeavyBeat, setIsHeavyBeat] = useState(false);
    const [ambientHue, setAmbientHue] = useState(280);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isPlaying) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setBeatScale(1);
            setBeatGlow(0);
            setVisualizerBars(Array(16).fill(10));
            return;
        }

        let lastUpdate = performance.now();
        const dataArray = analyserRef.current ? new Uint8Array(analyserRef.current.frequencyBinCount) : null;
        let time = 0;

        const updateLoop = () => {
            time += 0.08;
            const now = performance.now();
            
            let avgBass = 0;
            let avgMid = 0;
            let isRealAudio = false;

            if (analyserRef.current && dataArray) {
                try {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let bassSum = 0;
                    for (let i = 0; i < 4; i++) bassSum += dataArray[i];
                    avgBass = bassSum / 4;

                    let midSum = 0;
                    for (let i = 4; i < 16; i++) midSum += dataArray[i];
                    avgMid = midSum / 12;

                    if (avgBass > 5 || avgMid > 5) {
                        isRealAudio = true;
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (!isRealAudio) {
                const beatPulse = Math.pow(Math.abs(Math.sin(time * 3.5)), 6);
                const subBeat = Math.abs(Math.sin(time * 7));
                avgBass = beatPulse * 230 + subBeat * 40;
                avgMid = Math.abs(Math.sin(time * 4 + 1)) * 180;
            }

            // Throttled to ~30 FPS - only re-renders this isolated header without shaking or slowing down the rest of the page!
            if (now - lastUpdate >= 33) {
                lastUpdate = now;
                
                const normalizedBass = Math.min(1, avgBass / 230);
                const heavy = normalizedBass > 0.68;
                setIsHeavyBeat(heavy);
                setAmbientHue(Math.round((time * 40) % 360));
                
                if (beatFxEnabled) {
                    const newScale = 1 + normalizedBass * 0.14;
                    setBeatScale(Number(newScale.toFixed(3)));
                    setBeatGlow(Number(normalizedBass.toFixed(2)));
                } else {
                    setBeatScale(1);
                    setBeatGlow(0);
                }

                const newBars = Array.from({ length: 16 }, (_, idx) => {
                    let val = 10;
                    if (isRealAudio && dataArray && idx < dataArray.length) {
                        val = 8 + (dataArray[idx] / 255) * 44;
                    } else {
                        const wave = Math.abs(Math.sin(time * 4 + idx * 0.4)) * 38;
                        val = 8 + wave * (0.5 + normalizedBass * 0.5);
                    }
                    return Math.round(val);
                });
                setVisualizerBars(newBars);
            }

            animationFrameRef.current = requestAnimationFrame(updateLoop);
        };

        animationFrameRef.current = requestAnimationFrame(updateLoop);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, beatFxEnabled]);

    const handleAvatarClick = async () => {
        const musicUrl = profile?.selected_music?.music_url;
        if (!musicUrl) return;
    
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current || audioRef.current.src !== musicUrl) {
                if(audioRef.current) audioRef.current.pause();
                audioRef.current = new Audio(musicUrl);
                audioRef.current.crossOrigin = "anonymous";
                audioRef.current.addEventListener('ended', () => setIsPlaying(false));
            }
            try {
                await audioRef.current.play();
                setIsPlaying(true);
                
                if (!audioContextRef.current) {
                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioCtx) {
                        try {
                            audioContextRef.current = new AudioCtx();
                            analyserRef.current = audioContextRef.current.createAnalyser();
                            analyserRef.current.fftSize = 64;
                        } catch (e) {
                            console.warn("AudioContext init error:", e);
                        }
                    }
                }
                if (audioContextRef.current && analyserRef.current && audioRef.current && !sourceRef.current) {
                    try {
                        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                        sourceRef.current.connect(analyserRef.current);
                        analyserRef.current.connect(audioContextRef.current.destination);
                    } catch (e) {
                        console.warn("MediaElementSource connection error (likely CORS):", e);
                    }
                }
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume();
                }
            } catch (error) {
                console.error("Audio play failed:", error);
            }
        }
    };

    const activeGifUrl = profile.profile_gifs?.gif_url;
    const profileImageUrl = isPlaying && activeGifUrl ? activeGifUrl : profile.photo_url;
    const activeCoverUrl = profile.active_cover?.preview_url;
    const transform = (profile.active_cover?.asset_details as { transform?: { scale: number; translateX: number; translateY: number; } })?.transform;
    const baseTransform = 'translate(-50%, -50%)';
    const dynamicTransform = transform 
        ? ` translateX(${transform.translateX}px) translateY(${transform.translateY}px) scale(${transform.scale})`
        : '';
    const transformStyle = {
        transform: `${baseTransform}${dynamicTransform}`
    };

    return (
        <>
            {/* --- LIVE BEAT AMBIENT BACKGROUND GLOW --- */}
            {isPlaying && beatFxEnabled && (
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-all duration-300">
                    <div 
                        className="absolute -top-1/4 -left-1/4 w-[140vw] h-[140vw] rounded-full opacity-30 blur-3xl transition-transform duration-100"
                        style={{
                            background: `radial-gradient(circle, hsl(${ambientHue}, 80%, 55%), transparent 65%)`,
                            transform: `scale(${1 + beatGlow * 0.3})`
                        }}
                    />
                    <div 
                        className="absolute -bottom-1/4 -right-1/4 w-[140vw] h-[140vw] rounded-full opacity-30 blur-3xl transition-transform duration-100"
                        style={{
                            background: `radial-gradient(circle, hsl(${(ambientHue + 160) % 360}, 80%, 50%), transparent 65%)`,
                            transform: `scale(${1 + beatGlow * 0.4})`
                        }}
                    />
                </div>
            )}

            <div className="lg:col-span-4 xl:col-span-3 flex flex-col items-center lg:items-start lg:border-r lg:border-gray-200/20 dark:lg:border-gray-700/30 lg:pr-8 relative z-10">
                <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0 lg:-mt-24 lg:mb-6 flex flex-col items-center lg:items-center w-full">
                    {isPlaying && (
                        <div 
                            className="absolute -inset-6 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-60 blur-xl pointer-events-none transition-all duration-75"
                            style={{
                                transform: `scale(${beatScale * 1.15})`,
                                opacity: 0.3 + beatGlow * 0.6
                            }}
                        />
                    )}

                    {isPlaying && (
                        <div className="absolute -inset-4 flex items-center justify-center pointer-events-none">
                            {visualizerBars.map((height, idx) => {
                                const angle = (idx / visualizerBars.length) * 360;
                                return (
                                    <div
                                        key={idx}
                                        className="absolute origin-bottom bg-gradient-to-t from-purple-500 to-pink-400 rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                                        style={{
                                            width: '4px',
                                            height: `${height}px`,
                                            bottom: '50%',
                                            left: 'calc(50% - 2px)',
                                            transform: `rotate(${angle}deg) translateY(-76px)`,
                                            opacity: 0.6 + (height / 52) * 0.4
                                        }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    <button 
                        onClick={handleAvatarClick} 
                        className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 block group focus:outline-none rounded-full transition-transform duration-75 z-10"
                        style={{
                            transform: isPlaying ? `scale(${beatScale})` : 'scale(1)',
                            boxShadow: isPlaying ? `0 0 ${15 + beatGlow * 35}px rgba(236,72,153,${0.5 + beatGlow * 0.5})` : undefined
                        }}
                    >
                        <img src={profileImageUrl || undefined} alt="avatar" className="w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full object-cover border-8 border-[var(--theme-card-bg)] shadow-xl" />
                        {activeCoverUrl && <img src={activeCoverUrl} alt="Profile Cover" className="absolute top-1/2 left-1/2 pointer-events-none" style={transformStyle} />}
                        {profile.selected_music && (
                            <div className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 rounded-full p-2 sm:p-2.5 shadow-md z-20 transition-all ${isPlaying ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse shadow-purple-500/50 shadow-lg scale-110' : 'bg-white text-[var(--theme-primary)]'}`}>
                                <MusicNoteIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                        )}
                    </button>

                    {isPlaying && (
                        <div className="mt-3 bg-slate-900/90 border border-purple-500/40 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg shadow-purple-500/20 z-20 animate-fade-in">
                            <div className="flex items-end gap-0.5 h-4">
                                {visualizerBars.slice(0, 5).map((h, i) => (
                                    <div key={i} className="w-1 bg-gradient-to-t from-cyan-400 to-pink-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(4, h / 3)}px` }} />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                                <span className="text-pink-400 animate-pulse">●</span> {isHeavyBeat ? '🔥 SUPER BEAT!' : 'LIVE BEAT FX'}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setBeatFxEnabled(!beatFxEnabled); }}
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md transition-colors ${beatFxEnabled ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/50' : 'bg-gray-700 text-gray-300'}`}
                                title="Toggle beat pulsing"
                            >
                                {beatFxEnabled ? 'FX ON ⚡' : 'FX OFF'}
                            </button>
                        </div>
                    )}
                </motion.div>

                <div className={`transition-all duration-300 w-full ${isPlaying ? 'pt-28 sm:pt-32 lg:pt-0' : 'pt-20 sm:pt-24 lg:pt-0'}`}>
                    <motion.h1
                       {...{variants:itemVariants} as any}
                       className={`text-3xl sm:text-4xl font-extrabold transition-all duration-100 inline-block ${
                           isPlaying && beatFxEnabled
                               ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 animate-pulse'
                               : 'text-[var(--theme-text)] font-bold'
                       }`}
                       style={isPlaying && beatFxEnabled ? {
                           transform: `scale(${1 + beatGlow * 0.08})`,
                           filter: isHeavyBeat ? `drop-shadow(0 0 14px hsl(${ambientHue}, 90%, 65%))` : undefined
                       } : undefined}
                    >
                       {profile.name}
                    </motion.h1>
                    <motion.p 
                       {...{variants:itemVariants} as any} 
                       className={`mt-1 sm:text-lg transition-all duration-100 ${
                           isPlaying && beatFxEnabled ? 'text-pink-400 font-bold tracking-wide' : 'text-[var(--theme-text-secondary)] font-normal'
                       }`}
                    >
                       @{profile.username}
                    </motion.p>
                    {profile.bio && (
                        <motion.p 
                            {...{variants:itemVariants} as any} 
                            className="text-sm sm:text-base mt-4 max-w-md lg:max-w-none mx-auto lg:mx-0 text-[var(--theme-text)] font-normal"
                        >
                            {profile.bio}
                        </motion.p>
                    )}
                    {children}
                </div>
            </div>
        </>
    );
};

const Profile: React.FC<ProfileProps> = ({ session, userId, onBack, onMessage, onNavigateToSettings, onNavigateToTools, onViewProfile }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
    const [collectionItems, setCollectionItems] = useState<UserInventoryItem[]>([]);
    const [isCollectionLoading, setIsCollectionLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UserInventoryItem['store_items'] | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showBioModal, setShowBioModal] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    
    const isMyProfile = userId === session.user.id;
    
    // --- Scroll & Animation Hooks --- //
    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({ container: scrollRef });
    const coverScale = useTransform(scrollY, [0, 300], [1, 1.2]);
    const coverY = useTransform(scrollY, [0, 300], [0, -50]);
    
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } }
    };
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
    };
    
    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            setLoading(true);
            setError(null);
            setIsPlaying(false);
            if(audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            try {
                setIsCollectionLoading(true);
                const [profileRes, inventoryRes] = await Promise.all([
                    supabase.from('profiles').select('*, instagram_url, twitter_url, tiktok_url, discord_url').eq('id', userId).single(),
                    supabase.from('user_inventory').select('*, store_items(id, name, preview_url, description)').eq('user_id', userId),
                ]);

                const pRes = profileRes as any;
                if (pRes.error || !pRes.data) throw new Error(pRes.error?.message || "Profile not found.");
                const profileBase = pRes.data;

                const [musicRes, gifRes, coverRes] = await Promise.all([
                    profileBase.selected_music_id ? supabase.from('profile_music').select('music_url').eq('id', profileBase.selected_music_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
                    profileBase.active_gif_id ? supabase.from('profile_gifs').select('gif_url').eq('id', profileBase.active_gif_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
                    profileBase.active_cover_id ? supabase.from('store_items').select('id, asset_details, preview_url').eq('id', profileBase.active_cover_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
                ]);

                const fullProfileData: ProfileData = {
                    ...(profileBase as any),
                    selected_music: (musicRes as any).data,
                    profile_gifs: (gifRes as any).data,
                    active_cover: (coverRes as any).data as StoreItem | null,
                };
                setProfile(fullProfileData);
                
                if (inventoryRes.error) throw inventoryRes.error;
                setCollectionItems((inventoryRes.data as any[]) || []);
                setIsCollectionLoading(false);
                
                if (!isMyProfile) {
                    const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).match({ follower_id: session.user.id, following_id: userId });
                    setIsFollowing((count || 0) > 0);
                }
                
            } catch (error: any) {
                setError(error.message || "An error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        
        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        }
    }, [userId, session.user.id, isMyProfile]);

    const handleFollowToggle = async () => {
        if (isMyProfile || isUpdatingFollow) return;
        setIsUpdatingFollow(true);
        const originalFollowStatus = isFollowing;
        setIsFollowing(!originalFollowStatus);

        try {
            if (originalFollowStatus) {
                await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: userId });
            } else {
                const newFollow: TablesInsert<'follows'> = { follower_id: session.user.id, following_id: userId };
                await supabase.from('follows').insert(newFollow as any);
            }
        } catch (error: any) { 
            console.error("Failed to update follow status:", error.message);
            setIsFollowing(originalFollowStatus);
        } finally { 
            setIsUpdatingFollow(false);
        }
    };
    
    if (loading) return (
        <div ref={scrollRef} className="bg-[var(--theme-bg)] h-screen overflow-y-auto hide-scrollbar relative flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
    
    if (error || !profile) return (
        <div ref={scrollRef} className="bg-[var(--theme-bg)] h-screen overflow-y-auto hide-scrollbar relative flex flex-col items-center justify-center p-4 text-center">
            <p className="text-red-500">{error || "Could not load profile."}</p>
            {onBack && <Button onClick={onBack} variant="secondary" className="mt-4 w-auto px-6">Back</Button>}
        </div>
    );

    const activeGifUrl = profile.profile_gifs?.gif_url;
    const profileImageUrl = isPlaying && activeGifUrl ? activeGifUrl : (profile.photo_url);
    const activeCoverUrl = profile.active_cover?.preview_url;
    const transform = (profile.active_cover?.asset_details as { transform?: { scale: number; translateX: number; translateY: number; } })?.transform;
    const baseTransform = 'translate(-50%, -50%)';
    const dynamicTransform = transform 
        ? ` translateX(${transform.translateX}px) translateY(${transform.translateY}px) scale(${transform.scale})`
        : '';
    const transformStyle = {
        transform: `${baseTransform}${dynamicTransform}`
    };

    return (
        <>
            <div ref={scrollRef} className="bg-[var(--theme-bg)] h-screen overflow-y-auto hide-scrollbar relative">
                {/* --- BACKGROUND COVER --- */}
                <motion.div style={{ y: coverY } as any} className="absolute top-0 left-0 right-0 h-56 sm:h-72 lg:h-80 xl:h-96 z-0">
                    <motion.div style={{ scale: coverScale } as any} className="w-full h-full relative">
                        {profile.cover_url && <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[var(--theme-card-bg)] to-transparent" />
                    </motion.div>
                </motion.div>
                
                {/* --- HEADER BUTTONS --- */}
                <div className="absolute top-4 sm:top-6 lg:top-8 left-4 sm:left-8 lg:left-12 right-4 sm:right-8 lg:right-12 flex justify-between items-center z-20 max-w-7xl mx-auto">
                    <button onClick={onBack} className={`text-white p-2.5 sm:p-3 rounded-full transition-all bg-black/30 backdrop-blur-md hover:bg-black/50 hover:scale-105 shadow-lg ${onBack ? 'visible' : 'invisible'}`}><BackArrowIcon /></button>
                    <div className="flex items-center gap-2">
                        {isMyProfile && <button onClick={onNavigateToTools} className="text-white p-2.5 sm:p-3 rounded-full transition-all bg-black/30 backdrop-blur-md hover:bg-black/50 hover:scale-105 shadow-lg" title="Tools"><ToolsIcon /></button>}
                        {isMyProfile && <button onClick={onNavigateToSettings} className="text-white p-2.5 sm:p-3 rounded-full transition-all bg-black/30 backdrop-blur-md hover:bg-black/50 hover:scale-105 shadow-lg" title="Settings"><SettingsIcon /></button>}
                    </div>
                </div>
                
                {/* --- MAIN CONTENT (SCROLLABLE) --- */}
                <div className="relative z-10 mt-36 sm:mt-48 lg:mt-60 max-w-7xl mx-auto px-0 sm:px-6 lg:px-10 pb-20">
                    <motion.div
                        {...{
                            variants: containerVariants, initial: "hidden", animate: "visible"
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 relative sm:shadow-2xl sm:border sm:border-gray-200/20 dark:sm:border-gray-800/40 sm:mb-10"
                    >
                         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 text-center lg:text-left">
                            {/* --- LEFT COLUMN: AVATAR, BIO, SOCIALS --- */}
                            <ProfileHeaderWithAudioFx
                                profile={profile}
                                isPlaying={isPlaying}
                                setIsPlaying={setIsPlaying}
                                audioRef={audioRef}
                                itemVariants={itemVariants}
                            >
                                {/* Improved Social Links with Tooltips and Hover Glow */}
                                <motion.div {...{variants:containerVariants} as any} className="flex justify-center lg:justify-start flex-wrap gap-3 my-6">
                                    {profile.website_url && <SocialLink label="Website" href={profile.website_url} brandColorClass="hover:bg-indigo-600 hover:border-indigo-400"><WebsiteIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.youtube_url && <SocialLink label="YouTube" href={profile.youtube_url} brandColorClass="hover:bg-[#FF0000] hover:border-red-400"><YouTubeIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.facebook_url && <SocialLink label="Facebook" href={profile.facebook_url} brandColorClass="hover:bg-[#1877F2] hover:border-blue-400"><FacebookIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.instagram_url && <SocialLink label="Instagram" href={profile.instagram_url} brandColorClass="hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-pink-400"><InstagramIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.twitter_url && <SocialLink label="X / Twitter" href={profile.twitter_url} brandColorClass="hover:bg-[#1DA1F2] dark:hover:bg-white dark:hover:text-black hover:border-blue-400"><TwitterIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.tiktok_url && <SocialLink label="TikTok" href={profile.tiktok_url} brandColorClass="hover:bg-black hover:border-gray-500"><TikTokIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                    {profile.discord_url && <SocialLink label="Discord" href={profile.discord_url} brandColorClass="hover:bg-[#5865F2] hover:border-indigo-400"><DiscordIcon className="w-5 h-5 sm:w-6 sm:h-6"/></SocialLink>}
                                </motion.div>

                                <motion.div {...{variants:itemVariants} as any} className="flex flex-wrap items-center justify-center lg:justify-start gap-2 my-4">
                                    <button onClick={() => setShowBioModal(true)} className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-bold text-xs flex items-center gap-1.5 shadow-md">
                                        <LinkHubIcon className="w-4 h-4" />
                                        <span>🔗 Bio Link Hub</span>
                                    </button>
                                    <button onClick={() => setShowQrModal(true)} className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white transition-all font-bold text-xs flex items-center gap-1.5 shadow-md">
                                        <QrCodeIcon className="w-4 h-4" />
                                        <span>📱 Smart QR Code</span>
                                    </button>
                                    <button onClick={() => {
                                        const url = `${window.location.origin}/?user=${profile.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert('✨ Public Share Link copied! Anyone can visit without login!');
                                    }} className="px-3.5 py-2 rounded-2xl bg-[var(--theme-card-bg-alt)] border border-gray-500/20 text-[var(--theme-text-secondary)] hover:text-white hover:border-emerald-500 transition-all font-bold text-xs flex items-center gap-1.5 shadow-md" title="Works without login!">
                                        <ShareIcon className="w-4 h-4 text-emerald-400" />
                                        <span>🌐 Public Share Link</span>
                                    </button>
                                </motion.div>
                                
                                {!isMyProfile && (
                                    <motion.div {...{variants:itemVariants} as any} className="flex items-center gap-3 mt-6 w-full max-w-sm mx-auto lg:mx-0">
                                        <Button onClick={handleFollowToggle} disabled={isUpdatingFollow} variant={isFollowing ? 'secondary' : 'primary'} className="flex-1 py-3 font-semibold shadow-md">
                                            {isUpdatingFollow ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
                                        </Button>
                                        <Button variant="secondary" className="flex-1 py-3 font-semibold shadow-md" onClick={() => onMessage && profile && onMessage({ id: profile.id, name: profile.name || profile.username, photo_url: profile.photo_url, active_cover: profile.active_cover || null })}>
                                            Message
                                        </Button>
                                    </motion.div>
                                )}
                            </ProfileHeaderWithAudioFx>

                            {/* --- RIGHT COLUMN: STATS CURRENCY & COLLECTION SATCHEL --- */}
                            <div className="lg:col-span-8 xl:col-span-9 lg:pl-4 xl:pl-6 flex flex-col justify-between">
                                {/* --- STATS CURRENCY GRID --- */}
                                <motion.div
                                     {...{variants:containerVariants} as any}
                                     className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-gray-50/60 dark:bg-gray-800/20 sm:bg-transparent rounded-2xl sm:rounded-none p-4 sm:p-0 border sm:border-0 border-gray-200/60 dark:border-gray-700/50 sm:border-t sm:border-b py-5 my-2 sm:my-6 lg:my-0 lg:mb-8"
                                >
                                    <motion.div className="text-center p-2 rounded-xl sm:rounded-none hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors" {...{variants:itemVariants} as any}>
                                        <TrophyIcon className="h-7 w-7 sm:h-8 sm:w-8 text-violet-500 mx-auto mb-1.5" />
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight text-[var(--theme-text)]">{formatXp(profile.xp_balance ?? 0)}</p>
                                        <p className="text-[10px] sm:text-xs font-bold tracking-wider text-[var(--theme-text-secondary)] uppercase mt-0.5">XP</p>
                                    </motion.div>
                                    <motion.div className="text-center p-2 rounded-xl sm:rounded-none hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors" {...{variants:itemVariants} as any}>
                                        <GoldCoinIcon className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-1.5" />
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight text-[var(--theme-text)]">{formatXp(profile.gold_coins ?? 0)}</p>
                                        <p className="text-[10px] sm:text-xs font-bold tracking-wider text-[var(--theme-text-secondary)] uppercase mt-0.5">GOLD</p>
                                    </motion.div>
                                    <motion.div className="text-center p-2 rounded-xl sm:rounded-none hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors" {...{variants:itemVariants} as any}>
                                        <SilverCoinIcon className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1.5" />
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight text-[var(--theme-text)]">{formatXp(profile.silver_coins ?? 0)}</p>
                                        <p className="text-[10px] sm:text-xs font-bold tracking-wider text-[var(--theme-text-secondary)] uppercase mt-0.5">SILVER</p>
                                    </motion.div>
                                    <motion.div className="text-center p-2 rounded-xl sm:rounded-none hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors" {...{variants:itemVariants} as any}>
                                        <DiamondIcon className="h-7 w-7 sm:h-8 sm:w-8 text-cyan-400 mx-auto mb-1.5" />
                                        <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold leading-tight text-[var(--theme-text)]">{formatXp(profile.diamond_coins ?? 0)}</p>
                                        <p className="text-[10px] sm:text-xs font-bold tracking-wider text-[var(--theme-text-secondary)] uppercase mt-0.5">DIAMOND</p>
                                    </motion.div>
                                </motion.div>

                                {/* --- COLLECTION SATCHEL SECTION --- */}
                                <motion.div {...{variants:itemVariants} as any} className="text-left mt-6 lg:mt-0 flex-1">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text)]">Collection ({collectionItems.length})</h2>
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] tracking-wide uppercase">Traveler's Satchel</span>
                                    </div>
                                    {isCollectionLoading ? (
                                        <div className="flex justify-center py-12"><LoadingSpinner /></div>
                                    ) : collectionItems.length > 0 ? (
                                        <motion.div {...{variants:containerVariants} as any} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                                            {collectionItems.map((item) => item.store_items && (
                                                <motion.button
                                                    key={item.id}
                                                    {...{
                                                        variants: itemVariants,
                                                        whileHover: { y: -5, scale: 1.05 },
                                                        whileTap: { scale: 0.98 },
                                                    } as any}
                                                    onClick={() => item.store_items && setSelectedItem(item.store_items)}
                                                    className="group relative aspect-square bg-gray-100/50 dark:bg-gray-800/40 rounded-xl overflow-hidden flex items-center justify-center p-2 sm:p-3 shadow-sm hover:shadow-xl border border-gray-200/40 dark:border-gray-700/40 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-ring)]"
                                                >
                                                    <img src={item.store_items.preview_url || undefined} alt={item.store_items.name} className="object-contain max-h-full max-w-full transition-transform duration-300 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-1.5">
                                                        <span className="text-[10px] text-white font-semibold truncate w-full text-center">{item.store_items.name}</span>
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <div className="text-center bg-gray-50/50 dark:bg-gray-800/10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-10 sm:p-14 my-4">
                                            <p className="text-sm sm:text-base text-[var(--theme-text-secondary)]">This traveler's satchel is currently empty.</p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
            
            <ItemPreviewModal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} item={selectedItem} />
            <SmartQrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} profile={profile || { id: userId, username: 'user', name: null, photo_url: null }} />
            <BioLinkHubModal isOpen={showBioModal} onClose={() => setShowBioModal(false)} onOpenQr={() => { setShowBioModal(false); setShowQrModal(true); }} profile={profile} />
        </>
    );
};

export default Profile;
