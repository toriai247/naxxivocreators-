import { SupabaseClient } from '@supabase/supabase-js';
import { uploadToImgBB } from './imgbbService';

export { uploadToImgBB };

/**
 * Uploads a file to Supabase Storage with automatic bucket fallback creation.
 * If the bucket is missing (e.g. "Bucket not found") or RLS/CORS fails, it automatically falls back to ImgBB Cloud API!
 */
export async function uploadFileWithFallback(
    supabase: SupabaseClient<any, "public", any>,
    bucketName: string,
    fileName: string,
    file: File | Blob
): Promise<{ publicUrl: string; error: string | null }> {
    try {
        // Sanitize file name to avoid URL encoding or HTTP header issues that trigger CORS / "Failed to fetch"
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

        // 1. Attempt upload directly
        let { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(cleanFileName, file, { 
                upsert: true,
                contentType: file.type || 'application/octet-stream',
                cacheControl: '3600'
            });

        // 2. If upload failed (Bucket not found, Failed to fetch, 404, 400, etc.), attempt to ensure bucket exists
        if (uploadError) {
            console.warn(`[StorageUtils] Upload error (${uploadError.message}) on bucket "${bucketName}". Attempting to ensure bucket exists...`);
            try {
                const { error: createError } = await supabase.storage.createBucket(bucketName, {
                    public: true,
                    fileSizeLimit: 20971520, // 20MB limit
                });

                if (!createError || createError.message?.toLowerCase().includes('already exists') || createError.message?.toLowerCase().includes('duplicate')) {
                    // Retry upload after ensuring bucket exists
                    const retry = await supabase.storage
                        .from(bucketName)
                        .upload(cleanFileName, file, { 
                            upsert: true,
                            contentType: file.type || 'application/octet-stream',
                            cacheControl: '3600'
                        });
                    uploadError = retry.error;
                }
            } catch (createErr: any) {
                console.warn(`[StorageUtils] Could not auto-create bucket: ${createErr.message}`);
            }
        }

        // 3. If Supabase storage upload still failed (e.g. CORS, RLS, Bucket error), FALLBACK TO IMGBB CLOUD!
        if (uploadError) {
            console.warn(`[StorageUtils] Supabase storage upload failed (${uploadError.message}). Falling back to ImgBB Cloud API...`);
            const imgbbRes = await uploadToImgBB(file, cleanFileName);
            if (imgbbRes.url && !imgbbRes.error) {
                console.log(`[StorageUtils] Successfully uploaded via ImgBB fallback: ${imgbbRes.url}`);
                return { publicUrl: imgbbRes.url, error: null };
            }

            let errMsg = uploadError.message || 'Unknown upload error';
            if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
                errMsg = `Network/CORS error ("Failed to fetch"). ImgBB fallback also failed (${imgbbRes.error}). Please check your connection or storage setup.`;
            } else if (errMsg.toLowerCase().includes('bucket not found') || errMsg.toLowerCase().includes('not found')) {
                errMsg = `Storage bucket "${bucketName}" was not found and ImgBB fallback failed (${imgbbRes.error}).`;
            } else if (errMsg.toLowerCase().includes('security') || errMsg.toLowerCase().includes('policy') || errMsg.toLowerCase().includes('42501') || errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('violates row-level security')) {
                errMsg = `Permission denied by Supabase RLS policy (${errMsg}). ImgBB fallback also failed (${imgbbRes.error}).`;
            }
            return {
                publicUrl: '',
                error: `Upload failed: ${errMsg}`
            };
        }

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(cleanFileName);

        return { publicUrl, error: null };
    } catch (err: any) {
        console.warn(`[StorageUtils] Exception in Supabase upload (${err.message}). Attempting ImgBB fallback...`);
        const imgbbRes = await uploadToImgBB(file, fileName);
        if (imgbbRes.url && !imgbbRes.error) {
            return { publicUrl: imgbbRes.url, error: null };
        }

        let errMsg = err.message || 'An unexpected error occurred while uploading file.';
        if (errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network')) {
            errMsg = `Network/CORS error ("Failed to fetch"). Please ensure the storage bucket "${bucketName}" exists in your Supabase Dashboard.`;
        }
        return {
            publicUrl: '',
            error: errMsg
        };
    }
}
