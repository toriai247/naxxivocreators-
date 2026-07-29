import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    ArrowLeft,
    Eye,
    Undo2,
    Redo2,
    RotateCcw,
    Download,
    Share2,
    Upload,
    Link as LinkIcon,
    Sparkles,
    Sun,
    TrendingUp,
    Palette,
    Layers,
    Sliders,
    Maximize2,
    Crop,
    Check,
    FlipHorizontal,
    FlipVertical,
    RefreshCw,
    SlidersHorizontal,
    Image as ImageIcon
} from 'lucide-react';
import { uploadToImgBB } from '../../utils/imgbbService';
import LoadingSpinner from '../common/LoadingSpinner';

interface LightroomEditorStudioProps {
    onBack: () => void;
    initialImageUrl?: string;
    onSave?: (newUrl: string) => void;
}

// Color Channel types for HSL Mix
type HSLColorChannel = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

interface HSLChannelSettings {
    hue: number;        // -100 to +100
    saturation: number; // -100 to +100
    luminance: number;  // -100 to +100
}

interface LightroomState {
    // Light
    exposure: number;   // -100 to +100
    contrast: number;   // -100 to +100
    highlights: number; // -100 to +100
    shadows: number;    // -100 to +100
    whites: number;     // -100 to +100
    blacks: number;     // -100 to +100

    // Tone Curve Control Points (x, y from 0 to 1)
    curveShadowsY: number;   // default 0.25
    curveMidtonesY: number;  // default 0.50
    curveHighlightsY: number;// default 0.75

    // Color
    temperature: number; // -100 (cold) to +100 (warm)
    tint: number;        // -100 (green) to +100 (magenta)
    vibrance: number;    // -100 to +100
    saturation: number;  // -100 to +100

    // Color Mix HSL
    hsl: Record<HSLColorChannel, HSLChannelSettings>;

    // Color Grading (Split Toning)
    shadowsHue: number;        // 0 to 360
    shadowsSat: number;        // 0 to 100
    midtonesHue: number;       // 0 to 360
    midtonesSat: number;       // 0 to 100
    highlightsHue: number;     // 0 to 360
    highlightsSat: number;     // 0 to 100
    balance: number;           // -100 to +100

    // Effects
    texture: number;    // -100 to +100
    clarity: number;    // -100 to +100
    dehaze: number;     // -100 to +100
    vignette: number;   // -100 to +100
    grain: number;      // 0 to 100

    // Detail
    sharpening: number;      // 0 to 100
    noiseReduction: number;  // 0 to 100
    colorNoiseRed: number;   // 0 to 100

    // Geometry
    distortion: number; // -100 to +100
    vertical: number;   // -100 to +100
    horizontal: number; // -100 to +100
    rotate: number;     // -180 to +180
    scale: number;      // 50 to 200 (%)
    flipH: boolean;
    flipV: boolean;
}

const defaultHSLChannels: Record<HSLColorChannel, HSLChannelSettings> = {
    red: { hue: 0, saturation: 0, luminance: 0 },
    orange: { hue: 0, saturation: 0, luminance: 0 },
    yellow: { hue: 0, saturation: 0, luminance: 0 },
    green: { hue: 0, saturation: 0, luminance: 0 },
    cyan: { hue: 0, saturation: 0, luminance: 0 },
    blue: { hue: 0, saturation: 0, luminance: 0 },
    purple: { hue: 0, saturation: 0, luminance: 0 },
    magenta: { hue: 0, saturation: 0, luminance: 0 },
};

const defaultState: LightroomState = {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    curveShadowsY: 0.25,
    curveMidtonesY: 0.50,
    curveHighlightsY: 0.75,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    hsl: JSON.parse(JSON.stringify(defaultHSLChannels)),
    shadowsHue: 0,
    shadowsSat: 0,
    midtonesHue: 0,
    midtonesSat: 0,
    highlightsHue: 0,
    highlightsSat: 0,
    balance: 0,
    texture: 0,
    clarity: 0,
    dehaze: 0,
    vignette: 0,
    grain: 0,
    sharpening: 0,
    noiseReduction: 0,
    colorNoiseRed: 0,
    distortion: 0,
    vertical: 0,
    horizontal: 0,
    rotate: 0,
    scale: 100,
    flipH: false,
    flipV: false,
};

export function parseJsonPresetToState(jsonObj: any): Partial<LightroomState> {
    if (!jsonObj || typeof jsonObj !== 'object') return {};
    const newState: Partial<LightroomState> = {};

    if (jsonObj.light) {
        if (typeof jsonObj.light.exposure === 'number') newState.exposure = jsonObj.light.exposure;
        if (typeof jsonObj.light.contrast === 'number') newState.contrast = jsonObj.light.contrast;
        if (typeof jsonObj.light.highlights === 'number') newState.highlights = jsonObj.light.highlights;
        if (typeof jsonObj.light.shadows === 'number') newState.shadows = jsonObj.light.shadows;
        if (typeof jsonObj.light.whites === 'number') newState.whites = jsonObj.light.whites;
        if (typeof jsonObj.light.blacks === 'number') newState.blacks = jsonObj.light.blacks;
    }

    if (jsonObj.color) {
        if (typeof jsonObj.color.temperature === 'number') newState.temperature = jsonObj.color.temperature;
        if (typeof jsonObj.color.tint === 'number') newState.tint = jsonObj.color.tint;
        if (typeof jsonObj.color.vibrance === 'number') newState.vibrance = jsonObj.color.vibrance;
        if (typeof jsonObj.color.saturation === 'number') newState.saturation = jsonObj.color.saturation;
    }

    if (jsonObj.effects) {
        if (typeof jsonObj.effects.texture === 'number') newState.texture = jsonObj.effects.texture;
        if (typeof jsonObj.effects.clarity === 'number') newState.clarity = jsonObj.effects.clarity;
        if (typeof jsonObj.effects.dehaze === 'number') newState.dehaze = jsonObj.effects.dehaze;
        if (typeof jsonObj.effects.vignette === 'number') newState.vignette = jsonObj.effects.vignette;
        if (typeof jsonObj.effects.grain === 'number') newState.grain = jsonObj.effects.grain;
    }

    if (jsonObj.detail) {
        if (typeof jsonObj.detail.sharpening === 'number') newState.sharpening = jsonObj.detail.sharpening;
        if (typeof jsonObj.detail.noiseReduction === 'number') newState.noiseReduction = jsonObj.detail.noiseReduction;
        if (typeof jsonObj.detail.colorNoiseReduction === 'number') newState.colorNoiseRed = jsonObj.detail.colorNoiseReduction;
    }

    if (jsonObj.colorGrading) {
        if (jsonObj.colorGrading.shadows) {
            if (typeof jsonObj.colorGrading.shadows.hue === 'number') newState.shadowsHue = jsonObj.colorGrading.shadows.hue;
            if (typeof jsonObj.colorGrading.shadows.saturation === 'number') newState.shadowsSat = jsonObj.colorGrading.shadows.saturation;
        }
        if (jsonObj.colorGrading.highlights) {
            if (typeof jsonObj.colorGrading.highlights.hue === 'number') newState.highlightsHue = jsonObj.colorGrading.highlights.hue;
            if (typeof jsonObj.colorGrading.highlights.saturation === 'number') newState.highlightsSat = jsonObj.colorGrading.highlights.saturation;
        }
        if (typeof jsonObj.colorGrading.balance === 'number') newState.balance = jsonObj.colorGrading.balance;
    }

    if (jsonObj.hsl) {
        const hslCopy: Record<HSLColorChannel, HSLChannelSettings> = JSON.parse(JSON.stringify(defaultHSLChannels));
        const channelsMap: Record<string, HSLColorChannel> = {
            red: 'red',
            orange: 'orange',
            yellow: 'yellow',
            green: 'green',
            aqua: 'cyan',
            cyan: 'cyan',
            blue: 'blue',
            purple: 'purple',
            magenta: 'magenta',
        };

        Object.keys(jsonObj.hsl).forEach(key => {
            const mappedKey = channelsMap[key.toLowerCase()];
            if (mappedKey && jsonObj.hsl[key]) {
                const chData = jsonObj.hsl[key];
                hslCopy[mappedKey] = {
                    hue: typeof chData.hue === 'number' ? chData.hue : 0,
                    saturation: typeof chData.saturation === 'number' ? chData.saturation : 0,
                    luminance: typeof chData.luminance === 'number' ? chData.luminance : 0,
                };
            }
        });

        newState.hsl = hslCopy;
    }

    return newState;
}

function applyHSLAdjustments(
    r: number, g: number, b: number,
    hsl: Record<HSLColorChannel, HSLChannelSettings>
): { r: number; g: number; b: number } {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const d = max - min;

    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
            case gNorm: h = (bNorm - rNorm) / d + 2; break;
            case bNorm: h = (rNorm - gNorm) / d + 4; break;
        }
        h /= 6;
    }

    const hueDeg = h * 360;

    let ch: HSLChannelSettings | null = null;
    if (hueDeg >= 345 || hueDeg < 15) ch = hsl.red;
    else if (hueDeg >= 15 && hueDeg < 45) ch = hsl.orange;
    else if (hueDeg >= 45 && hueDeg < 75) ch = hsl.yellow;
    else if (hueDeg >= 75 && hueDeg < 150) ch = hsl.green;
    else if (hueDeg >= 150 && hueDeg < 210) ch = hsl.cyan;
    else if (hueDeg >= 210 && hueDeg < 255) ch = hsl.blue;
    else if (hueDeg >= 255 && hueDeg < 285) ch = hsl.purple;
    else if (hueDeg >= 285 && hueDeg < 345) ch = hsl.magenta;

    if (!ch || (ch.hue === 0 && ch.saturation === 0 && ch.luminance === 0)) {
        return { r, g, b };
    }

    let newH = (hueDeg + ch.hue * 0.5) % 360;
    if (newH < 0) newH += 360;
    let newS = Math.min(1, Math.max(0, s + (ch.saturation / 100) * (s > 0 ? s : 0.5)));
    let newL = Math.min(1, Math.max(0, l + (ch.luminance / 100) * 0.25));

    const hNorm = newH / 360;
    let newR: number, newG: number, newB: number;

    if (newS === 0) {
        newR = newG = newB = newL;
    } else {
        const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
        const pVal = 2 * newL - q;

        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        newR = hue2rgb(pVal, q, hNorm + 1 / 3);
        newG = hue2rgb(pVal, q, hNorm);
        newB = hue2rgb(pVal, q, hNorm - 1 / 3);
    }

    return {
        r: Math.min(255, Math.max(0, newR * 255)),
        g: Math.min(255, Math.max(0, newG * 255)),
        b: Math.min(255, Math.max(0, newB * 255)),
    };
}

// Preset Profiles
const LIGHTROOM_PRESETS: { id: string; name: string; icon: string; state: Partial<LightroomState> }[] = [
    {
        id: 'reset',
        name: 'Original',
        icon: '🔄',
        state: defaultState,
    },
    {
        id: 'imported_preset',
        name: 'Imported Preset',
        icon: '✨',
        state: {
            exposure: 0,
            contrast: -12,
            highlights: -69,
            shadows: 60,
            whites: -61,
            blacks: -60,
            temperature: 0,
            tint: 0,
            vibrance: 50,
            saturation: 0,
            texture: 5,
            clarity: -8,
            dehaze: 0,
            vignette: -7,
            grain: 0,
            sharpening: 15,
            noiseReduction: 0,
            colorNoiseRed: 0,
            shadowsHue: 222,
            shadowsSat: 10,
            highlightsHue: 204,
            highlightsSat: 27,
            balance: 0,
            hsl: {
                red: { hue: -21, saturation: -30, luminance: -15 },
                orange: { hue: 14, saturation: -35, luminance: 5 },
                yellow: { hue: -16, saturation: -14, luminance: -20 },
                green: { hue: -2, saturation: -22, luminance: -52 },
                cyan: { hue: 38, saturation: -68, luminance: 25 },
                blue: { hue: 14, saturation: -96, luminance: -13 },
                purple: { hue: -91, saturation: 0, luminance: 0 },
                magenta: { hue: 0, saturation: 0, luminance: 0 },
            }
        }
    },
    {
        id: 'cinematic',
        name: 'Cinematic Teal & Orange',
        icon: '🎬',
        state: {
            exposure: 10,
            contrast: 25,
            highlights: -15,
            shadows: 20,
            temperature: 15,
            tint: -10,
            vibrance: 20,
            shadowsHue: 195,
            shadowsSat: 35,
            highlightsHue: 35,
            highlightsSat: 30,
            dehaze: 15,
            vignette: -20,
        }
    },
    {
        id: 'moody_dark',
        name: 'Moody Dark',
        icon: '🖤',
        state: {
            exposure: -15,
            contrast: 35,
            highlights: -40,
            shadows: -15,
            whites: -20,
            blacks: 15,
            temperature: -10,
            vibrance: -15,
            clarity: 25,
            vignette: -40,
        }
    },
    {
        id: 'golden_hour',
        name: 'Golden Hour Sunset',
        icon: '🌅',
        state: {
            exposure: 15,
            contrast: 15,
            highlights: 10,
            shadows: 15,
            temperature: 45,
            tint: 15,
            vibrance: 30,
            saturation: 10,
            highlightsHue: 40,
            highlightsSat: 25,
            vignette: -15,
        }
    },
    {
        id: 'clean_portrait',
        name: 'Clean Portrait',
        icon: '📸',
        state: {
            exposure: 12,
            contrast: -5,
            highlights: -10,
            shadows: 25,
            whites: 10,
            temperature: 5,
            vibrance: 15,
            texture: -10, // smooth skin
            sharpening: 20,
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk Neon',
        icon: '⚡',
        state: {
            exposure: 5,
            contrast: 40,
            highlights: 20,
            shadows: -20,
            temperature: -30,
            tint: 40,
            vibrance: 50,
            saturation: 25,
            shadowsHue: 280,
            shadowsSat: 45,
            highlightsHue: 180,
            highlightsSat: 40,
            clarity: 30,
        }
    },
    {
        id: 'vintage_film',
        name: 'Vintage Film 80s',
        icon: '🎞️',
        state: {
            exposure: 5,
            contrast: -15,
            highlights: -30,
            shadows: 30,
            whites: -25,
            blacks: 35, // faded blacks
            temperature: 20,
            tint: -5,
            saturation: -10,
            grain: 35,
            vignette: -25,
        }
    },
    {
        id: 'bw_drama',
        name: 'B&W High Contrast Drama',
        icon: '♟️',
        state: {
            exposure: 5,
            contrast: 60,
            highlights: 25,
            shadows: -35,
            whites: 30,
            blacks: -20,
            saturation: -100,
            vibrance: -100,
            clarity: 35,
            grain: 20,
        }
    },
    {
        id: 'pastel_warm',
        name: 'Soft Pastel Dream',
        icon: '🌸',
        state: {
            exposure: 20,
            contrast: -25,
            highlights: -20,
            shadows: 35,
            whites: -10,
            blacks: 20,
            temperature: 15,
            tint: 20,
            vibrance: -10,
            texture: -15,
        }
    }
];

type MainTab = 'presets' | 'light' | 'curve' | 'color' | 'hsl' | 'grading' | 'effects' | 'detail' | 'geometry';

export const LightroomEditorStudio: React.FC<LightroomEditorStudioProps> = ({
    onBack,
    initialImageUrl = '',
    onSave,
}) => {
    // Current Image Source
    const [imageSrc, setImageSrc] = useState<string>(
        initialImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
    );
    const [inputUrl, setInputUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Lightroom Editing Parameters
    const [params, setParams] = useState<LightroomState>(defaultState);
    const [activeTab, setActiveTab] = useState<MainTab>('presets');
    const [selectedHSLChannel, setSelectedHSLChannel] = useState<HSLColorChannel>('red');
    const [showBefore, setShowBefore] = useState<boolean>(false);

    // Custom JSON Import Modal & Saved Presets
    const [showImportModal, setShowImportModal] = useState<boolean>(false);
    const [jsonInput, setJsonInput] = useState<string>('');
    const [customPresets, setCustomPresets] = useState<{ id: string; name: string; icon: string; state: Partial<LightroomState> }[]>(() => {
        try {
            const saved = localStorage.getItem('naxstudio_custom_presets');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const handleImportJson = (jsonStr?: string) => {
        const textToParse = jsonStr || jsonInput;
        if (!textToParse.trim()) {
            showStatus('error', 'Please paste JSON preset text first.');
            return;
        }
        try {
            const parsed = JSON.parse(textToParse);
            const parsedState = parseJsonPresetToState(parsed);
            const presetName = parsed.presetName || 'Custom Imported Preset';
            const newPresetObj = {
                id: 'custom_' + Date.now(),
                name: presetName,
                icon: '⚡',
                state: parsedState,
            };

            applyPreset(parsedState);

            const updated = [newPresetObj, ...customPresets];
            setCustomPresets(updated);
            try {
                localStorage.setItem('naxstudio_custom_presets', JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }

            setShowImportModal(false);
            setJsonInput('');
            showStatus('success', `Preset "${presetName}" imported and applied!`);
        } catch (e) {
            showStatus('error', 'Invalid JSON syntax. Please check your JSON format.');
        }
    };

    // History Stack for Undo/Redo
    const [history, setHistory] = useState<LightroomState[]>([defaultState]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);

    // Canvas & Image Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update state & save history step
    const updateParams = useCallback((updater: (prev: LightroomState) => LightroomState) => {
        setParams(prev => {
            const next = updater(prev);
            setHistory(hPrev => {
                const newHistory = hPrev.slice(0, historyIndex + 1);
                newHistory.push(next);
                if (newHistory.length > 25) newHistory.shift(); // limit history size
                return newHistory;
            });
            setHistoryIndex(hPrev => Math.min(hPrev + 1, 24));
            return next;
        });
    }, [historyIndex]);

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setParams(history[prevIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setParams(history[nextIndex]);
        }
    };

    const handleResetAll = () => {
        setParams(defaultState);
        setHistory([defaultState]);
        setHistoryIndex(0);
        showStatus('success', 'All Lightroom adjustments reset to default.');
    };

    const showStatus = (type: 'success' | 'error', text: string) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 3500);
    };

    // Load initial image into HTMLImageElement
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imgRef.current = img;
            renderCanvas();
        };
        img.onerror = () => {
            showStatus('error', 'Failed to load image. Try uploading another file or link.');
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Apply Preset
    const applyPreset = (presetState: Partial<LightroomState>) => {
        updateParams(prev => ({
            ...defaultState,
            ...presetState,
            hsl: presetState.hsl ? JSON.parse(JSON.stringify(presetState.hsl)) : JSON.parse(JSON.stringify(defaultHSLChannels)),
        }));
        showStatus('success', 'Preset applied successfully!');
    };

    // RAF Ref for 60fps Throttle Canvas Rendering Engine
    const rafRef = useRef<number | null>(null);

    // Synchronous Pixel Processing Engine
    const executeCanvasRender = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img || !img.complete) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Active parameter set (if holding Before button, use default empty params)
        const p = showBefore ? defaultState : params;

        // Set dimensions (Max 1200 for high quality yet fast pixel processing)
        const maxDim = 1000;
        let w = img.naturalWidth || 800;
        let h = img.naturalHeight || 600;
        if (w > maxDim || h > maxDim) {
            if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
            } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
            }
        }

        canvas.width = w;
        canvas.height = h;

        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Geometry transforms (Center, Rotate, Scale, Flip)
        ctx.translate(w / 2, h / 2);
        if (p.rotate !== 0) ctx.rotate((p.rotate * Math.PI) / 180);
        if (p.flipH || p.flipV) ctx.scale(p.flipH ? -1 : 1, p.flipV ? -1 : 1);
        if (p.scale !== 100) {
            const s = p.scale / 100;
            ctx.scale(s, s);
        }

        // Draw original image centered
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();

        // Check if any color/tone modifications are applied
        const hasToneCurve = (p.curveShadowsY !== 0.25 || p.curveMidtonesY !== 0.50 || p.curveHighlightsY !== 0.75);
        const hasColorGrading = (p.shadowsSat > 0 || p.highlightsSat > 0);
        const hasHSL = p.hsl && Object.values(p.hsl).some((ch: any) => ch && (ch.hue !== 0 || ch.saturation !== 0 || ch.luminance !== 0));
        const hasBasicTones = (p.exposure !== 0 || p.contrast !== 0 || p.highlights !== 0 || p.shadows !== 0 || p.whites !== 0 || p.blacks !== 0 || p.temperature !== 0 || p.tint !== 0 || p.vibrance !== 0 || p.saturation !== 0 || p.dehaze !== 0 || p.grain > 0 || hasHSL);

        // If no edits are present, skip heavy pixel array manipulation!
        if (!hasBasicTones && !hasToneCurve && !hasColorGrading && p.vignette === 0) {
            return;
        }

        // Get pixel data for Lightroom color pipeline processing
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Precompute Lightroom adjust factors for high speed
        const expMult = Math.pow(2, p.exposure / 50); // exposure EV mapping
        const contrastFactor = (259 * (p.contrast + 255)) / (255 * (259 - p.contrast));
        const tempOffset = p.temperature * 1.2; // warm (yellow) / cold (blue)
        const tintOffset = p.tint * 1.2;       // magenta / green
        const vibranceAmount = p.vibrance / 100;
        const globalSatAmount = p.saturation / 100;

        // Split toning / Color grading pre-calculations
        const shRad = (p.shadowsHue * Math.PI) / 180;
        const shSat = p.shadowsSat / 100;
        const hlRad = (p.highlightsHue * Math.PI) / 180;
        const hlSat = p.highlightsSat / 100;
        const shCos = Math.cos(shRad) * 50;
        const shSin = Math.sin(shRad) * 50;
        const hlCos = Math.cos(hlRad) * 50;
        const hlSin = Math.sin(hlRad) * 50;

        // Grain noise optimization
        const hasGrain = p.grain > 0;
        const grainAmount = (p.grain / 100) * 35;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // 1. Exposure & Whites / Blacks / Highlights / Shadows
            if (p.exposure !== 0) {
                r *= expMult;
                g *= expMult;
                b *= expMult;
            }

            // Highlights & Shadows adjustment
            if (p.highlights !== 0 || p.whites !== 0 || p.shadows !== 0 || p.blacks !== 0) {
                const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                if (luma > 128) {
                    const hlFactor = (luma - 128) / 127;
                    const adj = (p.highlights / 100) * hlFactor * 40 + (p.whites / 100) * hlFactor * 30;
                    r += adj; g += adj; b += adj;
                } else {
                    const shFactor = (128 - luma) / 128;
                    const adj = (p.shadows / 100) * shFactor * 40 + (p.blacks / 100) * shFactor * 30;
                    r += adj; g += adj; b += adj;
                }
            }

            // 2. Contrast
            if (p.contrast !== 0) {
                r = contrastFactor * (r - 128) + 128;
                g = contrastFactor * (g - 128) + 128;
                b = contrastFactor * (b - 128) + 128;
            }

            // 3. Tone Curve interpolation
            if (hasToneCurve) {
                const luma = (r + g + b) / 3;
                let normLuma = Math.min(255, Math.max(0, luma)) / 255;
                let curveFactor = 1;
                if (normLuma < 0.33) {
                    curveFactor = (p.curveShadowsY / 0.25);
                } else if (normLuma < 0.66) {
                    curveFactor = (p.curveMidtonesY / 0.50);
                } else {
                    curveFactor = (p.curveHighlightsY / 0.75);
                }
                r *= curveFactor;
                g *= curveFactor;
                b *= curveFactor;
            }

            // 4. White Balance (Temperature & Tint)
            if (tempOffset !== 0) {
                r += tempOffset * 0.8;
                b -= tempOffset * 0.8;
            }
            if (tintOffset !== 0) {
                g -= tintOffset * 0.6;
                r += tintOffset * 0.3;
                b += tintOffset * 0.3;
            }

            // 5. Saturation & Vibrance
            if (p.vibrance !== 0 || p.saturation !== 0) {
                const maxRGB = Math.max(r, Math.max(g, b));
                const avgRGB = (r + g + b) / 3;
                if (p.vibrance !== 0) {
                    const satCurrent = maxRGB === 0 ? 0 : (maxRGB - avgRGB) / maxRGB;
                    const vFactor = (1 - satCurrent) * vibranceAmount * 1.5;
                    r += (r - avgRGB) * vFactor;
                    g += (g - avgRGB) * vFactor;
                    b += (b - avgRGB) * vFactor;
                }
                if (p.saturation !== 0) {
                    r = avgRGB + (r - avgRGB) * (1 + globalSatAmount);
                    g = avgRGB + (g - avgRGB) * (1 + globalSatAmount);
                    b = avgRGB + (b - avgRGB) * (1 + globalSatAmount);
                }
            }

            // 5.5 HSL Color Mix Channel Adjustments
            if (hasHSL) {
                const adjusted = applyHSLAdjustments(r, g, b, p.hsl);
                r = adjusted.r;
                g = adjusted.g;
                b = adjusted.b;
            }

            // 6. Split Toning / Color Grading
            if (hasColorGrading) {
                const normL = Math.min(255, Math.max(0, (r + g + b) / 3)) / 255;
                if (normL < 0.5 && shSat > 0) {
                    const weight = (0.5 - normL) * 2 * shSat;
                    r += shCos * weight;
                    g += shSin * weight;
                    b += (50 - shCos) * weight;
                } else if (normL >= 0.5 && hlSat > 0) {
                    const weight = (normL - 0.5) * 2 * hlSat;
                    r += hlCos * weight;
                    g += hlSin * weight;
                    b += (50 - hlCos) * weight;
                }
            }

            // 7. Effects: Dehaze
            if (p.dehaze !== 0) {
                const dh = p.dehaze * 0.4;
                r += dh; g += dh; b += dh;
            }

            // 8. Grain Noise
            if (hasGrain) {
                const noise = (Math.random() - 0.5) * grainAmount;
                r += noise;
                g += noise;
                b += noise;
            }

            // Clamp 0-255
            data[i]     = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
        }

        ctx.putImageData(imgData, 0, 0);

        // 9. Post Overlay Effects: Vignette
        if (p.vignette !== 0) {
            ctx.save();
            const radius = Math.max(w, h) * 0.7;
            const grad = ctx.createRadialGradient(w / 2, h / 2, radius * 0.3, w / 2, h / 2, radius);
            if (p.vignette < 0) {
                const alpha = Math.abs(p.vignette) / 100;
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
            } else {
                const alpha = (p.vignette / 100) * 0.8;
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }, [params, showBefore]);

    // Throttled Canvas Render Call via RequestAnimationFrame
    const renderCanvas = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
            executeCanvasRender();
        });
    }, [executeCanvasRender]);

    // Cleanup RAF
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Trigger render on state change
    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Handle File Upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                if (evt.target?.result) {
                    setImageSrc(evt.target.result as string);
                    showStatus('success', 'Image uploaded into Lightroom workspace!');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Direct Image URL Load
    const handleLoadUrl = () => {
        if (!inputUrl.trim()) return;
        setImageSrc(inputUrl.trim());
        setInputUrl('');
        showStatus('success', 'Loaded image from link!');
    };

    // Export & Download
    const handleDownload = (format: 'image/jpeg' | 'image/png' = 'image/jpeg') => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `Lightroom_Edit_${Date.now()}.${format === 'image/jpeg' ? 'jpg' : 'png'}`;
        link.href = canvas.toDataURL(format, 0.95);
        link.click();
        showStatus('success', 'Edited photo saved to downloads!');
    };

    // Export & Upload to ImgBB
    const handleUploadImgBB = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsUploading(true);
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            // Convert data URL to Blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `lightroom_${Date.now()}.jpg`, { type: 'image/jpeg' });

            const uploadRes = await uploadToImgBB(file);
            if (uploadRes && uploadRes.url) {
                if (onSave) onSave(uploadRes.url);
                navigator.clipboard.writeText(uploadRes.url);
                showStatus('success', 'Uploaded to ImgBB! Direct URL copied to clipboard!');
            } else {
                showStatus('error', 'ImgBB upload failed. Check API key or connection.');
            }
        } catch (err) {
            console.error(err);
            showStatus('error', 'Error exporting image. Try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-100 text-slate-900 flex flex-col overflow-hidden select-none font-sans h-[100dvh] w-screen">
            {/* Top Binance Style Light Header */}
            <header className="h-14 sm:h-16 px-3 sm:px-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between gap-2 z-30 shrink-0 w-full overflow-hidden shadow-sm">
                <div className="flex items-center gap-2.5 shrink-0">
                    <button
                        onClick={onBack}
                        className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 flex items-center justify-center transition-none font-mono"
                        title="Back to Apps"
                    >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-400 text-slate-950 border border-slate-900 font-black text-xs flex items-center justify-center shrink-0 tracking-tighter shadow-xs">
                            NX
                        </div>
                        <div className="hidden min-[360px]:block">
                            <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase font-mono flex items-center gap-1.5">
                                <span>NAXSTUDIO</span>
                            </h1>
                            <p className="text-[9px] text-yellow-700 font-mono font-bold hidden sm:block">
                                IMAGE EDITOR SUITE
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Action Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 font-mono">
                    {/* Before / After Hold Toggle */}
                    <button
                        onMouseDown={() => setShowBefore(true)}
                        onMouseUp={() => setShowBefore(false)}
                        onTouchStart={() => setShowBefore(true)}
                        onTouchEnd={() => setShowBefore(false)}
                        className={`px-2.5 py-1.5 text-[11px] font-extrabold border shrink-0 flex items-center gap-1.5 transition-none ${
                            showBefore
                                ? 'bg-yellow-400 text-slate-950 border-slate-900 shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                        title="Hold to view Original Photo"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showBefore ? 'ORIGINAL' : 'BEFORE'}</span>
                    </button>

                    {/* Undo / Redo */}
                    <div className="flex items-center bg-slate-100 border border-slate-300 shrink-0">
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            className="p-1.5 text-[11px] font-black disabled:opacity-30 hover:bg-slate-200 text-slate-800 transition-none flex items-center justify-center"
                            title="Undo"
                        >
                            <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-3 bg-slate-300" />
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-1.5 text-[11px] font-black disabled:opacity-30 hover:bg-slate-200 text-slate-800 transition-none flex items-center justify-center"
                            title="Redo"
                        >
                            <Redo2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Reset All */}
                    <button
                        onClick={handleResetAll}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 shrink-0 flex items-center gap-1 transition-none"
                        title="Reset All Adjustments"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">RESET</span>
                    </button>

                    {/* Export JPG */}
                    <button
                        onClick={() => handleDownload('image/jpeg')}
                        className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] sm:text-xs border border-slate-900 transition-none flex items-center gap-1 shrink-0 shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>SAVE<span className="hidden sm:inline"> JPG</span></span>
                    </button>

                    {/* Share ImgBB */}
                    <button
                        onClick={handleUploadImgBB}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[11px] sm:text-xs border border-slate-900 transition-none flex items-center gap-1 disabled:opacity-50 shrink-0 shadow-sm"
                    >
                        {isUploading ? <LoadingSpinner size="small" /> : <><Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">SHARE</span></>}
                    </button>
                </div>
            </header>

            {/* Status Banner */}
            {statusMsg && (
                <div
                    className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border font-mono text-xs font-bold text-center max-w-sm w-[90%] shadow-md ${
                        statusMsg.type === 'success'
                            ? 'bg-yellow-100 border-yellow-400 text-slate-900'
                            : 'bg-rose-100 border-rose-400 text-rose-900'
                    }`}
                >
                    {statusMsg.text}
                </div>
            )}

            {/* Main Workspace Body */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
                {/* Top / Left Locked Canvas Viewport */}
                <div className="w-full lg:flex-1 bg-slate-200 flex flex-col items-center justify-center p-2 sm:p-4 shrink-0 h-[40vh] sm:h-[46vh] lg:h-full relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-300">
                    {/* Checkerboard Background Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-70 pointer-events-none" />

                    {/* Canvas Display Box Frame */}
                    <div className="relative w-full h-full max-w-full max-h-full flex items-center justify-center bg-white border border-slate-300 shadow-sm p-2 overflow-hidden">
                        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                    </div>

                    {/* Floating Upload Bar */}
                    <div className="mt-2 flex items-center gap-2 w-full max-w-xl bg-white p-2 border border-slate-300 shadow-sm z-10 shrink-0 font-mono">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shrink-0 border border-slate-900 flex items-center gap-1 transition-none"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            <span>UPLOAD</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Direct photo URL..."
                            className="flex-1 min-w-0 bg-slate-50 border border-slate-300 focus:border-yellow-500 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                        />

                        <button
                            onClick={handleLoadUrl}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs shrink-0 border border-slate-300 flex items-center gap-1 transition-none"
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>LOAD</span>
                        </button>
                    </div>
                </div>

                {/* Bottom / Right Control Drawer */}
                <div className="flex-1 lg:w-96 bg-white border-slate-200 flex flex-col min-h-0 overflow-hidden">
                    {/* Category Tabs Bar */}
                    <div className="flex items-center gap-1.5 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0 font-mono">
                        {[
                            { id: 'presets', label: 'Presets', Icon: Sparkles },
                            { id: 'light', label: 'Light', Icon: Sun },
                            { id: 'curve', label: 'Curve', Icon: TrendingUp },
                            { id: 'color', label: 'Color', Icon: Palette },
                            { id: 'hsl', label: 'HSL Mix', Icon: Layers },
                            { id: 'grading', label: 'Grading', Icon: SlidersHorizontal },
                            { id: 'effects', label: 'Effects', Icon: Sliders },
                            { id: 'detail', label: 'Detail', Icon: Maximize2 },
                            { id: 'geometry', label: 'Crop & Tilt', Icon: Crop },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id as MainTab)}
                                className={`px-3 py-1.5 text-xs font-black whitespace-nowrap border flex items-center gap-1.5 transition-none ${
                                    activeTab === id
                                        ? 'bg-yellow-400 text-slate-950 border-slate-900 shadow-sm'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{label.toUpperCase()}</span>
                            </button>
                        ))}
                    </div>

                    {/* Active Controls Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-6 custom-scrollbar bg-white">
                        {/* TAB 1: PRESETS */}
                        {activeTab === 'presets' && (
                            <div className="space-y-4 font-sans">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                        <span>COLOR PROFILES & PRESETS</span>
                                    </h3>
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-mono font-black text-[10px] uppercase border border-slate-900 shadow-xs flex items-center gap-1"
                                    >
                                        <span>📋 PASTE JSON PRESET</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {[...LIGHTROOM_PRESETS, ...customPresets].map(preset => (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset.state)}
                                            className="p-3 bg-slate-50 hover:bg-yellow-50 border border-slate-200 hover:border-slate-900 text-left transition-none flex flex-col justify-between"
                                        >
                                            <div className="text-2xl mb-1.5">{preset.icon}</div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900">
                                                    {preset.name}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    Apply Preset
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 2: LIGHT */}
                        {activeTab === 'light' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>LIGHT & EXPOSURE CONTROLS</span>
                                </h3>

                                <SliderControl
                                    label="Exposure"
                                    value={params.exposure}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, exposure: v }))}
                                />

                                <SliderControl
                                    label="Contrast"
                                    value={params.contrast}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, contrast: v }))}
                                />

                                <SliderControl
                                    label="Highlights"
                                    value={params.highlights}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, highlights: v }))}
                                />

                                <SliderControl
                                    label="Shadows"
                                    value={params.shadows}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, shadows: v }))}
                                />

                                <SliderControl
                                    label="Whites"
                                    value={params.whites}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, whites: v }))}
                                />

                                <SliderControl
                                    label="Blacks"
                                    value={params.blacks}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, blacks: v }))}
                                />
                            </div>
                        )}

                        {/* TAB 3: TONE CURVE */}
                        {activeTab === 'curve' && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                        <span>PARAMETRIC TONE CURVE</span>
                                    </h3>
                                    <button
                                        onClick={() => updateParams(p => ({ ...p, curveShadowsY: 0.25, curveMidtonesY: 0.50, curveHighlightsY: 0.75 }))}
                                        className="text-[10px] text-slate-600 hover:text-slate-900 font-mono font-bold uppercase"
                                    >
                                        [RESET CURVE]
                                    </button>
                                </div>

                                {/* SVG Tone Curve Box */}
                                <div className="bg-slate-50 p-4 border border-slate-300 relative">
                                    <svg viewBox="0 0 100 100" className="w-full h-44 overflow-visible">
                                        {/* Grid Lines */}
                                        <line x1="0" y1="25" x2="100" y2="25" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                                        <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                                        <line x1="0" y1="75" x2="100" y2="75" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                                        <line x1="25" y1="0" x2="25" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                                        <line x1="50" y1="0" x2="50" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />
                                        <line x1="75" y1="0" x2="75" y2="100" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2" />

                                        {/* Curve Line */}
                                        <path
                                            d={`M 0 100 Q 25 ${100 - params.curveShadowsY * 100}, 50 ${100 - params.curveMidtonesY * 100} T 100 0`}
                                            fill="none"
                                            stroke="#d97706"
                                            strokeWidth="3"
                                        />

                                        {/* Control Points */}
                                        <circle cx="25" cy={100 - params.curveShadowsY * 100} r="4" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
                                        <circle cx="50" cy={100 - params.curveMidtonesY * 100} r="4" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
                                        <circle cx="75" cy={100 - params.curveHighlightsY * 100} r="4" fill="#eab308" stroke="#0f172a" strokeWidth="1" />
                                    </svg>
                                </div>

                                <SliderControl
                                    label="Shadows Tonal Lift"
                                    value={Math.round((params.curveShadowsY - 0.25) * 100)}
                                    min={-25}
                                    max={25}
                                    onChange={v => updateParams(p => ({ ...p, curveShadowsY: 0.25 + v / 100 }))}
                                />

                                <SliderControl
                                    label="Midtones Tonal Lift"
                                    value={Math.round((params.curveMidtonesY - 0.50) * 100)}
                                    min={-25}
                                    max={25}
                                    onChange={v => updateParams(p => ({ ...p, curveMidtonesY: 0.50 + v / 100 }))}
                                />

                                <SliderControl
                                    label="Highlights Tonal Lift"
                                    value={Math.round((params.curveHighlightsY - 0.75) * 100)}
                                    min={-25}
                                    max={25}
                                    onChange={v => updateParams(p => ({ ...p, curveHighlightsY: 0.75 + v / 100 }))}
                                />
                            </div>
                        )}

                        {/* TAB 4: COLOR */}
                        {activeTab === 'color' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>WHITE BALANCE & SATURATION</span>
                                </h3>

                                <SliderControl
                                    label="Temp (Temperature)"
                                    value={params.temperature}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, temperature: v }))}
                                />

                                <SliderControl
                                    label="Tint"
                                    value={params.tint}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, tint: v }))}
                                />

                                <SliderControl
                                    label="Vibrance"
                                    value={params.vibrance}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, vibrance: v }))}
                                />

                                <SliderControl
                                    label="Saturation"
                                    value={params.saturation}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, saturation: v }))}
                                />
                            </div>
                        )}

                        {/* TAB 5: HSL MIX */}
                        {activeTab === 'hsl' && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                        <span>HSL COLOR MIXER CHANNEL</span>
                                    </h3>
                                </div>

                                {/* Channel Selector Buttons */}
                                <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-100 border border-slate-200 font-mono">
                                    {(['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'magenta'] as HSLColorChannel[]).map(ch => (
                                        <button
                                            key={ch}
                                            onClick={() => setSelectedHSLChannel(ch)}
                                            className={`px-2 py-1 text-[10px] font-black uppercase flex items-center justify-center gap-1 transition-none ${
                                                selectedHSLChannel === ch
                                                    ? 'bg-yellow-400 text-slate-950 border border-slate-900 shadow-sm'
                                                    : 'text-slate-700 hover:bg-slate-200 border border-transparent'
                                            }`}
                                        >
                                            <span className={`w-2 h-2 ${getChannelBgColor(ch)}`} />
                                            <span>{ch}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 space-y-4 font-sans">
                                    <p className="text-xs font-black text-slate-900 uppercase font-mono flex items-center gap-2">
                                        <span className={`w-3 h-3 ${getChannelBgColor(selectedHSLChannel)}`} />
                                        <span>TARGET CHANNEL: {selectedHSLChannel}</span>
                                    </p>

                                    <SliderControl
                                        label="Hue Adjustment"
                                        value={params.hsl[selectedHSLChannel].hue}
                                        min={-100}
                                        max={100}
                                        onChange={v => updateParams(p => {
                                            const updated = { ...p.hsl };
                                            updated[selectedHSLChannel] = { ...updated[selectedHSLChannel], hue: v };
                                            return { ...p, hsl: updated };
                                        })}
                                    />

                                    <SliderControl
                                        label="Saturation"
                                        value={params.hsl[selectedHSLChannel].saturation}
                                        min={-100}
                                        max={100}
                                        onChange={v => updateParams(p => {
                                            const updated = { ...p.hsl };
                                            updated[selectedHSLChannel] = { ...updated[selectedHSLChannel], saturation: v };
                                            return { ...p, hsl: updated };
                                        })}
                                    />

                                    <SliderControl
                                        label="Luminance"
                                        value={params.hsl[selectedHSLChannel].luminance}
                                        min={-100}
                                        max={100}
                                        onChange={v => updateParams(p => {
                                            const updated = { ...p.hsl };
                                            updated[selectedHSLChannel] = { ...updated[selectedHSLChannel], luminance: v };
                                            return { ...p, hsl: updated };
                                        })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 6: COLOR GRADING / SPLIT TONING */}
                        {activeTab === 'grading' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>SPLIT TONING & COLOR GRADING</span>
                                </h3>

                                <div className="p-4 bg-slate-50 border border-slate-200 space-y-3 font-sans">
                                    <h4 className="text-xs font-black text-slate-900 font-mono uppercase">🌑 SHADOWS COLOR GRADE</h4>
                                    <SliderControl
                                        label="Shadows Hue"
                                        value={params.shadowsHue}
                                        min={0}
                                        max={360}
                                        onChange={v => updateParams(p => ({ ...p, shadowsHue: v }))}
                                    />
                                    <SliderControl
                                        label="Shadows Saturation"
                                        value={params.shadowsSat}
                                        min={0}
                                        max={100}
                                        onChange={v => updateParams(p => ({ ...p, shadowsSat: v }))}
                                    />
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-200 space-y-3 font-sans">
                                    <h4 className="text-xs font-black text-slate-900 font-mono uppercase">☀️ HIGHLIGHTS COLOR GRADE</h4>
                                    <SliderControl
                                        label="Highlights Hue"
                                        value={params.highlightsHue}
                                        min={0}
                                        max={360}
                                        onChange={v => updateParams(p => ({ ...p, highlightsHue: v }))}
                                    />
                                    <SliderControl
                                        label="Highlights Saturation"
                                        value={params.highlightsSat}
                                        min={0}
                                        max={100}
                                        onChange={v => updateParams(p => ({ ...p, highlightsSat: v }))}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 7: EFFECTS */}
                        {activeTab === 'effects' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>STYLISTIC EFFECTS & VIGNETTE</span>
                                </h3>

                                <SliderControl
                                    label="Texture"
                                    value={params.texture}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, texture: v }))}
                                />

                                <SliderControl
                                    label="Clarity"
                                    value={params.clarity}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, clarity: v }))}
                                />

                                <SliderControl
                                    label="Dehaze"
                                    value={params.dehaze}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, dehaze: v }))}
                                />

                                <SliderControl
                                    label="Vignette"
                                    value={params.vignette}
                                    min={-100}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, vignette: v }))}
                                />

                                <SliderControl
                                    label="Film Grain"
                                    value={params.grain}
                                    min={0}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, grain: v }))}
                                />
                            </div>
                        )}

                        {/* TAB 8: DETAIL */}
                        {activeTab === 'detail' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>DETAIL & SHARPENING</span>
                                </h3>

                                <SliderControl
                                    label="Sharpening"
                                    value={params.sharpening}
                                    min={0}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, sharpening: v }))}
                                />

                                <SliderControl
                                    label="Luminance Noise Reduction"
                                    value={params.noiseReduction}
                                    min={0}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, noiseReduction: v }))}
                                />

                                <SliderControl
                                    label="Color Noise Reduction"
                                    value={params.colorNoiseRed}
                                    min={0}
                                    max={100}
                                    onChange={v => updateParams(p => ({ ...p, colorNoiseRed: v }))}
                                />
                            </div>
                        )}

                        {/* TAB 9: GEOMETRY */}
                        {activeTab === 'geometry' && (
                            <div className="space-y-5">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-yellow-400 border border-slate-900"></span>
                                    <span>GEOMETRY, TILT & ROTATION</span>
                                </h3>

                                <SliderControl
                                    label="Rotate Angle (°)"
                                    value={params.rotate}
                                    min={-180}
                                    max={180}
                                    onChange={v => updateParams(p => ({ ...p, rotate: v }))}
                                />

                                <SliderControl
                                    label="Zoom Scale (%)"
                                    value={params.scale}
                                    min={50}
                                    max={200}
                                    onChange={v => updateParams(p => ({ ...p, scale: v }))}
                                />

                                <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                                    <button
                                        onClick={() => updateParams(p => ({ ...p, flipH: !p.flipH }))}
                                        className={`p-3 border text-xs font-black flex items-center justify-center gap-2 transition-none ${
                                            params.flipH
                                                ? 'bg-yellow-400 text-slate-950 border-slate-900'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                        }`}
                                    >
                                        <FlipHorizontal className="w-4 h-4" />
                                        <span>FLIP HORIZ</span>
                                    </button>

                                    <button
                                        onClick={() => updateParams(p => ({ ...p, flipV: !p.flipV }))}
                                        className={`p-3 border text-xs font-black flex items-center justify-center gap-2 transition-none ${
                                            params.flipV
                                                ? 'bg-yellow-400 text-slate-950 border-slate-900'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                        }`}
                                    >
                                        <FlipVertical className="w-4 h-4" />
                                        <span>FLIP VERT</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Import JSON Preset Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white border-2 border-slate-900 shadow-2xl w-full max-w-lg p-5 space-y-4 font-sans relative">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <h3 className="text-sm font-black text-slate-900 uppercase font-mono flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-yellow-400 border border-slate-900"></span>
                                <span>IMPORT LIGHTROOM JSON PRESET</span>
                            </h3>
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono font-bold flex items-center justify-center border border-slate-300"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Paste your JSON preset configuration (containing <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">light</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">color</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">effects</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">hsl</code> settings) to apply directly.
                        </p>

                        <textarea
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder={`Paste JSON Preset here...\n{\n  "presetName": "Imported Preset",\n  "light": { "exposure": 0.00, "contrast": -12, ... }\n}`}
                            className="w-full h-48 p-3 font-mono text-xs bg-slate-50 border border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none text-slate-800 resize-none"
                        />

                        <div className="flex items-center justify-between gap-3 pt-1">
                            <button
                                onClick={() => {
                                    const userSampleJson = JSON.stringify({
                                        "presetName": "Imported Preset",
                                        "light": { "exposure": 0, "contrast": -12, "highlights": -69, "shadows": 60, "whites": -61, "blacks": -60 },
                                        "color": { "temperature": 0, "tint": 0, "vibrance": 50, "saturation": 0 },
                                        "effects": { "texture": 5, "clarity": -8, "dehaze": 0, "vignette": -7, "grain": 0 },
                                        "detail": { "sharpening": 15, "radius": 1, "detail": 25, "masking": 0, "noiseReduction": 0, "colorNoiseReduction": 0 },
                                        "hsl": {
                                            "red": { "hue": -21, "saturation": -30, "luminance": -15 },
                                            "orange": { "hue": 14, "saturation": -35, "luminance": 5 },
                                            "yellow": { "hue": -16, "saturation": -14, "luminance": -20 },
                                            "green": { "hue": -2, "saturation": -22, "luminance": -52 },
                                            "aqua": { "hue": 38, "saturation": -68, "luminance": 25 },
                                            "blue": { "hue": 14, "saturation": -96, "luminance": -13 },
                                            "purple": { "hue": -91, "saturation": 0, "luminance": 0 },
                                            "magenta": { "hue": 0, "saturation": 0, "luminance": 0 }
                                        },
                                        "colorGrading": { "shadows": { "hue": 222, "saturation": 10 }, "highlights": { "hue": 204, "saturation": 27 }, "balance": 0 }
                                    }, null, 2);
                                    setJsonInput(userSampleJson);
                                }}
                                className="text-xs text-yellow-700 hover:text-yellow-900 font-mono font-bold underline"
                            >
                                Load Sample Preset JSON
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs border border-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleImportJson()}
                                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-mono font-black text-xs uppercase border border-slate-900 shadow-sm"
                                >
                                    Import & Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable Custom Slider Control Component
const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    defaultValue?: number;
    gradient?: string;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, defaultValue = 0, onChange }) => {
    const handleReset = () => onChange(defaultValue);

    return (
        <div className="space-y-1.5 group font-sans">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <button
                    onClick={handleReset}
                    className="hover:text-yellow-600 transition-none text-left flex items-center gap-1 focus:outline-none font-mono text-[11px] font-bold"
                    title="Click to reset slider"
                >
                    <span>{label}</span>
                </button>

                <div className="flex items-center gap-1 font-mono">
                    <button
                        onClick={() => onChange(Math.max(min, value - 1))}
                        className="w-5 h-5 bg-slate-200 hover:bg-slate-300 text-slate-900 flex items-center justify-center text-[10px] font-extrabold border border-slate-300 transition-none"
                        title="Decrease by 1"
                    >
                        -
                    </button>
                    <button
                        onClick={handleReset}
                        className="font-mono text-[11px] text-yellow-400 font-black bg-slate-900 px-2 py-0.5 border border-slate-900"
                        title="Click to reset"
                    >
                        {value > 0 ? `+${value}` : value}
                    </button>
                    <button
                        onClick={() => onChange(Math.min(max, value + 1))}
                        className="w-5 h-5 bg-slate-200 hover:bg-slate-300 text-slate-900 flex items-center justify-center text-[10px] font-extrabold border border-slate-300 transition-none"
                        title="Increase by 1"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="relative flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onDoubleClick={handleReset}
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-full h-2 rounded-none appearance-none cursor-pointer bg-slate-200 border border-slate-300 accent-yellow-500 focus:outline-none"
                />
            </div>
        </div>
    );
};

function getChannelBgColor(ch: HSLColorChannel): string {
    switch (ch) {
        case 'red': return 'bg-red-500';
        case 'orange': return 'bg-amber-500';
        case 'yellow': return 'bg-yellow-400';
        case 'green': return 'bg-emerald-500';
        case 'cyan': return 'bg-cyan-400';
        case 'blue': return 'bg-blue-500';
        case 'purple': return 'bg-purple-500';
        case 'magenta': return 'bg-pink-500';
        default: return 'bg-indigo-500';
    }
}

export default LightroomEditorStudio;
