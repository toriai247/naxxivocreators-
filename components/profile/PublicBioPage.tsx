import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import BioLinkHubModal from './BioLinkHubModal';
import SmartQrCodeModal from './SmartQrCodeModal';
import { 
    LinkHubIcon, QrCodeIcon, ShareIcon, EmailIcon, PhoneIcon, LocationIcon,
    WebsiteIcon, YouTubeIcon, FacebookIcon, InstagramIcon, TwitterIcon, TikTokIcon, DiscordIcon, TelegramIcon, WhatsAppIcon, LinkedInIcon, GitHubIcon
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [showBioModal, setShowBioModal] = useState(true);

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
                const { data, error: fetchErr } = await query.single();

                if (fetchErr || !data) {
                    throw new Error('Profile not found or set to private.');
                }
                setProfile(data);
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
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-4">
                <LoadingSpinner />
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--theme-text-secondary)] animate-pulse">
                    Loading Public Bio Hub...
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

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col justify-between relative overflow-x-hidden">
            {/* Top public notice banner */}
            <header className="w-full bg-[var(--theme-card-bg)]/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800 py-3 px-4 sm:px-6 sticky top-0 z-40 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]">
                        Public Visitor Mode (No Login Required)
                    </span>
                </div>
                {onLoginClick && (
                    <button
                        onClick={onLoginClick}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all"
                    >
                        Create Your Own Bio Hub ✨
                    </button>
                )}
            </header>

            {/* Main Bio Hub Card */}
            <main className="flex-1 w-full max-w-xl mx-auto p-4 sm:p-8 flex flex-col items-center">
                {/* Cover & Avatar Header */}
                <div className="w-full relative rounded-3xl overflow-hidden bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 shadow-2xl mb-6">
                    <div className="w-full h-36 sm:h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
                        {profile.cover_url && (
                            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="px-6 pb-6 pt-12 sm:pt-14 relative flex flex-col items-center text-center">
                        {/* Avatar floating */}
                        <div className="absolute -top-14 sm:-top-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-[var(--theme-card-bg)] shadow-2xl overflow-hidden border-4 border-indigo-500/30">
                            <img
                                src={profile.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                                alt={profile.username}
                                className="w-full h-full rounded-full object-cover bg-[var(--theme-bg)]"
                            />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-[var(--theme-text)] flex items-center justify-center gap-2 mt-2">
                            {profile.name || profile.username}
                            <span className="text-blue-500" title="Verified Creator">✓</span>
                        </h1>
                        <p className="text-sm font-bold text-indigo-400 mt-0.5">
                            @{profile.username}
                        </p>

                        {profile.bio_tagline ? (
                            <p className="text-sm font-semibold text-[var(--theme-text-secondary)] mt-3 bg-[var(--theme-card-bg-alt)] px-4 py-2 rounded-2xl border border-gray-500/10 max-w-sm italic">
                                "{profile.bio_tagline}"
                            </p>
                        ) : profile.bio && (
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-3 max-w-sm">
                                {profile.bio}
                            </p>
                        )}

                        {/* Quick Action Buttons: QR Code & Copy Link */}
                        <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-xs">
                            <Button
                                onClick={() => setShowQrModal(true)}
                                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                <QrCodeIcon className="w-4 h-4" />
                                <span>Smart QR Code</span>
                            </Button>
                            <Button
                                onClick={() => setShowBioModal(true)}
                                variant="secondary"
                                className="flex-1 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 bg-[var(--theme-card-bg-alt)] border border-gray-500/20 hover:border-indigo-500"
                            >
                                <LinkHubIcon className="w-4 h-4 text-indigo-400" />
                                <span>Bio Hub</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Contact Cards */}
                {(profile.contact_email || profile.contact_phone || profile.contact_location) && (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        {profile.contact_email && (
                            <a href={`mailto:${profile.contact_email}`} className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-blue-500/20 hover:border-blue-500 flex items-center justify-center gap-2 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs shadow-md">
                                <EmailIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">Email Creator</span>
                            </a>
                        )}
                        {profile.contact_phone && (
                            <a href={`tel:${profile.contact_phone}`} className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-green-500/20 hover:border-green-500 flex items-center justify-center gap-2 text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold text-xs shadow-md">
                                <PhoneIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">Call / SMS</span>
                            </a>
                        )}
                        {profile.contact_location && (
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(profile.contact_location)}`} target="_blank" rel="noreferrer" className="p-3.5 rounded-2xl bg-[var(--theme-card-bg)] border border-amber-500/20 hover:border-amber-500 flex items-center justify-center gap-2 text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-bold text-xs shadow-md">
                                <LocationIcon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{profile.contact_location}</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Featured Custom Links */}
                {customLinks.length > 0 && (
                    <div className="w-full space-y-3 mb-6">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Featured Bio Links
                            </span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                                {customLinks.length} Links
                            </span>
                        </div>
                        {customLinks.map((link: any, idx: number) => (
                            <a
                                key={link.id || idx}
                                href={ensureProtocol(link.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full p-4 rounded-2xl flex items-center justify-between font-bold text-white shadow-xl transition-transform hover:scale-102 hover:translate-x-1 border border-white/10 group overflow-hidden relative"
                                style={{
                                    background: link.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                                }}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <span className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-lg">
                                        {link.icon || '🌐'}
                                    </span>
                                    <div className="text-left">
                                        <div className="text-sm font-black tracking-wide group-hover:underline">
                                            {link.title}
                                        </div>
                                        <div className="text-[10px] text-white/75 truncate max-w-[200px] sm:max-w-[280px] font-normal">
                                            {link.url.replace(/^(?:f|ht)tps?\:\/\//, '')}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-white/80 group-hover:text-white">
                                    Visit →
                                </span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Social Networks Bar */}
                <div className="w-full p-5 rounded-3xl bg-[var(--theme-card-bg)] border border-gray-200/20 dark:border-gray-800 shadow-xl text-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-4">
                        Connect on Socials
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {profile.website_url && <a href={ensureProtocol(profile.website_url)} target="_blank" rel="noreferrer" title="Website" className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><WebsiteIcon className="w-6 h-6"/></a>}
                        {profile.youtube_url && <a href={ensureProtocol(profile.youtube_url)} target="_blank" rel="noreferrer" title="YouTube" className="p-3 bg-[#FF0000] hover:bg-red-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><YouTubeIcon className="w-6 h-6"/></a>}
                        {profile.facebook_url && <a href={ensureProtocol(profile.facebook_url)} target="_blank" rel="noreferrer" title="Facebook" className="p-3 bg-[#1877F2] hover:bg-blue-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><FacebookIcon className="w-6 h-6"/></a>}
                        {profile.instagram_url && <a href={ensureProtocol(profile.instagram_url)} target="_blank" rel="noreferrer" title="Instagram" className="p-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl shadow-md hover:scale-110 transition-all"><InstagramIcon className="w-6 h-6"/></a>}
                        {profile.twitter_url && <a href={ensureProtocol(profile.twitter_url)} target="_blank" rel="noreferrer" title="X / Twitter" className="p-3 bg-[#1DA1F2] dark:bg-white dark:text-black hover:opacity-90 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><TwitterIcon className="w-6 h-6"/></a>}
                        {profile.tiktok_url && <a href={ensureProtocol(profile.tiktok_url)} target="_blank" rel="noreferrer" title="TikTok" className="p-3 bg-black text-white rounded-2xl shadow-md hover:scale-110 transition-all border border-gray-700"><TikTokIcon className="w-6 h-6"/></a>}
                        {profile.discord_url && <a href={ensureProtocol(profile.discord_url)} target="_blank" rel="noreferrer" title="Discord" className="p-3 bg-[#5865F2] hover:bg-indigo-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><DiscordIcon className="w-6 h-6"/></a>}
                        {profile.telegram_url && <a href={ensureProtocol(profile.telegram_url)} target="_blank" rel="noreferrer" title="Telegram" className="p-3 bg-[#24A1DE] hover:bg-blue-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><TelegramIcon className="w-6 h-6"/></a>}
                        {profile.whatsapp_url && <a href={ensureProtocol(profile.whatsapp_url)} target="_blank" rel="noreferrer" title="WhatsApp" className="p-3 bg-[#25D366] hover:bg-green-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><WhatsAppIcon className="w-6 h-6"/></a>}
                        {profile.linkedin_url && <a href={ensureProtocol(profile.linkedin_url)} target="_blank" rel="noreferrer" title="LinkedIn" className="p-3 bg-[#0A66C2] hover:bg-blue-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><LinkedInIcon className="w-6 h-6"/></a>}
                        {profile.github_url && <a href={ensureProtocol(profile.github_url)} target="_blank" rel="noreferrer" title="GitHub" className="p-3 bg-gray-900 text-white rounded-2xl shadow-md hover:scale-110 transition-all border border-gray-700"><GitHubIcon className="w-6 h-6"/></a>}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full py-6 text-center border-t border-gray-200/10 dark:border-gray-800 text-xs text-[var(--theme-text-secondary)] bg-[var(--theme-card-bg)]/50">
                <p>© {new Date().getFullYear()} Official Social Bio Hub • Shared without login</p>
                {onLoginClick && (
                    <button onClick={onLoginClick} className="mt-2 text-indigo-400 font-bold hover:underline">
                        ⚡ Want your own Smart QR & Bio Link Hub? Click Here!
                    </button>
                )}
            </footer>

            {/* Modals */}
            <SmartQrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} profile={profile} />
            <BioLinkHubModal isOpen={showBioModal} onClose={() => setShowBioModal(false)} onOpenQr={() => { setShowBioModal(false); setShowQrModal(true); }} profile={profile} />
        </div>
    );
};

export default PublicBioPage;
