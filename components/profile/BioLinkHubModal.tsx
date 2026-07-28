import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LinkHubIcon, QrCodeIcon, CopyIcon, CheckCircleIcon, ExternalLinkIcon,
    EmailIcon, PhoneIcon, LocationIcon, TelegramIcon, WhatsAppIcon,
    LinkedInIcon, GitHubIcon, WebsiteIcon, YouTubeIcon, FacebookIcon,
    InstagramIcon, TwitterIcon, TikTokIcon, DiscordIcon, ShareIcon,
    SpotifyIcon, TwitchIcon
} from '../common/AppIcons';
import Button from '../common/Button';

export interface BioLinkItem {
    id: string;
    title: string;
    url: string;
    icon?: string;
    bgColor?: string;
    isActive?: boolean;
}

interface BioLinkHubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenQr: () => void;
    profile: any;
}

const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (!/^(?:f|ht)tps?\:\/\//.test(url) && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
        return `https://${url}`;
    }
    return url;
};

const BioLinkHubModal: React.FC<BioLinkHubModalProps> = ({ isOpen, onClose, onOpenQr, profile }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !profile) return null;

    const customLinks: BioLinkItem[] = Array.isArray(profile.bio_links) 
        ? profile.bio_links.filter((l: any) => l && (l.isActive === undefined || l.isActive !== false))
        : [];

    const shareUrl = `${window.location.origin}/?user=${profile.id}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[var(--theme-card-bg)] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header bar with Copy Link & QR */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200/20 dark:border-gray-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                Official Bio Link Hub
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onOpenQr}
                                title="Show QR Code"
                                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5"
                            >
                                <QrCodeIcon className="w-4 h-4" />
                                <span>QR Code</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-500/20 text-gray-400 hover:text-white hover:bg-red-500/80 transition-all font-bold"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto pr-1 py-6 flex-1 space-y-6 custom-scrollbar">
                        {/* Profile Identity Card */}
                        <div className="text-center flex flex-col items-center">
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl mb-3">
                                <img
                                    src={profile.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                                    alt={profile.username}
                                    className="w-full h-full rounded-full object-cover bg-[var(--theme-bg)]"
                                />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-text)] flex items-center gap-2">
                                {profile.name || profile.username}
                                <span className="text-blue-500" title="Verified Creator">✓</span>
                            </h2>
                            <p className="text-sm font-semibold text-indigo-400 mt-0.5">
                                @{profile.username}
                            </p>
                            {profile.bio_tagline && (
                                <p className="text-sm text-[var(--theme-text-secondary)] mt-2 max-w-sm italic bg-[var(--theme-card-bg-alt)] px-4 py-2 rounded-2xl border border-gray-500/10">
                                    "{profile.bio_tagline}"
                                </p>
                            )}
                        </div>

                        {/* Contact Quick Action Buttons (Email, Phone, Location) */}
                        {(profile.contact_email || profile.contact_phone || profile.contact_location) && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {profile.contact_email && (
                                    <a
                                        href={`mailto:${profile.contact_email}`}
                                        className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all font-bold text-xs"
                                    >
                                        <EmailIcon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">Email Me</span>
                                    </a>
                                )}
                                {profile.contact_phone && (
                                    <a
                                        href={`tel:${profile.contact_phone}`}
                                        className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all font-bold text-xs"
                                    >
                                        <PhoneIcon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">Call / SMS</span>
                                    </a>
                                )}
                                {profile.contact_location && (
                                    <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(profile.contact_location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white transition-all font-bold text-xs"
                                    >
                                        <LocationIcon className="w-4 h-4 shrink-0" />
                                        <span className="truncate">{profile.contact_location}</span>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Custom Bio Links (Linktree Style Buttons) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                    Featured Links
                                </h3>
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                                    {customLinks.length} Active
                                </span>
                            </div>

                            {customLinks.length === 0 ? (
                                <div className="p-6 rounded-2xl bg-[var(--theme-card-bg-alt)] border border-dashed border-gray-500/20 text-center">
                                    <p className="text-xs text-[var(--theme-text-secondary)]">
                                        No custom bio links added yet. Users can add custom links from Edit Profile!
                                    </p>
                                </div>
                            ) : (
                                customLinks.map((link, idx) => (
                                    <motion.a
                                        key={link.id || idx}
                                        href={ensureProtocol(link.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full p-4 rounded-2xl flex items-center justify-between font-bold text-white shadow-lg transition-all border border-white/10 group relative overflow-hidden"
                                        style={{
                                            background: link.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                                        }}
                                    >
                                        <div className="flex items-center gap-3 relative z-10">
                                            <span className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner">
                                                {link.icon || '🌐'}
                                            </span>
                                            <div className="text-left">
                                                <div className="text-sm font-black tracking-wide group-hover:underline">
                                                    {link.title}
                                                </div>
                                                <div className="text-[10px] text-white/70 truncate max-w-[200px] sm:max-w-[280px] font-normal">
                                                    {link.url.replace(/^(?:f|ht)tps?\:\/\//, '')}
                                                </div>
                                            </div>
                                        </div>
                                        <ExternalLinkIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 relative z-10" />
                                    </motion.a>
                                ))
                            )}
                        </div>

                        {/* Social Media Networks Grid */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] px-1">
                                Social Networks
                            </h3>
                            <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-2xl bg-[var(--theme-card-bg-alt)] border border-gray-500/10">
                                {profile.website_url && (
                                    <a href={ensureProtocol(profile.website_url)} target="_blank" rel="noreferrer" title="Website" className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><WebsiteIcon className="w-6 h-6"/></a>
                                )}
                                {profile.youtube_url && (
                                    <a href={ensureProtocol(profile.youtube_url)} target="_blank" rel="noreferrer" title="YouTube" className="p-3 bg-[#FF0000] hover:bg-red-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><YouTubeIcon className="w-6 h-6"/></a>
                                )}
                                {profile.facebook_url && (
                                    <a href={ensureProtocol(profile.facebook_url)} target="_blank" rel="noreferrer" title="Facebook" className="p-3 bg-[#1877F2] hover:bg-blue-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><FacebookIcon className="w-6 h-6"/></a>
                                )}
                                {profile.instagram_url && (
                                    <a href={ensureProtocol(profile.instagram_url)} target="_blank" rel="noreferrer" title="Instagram" className="p-3 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-2xl shadow-md hover:scale-110 transition-all"><InstagramIcon className="w-6 h-6"/></a>
                                )}
                                {profile.twitter_url && (
                                    <a href={ensureProtocol(profile.twitter_url)} target="_blank" rel="noreferrer" title="X / Twitter" className="p-3 bg-[#1DA1F2] dark:bg-white dark:text-black hover:opacity-90 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><TwitterIcon className="w-6 h-6"/></a>
                                )}
                                {profile.tiktok_url && (
                                    <a href={ensureProtocol(profile.tiktok_url)} target="_blank" rel="noreferrer" title="TikTok" className="p-3 bg-black text-white rounded-2xl shadow-md hover:scale-110 transition-all border border-gray-700"><TikTokIcon className="w-6 h-6"/></a>
                                )}
                                {profile.discord_url && (
                                    <a href={ensureProtocol(profile.discord_url)} target="_blank" rel="noreferrer" title="Discord" className="p-3 bg-[#5865F2] hover:bg-indigo-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><DiscordIcon className="w-6 h-6"/></a>
                                )}
                                {profile.telegram_url && (
                                    <a href={ensureProtocol(profile.telegram_url)} target="_blank" rel="noreferrer" title="Telegram" className="p-3 bg-[#24A1DE] hover:bg-blue-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><TelegramIcon className="w-6 h-6"/></a>
                                )}
                                {profile.whatsapp_url && (
                                    <a href={ensureProtocol(profile.whatsapp_url)} target="_blank" rel="noreferrer" title="WhatsApp" className="p-3 bg-[#25D366] hover:bg-green-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><WhatsAppIcon className="w-6 h-6"/></a>
                                )}
                                {profile.linkedin_url && (
                                    <a href={ensureProtocol(profile.linkedin_url)} target="_blank" rel="noreferrer" title="LinkedIn" className="p-3 bg-[#0A66C2] hover:bg-blue-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><LinkedInIcon className="w-6 h-6"/></a>
                                )}
                                {profile.github_url && (
                                    <a href={ensureProtocol(profile.github_url)} target="_blank" rel="noreferrer" title="GitHub" className="p-3 bg-gray-900 text-white rounded-2xl shadow-md hover:scale-110 transition-all border border-gray-700"><GitHubIcon className="w-6 h-6"/></a>
                                )}
                                {profile.spotify_url && (
                                    <a href={ensureProtocol(profile.spotify_url)} target="_blank" rel="noreferrer" title="Spotify" className="p-3 bg-[#1DB954] hover:bg-green-500 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><SpotifyIcon className="w-6 h-6"/></a>
                                )}
                                {profile.twitch_url && (
                                    <a href={ensureProtocol(profile.twitch_url)} target="_blank" rel="noreferrer" title="Twitch" className="p-3 bg-[#9146FF] hover:bg-purple-600 text-white rounded-2xl shadow-md hover:scale-110 transition-all"><TwitchIcon className="w-6 h-6"/></a>
                                )}
                                {(!profile.website_url && !profile.youtube_url && !profile.facebook_url && !profile.instagram_url && !profile.twitter_url && !profile.tiktok_url && !profile.discord_url && !profile.telegram_url && !profile.whatsapp_url && !profile.linkedin_url && !profile.github_url) && (
                                    <p className="text-xs text-[var(--theme-text-secondary)] italic">
                                        No social media accounts linked yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Share Bar */}
                    <div className="pt-4 border-t border-gray-200/20 dark:border-gray-800 shrink-0 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 bg-[var(--theme-bg)] px-3 py-2 rounded-xl border border-gray-500/20 text-xs truncate font-mono text-[var(--theme-text-secondary)]">
                            {shareUrl}
                        </div>
                        <Button
                            onClick={handleCopyLink}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-500/20"
                        >
                            {copied ? (
                                <>
                                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-4 h-4" />
                                    <span>Copy Share Link</span>
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BioLinkHubModal;
