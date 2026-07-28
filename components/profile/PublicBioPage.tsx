import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import BioLinkHubModal from './BioLinkHubModal';
import SmartQrCodeModal from './SmartQrCodeModal';
import { 
    LinkHubIcon, QrCodeIcon, ShareIcon, EmailIcon, PhoneIcon, LocationIcon,
    WebsiteIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TwitterIcon, TikTokIcon, 
    DiscordIcon, TelegramIcon, WhatsAppIcon, LinkedInIcon, GitHubIcon,
    SpotifyIcon, TwitchIcon, MusicNoteIcon, VolumeIcon, MuteIcon, CollectionIcon, AudioFxIcon
} from '../common/AppIcons';
import Button from '../common/Button';

interface PublicBioPageProps {
    userId: string;
    onLoginClick?: () => void;
}

const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (!/^(?:f|ht)tps?\:\/\//.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
        return `https://${url}`;
    }
    return url;
};

const PublicBioPage: React.FC<PublicBioPageProps> = ({ userId, onLoginClick }) => {
    const [profile, setProfile] = useState<any>(null);
    const [music, setMusic] = useState<any>(null);
    const [gif, setGif] = useState<any>(null);
    const [coverRing, setCoverRing] = useState<any>(null);
    const [collection, setCollection] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showBioModal, setShowBioModal] = useState(false);
    
    // Audio State
    const [isPlayingMusic, setIsPlayingMusic] = useState(false);
    const [audioFxEnabled, setAudioFxEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Selected Collection Item Modal
    const [selectedCollectionItem, setSelectedCollectionItem] = useState<any>(null);

    // Audio SFX Generator (Web Audio API)
    const playClickSfx = () => {
        if (!audioFxEnabled) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {
            // Ignore if blocked by browser policy
        }
    };

    useEffect(() => {
        const fetchPublicProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch profile by ID or username
                let query = supabase.from('profiles').select('*');
                if (userId.includes('-') && userId.length > 20) {
                    query = query.eq('id', userId);
                } else {
                    query = query.eq('username', userId);
                }
                const { data: profileData, error: fetchErr } = await query.single();

                if (fetchErr || !profileData) {
                    throw new Error('Profile not found or set to private.');
                }
                const pData = profileData as any;
                setProfile(pData);

                // Parallel fetch for Music, GIF, Cover Ring, and Collection
                const [musicRes, gifRes, coverRes, collectionRes] = await Promise.all([
                    pData.selected_music_id 
                        ? supabase.from('profile_music').select('*').eq('id', pData.selected_music_id).maybeSingle() 
                        : Promise.resolve({ data: null }),
                    pData.active_gif_id 
                        ? supabase.from('profile_gifs').select('*').eq('id', pData.active_gif_id).maybeSingle() 
                        : Promise.resolve({ data: null }),
                    pData.active_cover_id 
                        ? supabase.from('store_items').select('*').eq('id', pData.active_cover_id).maybeSingle() 
                        : Promise.resolve({ data: null }),
                    supabase.from('user_inventory')
                        .select('*, store_items(*)')
                        .eq('user_id', pData.id)
                ]);

                if (musicRes.data) setMusic(musicRes.data);
                if (gifRes.data) setGif(gifRes.data);
                if (coverRes.data) setCoverRing(coverRes.data);
                if (collectionRes.data) setCollection(collectionRes.data);

            } catch (err: any) {
                console.error('Error fetching public profile:', err);
                setError(err.message || 'Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchPublicProfile();
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [userId]);

    const toggleMusic = () => {
        playClickSfx();
        const musicUrl = music?.music_url;
        if (!musicUrl) return;

        if (isPlayingMusic && audioRef.current) {
            audioRef.current.pause();
            setIsPlayingMusic(false);
        } else {
            if (!audioRef.current || audioRef.current.src !== musicUrl) {
                if (audioRef.current) audioRef.current.pause();
                audioRef.current = new Audio(musicUrl);
                audioRef.current.loop = true;
                audioRef.current.addEventListener('ended', () => setIsPlayingMusic(false));
            }
            audioRef.current.play()
                .then(() => setIsPlayingMusic(true))
                .catch(err => console.warn('Music playback error:', err));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4">
                <LoadingSpinner />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--theme-text-secondary)] animate-pulse">
                    Loading Bio Profile...
                </p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-3xl mb-4 shadow-lg">
                    ⚠️
                </div>
                <h2 className="text-2xl font-black mb-2">Profile Not Found</h2>
                <p className="text-sm text-[var(--theme-text-secondary)] max-w-md mb-6">
                    {error || "We couldn't find the requested user profile or it may have been removed."}
                </p>
                {onLoginClick && (
                    <Button onClick={onLoginClick} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/25">
                        Return to App / Login
                    </Button>
                )}
            </div>
        );
    }

    const customLinks = Array.isArray(profile.bio_links) 
        ? profile.bio_links.filter((l: any) => l && (l.isActive === undefined || l.isActive !== false))
        : [];

    const activeCoverUrl = coverRing?.preview_url || profile.cover_url;
    const transform = (coverRing?.asset_details as any)?.transform;
    const baseTransform = 'translate(-50%, -50%)';
    const dynamicTransform = transform 
        ? ` translateX(${transform.translateX || 0}px) translateY(${transform.translateY || 0}px) scale(${transform.scale || 1})`
        : '';
    const ringTransformStyle = {
        transform: `${baseTransform}${dynamicTransform}`
    };

    // Avatar image with GIF fallback when music plays or if active GIF exists
    const avatarSrc = (isPlayingMusic && gif?.gif_url) 
        ? gif.gif_url 
        : (profile.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`);

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
            
            {/* Top Navigation Header with Single 'Create Own Bio' Button */}
            <header className="w-full bg-[var(--theme-card-bg)]/90 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800 py-3.5 px-4 sm:px-8 sticky top-0 z-40 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text)] hidden sm:inline">
                        NAXXIVO Bio Profile
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text)] sm:hidden">
                        Public Bio
                    </span>
                </div>

                {/* SINGLE HEADER BUTTON REQUIRED BY USER */}
                <button
                    onClick={() => {
                        playClickSfx();
                        if (onLoginClick) onLoginClick();
                    }}
                    className="px-5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20"
                >
                    <span>✨ Create Own Bio</span>
                </button>
            </header>

            {/* Main Bio Hub Content */}
            <main className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-8 flex flex-col items-center">
                
                {/* Hero Card: Cover, Avatar, Ring, GIFs & Bio */}
                <div className="w-full relative rounded-3xl overflow-hidden bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 shadow-2xl mb-6">
                    {/* Cover Photo / Banner */}
                    <div className="w-full h-40 sm:h-52 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
                        {activeCoverUrl ? (
                            <img src={activeCoverUrl} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-card-bg)] via-black/20 to-transparent" />
                        
                        {/* Animated GIF Sticker / Badge if present */}
                        {gif?.gif_url && (
                            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-pink-300 flex items-center gap-1.5 shadow-lg">
                                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                                <span>Animated GIF Badge</span>
                            </div>
                        )}
                    </div>

                    <div className="px-6 pb-6 pt-12 sm:pt-14 relative flex flex-col items-center text-center">
                        {/* Floating Avatar Container with Active Cover Ring */}
                        <div className="absolute -top-16 sm:-top-20 w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-[var(--theme-card-bg)] shadow-2xl overflow-hidden border-4 border-indigo-500/30 relative z-10">
                                <img
                                    src={avatarSrc}
                                    alt={profile.username}
                                    className="w-full h-full rounded-full object-cover bg-[var(--theme-bg)]"
                                />
                            </div>

                            {/* Active Custom Cover Ring Effect */}
                            {coverRing?.preview_url && (
                                <div className="absolute top-1/2 left-1/2 z-20 pointer-events-none w-40 h-40 sm:w-44 sm:h-44" style={ringTransformStyle}>
                                    <img src={coverRing.preview_url} alt="Ring" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>

                        {/* Name & Handles */}
                        <h1 className="text-2xl sm:text-3xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2 mt-2 tracking-tight">
                            {profile.name || profile.username}
                            <span className="text-blue-500 text-lg" title="Verified Creator">✓</span>
                        </h1>
                        <p className="text-sm font-extrabold text-indigo-400 mt-0.5">
                            @{profile.username}
                        </p>

                        {/* Bio / Tagline */}
                        {profile.bio_tagline ? (
                            <p className="text-sm font-semibold text-[var(--theme-text-secondary)] mt-3 bg-[var(--theme-card-bg-alt)] px-4 py-2.5 rounded-2xl border border-gray-500/10 max-w-sm italic shadow-inner">
                                "{profile.bio_tagline}"
                            </p>
                        ) : profile.bio && (
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-3 max-w-sm leading-relaxed">
                                {profile.bio}
                            </p>
                        )}

                        {/* Quick Action Hub Buttons */}
                        <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-xs">
                            <Button
                                onClick={() => {
                                    playClickSfx();
                                    setShowQrModal(true);
                                }}
                                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 border border-indigo-400/20"
                            >
                                <QrCodeIcon className="w-4 h-4" />
                                <span>Smart QR</span>
                            </Button>
                            <Button
                                onClick={() => {
                                    playClickSfx();
                                    setShowBioModal(true);
                                }}
                                variant="secondary"
                                className="flex-1 py-2.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 bg-[var(--theme-card-bg-alt)] border border-gray-500/20 hover:border-indigo-500"
                            >
                                <LinkHubIcon className="w-4 h-4 text-indigo-400" />
                                <span>Bio Hub</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Music Player & Audio Effects Control */}
                {music?.music_url && (
                    <div className="w-full p-4.5 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-900/90 border border-indigo-500/30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <button
                                onClick={toggleMusic}
                                className={`w-12 h-12 rounded-2xl ${
                                    isPlayingMusic 
                                        ? 'bg-gradient-to-tr from-pink-600 to-purple-600 shadow-pink-500/30' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'
                                } text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 shrink-0 border border-white/20`}
                            >
                                {isPlayingMusic ? (
                                    <span className="text-base font-black">⏸</span>
                                ) : (
                                    <span className="text-base font-black ml-0.5">▶</span>
                                )}
                            </button>
                            <div className="text-left truncate">
                                <div className="flex items-center gap-1.5">
                                    <MusicNoteIcon className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                                        Background Track
                                    </span>
                                </div>
                                <div className="text-sm font-extrabold text-white truncate max-w-[160px] sm:max-w-[220px]">
                                    {music.title || music.file_name || "Profile Theme Song"}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Equalizer Visualizer Bars */}
                            <div className="flex items-end gap-1 h-6 px-1">
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className={`w-1 rounded-full bg-indigo-400 transition-all ${isPlayingMusic ? 'animate-bounce' : 'h-2 opacity-30'}`}
                                        style={{
                                            height: isPlayingMusic ? `${10 + (i % 3) * 6}px` : '6px',
                                            animationDelay: `${i * 0.15}s`
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Audio FX Toggle Button */}
                            <button
                                onClick={() => {
                                    setAudioFxEnabled(!audioFxEnabled);
                                    playClickSfx();
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 border ${
                                    audioFxEnabled 
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                                        : 'bg-gray-800/80 text-gray-400 border-gray-700'
                                }`}
                                title="Toggle Audio Sound Effects"
                            >
                                <AudioFxIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">SFX {audioFxEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Collection Showcase Section */}
                {collection.length > 0 && (
                    <div className="w-full p-5 rounded-3xl bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 shadow-xl mb-6">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                                <CollectionIcon className="w-5 h-5 text-amber-400" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--theme-text)]">
                                    Unlocked Collection
                                </h3>
                            </div>
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-extrabold border border-amber-500/20">
                                {collection.length} Items
                            </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {collection.slice(0, 8).map((inv: any) => {
                                const item = inv.store_items;
                                if (!item) return null;
                                return (
                                    <div
                                        key={inv.id}
                                        onClick={() => {
                                            playClickSfx();
                                            setSelectedCollectionItem(item);
                                        }}
                                        className="p-3 rounded-2xl bg-[var(--theme-card-bg-alt)] border border-gray-500/10 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105 flex flex-col items-center text-center group shadow-sm"
                                    >
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/20 mb-2 flex items-center justify-center p-1">
                                            <img src={item.preview_url} alt={item.name} className="w-full h-full object-contain group-hover:rotate-6 transition-transform" />
                                        </div>
                                        <span className="text-[11px] font-extrabold text-[var(--theme-text)] line-clamp-1 w-full">
                                            {item.name}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold text-amber-400/90 mt-0.5">
                                            {item.category || 'Collectible'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Contact Shortcuts */}
                {(profile.contact_email || profile.contact_phone || profile.contact_location) && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        {profile.contact_email && (
                            <a 
                                href={`mailto:${profile.contact_email}`} 
                                onClick={playClickSfx}
                                className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-blue-500/20 hover:border-blue-500 flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-extrabold text-xs shadow-md group"
                            >
                                <EmailIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">Email Creator</span>
                            </a>
                        )}
                        {profile.contact_phone && (
                            <a 
                                href={`tel:${profile.contact_phone}`} 
                                onClick={playClickSfx}
                                className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-green-500/20 hover:border-green-500 flex items-center justify-center gap-2 text-green-400 hover:bg-green-500 hover:text-white transition-all font-extrabold text-xs shadow-md group"
                            >
                                <PhoneIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">Call / SMS</span>
                            </a>
                        )}
                        {profile.contact_location && (
                            <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(profile.contact_location)}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                onClick={playClickSfx}
                                className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-amber-500/20 hover:border-amber-500 flex items-center justify-center gap-2 text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-extrabold text-xs shadow-md group"
                            >
                                <LocationIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">{profile.contact_location}</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Featured Custom Bio Links */}
                {customLinks.length > 0 && (
                    <div className="w-full space-y-3 mb-6">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Featured Links
                            </span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/20">
                                {customLinks.length} Active
                            </span>
                        </div>
                        {customLinks.map((link: any, idx: number) => (
                            <a
                                key={link.id || idx}
                                href={ensureProtocol(link.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={playClickSfx}
                                className="w-full p-4 rounded-2xl flex items-center justify-between font-extrabold text-white shadow-xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 border border-white/10 group overflow-hidden relative"
                                style={{
                                    background: link.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                                }}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <span className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-lg shrink-0">
                                        {link.icon || '🌐'}
                                    </span>
                                    <div className="text-left">
                                        <div className="text-sm font-black tracking-wide group-hover:underline">
                                            {link.title}
                                        </div>
                                        <div className="text-[10px] text-white/80 truncate max-w-[200px] sm:max-w-[280px] font-medium">
                                            {link.url.replace(/^(?:f|ht)tps?\:\/\//, '')}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-extrabold uppercase tracking-wider text-white/90 group-hover:text-white shrink-0">
                                    Visit →
                                </span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Improved Social Networks Icons Grid */}
                <div className="w-full p-6 rounded-3xl bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 shadow-2xl text-center">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--theme-text-secondary)] mb-4">
                        Connect on Social Networks
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {profile.website_url && <a href={ensureProtocol(profile.website_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Website" className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><WebsiteIcon className="w-6 h-6"/></a>}
                        {profile.youtube_url && <a href={ensureProtocol(profile.youtube_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="YouTube" className="p-3.5 bg-[#FF0000] hover:bg-red-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><YouTubeIcon className="w-6 h-6"/></a>}
                        {profile.facebook_url && <a href={ensureProtocol(profile.facebook_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Facebook" className="p-3.5 bg-[#1877F2] hover:bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><FacebookIcon className="w-6 h-6"/></a>}
                        {profile.instagram_url && <a href={ensureProtocol(profile.instagram_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Instagram" className="p-3.5 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><InstagramIcon className="w-6 h-6"/></a>}
                        {profile.twitter_url && <a href={ensureProtocol(profile.twitter_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="X / Twitter" className="p-3.5 bg-black dark:bg-white dark:text-black text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all border border-gray-700"><TwitterIcon className="w-6 h-6"/></a>}
                        {profile.tiktok_url && <a href={ensureProtocol(profile.tiktok_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="TikTok" className="p-3.5 bg-black text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all border border-gray-700"><TikTokIcon className="w-6 h-6"/></a>}
                        {profile.discord_url && <a href={ensureProtocol(profile.discord_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Discord" className="p-3.5 bg-[#5865F2] hover:bg-indigo-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><DiscordIcon className="w-6 h-6"/></a>}
                        {profile.telegram_url && <a href={ensureProtocol(profile.telegram_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Telegram" className="p-3.5 bg-[#24A1DE] hover:bg-blue-500 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><TelegramIcon className="w-6 h-6"/></a>}
                        {profile.whatsapp_url && <a href={ensureProtocol(profile.whatsapp_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="WhatsApp" className="p-3.5 bg-[#25D366] hover:bg-green-500 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><WhatsAppIcon className="w-6 h-6"/></a>}
                        {profile.linkedin_url && <a href={ensureProtocol(profile.linkedin_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="LinkedIn" className="p-3.5 bg-[#0A66C2] hover:bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><LinkedInIcon className="w-6 h-6"/></a>}
                        {profile.github_url && <a href={ensureProtocol(profile.github_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="GitHub" className="p-3.5 bg-gray-900 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all border border-gray-700"><GitHubIcon className="w-6 h-6"/></a>}
                        {profile.spotify_url && <a href={ensureProtocol(profile.spotify_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Spotify" className="p-3.5 bg-[#1DB954] hover:bg-green-500 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><SpotifyIcon className="w-6 h-6"/></a>}
                        {profile.twitch_url && <a href={ensureProtocol(profile.twitch_url)} target="_blank" rel="noreferrer" onClick={playClickSfx} title="Twitch" className="p-3.5 bg-[#9146FF] hover:bg-purple-600 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"><TwitchIcon className="w-6 h-6"/></a>}
                    </div>
                </div>
            </main>

            {/* Footer Banner */}
            <footer className="w-full py-6 text-center border-t border-gray-200/10 dark:border-gray-800 text-xs text-[var(--theme-text-secondary)] bg-[var(--theme-card-bg)]/50 backdrop-blur-md">
                <p>© {new Date().getFullYear()} Official NAXXIVO Social Bio Hub</p>
                {onLoginClick && (
                    <button 
                        onClick={() => {
                            playClickSfx();
                            onLoginClick();
                        }} 
                        className="mt-2 text-indigo-400 font-extrabold hover:underline block mx-auto"
                    >
                        ⚡ Want your own Smart QR & Bio Link Hub? Create your Bio now!
                    </button>
                )}
            </footer>

            {/* Collection Item Preview Modal */}
            {selectedCollectionItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button
                            onClick={() => setSelectedCollectionItem(null)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-500/20 text-gray-400 hover:text-white font-bold"
                        >
                            ✕
                        </button>
                        <div className="w-24 h-24 mx-auto rounded-2xl bg-black/30 p-2 mb-4 flex items-center justify-center">
                            <img src={selectedCollectionItem.preview_url} alt={selectedCollectionItem.name} className="w-full h-full object-contain" />
                        </div>
                        <h3 className="text-lg font-black text-[var(--theme-text)]">
                            {selectedCollectionItem.name}
                        </h3>
                        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-1">
                            {selectedCollectionItem.category || 'Unlocked Item'}
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-3 leading-relaxed">
                            {selectedCollectionItem.description || "Official unlocked profile item in creator's collection."}
                        </p>
                        <Button
                            onClick={() => setSelectedCollectionItem(null)}
                            className="w-full mt-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs"
                        >
                            Close Preview
                        </Button>
                    </div>
                </div>
            )}

            {/* Smart QR & Bio Hub Modals */}
            <SmartQrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} profile={profile} />
            <BioLinkHubModal isOpen={showBioModal} onClose={() => setShowBioModal(false)} onOpenQr={() => { setShowBioModal(false); setShowQrModal(true); }} profile={profile} />
        </div>
    );
};

export default PublicBioPage;
