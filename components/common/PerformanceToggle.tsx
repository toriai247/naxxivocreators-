import React, { useState } from 'react';
import { usePerformanceMode } from '../../utils/performanceMode';

interface PerformanceToggleProps {
    variant?: 'badge' | 'floating' | 'card' | 'settings';
    className?: string;
}

export const PerformanceToggle: React.FC<PerformanceToggleProps> = ({ variant = 'badge', className = '' }) => {
    const { mode, isLowMode, toggleMode, setMode, fps, deviceSpecs } = usePerformanceMode();
    const [showInfo, setShowInfo] = useState(false);

    if (variant === 'badge' || variant === 'floating') {
        return (
            <div className="relative inline-block select-none">
                <button
                    onClick={toggleMode}
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-[11px] font-black uppercase border shadow-xs transition-none ${
                        isLowMode
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-slate-900'
                            : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-slate-900'
                    } ${className}`}
                    title={isLowMode ? "Low Performance Mode (0 Lag, Fast Load) - Click to Switch" : "High Performance Mode (Full FX) - Click to Switch"}
                >
                    <span className="text-xs">{isLowMode ? '⚡' : '✨'}</span>
                    <span>{isLowMode ? 'LOW (0-LAG)' : 'HIGH (ULTRA)'}</span>
                    <span className={`px-1 rounded text-[9px] font-mono font-bold ${
                        fps >= 50 ? 'bg-black/20 text-white' : 'bg-rose-600 text-white'
                    }`}>
                        {fps} FPS
                    </span>
                </button>

                {/* Floating tooltip with live hardware diagnostics on hover */}
                {showInfo && (
                    <div className="absolute left-0 top-full mt-1.5 w-56 p-2.5 bg-slate-900 text-white border border-slate-700 shadow-xl z-50 text-[10px] font-mono space-y-1">
                        <div className="flex items-center justify-between text-yellow-400 font-bold border-b border-slate-800 pb-1">
                            <span>HARDWARE & LAG MONITOR</span>
                            <span>{fps} FPS</span>
                        </div>
                        <div className="text-slate-300 space-y-0.5 pt-0.5">
                            <p>Mode: <span className={isLowMode ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>{isLowMode ? "LOW (0-LAG)" : "HIGH (ULTRA)"}</span></p>
                            <p>CPU Cores: {deviceSpecs.cores}</p>
                            {deviceSpecs.memoryGB && <p>RAM: ~{deviceSpecs.memoryGB} GB</p>}
                            <p className="text-slate-400 text-[9px] pt-1">
                                {isLowMode ? "✓ 0 Animations • 0 Blurs • Min CPU usage" : "⚡ Full graphics & transition effects"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'settings' || variant === 'card') {
        return (
            <div className={`p-4 bg-[var(--theme-card-bg)] border border-[var(--theme-secondary)] rounded-xl space-y-3 font-sans ${className}`}>
                <div className="flex items-center justify-between gap-2 border-b border-[var(--theme-secondary)] pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shadow-xs ${
                            isLowMode ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-slate-950 border border-slate-900'
                        }`}>
                            {isLowMode ? '⚡' : '✨'}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-sm text-[var(--theme-text)] flex items-center gap-2">
                                <span>Master Performance & Graphics Engine</span>
                                {deviceSpecs.isLowEndDevice && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500 text-slate-950 rounded">WEAK DEVICE DETECTED</span>
                                )}
                            </h3>
                            <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                                Mode: <span className="font-bold font-mono text-[var(--theme-text)]">{isLowMode ? 'LOW (Lite / 0-Lag Mode)' : 'HIGH (Ultra FX Mode)'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Live FPS Counter Badge */}
                    <div className="text-right font-mono shrink-0">
                        <div className="text-[10px] text-[var(--theme-text-secondary)] uppercase">Live Frame Rate</div>
                        <div className={`text-sm font-black flex items-center justify-end gap-1 ${
                            fps >= 50 ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            <span>{fps} FPS</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* LOW MODE OPTION */}
                    <button
                        onClick={() => setMode('low')}
                        className={`p-3.5 text-left border rounded-xl transition-none flex flex-col justify-between ${
                            isLowMode
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 dark:bg-emerald-950/40'
                                : 'bg-[var(--theme-card-bg-alt)] border-[var(--theme-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black font-mono px-2 py-0.5 bg-emerald-500 text-white rounded">⚡ LOW (0-LAG)</span>
                                {isLowMode && <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">ACTIVE</span>}
                            </div>
                            <p className="text-xs font-extrabold text-[var(--theme-text)]">Ultra Lite Mode (Maximum Speed)</p>
                            <ul className="text-[11px] text-[var(--theme-text-secondary)] mt-2 space-y-1 font-sans">
                                <li className="flex items-center gap-1">✓ 0 Animations & 0 Page Transitions</li>
                                <li className="flex items-center gap-1">✓ Strips Backdrop Blurs & Heavy Shadows</li>
                                <li className="flex items-center gap-1">✓ Optimized for weak RAM / CPU & slow networks</li>
                            </ul>
                        </div>
                        <div className="mt-3 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold border-t border-emerald-200 dark:border-emerald-800/50 pt-1.5">
                            BEST FOR LOW RAM / WEAK MOBILE PHONES
                        </div>
                    </button>

                    {/* HIGH MODE OPTION */}
                    <button
                        onClick={() => setMode('high')}
                        className={`p-3.5 text-left border rounded-xl transition-none flex flex-col justify-between ${
                            !isLowMode
                                ? 'bg-amber-50 border-yellow-500 ring-2 ring-yellow-400 dark:bg-amber-950/40'
                                : 'bg-[var(--theme-card-bg-alt)] border-[var(--theme-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black font-mono px-2 py-0.5 bg-yellow-400 text-slate-950 border border-slate-900 rounded">✨ HIGH (ULTRA)</span>
                                {!isLowMode && <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 font-mono">ACTIVE</span>}
                            </div>
                            <p className="text-xs font-extrabold text-[var(--theme-text)]">Full Ultra Graphics Mode</p>
                            <ul className="text-[11px] text-[var(--theme-text-secondary)] mt-2 space-y-1 font-sans">
                                <li className="flex items-center gap-1">✨ Smooth Framer Motion spring physics</li>
                                <li className="flex items-center gap-1">✨ Glassmorphism blurs & glowing gradients</li>
                                <li className="flex items-center gap-1">✨ Rich interactive micro-animations</li>
                            </ul>
                        </div>
                        <div className="mt-3 text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold border-t border-yellow-200 dark:border-amber-800/50 pt-1.5">
                            BEST FOR FAST COMPUTERS & HIGH-END PHONES
                        </div>
                    </button>
                </div>

                {/* System Specs Diagnostic Footer */}
                <div className="p-2.5 bg-[var(--theme-card-bg-alt)] border border-[var(--theme-secondary)] rounded-lg text-[10px] font-mono text-[var(--theme-text-secondary)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <span>CPU CORES: <strong className="text-[var(--theme-text)]">{deviceSpecs.cores}</strong></span>
                        {deviceSpecs.memoryGB && <span>EST. RAM: <strong className="text-[var(--theme-text)]">~{deviceSpecs.memoryGB} GB</strong></span>}
                    </div>
                    <div>
                        STATUS: <strong className={isLowMode ? "text-emerald-500" : "text-yellow-500"}>
                            {isLowMode ? "OPTIMIZED FOR ZERO LAG" : "FULL GRAPHICS READY"}
                        </strong>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default PerformanceToggle;

