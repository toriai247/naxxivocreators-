// Client-side native Image Compressor and Format Converter (No server/paid API required!)
// Uses HTML5 Canvas & Blob to compress, resize, and convert images (PNG, JPG, BMP, WEBP, static GIF) to WebP/JPG/PNG.

export interface CompressionOptions {
    quality?: number; // 0.1 to 1.0 (default: 0.8)
    maxWidth?: number; // e.g., 1920 (default: no limit or 1920)
    maxHeight?: number; // e.g., 1080
    targetFormat?: 'image/webp' | 'image/jpeg' | 'image/png'; // default: 'image/webp'
}

export interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    savingsPercent: number;
    dataUrl: string;
    width: number;
    height: number;
    originalFormat: string;
    targetFormat: string;
}

/**
 * Formats file size in bytes to human-readable string (KB, MB).
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Converts a File to a Base64 Data URL reliably (no CORS or Blob URL issues in mobile/iframes).
 */
export const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file ${file.name} as Data URL.`));
        reader.readAsDataURL(file);
    });
};

/**
 * Compresses and converts an image File using browser native Canvas API.
 * Uses FileReader instead of createObjectURL to avoid mobile gallery & iframe sandbox restrictions.
 */
export const compressImage = async (file: File, options: CompressionOptions = {}): Promise<CompressionResult> => {
    const {
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1920,
        targetFormat = 'image/webp'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) {
                reject(new Error("Failed to read image data from file."));
                return;
            }

            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate responsive resize maintaining aspect ratio
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Failed to get 2D canvas context for image compression."));
                    return;
                }

                // If target format is JPEG, draw a white background first (in case of transparent PNG)
                if (targetFormat === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                }

                // Use high quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Export from canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas failed to create blob during compression."));
                            return;
                        }

                        // Determine new file extension
                        let ext = '.webp';
                        if (targetFormat === 'image/jpeg') ext = '.jpg';
                        else if (targetFormat === 'image/png') ext = '.png';

                        // Create clean file name with new extension
                        const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        const newFileName = `${originalNameWithoutExt}_compressed${ext}`;

                        const compressedFile = new File([blob], newFileName, {
                            type: targetFormat,
                            lastModified: Date.now()
                        });

                        const originalSize = file.size;
                        const compressedSize = compressedFile.size;
                        const savingsPercent = originalSize > 0 
                            ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
                            : 0;

                        // Generate data URL for instant preview
                        const resultReader = new FileReader();
                        resultReader.onloadend = () => {
                            resolve({
                                file: compressedFile,
                                originalSize,
                                compressedSize,
                                savingsPercent,
                                dataUrl: resultReader.result as string,
                                width,
                                height,
                                originalFormat: file.type || 'unknown',
                                targetFormat: targetFormat
                            });
                        };
                        resultReader.onerror = () => {
                            resolve({
                                file: compressedFile,
                                originalSize,
                                compressedSize,
                                savingsPercent,
                                dataUrl: dataUrl,
                                width,
                                height,
                                originalFormat: file.type || 'unknown',
                                targetFormat: targetFormat
                            });
                        };
                        resultReader.readAsDataURL(compressedFile);
                    },
                    targetFormat,
                    targetFormat === 'image/png' ? undefined : quality
                );
            };

            img.onerror = () => {
                reject(new Error(`Failed to load image file: ${file.name}. Please ensure it is a valid image.`));
            };

            img.src = dataUrl;
        };

        reader.onerror = () => {
            reject(new Error(`Failed to read file from phone storage: ${file.name}.`));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Helper to download a File object directly to user's computer/phone
 */
export const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
};
