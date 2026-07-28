import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBytes } from '../../utils/imageCompressor';

export interface UploadStepTrackerProps {
    currentStep: number; // 0=idle, 1=compressing, 2=converting to webp, 3=uploading to imgbb, 4=generating url, 5=ready!
    originalSize?: number;
    compressedSize?: number;
    error?: string | null;
}

export const UploadStepTracker: React.FC<UploadStepTrackerProps> = ({
    currentStep,
    originalSize,
    compressedSize,
    error
}) => {
    if (currentStep === 0 && !error) return null;

    const steps = [
        { id: 1, label: "Compressing image resolution & size" },
        { id: 2, label: "Converting to lightweight WebP format" },
        { id: 3, label: "Uploading optimized file to ImgBB Cloud" },
        { id: 4, label: "Generating Direct URL from CDN" },
        { id: 5, label: "Ready! URL auto-filled automatically ✨" }
    ];

    const savings = (originalSize && compressedSize && originalSize > 0)
        ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
        : 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="mt-2.5 p-3.5 bg-black/50 backdrop-blur-md rounded-2xl border border-indigo-500/40 text-xs space-y-2 shadow-xl w-full text-left overflow-hidden"
            >
                <div className="font-bold text-indigo-300 flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5">
                        <span className="animate-spin text-sm">⚡</span>
                        <span>Auto-Optimization Pipeline</span>
                    </span>
                    {currentStep === 5 && (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                            <span>🎉 COMPLETED</span>
                        </span>
                    )}
                </div>

                {/* Step Checklist */}
                <div className="space-y-1.5 pt-1">
                    {steps.map((s) => {
                        const isDone = currentStep > s.id || (currentStep === 5 && s.id === 5);
                        const isCurrent = currentStep === s.id;
                        const isPending = currentStep < s.id;

                        return (
                            <div
                                key={s.id}
                                className={`flex items-center justify-between gap-2 transition-all duration-300 ${
                                    isDone ? 'text-emerald-400 font-medium' : isCurrent ? 'text-amber-300 font-bold scale-[1.01]' : 'text-gray-500 opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="w-4 text-center">
                                        {isDone ? '✅' : isCurrent ? '⏳' : '⚪'}
                                    </span>
                                    <span>{s.label}</span>
                                </div>
                                {isCurrent && (
                                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded animate-pulse">
                                        Processing...
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Stats badge when compression completes */}
                {compressedSize && originalSize && currentStep >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] bg-emerald-500/10 p-2 rounded-xl text-emerald-300 border border-emerald-500/20"
                    >
                        <div>
                            <span>Original: <strong>{formatBytes(originalSize)}</strong></span>
                            <span className="mx-1.5">➡️</span>
                            <span>WebP: <strong>{formatBytes(compressedSize)}</strong></span>
                        </div>
                        {savings > 0 && (
                            <span className="bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                                -{savings}% Size 🔥
                            </span>
                        )}
                    </motion.div>
                )}

                {/* Error message if failed */}
                {error && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-[11px] font-bold flex items-center gap-1.5">
                        <span>❌</span>
                        <span>{error}</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default UploadStepTracker;
