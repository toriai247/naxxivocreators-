import { useState, useEffect, useRef } from 'react';

export type PerformanceMode = 'low' | 'high';

const LOCAL_STORAGE_KEY = 'naxxivo_perf_mode';

export interface DeviceSpecs {
    cores: number;
    memoryGB?: number;
    isLowEndDevice: boolean;
}

/**
 * Detect hardware specs of the client device
 */
export function getDeviceSpecs(): DeviceSpecs {
    if (typeof window === 'undefined') {
        return { cores: 8, isLowEndDevice: false };
    }

    const cores = navigator.hardwareConcurrency || 4;
    const memoryGB = (navigator as any).deviceMemory || undefined;

    // Consider device low end if <= 4 CPU cores or <= 4GB RAM
    const isLowEndDevice = cores <= 4 || (memoryGB !== undefined && memoryGB <= 4);

    return {
        cores,
        memoryGB,
        isLowEndDevice,
    };
}

/**
 * Gets current performance mode from localStorage.
 * If user hasn't set one, defaults to 'low' for detected weak devices, or 'high' for capable devices.
 */
export function getPerformanceMode(): PerformanceMode {
    if (typeof window === 'undefined') return 'high';
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved === 'low' || saved === 'high') return saved;

    // Auto-detect weak hardware if user never selected a mode
    const specs = getDeviceSpecs();
    if (specs.isLowEndDevice) {
        return 'low';
    }
    return 'high';
}

/**
 * Sets performance mode and updates root element class list & dispatches event.
 */
export function setPerformanceMode(mode: PerformanceMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEY, mode);

    const root = document.documentElement;
    if (mode === 'low') {
        root.classList.add('perf-mode-low');
    } else {
        root.classList.remove('perf-mode-low');
    }

    // Dispatch event so hooks re-render reactively
    window.dispatchEvent(new CustomEvent('perf-mode-changed', { detail: mode }));
}

/**
 * Initializes performance mode class on initial page load.
 */
export function initPerformanceMode(): PerformanceMode {
    const mode = getPerformanceMode();
    const root = document.documentElement;
    if (mode === 'low') {
        root.classList.add('perf-mode-low');
    } else {
        root.classList.remove('perf-mode-low');
    }
    return mode;
}

/**
 * React hook to read, set, and monitor performance mode & FPS reactively.
 */
export function usePerformanceMode() {
    const [mode, setModeState] = useState<PerformanceMode>(getPerformanceMode);
    const [fps, setFps] = useState<number>(60);
    const [deviceSpecs] = useState<DeviceSpecs>(getDeviceSpecs);
    
    const frameCountRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(performance.now());
    const animFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        // Ensure DOM class matches state on mount
        const current = getPerformanceMode();
        setModeState(current);
        const root = document.documentElement;
        if (current === 'low') {
            root.classList.add('perf-mode-low');
        } else {
            root.classList.remove('perf-mode-low');
        }

        const handleModeChange = (e: Event) => {
            const customEvent = e as CustomEvent<PerformanceMode>;
            if (customEvent.detail) {
                setModeState(customEvent.detail);
            } else {
                setModeState(getPerformanceMode());
            }
        };

        window.addEventListener('perf-mode-changed', handleModeChange);
        window.addEventListener('storage', handleModeChange);

        // Real-time lightweight FPS counter for diagnostic feedback
        const calcFps = () => {
            const now = performance.now();
            frameCountRef.current += 1;

            if (now - lastTimeRef.current >= 1000) {
                const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
                setFps(currentFps);
                frameCountRef.current = 0;
                lastTimeRef.current = now;
            }

            animFrameIdRef.current = requestAnimationFrame(calcFps);
        };

        animFrameIdRef.current = requestAnimationFrame(calcFps);

        return () => {
            window.removeEventListener('perf-mode-changed', handleModeChange);
            window.removeEventListener('storage', handleModeChange);
            if (animFrameIdRef.current) {
                cancelAnimationFrame(animFrameIdRef.current);
            }
        };
    }, []);

    const toggleMode = () => {
        const nextMode = mode === 'low' ? 'high' : 'low';
        setPerformanceMode(nextMode);
    };

    const setMode = (newMode: PerformanceMode) => {
        setPerformanceMode(newMode);
    };

    /**
     * Master framer-motion prop builder:
     * Disables spring / translation animations dynamically if low mode is enabled.
     */
    const getMotionProps = (options: {
        initial?: any;
        animate?: any;
        exit?: any;
        transition?: any;
        whileHover?: any;
        whileTap?: any;
    }) => {
        if (mode === 'low') {
            return {
                initial: false,
                animate: false,
                exit: false,
                transition: { duration: 0 },
                whileHover: undefined,
                whileTap: undefined,
            };
        }
        return options;
    };

    return {
        mode,
        isLowMode: mode === 'low',
        setMode,
        toggleMode,
        fps,
        deviceSpecs,
        getMotionProps,
    };
}

