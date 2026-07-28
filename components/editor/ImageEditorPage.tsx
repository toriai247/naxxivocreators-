import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackArrowIcon } from '../common/AppIcons';
import ImageEditorModal from './ImageEditorModal';

interface ImageEditorPageProps {
    onBack: () => void;
}

interface SavedEditItem {
    id: string;
    url: string;
    title: string;
    date: string;
}

export const ImageEditorPage: React.FC<ImageEditorPageProps> = ({ onBack }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:1'>('free');
    const [studioTitle, setStudioTitle] = useState("🎨 Studio Image Editor");
    const [initialImg, setInitialImg] = useState("");
    const [savedEdits, setSavedEdits] = useState<SavedEditItem[]>([]);
    const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

    // Load recent edits from localStorage
    useEffect(() => {
        try {
            const loaded = localStorage.getItem('studio_recent_edits');
            if (loaded) {
                setSavedEdits(JSON.parse(loaded));
            }
        } catch (e) {
            console.error("Failed to load saved edits from localStorage", e);
        }
    }, []);

    const saveToRecentEdits = (newUrl: string) => {
        if (!newUrl) return;
        const newItem: SavedEditItem = {
            id: String(Date.now()),
            url: newUrl,
            title: `${studioTitle} (${new Date().toLocaleDateString()})`,
            date: new Date().toLocaleTimeString()
        };
        const updated = [newItem, ...savedEdits].slice(0, 16); // keep up to 16 recent edits
        setSavedEdits(updated);
        try {
            localStorage.setItem('studio_recent_edits', JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save edit to localStorage", e);
        }
    };

    const openStudio = (ratio: 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:1', title: string, imgUrl = "") => {
        setSelectedAspectRatio(ratio);
        setStudioTitle(title);
        setInitialImg(imgUrl);
        setIsModalOpen(true);
    };

    const handleDeleteSaved = (id: string) => {
        const updated = savedEdits.filter(item => item.id !== id);
        setSavedEdits(updated);
        try {
            localStorage.setItem('studio_recent_edits', JSON.stringify(updated));
        } catch (e) {}
    };

    const handleCopyUrl = (id: string, url: string) => {
        navigator.clipboard.writeText(url);
        setCopySuccessId(id);
        setTimeout(() => setCopySuccessId(null), 2500);
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] pb-16">
            {/* Header */}
            <header className="p-4 sm:p-6 text-center sticky top-0 z-10 bg-[var(--theme-bg)]/80 backdrop-blur-lg border-b border-[var(--theme-secondary)]/30">
                <div className="relative flex items-center justify-center max-w-7xl mx-auto">
                    <button
                        onClick={onBack}
                        className="absolute left-0 p-2 text-[var(--theme-header-text)] hover:opacity-80 transition-opacity"
                    >
                        <BackArrowIcon />
                    </button>
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl sm:text-3xl">🎨</span>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--theme-text)]">Image Editor Studio</h1>
                    </div>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] mt-1">
                    Full access studio for cropping, rotating, applying filters, and framing photos with instant ImgBB auto-upload!
                </p>
            </header>

            <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
                {/* Hero Banner Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-pink-900/60 p-6 sm:p-8 border border-indigo-500/30 shadow-2xl overflow-hidden"
                >
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 max-w-2xl">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 font-extrabold text-xs tracking-wider uppercase border border-indigo-500/40">
                            ⚡ Unlimited Free Studio
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 leading-tight">
                            Craft Custom Avatars, Covers & Aesthetic Photos Smoothly
                        </h2>
                        <p className="text-sm text-indigo-100/80 mt-2">
                            Select a workspace below to start editing. Adjust cropping ratios, fine-tune horizon tilt, apply vintage/polaroid filters, and generate direct links instantly.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => openStudio('free', '🆓 Universal Image Craft Studio')}
                                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-sm shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center space-x-2"
                            >
                                <span>✨ Open Free Workspace</span>
                                <span>↗</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Studio Workspaces Grid */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[var(--theme-text)] flex items-center gap-2">
                            <span>🛠️ Dedicated Preset Studios</span>
                        </h3>
                        <span className="text-xs font-semibold text-gray-400">One-click optimized ratios</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                id: 'avatar',
                                ratio: '1:1' as const,
                                title: '🧑‍🎨 Avatar Creator Studio',
                                desc: 'Perfect 1:1 Square ratio with circle/pill border radius support for your profile picture.',
                                icon: '🧑‍🎨',
                                color: 'from-blue-600/20 to-indigo-600/20 border-blue-500/30',
                                badge: '1:1 Square'
                            },
                            {
                                id: 'cover',
                                ratio: '16:9' as const,
                                title: '🖥️ Profile Cover Studio',
                                desc: 'Widescreen 16:9 cover photo ratio with neon & solid frames for your profile header.',
                                icon: '🖥️',
                                color: 'from-purple-600/20 to-pink-600/20 border-purple-500/30',
                                badge: '16:9 Cover'
                            },
                            {
                                id: 'banner',
                                ratio: '3:1' as const,
                                title: '🏁 Store Banner Studio',
                                desc: 'Ultra-wide 3:1 ratio tailored for custom bazaar items, promotional headers, and banners.',
                                icon: '🏁',
                                color: 'from-amber-600/20 to-red-600/20 border-amber-500/30',
                                badge: '3:1 Wide'
                            },
                            {
                                id: 'story',
                                ratio: '9:16' as const,
                                title: '📱 Reel / Story Frame',
                                desc: 'Vertical 9:16 portrait ratio ideal for mobile screenshots, stories, and event submissions.',
                                icon: '📱',
                                color: 'from-emerald-600/20 to-teal-600/20 border-emerald-500/30',
                                badge: '9:16 Portrait'
                            }
                        ].map((studio, idx) => (
                            <motion.button
                                key={studio.id}
                                whileHover={{ scale: 1.03, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openStudio(studio.ratio, studio.title)}
                                className={`p-5 rounded-2xl bg-gradient-to-br ${studio.color} border bg-[var(--theme-card-bg)]/80 text-left flex flex-col justify-between shadow-lg transition-all group`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-4xl">{studio.icon}</span>
                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
                                            {studio.badge}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base text-[var(--theme-text)] group-hover:text-indigo-400 transition-colors">
                                        {studio.title}
                                    </h4>
                                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 line-clamp-3">
                                        {studio.desc}
                                    </p>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-indigo-400">
                                    <span>Launch Studio</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Recent Edits & Creations Gallery */}
                <section className="bg-[var(--theme-card-bg)]/60 border border-gray-700/50 rounded-3xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--theme-text)] flex items-center gap-2">
                                <span>📂 Your Recent Edited Creations</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-extrabold">
                                    {savedEdits.length}
                                </span>
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)]">
                                Images edited in this browser are automatically saved here for quick copying & reuse across the app!
                            </p>
                        </div>
                        {savedEdits.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm("Clear all saved recent edits history?")) {
                                        setSavedEdits([]);
                                        localStorage.removeItem('studio_recent_edits');
                                    }
                                }}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                            >
                                🗑️ Clear History
                            </button>
                        )}
                    </div>

                    {savedEdits.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-gray-700/50 rounded-2xl">
                            <span className="text-4xl block mb-2">🖼️</span>
                            <p className="font-bold text-sm text-[var(--theme-text)]">No Saved Edits Yet</p>
                            <p className="text-xs text-[var(--theme-text-secondary)] max-w-sm mx-auto mt-1">
                                Launch any workspace above, make your adjustments, and click "Apply & Auto-Upload" to see your creations here!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {savedEdits.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-[var(--theme-bg)] border border-gray-700/60 rounded-2xl overflow-hidden flex flex-col justify-between shadow-md group"
                                    >
                                        <div className="relative aspect-video bg-black/40 overflow-hidden flex items-center justify-center">
                                            <img
                                                src={item.url}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openStudio('free', '🎨 Edit Saved Creation', item.url)}
                                                    className="p-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-700"
                                                    title="Re-edit this image"
                                                >
                                                    🎨 Edit Again
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 flex flex-col justify-between flex-1">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-xs text-[var(--theme-text)] truncate" title={item.title}>
                                                        {item.title}
                                                    </p>
                                                    <button
                                                        onClick={() => handleDeleteSaved(item.id)}
                                                        className="text-gray-500 hover:text-red-400 transition-colors text-xs ml-1"
                                                        title="Remove from history"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-[var(--theme-text-secondary)] mt-0.5">
                                                    Saved at {item.date}
                                                </p>
                                            </div>
                                            <div className="mt-3 pt-2 border-t border-gray-700/40 flex items-center justify-between gap-1">
                                                <button
                                                    onClick={() => handleCopyUrl(item.id, item.url)}
                                                    className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    {copySuccessId === item.id ? (
                                                        <span className="text-green-400 font-extrabold">✅ Copied!</span>
                                                    ) : (
                                                        <>
                                                            <span>📋 Copy URL</span>
                                                        </>
                                                    )}
                                                </button>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-xs flex items-center justify-center transition-colors"
                                                    title="Open full image"
                                                >
                                                    ↗
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal Studio */}
            <ImageEditorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialImageUrl={initialImg}
                onSave={(url) => saveToRecentEdits(url)}
                title={studioTitle}
                defaultAspectRatio={selectedAspectRatio}
            />
        </div>
    );
};

export default ImageEditorPage;
