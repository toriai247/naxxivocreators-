import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToImgBB } from '../../utils/imgbbService';
import LoadingSpinner from '../common/LoadingSpinner';

export interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialImageUrl?: string;
    onSave?: (newUrl: string) => void;
    title?: string;
    defaultAspectRatio?: 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:1';
}

type TabType = 'crop' | 'rotate' | 'color' | 'filters' | 'frames';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
    isOpen,
    onClose,
    initialImageUrl = '',
    onSave,
    title = "🎨 Studio Image Editor",
    defaultAspectRatio = 'free'
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('crop');
    const [imageSrc, setImageSrc] = useState<string>(initialImageUrl);
    const [inputUrl, setInputUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Editing state
    const [aspectRatio, setAspectRatio] = useState<'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:1'>(defaultAspectRatio);
    const [zoom, setZoom] = useState<number>(1);
    const [panX, setPanX] = useState<number>(0);
    const [panY, setPanY] = useState<number>(0);
    const [rotateDeg, setRotateDeg] = useState<number>(0);
    const [fineAngle, setFineAngle] = useState<number>(0);
    const [flipH, setFlipH] = useState<boolean>(false);
    const [flipV, setFlipV] = useState<boolean>(false);

    // Color & Tone
    const [brightness, setBrightness] = useState<number>(100); // %
    const [contrast, setContrast] = useState<number>(100); // %
    const [saturation, setSaturation] = useState<number>(100); // %
    const [warmth, setWarmth] = useState<number>(0); // -50 to +50
    const [blur, setBlur] = useState<number>(0); // px

    // Filters
    const [filterPreset, setFilterPreset] = useState<'none' | 'vintage' | 'grayscale' | 'sepia' | 'cool' | 'warm' | 'cyberpunk' | 'polaroid' | 'drama'>('none');

    // Frames & Borders
    const [borderRadius, setBorderRadius] = useState<number>(0); // %
    const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'polaroid' | 'cyber' | 'gold'>('none');
    const [borderColor, setBorderColor] = useState<string>('#6366f1');
    const [borderWidth, setBorderWidth] = useState<number>(10);

    // References
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadedImgRef = useRef<HTMLImageElement | null>(null);

    // Load initial image when modal opens or url changes
    useEffect(() => {
        if (isOpen && initialImageUrl) {
            setImageSrc(initialImageUrl);
        }
    }, [isOpen, initialImageUrl]);

    // Apply preset filter settings when user clicks filter buttons
    const applyFilterPreset = (preset: typeof filterPreset) => {
        setFilterPreset(preset);
        switch (preset) {
            case 'none':
                setBrightness(100); setContrast(100); setSaturation(100); setWarmth(0);
                break;
            case 'vintage':
                setBrightness(105); setContrast(90); setSaturation(85); setWarmth(20);
                break;
            case 'grayscale':
                setBrightness(100); setContrast(110); setSaturation(0); setWarmth(0);
                break;
            case 'sepia':
                setBrightness(105); setContrast(95); setSaturation(80); setWarmth(35);
                break;
            case 'cool':
                setBrightness(105); setContrast(105); setSaturation(110); setWarmth(-25);
                break;
            case 'warm':
                setBrightness(105); setContrast(105); setSaturation(115); setWarmth(25);
                break;
            case 'cyberpunk':
                setBrightness(110); setContrast(135); setSaturation(160); setWarmth(-10);
                break;
            case 'polaroid':
                setBrightness(115); setContrast(90); setSaturation(95); setWarmth(15);
                setBorderStyle('polaroid'); setBorderColor('#ffffff'); setBorderWidth(24);
                break;
            case 'drama':
                setBrightness(95); setContrast(145); setSaturation(120); setWarmth(0);
                break;
        }
    };

    const handleResetAll = () => {
        setZoom(1); setPanX(0); setPanY(0);
        setRotateDeg(0); setFineAngle(0);
        setFlipH(false); setFlipV(false);
        setBrightness(100); setContrast(100); setSaturation(100); setWarmth(0); setBlur(0);
        setFilterPreset('none');
        setBorderRadius(0); setBorderStyle('none'); setBorderWidth(10);
        setErrorMsg(null);
        setSuccessMsg("✨ All edits reset to default!");
        setTimeout(() => setSuccessMsg(null), 2500);
    };

    // Load Image into DOM Image object
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            loadedImgRef.current = img;
            renderCanvas();
        };
        img.onerror = () => {
            setErrorMsg("❌ Could not load image. If using a URL, make sure it allows external viewing or upload direct file.");
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Re-render canvas whenever any editing state changes
    useEffect(() => {
        renderCanvas();
    }, [
        aspectRatio, zoom, panX, panY, rotateDeg, fineAngle,
        flipH, flipV, brightness, contrast, saturation, warmth, blur,
        filterPreset, borderRadius, borderStyle, borderColor, borderWidth
    ]);

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        const img = loadedImgRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Base resolution for clean export quality
        let targetWidth = 800;
        let targetHeight = 800;

        if (aspectRatio === '1:1') { targetWidth = 800; targetHeight = 800; }
        else if (aspectRatio === '16:9') { targetWidth = 960; targetHeight = 540; }
        else if (aspectRatio === '4:3') { targetWidth = 800; targetHeight = 600; }
        else if (aspectRatio === '9:16') { targetWidth = 540; targetHeight = 960; }
        else if (aspectRatio === '3:1') { targetWidth = 900; targetHeight = 300; }
        else {
            // free aspect ratio preserves source ratio
            const ratio = img.width / img.height;
            targetWidth = 800;
            targetHeight = Math.round(800 / ratio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // Apply rounded corner clipping if requested
        if (borderRadius > 0) {
            ctx.save();
            ctx.beginPath();
            const r = (Math.min(targetWidth, targetHeight) * (borderRadius / 100)) / 2;
            if (ctx.roundRect) {
                ctx.roundRect(0, 0, targetWidth, targetHeight, r);
            } else {
                // Fallback rounded rect
                ctx.moveTo(r, 0);
                ctx.lineTo(targetWidth - r, 0);
                ctx.quadraticCurveTo(targetWidth, 0, targetWidth, r);
                ctx.lineTo(targetWidth, targetHeight - r);
                ctx.quadraticCurveTo(targetWidth, targetHeight, targetWidth - r, targetHeight);
                ctx.lineTo(r, targetHeight);
                ctx.quadraticCurveTo(0, targetHeight, 0, targetHeight - r);
                ctx.lineTo(0, r);
                ctx.quadraticCurveTo(0, 0, r, 0);
            }
            ctx.clip();
        }

        // Apply CSS Filters
        let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        if (blur > 0) {
            filterStr += ` blur(${blur}px)`;
        }
        ctx.filter = filterStr;

        // Transform (Rotate, Flip, Pan, Zoom)
        ctx.save();
        ctx.translate(targetWidth / 2 + panX, targetHeight / 2 + panY);
        
        const totalAngleRad = ((rotateDeg + fineAngle) * Math.PI) / 180;
        ctx.rotate(totalAngleRad);
        ctx.scale(flipH ? -zoom : zoom, flipV ? -zoom : zoom);

        // Calculate scaling to cover canvas
        const scaleX = targetWidth / img.width;
        const scaleY = targetHeight / img.height;
        const baseScale = Math.max(scaleX, scaleY);
        const drawW = img.width * baseScale;
        const drawH = img.height * baseScale;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Apply Warmth / Tint overlay
        if (warmth !== 0) {
            ctx.save();
            ctx.globalCompositeOperation = warmth > 0 ? 'color-burn' : 'color-dodge';
            ctx.fillStyle = warmth > 0 ? `rgba(255, 165, 0, ${Math.abs(warmth) / 200})` : `rgba(0, 150, 255, ${Math.abs(warmth) / 200})`;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.restore();
        }

        // Apply Cyberpunk or Vintage color wash
        if (filterPreset === 'cyberpunk') {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
            grad.addColorStop(0, 'rgba(255, 0, 128, 0.25)');
            grad.addColorStop(1, 'rgba(0, 255, 255, 0.25)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.restore();
        } else if (filterPreset === 'sepia') {
            ctx.save();
            ctx.globalCompositeOperation = 'color';
            ctx.fillStyle = 'rgba(112, 66, 20, 0.4)';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.restore();
        }

        // Apply Borders / Frames
        if (borderStyle !== 'none' && borderWidth > 0) {
            ctx.save();
            if (borderStyle === 'solid') {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = borderWidth * 2;
                if (ctx.roundRect && borderRadius > 0) {
                    const r = (Math.min(targetWidth, targetHeight) * (borderRadius / 100)) / 2;
                    ctx.beginPath();
                    ctx.roundRect(0, 0, targetWidth, targetHeight, r);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(0, 0, targetWidth, targetHeight);
                }
            } else if (borderStyle === 'polaroid') {
                // Classic Polaroid white border with thick bottom
                ctx.fillStyle = borderColor;
                ctx.fillRect(0, 0, targetWidth, borderWidth); // top
                ctx.fillRect(0, 0, borderWidth, targetHeight); // left
                ctx.fillRect(targetWidth - borderWidth, 0, borderWidth, targetHeight); // right
                ctx.fillRect(0, targetHeight - borderWidth * 2.8, targetWidth, borderWidth * 2.8); // bottom
            } else if (borderStyle === 'cyber') {
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(borderWidth / 2, borderWidth / 2, targetWidth - borderWidth, targetHeight - borderWidth);
                ctx.strokeStyle = '#ff007f';
                ctx.lineWidth = Math.max(2, borderWidth / 2);
                ctx.strokeRect(borderWidth * 1.5, borderWidth * 1.5, targetWidth - borderWidth * 3, targetHeight - borderWidth * 3);
            } else if (borderStyle === 'gold') {
                const goldGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
                goldGrad.addColorStop(0, '#bf953f');
                goldGrad.addColorStop(0.25, '#fcf6ba');
                goldGrad.addColorStop(0.5, '#b38728');
                goldGrad.addColorStop(0.75, '#fbf5b7');
                goldGrad.addColorStop(1, '#aa771c');
                ctx.strokeStyle = goldGrad;
                ctx.lineWidth = borderWidth * 2;
                ctx.strokeRect(0, 0, targetWidth, targetHeight);
            }
            ctx.restore();
        }

        if (borderRadius > 0) {
            ctx.restore();
        }
    };

    const handleFileUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrorMsg("❌ Please upload a valid image file (PNG, JPG, WEBP, GIF).");
            return;
        }
        setErrorMsg(null);
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImageSrc(e.target.result as string);
                setSuccessMsg("📂 Photo loaded into Studio!");
                setTimeout(() => setSuccessMsg(null), 2500);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleUrlLoad = () => {
        if (!inputUrl.trim()) return;
        setImageSrc(inputUrl.trim());
        setInputUrl('');
        setSuccessMsg("🔗 URL Image loaded into Studio!");
        setTimeout(() => setSuccessMsg(null), 2500);
    };

    const handleDownloadLocal = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `edited_studio_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSuccessMsg("💾 Downloaded PNG successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handleSaveAndUpload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsUploading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
            });

            if (!blob) throw new Error("Could not render edited canvas image.");

            const fileName = `studio_edited_${Date.now()}.png`;
            const result = await uploadToImgBB(blob, fileName);

            if (result.error || !result.url) {
                throw new Error(result.error || "Failed to upload edited image to ImgBB.");
            }

            setSuccessMsg("✨ Edited image saved & auto-uploaded to ImgBB!");
            if (onSave) {
                onSave(result.url);
            }
            setTimeout(() => {
                setIsUploading(false);
                onClose();
            }, 1500);
        } catch (err: any) {
            setErrorMsg(err.message || "Upload failed. You can still use 'Download Local Copy'!");
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-[var(--theme-card-bg)] border border-gray-700/60 rounded-2xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 px-6 bg-[var(--theme-card-bg-alt)] border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center space-x-3">
                            <span className="text-2xl">🎨</span>
                            <div>
                                <h2 className="text-lg font-bold text-[var(--theme-text)]">{title}</h2>
                                <p className="text-xs text-[var(--theme-text-secondary)]">Crop, Rotate, Apply Filters & Borders with ImgBB Auto-Upload</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleResetAll}
                                type="button"
                                className="px-3 py-1.5 rounded-lg bg-gray-500/20 hover:bg-gray-500/30 text-xs font-semibold text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] transition-colors flex items-center gap-1"
                                title="Reset all changes"
                            >
                                <span>🔄 Reset</span>
                            </button>
                            <button
                                onClick={onClose}
                                type="button"
                                className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 font-bold flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Source Pickers Toolbar */}
                    <div className="p-3 bg-[var(--theme-bg)]/80 border-b border-gray-700/40 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm flex items-center gap-1 transition-all"
                            >
                                <span>📁 Upload New Photo</span>
                            </button>
                            <div className="flex items-center gap-1 flex-1">
                                <input
                                    type="url"
                                    value={inputUrl}
                                    onChange={(e) => setInputUrl(e.target.value)}
                                    placeholder="Paste image URL here..."
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--theme-card-bg)] border border-gray-700 text-xs text-[var(--theme-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                                />
                                <button
                                    type="button"
                                    onClick={handleUrlLoad}
                                    disabled={!inputUrl.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold disabled:opacity-40 transition-colors"
                                >
                                    Load URL
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                ✨ Smooth Real-time Rendering
                            </span>
                        </div>
                    </div>

                    {/* Main Studio Body: Canvas Left/Top, Controls Right/Bottom */}
                    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                        {/* Canvas Preview Area */}
                        <div className="flex-1 bg-black/60 p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[280px]">
                            <div className="relative max-w-full max-h-full flex items-center justify-center border border-gray-800 rounded-xl p-2 bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px]">
                                {imageSrc ? (
                                    <canvas
                                        ref={canvasRef}
                                        className="max-w-full max-h-[50vh] md:max-h-[62vh] object-contain shadow-2xl rounded"
                                    />
                                ) : (
                                    <div className="py-20 px-8 text-center text-gray-400 flex flex-col items-center gap-3">
                                        <span className="text-5xl">🖼️</span>
                                        <p className="font-bold text-sm">No Image Selected</p>
                                        <p className="text-xs max-w-xs">Upload a file or paste a direct image URL above to start editing!</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow"
                                        >
                                            📁 Pick Image Now
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status messages */}
                            <div className="absolute bottom-3 left-4 right-4 flex flex-col gap-1 items-center pointer-events-none">
                                {errorMsg && (
                                    <div className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-auto">
                                        <span>⚠️</span>
                                        <span>{errorMsg}</span>
                                        <button onClick={() => setErrorMsg(null)} className="ml-2 underline">✕</button>
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="px-4 py-2 rounded-xl bg-green-600/95 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
                                        <span>✅</span>
                                        <span>{successMsg}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls Panel */}
                        <div className="w-full md:w-80 lg:w-96 bg-[var(--theme-card-bg-alt)] border-t md:border-t-0 md:border-l border-gray-700/60 flex flex-col flex-shrink-0">
                            {/* Tabs Header */}
                            <div className="grid grid-cols-5 border-b border-gray-700/60 bg-[var(--theme-bg)]/50 text-center text-[11px] font-bold">
                                <button
                                    onClick={() => setActiveTab('crop')}
                                    className={`py-3 px-1 border-b-2 transition-all flex flex-col items-center gap-1 ${activeTab === 'crop' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    <span>✂️</span>
                                    <span>Crop</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('rotate')}
                                    className={`py-3 px-1 border-b-2 transition-all flex flex-col items-center gap-1 ${activeTab === 'rotate' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    <span>🔄</span>
                                    <span>Rotate</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('color')}
                                    className={`py-3 px-1 border-b-2 transition-all flex flex-col items-center gap-1 ${activeTab === 'color' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    <span>🎨</span>
                                    <span>Tone</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('filters')}
                                    className={`py-3 px-1 border-b-2 transition-all flex flex-col items-center gap-1 ${activeTab === 'filters' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    <span>✨</span>
                                    <span>Filters</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('frames')}
                                    className={`py-3 px-1 border-b-2 transition-all flex flex-col items-center gap-1 ${activeTab === 'frames' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                                >
                                    <span>🖼️</span>
                                    <span>Frame</span>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-5 text-xs text-[var(--theme-text)] max-h-[38vh] md:max-h-[55vh]">
                                {activeTab === 'crop' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-2 text-gray-300">📐 Aspect Ratio & Frame Size</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['free', '1:1', '16:9', '4:3', '9:16', '3:1'] as const).map((ratio) => (
                                                    <button
                                                        key={ratio}
                                                        type="button"
                                                        onClick={() => setAspectRatio(ratio)}
                                                        className={`py-2 px-2 rounded-lg font-bold border text-center transition-all ${
                                                            aspectRatio === ratio
                                                                ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                                                                : 'bg-[var(--theme-bg)] border-gray-700 text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {ratio === 'free' ? '🆓 Free' :
                                                         ratio === '1:1' ? '🟩 Square (1:1)' :
                                                         ratio === '16:9' ? '🖥️ Cover (16:9)' :
                                                         ratio === '4:3' ? '🖼️ Standard (4:3)' :
                                                         ratio === '9:16' ? '📱 Story (9:16)' : '🏁 Banner (3:1)'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2 border-t border-gray-700/50">
                                            <div>
                                                <div className="flex justify-between font-semibold mb-1">
                                                    <span>🔍 Zoom / Scale</span>
                                                    <span>{zoom.toFixed(2)}x</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="3"
                                                    step="0.05"
                                                    value={zoom}
                                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                                    className="w-full accent-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between font-semibold mb-1">
                                                    <span>↔️ Horizontal Pan (X)</span>
                                                    <span>{panX}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-300"
                                                    max="300"
                                                    step="5"
                                                    value={panX}
                                                    onChange={(e) => setPanX(parseInt(e.target.value))}
                                                    className="w-full accent-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between font-semibold mb-1">
                                                    <span>↕️ Vertical Pan (Y)</span>
                                                    <span>{panY}px</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-300"
                                                    max="300"
                                                    step="5"
                                                    value={panY}
                                                    onChange={(e) => setPanY(parseInt(e.target.value))}
                                                    className="w-full accent-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'rotate' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold mb-2 text-gray-300">🔄 Quick Turn & Flip</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRotateDeg((d) => (d - 90 + 360) % 360)}
                                                    className="py-2.5 px-3 rounded-lg bg-[var(--theme-bg)] border border-gray-700 hover:border-indigo-500 font-semibold flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <span>↪️ 90° Left</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRotateDeg((d) => (d + 90) % 360)}
                                                    className="py-2.5 px-3 rounded-lg bg-[var(--theme-bg)] border border-gray-700 hover:border-indigo-500 font-semibold flex items-center justify-center gap-2 transition-all"
                                                >
                                                    <span>↩️ 90° Right</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFlipH(!flipH)}
                                                    className={`py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-center gap-2 transition-all ${
                                                        flipH ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-[var(--theme-bg)] border-gray-700 text-gray-300'
                                                    }`}
                                                >
                                                    <span>↔️ Mirror Flip H</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFlipV(!flipV)}
                                                    className={`py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-center gap-2 transition-all ${
                                                        flipV ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-[var(--theme-bg)] border-gray-700 text-gray-300'
                                                    }`}
                                                >
                                                    <span>↕️ Mirror Flip V</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-gray-700/50">
                                            <div className="flex justify-between font-semibold">
                                                <span>🧭 Fine Horizon Angle</span>
                                                <span>{fineAngle}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-45"
                                                max="45"
                                                step="1"
                                                value={fineAngle}
                                                onChange={(e) => setFineAngle(parseInt(e.target.value))}
                                                className="w-full accent-indigo-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-500">
                                                <span>-45° Tilt Left</span>
                                                <span>0° Normal</span>
                                                <span>+45° Tilt Right</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'color' && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>☀️ Brightness</span>
                                                <span>{brightness}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="20"
                                                max="200"
                                                value={brightness}
                                                onChange={(e) => setBrightness(parseInt(e.target.value))}
                                                className="w-full accent-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>🌓 Contrast</span>
                                                <span>{contrast}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="20"
                                                max="200"
                                                value={contrast}
                                                onChange={(e) => setContrast(parseInt(e.target.value))}
                                                className="w-full accent-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>🎨 Saturation (Vibrance)</span>
                                                <span>{saturation}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="250"
                                                value={saturation}
                                                onChange={(e) => setSaturation(parseInt(e.target.value))}
                                                className="w-full accent-pink-500"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>🌡️ Warmth / Temperature Tint</span>
                                                <span>{warmth > 0 ? `+${warmth} Warm` : warmth < 0 ? `${warmth} Cool` : '0 Normal'}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-50"
                                                max="50"
                                                value={warmth}
                                                onChange={(e) => setWarmth(parseInt(e.target.value))}
                                                className="w-full accent-orange-500"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>🌫️ Soft Blur / Glow</span>
                                                <span>{blur}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="12"
                                                value={blur}
                                                onChange={(e) => setBlur(parseInt(e.target.value))}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'filters' && (
                                    <div className="space-y-3">
                                        <label className="block font-bold text-gray-300">✨ One-Tap Aesthetic Filters</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'none', label: '🌟 Normal', desc: 'No Filter' },
                                                { id: 'vintage', label: '🎞️ Vintage', desc: 'Warm 80s' },
                                                { id: 'cyberpunk', label: '🏙️ Cyberpunk', desc: 'Neon Wash' },
                                                { id: 'grayscale', label: '⬛ Grayscale', desc: 'B&W Classic' },
                                                { id: 'sepia', label: '📜 Sepia', desc: 'Antique Gold' },
                                                { id: 'cool', label: '❄️ Cool Breeze', desc: 'Crisp Blue' },
                                                { id: 'warm', label: '☀️ Golden Sun', desc: 'Summer Glow' },
                                                { id: 'polaroid', label: '📸 Polaroid', desc: 'Retro Frame' },
                                                { id: 'drama', label: '🎭 Drama', desc: 'High Contrast' },
                                            ].map((filter) => (
                                                <button
                                                    key={filter.id}
                                                    type="button"
                                                    onClick={() => applyFilterPreset(filter.id as any)}
                                                    className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                                                        filterPreset === filter.id
                                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                                            : 'bg-[var(--theme-bg)] border-gray-700 text-gray-300 hover:border-gray-500'
                                                    }`}
                                                >
                                                    <span className="font-bold text-xs">{filter.label}</span>
                                                    <span className={`text-[10px] mt-0.5 ${filterPreset === filter.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                                                        {filter.desc}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'frames' && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between font-semibold mb-1">
                                                <span>⭕ Corner Radius (Square to Circle)</span>
                                                <span>{borderRadius}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="50"
                                                value={borderRadius}
                                                onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                                                className="w-full accent-indigo-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                                <span>0% Sharp Square</span>
                                                <span>20% Rounded Card</span>
                                                <span>50% Circle/Pill</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-700/50">
                                            <label className="block font-bold mb-2 text-gray-300">🖼️ Border Style</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'none', label: '🚫 No Border' },
                                                    { id: 'solid', label: '🔲 Solid Frame' },
                                                    { id: 'polaroid', label: '📸 Polaroid Photo' },
                                                    { id: 'cyber', label: '⚡ Cyber Neon' },
                                                    { id: 'gold', label: '👑 Golden Luxury' },
                                                ].map((style) => (
                                                    <button
                                                        key={style.id}
                                                        type="button"
                                                        onClick={() => setBorderStyle(style.id as any)}
                                                        className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                                                            borderStyle === style.id
                                                                ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                                                                : 'bg-[var(--theme-bg)] border-gray-700 text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        {style.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {borderStyle !== 'none' && (
                                            <div className="space-y-3 pt-2">
                                                <div>
                                                    <div className="flex justify-between font-semibold mb-1">
                                                        <span>📏 Border Thickness</span>
                                                        <span>{borderWidth}px</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="2"
                                                        max="40"
                                                        value={borderWidth}
                                                        onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                                        className="w-full accent-indigo-500"
                                                    />
                                                </div>

                                                {borderStyle === 'solid' && (
                                                    <div>
                                                        <label className="block font-semibold mb-1">🎨 Border Color</label>
                                                        <div className="flex items-center gap-2">
                                                            {[
                                                                '#ffffff', '#000000', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'
                                                            ].map((col) => (
                                                                <button
                                                                    key={col}
                                                                    type="button"
                                                                    onClick={() => setBorderColor(col)}
                                                                    style={{ backgroundColor: col }}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${borderColor === col ? 'scale-125 border-white shadow-md' : 'border-gray-600 hover:scale-110'}`}
                                                                />
                                                            ))}
                                                            <input
                                                                type="color"
                                                                value={borderColor}
                                                                onChange={(e) => setBorderColor(e.target.value)}
                                                                className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                                                                title="Custom color picker"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Action Buttons */}
                            <div className="p-4 bg-[var(--theme-bg)] border-t border-gray-700/60 space-y-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSaveAndUpload}
                                    disabled={!imageSrc || isUploading}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <LoadingSpinner size="sm" />
                                            <span>Auto-Uploading to ImgBB...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-base">✨</span>
                                            <span>Apply Edits & Auto-Upload URL</span>
                                        </>
                                    )}
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadLocal}
                                        disabled={!imageSrc}
                                        className="py-2 px-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                    >
                                        <span>💾</span>
                                        <span>Download PNG</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="py-2 px-3 rounded-xl bg-[var(--theme-card-bg)] border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold text-xs transition-colors"
                                    >
                                        Close Studio
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageEditorModal;
