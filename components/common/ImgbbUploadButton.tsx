import React, { useState, useRef } from 'react';
import { uploadToImgBB } from '../../utils/imgbbService';
import { compressImage } from '../../utils/imageCompressor';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';
import { UploadStepTracker } from './UploadStepTracker';

interface ImgbbUploadButtonProps {
    onUrlReceived: (directUrl: string) => void;
    label?: string;
    className?: string;
    variant?: 'button' | 'dropzone' | 'compact';
    disabled?: boolean;
}

export const ImgbbUploadButton: React.FC<ImgbbUploadButtonProps> = ({
    onUrlReceived,
    label = "☁️ ImgBB Upload (Auto-fill URL)",
    className = "",
    variant = 'button',
    disabled = false
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [originalSize, setOriginalSize] = useState<number | undefined>(undefined);
    const [compressedSize, setCompressedSize] = useState<number | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError("Please select a valid image file (PNG, JPG, GIF, WEBP).");
            return;
        }

        setIsUploading(true);
        setError(null);
        setSuccessMessage(null);
        setCurrentStep(1); // 1. Compressing image size
        setOriginalSize(file.size);
        setCompressedSize(undefined);

        // Brief delay so user sees Step 1 starting
        await new Promise(r => setTimeout(r, 250));

        try {
            let fileToUpload = file;
            const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
            
            setCurrentStep(2); // 2. Converting format to WebP
            await new Promise(r => setTimeout(r, 250));

            // Auto-compress non-GIF images to lightweight WebP before uploading for maximum speed!
            if (!isGif && file.size > 50 * 1024) {
                try {
                    const res = await compressImage(file, { quality: 0.82, maxWidth: 1920, maxHeight: 1920, targetFormat: 'image/webp' });
                    fileToUpload = res.file;
                    setCompressedSize(res.compressedSize);
                } catch (err) {
                    console.warn("Auto-compression skipped, uploading original:", err);
                    setCompressedSize(file.size);
                }
            } else {
                setCompressedSize(file.size);
            }

            setCurrentStep(3); // 3. Uploading optimized file to ImgBB Cloud
            const result = await uploadToImgBB(fileToUpload, fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_'));
            if (result.error || !result.url) {
                throw new Error(result.error || "Failed to generate ImgBB direct URL.");
            }

            setCurrentStep(4); // 4. Generating Direct URL from CDN
            await new Promise(r => setTimeout(r, 300));

            setCurrentStep(5); // 5. Ready! URL auto-filled automatically!
            onUrlReceived(result.url);
            setSuccessMessage("✅ Direct WebP URL generated & auto-filled!");
            setTimeout(() => {
                setSuccessMessage(null);
                setCurrentStep(0);
            }, 6000);
        } catch (err: any) {
            setError(err.message || "An error occurred during upload.");
            setCurrentStep(0);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled || isUploading) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    if (variant === 'compact') {
        return (
            <div className={`inline-flex flex-col items-start ${className}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={disabled || isUploading}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow transition-all disabled:opacity-50"
                    title="Upload image to ImgBB and get direct URL"
                >
                    {isUploading ? (
                        <>
                            <LoadingSpinner size="sm" />
                            <span>Uploading to ImgBB...</span>
                        </>
                    ) : (
                        <>
                            <span>☁️</span>
                            <span>{label}</span>
                        </>
                    )}
                </button>
                {error && <span className="text-[11px] text-red-500 mt-1 font-medium">{error}</span>}
                {successMessage && <span className="text-[11px] text-green-500 mt-1 font-medium animate-pulse">{successMessage}</span>}
                <UploadStepTracker currentStep={currentStep} originalSize={originalSize} compressedSize={compressedSize} error={error} />
            </div>
        );
    }

    if (variant === 'dropzone') {
        return (
            <div className={`w-full ${className}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={disabled || isUploading}
                />
                <div
                    onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 flex flex-col items-center justify-center space-y-2 ${
                        isDragging
                            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                            : 'border-gray-300 dark:border-gray-700 bg-[var(--theme-card-bg-alt)]/50 hover:border-indigo-400 hover:bg-[var(--theme-card-bg-alt)]'
                    } ${disabled || isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                >
                    <div className="p-3 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-indigo-500 rounded-full">
                        {isUploading ? <LoadingSpinner /> : <span className="text-2xl">☁️</span>}
                    </div>
                    <div>
                        <p className="font-bold text-sm text-[var(--theme-text)]">
                            {isUploading ? "Uploading image to ImgBB..." : "Drag & Drop Image or Click to Browse"}
                        </p>
                        <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5">
                            Auto-uploads via ImgBB v1 API and fills the URL input column instantly 😊
                        </p>
                    </div>
                    {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
                    {successMessage && <p className="text-xs text-green-500 font-bold mt-1">{successMessage}</p>}
                </div>
                <UploadStepTracker currentStep={currentStep} originalSize={originalSize} compressedSize={compressedSize} error={error} />
            </div>
        );
    }

    // Default button variant
    return (
        <div className={`flex flex-col items-start ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={disabled || isUploading}
            />
            <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
                {isUploading ? (
                    <>
                        <LoadingSpinner size="sm" />
                        <span>Uploading to ImgBB Cloud...</span>
                    </>
                ) : (
                    <>
                        <span className="text-base">☁️</span>
                        <span>{label}</span>
                    </>
                )}
            </motion.button>
            {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
            {successMessage && <p className="text-xs text-green-500 font-bold mt-1.5">{successMessage}</p>}
            <UploadStepTracker currentStep={currentStep} originalSize={originalSize} compressedSize={compressedSize} error={error} />
        </div>
    );
};
