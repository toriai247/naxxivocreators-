import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackArrowIcon, UploadIcon, DownloadIcon, CheckCircleIcon } from '../common/AppIcons';
import Button from '../common/Button';
import { compressImage, formatBytes, downloadFile, fileToDataUrl, type CompressionResult } from '../../utils/imageCompressor';
import { uploadToImgBB } from '../../utils/imgbbService';

interface ImageCompressorPageProps {
    onBack: () => void;
}

interface FileItem {
    id: string;
    originalFile: File;
    originalSize: number;
    originalFormat: string;
    previewUrl: string;
    status: 'pending' | 'compressing' | 'done' | 'error';
    errorMsg?: string;
    result?: CompressionResult;
    isUploadingToImgbb?: boolean;
    imgbbUrl?: string;
}

const ImageCompressorPage: React.FC<ImageCompressorPageProps> = ({ onBack }) => {
    const [fileItems, setFileItems] = useState<FileItem[]>([]);
    const [targetFormat, setTargetFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
    const [quality, setQuality] = useState<number>(0.82); // 82% quality
    const [maxDimension, setMaxDimension] = useState<number>(1920);
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'compressor' | 'speed_tips'>('compressor');
    const [globalMessage, setGlobalMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle files dropped or selected
    const handleFilesAdded = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newItems: FileItem[] = [];
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('image/')) {
                continue; // Skip non-images
            }
            let preview = '';
            try {
                preview = await fileToDataUrl(file);
            } catch (err) {
                preview = '';
            }
            newItems.push({
                id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                originalFile: file,
                originalSize: file.size,
                originalFormat: file.type || 'image/unknown',
                previewUrl: preview,
                status: 'pending'
            });
        }

        if (newItems.length > 0) {
            setFileItems((prev) => [...prev, ...newItems]);
            setGlobalMessage(`Added ${newItems.length} image(s) ready for compression!`);
            setTimeout(() => setGlobalMessage(null), 3000);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFilesAdded(e.dataTransfer.files);
    };

    // Compress a single item
    const compressSingleItem = async (item: FileItem) => {
        setFileItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'compressing', errorMsg: undefined } : i))
        );

        try {
            const res = await compressImage(item.originalFile, {
                quality: quality,
                maxWidth: maxDimension,
                maxHeight: maxDimension,
                targetFormat: targetFormat
            });

            setFileItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: 'done', result: res } : i))
            );
        } catch (err: any) {
            setFileItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: 'error', errorMsg: err.message || 'Compression failed.' } : i))
            );
        }
    };

    // Compress all pending items
    const compressAll = async () => {
        const pendingItems = fileItems.filter((i) => i.status === 'pending' || i.status === 'error');
        if (pendingItems.length === 0) return;

        for (const item of pendingItems) {
            await compressSingleItem(item);
        }
    };

    // Upload compressed file to ImgBB
    const handleUploadToImgbb = async (item: FileItem) => {
        if (!item.result) return;

        setFileItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, isUploadingToImgbb: true } : i))
        );

        try {
            const res = await uploadToImgBB(item.result.file, item.result.file.name);
            if (res.error || !res.url) {
                throw new Error(res.error || 'ImgBB upload failed.');
            }

            setFileItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, isUploadingToImgbb: false, imgbbUrl: res.url } : i))
            );

            // Copy to clipboard automatically
            navigator.clipboard.writeText(res.url);
            setGlobalMessage(`✅ Direct URL copied to clipboard: ${res.url}`);
            setTimeout(() => setGlobalMessage(null), 5000);
        } catch (err: any) {
            setFileItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, isUploadingToImgbb: false, errorMsg: err.message || 'ImgBB upload error' } : i))
            );
        }
    };

    const removeItem = (id: string) => {
        setFileItems((prev) => prev.filter((i) => i.id !== id));
    };

    const clearAll = () => {
        setFileItems([]);
    };

    // Calculate total stats
    const totalOriginalSize = fileItems.reduce((acc, curr) => acc + curr.originalSize, 0);
    const totalCompressedSize = fileItems.reduce((acc, curr) => acc + (curr.result?.compressedSize || curr.originalSize), 0);
    const totalSavedBytes = totalOriginalSize - totalCompressedSize;
    const totalSavedPercent = totalOriginalSize > 0 ? Math.round((totalSavedBytes / totalOriginalSize) * 100) : 0;

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] pb-12">
            {/* Header */}
            <header className="p-4 text-center sticky top-0 z-20 bg-[var(--theme-bg)]/80 backdrop-blur-lg border-b border-[var(--theme-secondary)]/30">
                <div className="relative flex items-center justify-center max-w-5xl mx-auto">
                    <button onClick={onBack} className="absolute left-0 text-[var(--theme-header-text)] hover:opacity-80 p-2">
                        <BackArrowIcon />
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--theme-text)] flex items-center gap-2">
                        ⚡ Native Image Compressor & WebP Converter
                    </h1>
                </div>
                <p className="text-xs sm:text-sm text-[var(--theme-text-secondary)] mt-1 max-w-2xl mx-auto">
                    100% Free, Browser-Native Image Optimization. Convert PNG/JPG to WebP without paid third-party APIs!
                </p>

                {/* Tabs */}
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        onClick={() => setActiveTab('compressor')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'compressor'
                                ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/30 scale-105'
                                : 'bg-[var(--theme-card-bg)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'
                        }`}
                    >
                        🗜️ Compressor Studio
                    </button>
                    <button
                        onClick={() => setActiveTab('speed_tips')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            activeTab === 'speed_tips'
                                ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/30 scale-105'
                                : 'bg-[var(--theme-card-bg)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'
                        }`}
                    >
                        🚀 Why Own Code vs Paid API?
                    </button>
                </div>
            </header>

            {/* Global notification banner */}
            <AnimatePresence>
                {globalMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-4xl mx-auto mt-4 px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm font-medium text-center shadow-lg"
                    >
                        {globalMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-6xl mx-auto p-4 sm:p-6 mt-2">
                {activeTab === 'compressor' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Control Panel */}
                        <div className="lg:col-span-1 bg-[var(--theme-card-bg)]/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl space-y-5 h-fit sticky top-28">
                            <h3 className="font-bold text-lg text-[var(--theme-text)] flex items-center gap-2 border-b border-white/10 pb-3">
                                ⚙️ Compression Settings
                            </h3>

                            {/* Target Format */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2">
                                    Target Output Format
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setTargetFormat(fmt)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                targetFormat === fmt
                                                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)] shadow-md'
                                                    : 'bg-black/20 text-[var(--theme-text-secondary)] border-white/10 hover:border-white/30'
                                            }`}
                                        >
                                            {fmt === 'image/webp' ? 'WEBP ⚡ (Best)' : fmt === 'image/jpeg' ? 'JPEG' : 'PNG'}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-[var(--theme-text-secondary)] mt-1.5 leading-relaxed">
                                    💡 <strong className="text-amber-400">WEBP</strong> produces images up to 80% smaller than PNG with identical visual quality!
                                </p>
                            </div>

                            {/* Quality Slider */}
                            {targetFormat !== 'image/png' && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)]">
                                            Compression Quality
                                        </label>
                                        <span className="text-sm font-bold text-[var(--theme-primary)]">
                                            {Math.round(quality * 100)}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.02"
                                        value={quality}
                                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)]"
                                    />
                                    <div className="flex justify-between text-[10px] text-[var(--theme-text-secondary)] mt-1">
                                        <span>Max Compression (10%)</span>
                                        <span>Balanced (80%)</span>
                                        <span>Lossless (100%)</span>
                                    </div>
                                </div>
                            )}

                            {/* Max Dimension */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--theme-text-secondary)] mb-2">
                                    Max Image Resolution
                                </label>
                                <select
                                    value={maxDimension}
                                    onChange={(e) => setMaxDimension(parseInt(e.target.value))}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
                                >
                                    <option value={1920}>1920px (Full HD / Standard)</option>
                                    <option value={1280}>1280px (HD / Web Optimized)</option>
                                    <option value={800}>800px (Medium / Fast Loading)</option>
                                    <option value={500}>500px (Avatar / Thumbnail)</option>
                                    <option value={99999}>Original Dimensions (No Resizing)</option>
                                </select>
                            </div>

                            {/* Action Summary */}
                            <div className="pt-3 border-t border-white/10 space-y-2">
                                <Button
                                    variant="primary"
                                    onClick={compressAll}
                                    disabled={fileItems.filter(i => i.status === 'pending' || i.status === 'error').length === 0}
                                    className="w-full py-3 font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>🚀 Compress & Convert All ({fileItems.filter(i => i.status === 'pending' || i.status === 'error').length})</span>
                                </Button>

                                {fileItems.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="w-full py-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                                    >
                                        🗑️ Clear All Images
                                    </button>
                                )}
                            </div>

                            {/* Stats Summary Box */}
                            {fileItems.some(i => i.status === 'done') && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1 text-emerald-300">
                                    <div className="font-bold flex items-center gap-1 text-emerald-400 mb-1">
                                        🔥 Total Savings Summary
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Original Size:</span>
                                        <span className="font-bold">{formatBytes(totalOriginalSize)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Compressed Size:</span>
                                        <span className="font-bold">{formatBytes(totalCompressedSize)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-emerald-500/20 pt-1 text-emerald-400 font-bold">
                                        <span>Total Saved:</span>
                                        <span>{formatBytes(totalSavedBytes)} ({totalSavedPercent}%)</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Area: Dropzone & File List */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Drag & Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                                    isDragging
                                        ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 scale-[1.01]'
                                        : 'border-white/20 hover:border-white/40 bg-[var(--theme-card-bg)]/40 hover:bg-[var(--theme-card-bg)]/60'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFilesAdded(e.target.files)}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />
                                <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/20 flex items-center justify-center text-3xl mb-3 text-[var(--theme-primary)] shadow-inner">
                                    📁
                                </div>
                                <h3 className="font-bold text-base text-[var(--theme-text)] mb-1">
                                    Click to Browse or Drag & Drop Images Here
                                </h3>
                                <p className="text-xs text-[var(--theme-text-secondary)] max-w-md">
                                    Supports PNG, JPG, WEBP, BMP, & GIFs. You can select multiple images at once to batch convert!
                                </p>
                            </div>

                            {/* File List */}
                            {fileItems.length === 0 ? (
                                <div className="text-center py-12 bg-[var(--theme-card-bg)]/20 rounded-2xl border border-white/5">
                                    <div className="text-4xl mb-2 opacity-50">📭</div>
                                    <p className="text-sm text-[var(--theme-text-secondary)]">
                                        No images added yet. Drop your bulky PNG or JPG images above to optimize!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="font-bold text-sm text-[var(--theme-text)]">
                                            Uploaded Queue ({fileItems.length})
                                        </h3>
                                        <span className="text-xs text-[var(--theme-text-secondary)]">
                                            Click 'Compress Now' on individual cards or use the button on the left!
                                        </span>
                                    </div>

                                    {fileItems.map((item) => {
                                        const isDone = item.status === 'done' && item.result;
                                        const savings = item.result?.savingsPercent || 0;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-[var(--theme-card-bg)]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
                                            >
                                                {/* Left: Thumbnail & Info */}
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
                                                        <img
                                                            src={isDone ? item.result!.dataUrl : item.previewUrl}
                                                            alt={item.originalFile.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {isDone && (
                                                            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[9px] font-bold px-1 rounded-tl">
                                                                WEBP
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm text-[var(--theme-text)] truncate" title={item.originalFile.name}>
                                                            {item.originalFile.name}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--theme-text-secondary)]">
                                                            <span className="bg-black/30 px-2 py-0.5 rounded text-[11px]">
                                                                Original: <strong className="text-[var(--theme-text)]">{formatBytes(item.originalSize)}</strong>
                                                            </span>

                                                            {isDone && (
                                                                <>
                                                                    <span>➡️</span>
                                                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                                                                        New: {formatBytes(item.result!.compressedSize)}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                                                        savings > 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                                                    }`}>
                                                                        {savings > 0 ? `-${savings}% Smaller 🔥` : `Optimized`}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {item.status === 'compressing' && (
                                                            <div className="text-xs text-amber-400 mt-1 font-medium animate-pulse">
                                                                ⏳ Compressing with Browser Engine...
                                                            </div>
                                                        )}
                                                        {item.status === 'error' && (
                                                            <div className="text-xs text-red-400 mt-1">
                                                                ❌ {item.errorMsg}
                                                            </div>
                                                        )}
                                                        {item.imgbbUrl && (
                                                            <div className="mt-2 flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10 text-xs">
                                                                <span className="text-emerald-400 font-bold">☁️ URL:</span>
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={item.imgbbUrl}
                                                                    className="bg-transparent text-[11px] text-[var(--theme-text)] flex-1 focus:outline-none truncate"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(item.imgbbUrl!);
                                                                        setGlobalMessage("Copied direct URL to clipboard!");
                                                                        setTimeout(() => setGlobalMessage(null), 3000);
                                                                    }}
                                                                    className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-[10px] text-white font-bold"
                                                                >
                                                                    Copy
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Actions */}
                                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                                                    {item.status === 'pending' || item.status === 'error' ? (
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => compressSingleItem(item)}
                                                            className="py-1.5 px-3 text-xs font-bold bg-[var(--theme-primary)] text-white hover:opacity-90"
                                                        >
                                                            ⚡ Compress Now
                                                        </Button>
                                                    ) : item.status === 'done' ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => downloadFile(item.result!.file)}
                                                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                                                                title="Download to PC/Phone"
                                                            >
                                                                <span>⬇️ Download</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleUploadToImgbb(item)}
                                                                disabled={item.isUploadingToImgbb}
                                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all"
                                                                title="Upload to ImgBB & Get Direct URL"
                                                            >
                                                                <span>{item.isUploadingToImgbb ? '⏳ Uploading...' : '☁️ Get URL'}</span>
                                                            </button>
                                                        </div>
                                                    ) : null}

                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-[var(--theme-text-secondary)] hover:text-red-400 p-1.5 rounded-lg transition-colors"
                                                        title="Remove from queue"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Explanation Tab: Why Own Code vs Paid API? */
                    <div className="bg-[var(--theme-card-bg)]/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-6">
                        <div className="border-b border-white/10 pb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text)] flex items-center gap-2">
                                💡 Why Browser-Native Compression is 10x Better Than Paid APIs!
                            </h2>
                            <p className="text-sm text-[var(--theme-text-secondary)] mt-1">
                                Answering your question: Yes, React & TypeScript can natively convert PNG/JPG to WebP and compress image size without any third-party paid services!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                                <h3 className="font-bold text-emerald-400 text-base flex items-center gap-2">
                                    ✅ Own Code (Browser Native Canvas API)
                                </h3>
                                <ul className="space-y-2 text-xs sm:text-sm text-emerald-200">
                                    <li className="flex items-start gap-2">
                                        <span>💸</span>
                                        <span><strong>100% Free Forever:</strong> Zero monthly subscription, zero API credits or limits!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>⚡</span>
                                        <span><strong>Super Fast & Zero Latency:</strong> Images are compressed right inside your device's RAM/CPU. No waiting for server upload/download loops!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>🔒</span>
                                        <span><strong>100% Privacy Safe:</strong> Your private photos never leave your device until you explicitly decide to upload them.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>🔋</span>
                                        <span><strong>Offline Capable:</strong> Works even if internet is slow or temporarily disconnected.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-3">
                                <h3 className="font-bold text-red-400 text-base flex items-center gap-2">
                                    ❌ Third-Party Paid APIs (TinyPNG, Cloudinary, etc.)
                                </h3>
                                <ul className="space-y-2 text-xs sm:text-sm text-red-200">
                                    <li className="flex items-start gap-2">
                                        <span>💰</span>
                                        <span><strong>Expensive & Limited:</strong> Free tiers cap you at ~500 images/month, then charge per image!</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>🐢</span>
                                        <span><strong>Slow Server Bottlenecks:</strong> Must upload bulky 5MB PNG to remote servers, wait for backend processing, then download back.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>⚠️</span>
                                        <span><strong>API Key Dependency:</strong> If their API goes down or changes pricing, your app stops working.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
                            <h3 className="font-bold text-[var(--theme-text)] text-base">
                                🚀 How to make your App/Website Super Fast:
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[var(--theme-text-secondary)]">
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <strong className="text-[var(--theme-primary)] block mb-1">1. Use WebP Format</strong>
                                    WebP images are 30% to 80% smaller than standard PNGs and JPEGs while keeping transparency and crisp quality!
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <strong className="text-[var(--theme-primary)] block mb-1">2. Auto-Compress Before Upload</strong>
                                    Use our built-in automatic compressor in upload boxes so large 4MB phone camera photos shrink to 200KB before hitting the database!
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <strong className="text-[var(--theme-primary)] block mb-1">3. Code Splitting & Lazy Loading</strong>
                                    We already implemented React Suspense & lazy loading so pages only download when clicked!
                                </div>
                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                    <strong className="text-[var(--theme-primary)] block mb-1">4. CDN Direct URLs</strong>
                                    Hosting compressed images on high-speed CDNs (like ImgBB or Supabase Storage) ensures lightning-fast global delivery!
                                </div>
                            </div>
                        </div>

                        <div className="text-center pt-2">
                            <Button
                                variant="primary"
                                onClick={() => setActiveTab('compressor')}
                                className="py-3 px-8 font-bold shadow-lg"
                            >
                                🗜️ Go to Compressor Studio Now
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ImageCompressorPage;
