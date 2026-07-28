import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadIcon, CopyIcon, CheckCircleIcon, ShareIcon } from '../common/AppIcons';
import Button from '../common/Button';

interface SmartQrCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        id: string;
        name: string | null;
        username: string;
        photo_url: string | null;
        bio_tagline?: string | null;
    };
}

const THEMES = [
    { id: 'cyber', name: 'Cyber Purple', color: '4f46e5', bg: 'ffffff', gradient: 'from-indigo-600 via-purple-600 to-pink-500' },
    { id: 'emerald', name: 'Neon Emerald', color: '059669', bg: 'ffffff', gradient: 'from-emerald-500 to-teal-700' },
    { id: 'gold', name: 'VIP Gold', color: 'b45309', bg: 'ffffff', gradient: 'from-amber-500 via-yellow-600 to-orange-600' },
    { id: 'classic', name: 'Classic Dark', color: '000000', bg: 'ffffff', gradient: 'from-gray-800 to-black' },
    { id: 'sunset', name: 'Sunset Glow', color: 'e11d48', bg: 'ffffff', gradient: 'from-rose-500 via-red-600 to-orange-500' },
];

const SmartQrCodeModal: React.FC<SmartQrCodeModalProps> = ({ isOpen, onClose, profile }) => {
    const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    // Construct the direct public shareable link!
    const shareUrl = `${window.location.origin}/?user=${profile.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(shareUrl)}&color=${selectedTheme.color}&bgcolor=${selectedTheme.bg}&margin=15&qzone=2`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    const handleDownloadQr = async () => {
        setDownloading(true);
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${profile.username || 'user'}_Smart_QRCode.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            // Fallback: open in new tab if cors issues
            window.open(qrUrl, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.name || profile.username}'s Profile & Bio Hub`,
                    text: profile.bio_tagline || `Check out ${profile.name || profile.username}'s official Bio Link Hub and social profile!`,
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Share canceled or failed:', err);
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--theme-card-bg)] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
                >
                    {/* Glowing background header */}
                    <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${selectedTheme.gradient} opacity-20 blur-xl pointer-events-none`} />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-gray-500/20 text-[var(--theme-text-secondary)] hover:text-white hover:bg-red-500/80 transition-all z-10 font-bold"
                    >
                        ✕
                    </button>

                    <div className="text-center mb-6 relative z-10">
                        <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
                            ✨ Smart Profile QR
                        </span>
                        <h3 className="text-2xl font-black text-[var(--theme-text)]">
                            {profile.name || profile.username}'s QR Code
                        </h3>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-1">
                            Scan with any camera to visit Bio Link Hub without login!
                        </p>
                    </div>

                    {/* QR Code Canvas Card */}
                    <div className="relative flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 dark:border-gray-800 my-4 group">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <img
                                src={qrUrl}
                                alt="Smart Profile QR Code"
                                className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Avatar emblem in the center of QR */}
                            {profile.photo_url && (
                                <div className="absolute w-14 h-14 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                                    <img src={profile.photo_url} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <span className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
                                {window.location.host}
                            </span>
                        </div>
                    </div>

                    {/* Color Theme Selector */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wider mb-2 text-center">
                            Customize QR Theme
                        </label>
                        <div className="flex items-center justify-center gap-2">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTheme(t)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        selectedTheme.id === t.id
                                            ? `bg-gradient-to-r ${t.gradient} text-white shadow-lg scale-105`
                                            : 'bg-gray-500/10 text-[var(--theme-text-secondary)] hover:bg-gray-500/20'
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full bg-[#${t.color}] border border-white/50`} />
                                    {t.name.split(' ')[1] || t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <Button
                            onClick={handleDownloadQr}
                            disabled={downloading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            {downloading ? 'Saving...' : 'Download PNG'}
                        </Button>

                        <Button
                            onClick={handleCopyLink}
                            variant="secondary"
                            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 bg-[var(--theme-card-bg-alt)] border border-gray-500/20 hover:border-indigo-500"
                        >
                            {copied ? (
                                <>
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    <span className="text-green-500 font-bold">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-5 h-5" />
                                    <span>Copy Link</span>
                                </>
                            )}
                        </Button>
                    </div>

                    <button
                        onClick={handleNativeShare}
                        className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <ShareIcon />
                        <span>Share Profile & Bio Hub Everywhere</span>
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default SmartQrCodeModal;
