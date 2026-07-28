/**
 * ImgBB API v1 Service
 * API Key: 69398385bcad0a0ef63957ec1b3b53f4
 * Documentation: https://api.imgbb.com/1/upload
 */

export const IMGBB_API_KEY = "69398385bcad0a0ef63957ec1b3b53f4";

export interface ImgbbUploadResult {
    id: string;
    title: string;
    url_viewer: string;
    url: string; // Direct image url
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
        filename: string;
        name: string;
        mime: string;
        extension: string;
        url: string;
    };
    thumb: {
        filename: string;
        name: string;
        mime: string;
        extension: string;
        url: string;
    };
    medium?: {
        filename: string;
        name: string;
        mime: string;
        extension: string;
        url: string;
    };
    delete_url: string;
}

export interface ImgbbApiResponse {
    data?: ImgbbUploadResult;
    success: boolean;
    status: number;
    error?: {
        message: string;
        code: number;
    };
}

/**
 * Uploads a file, Blob, or base64 string to ImgBB Cloud.
 * Returns the direct URL to the uploaded image.
 */
export async function uploadToImgBB(
    fileOrBase64: File | Blob | string,
    name?: string,
    expirationSeconds?: number
): Promise<{ url: string; display_url: string; delete_url: string; error: string | null }> {
    try {
        const formData = new FormData();
        formData.append("key", IMGBB_API_KEY);

        if (typeof fileOrBase64 === "string") {
            // If it's base64 or URL string
            formData.append("image", fileOrBase64);
        } else {
            // If it's a File or Blob object
            formData.append("image", fileOrBase64);
        }

        if (name) {
            formData.append("name", name);
        }

        if (expirationSeconds && expirationSeconds >= 60) {
            formData.append("expiration", expirationSeconds.toString());
        }

        const response = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
        });

        const result: ImgbbApiResponse = await response.json();

        if (!result.success || !result.data) {
            const errorMessage = result.error?.message || `ImgBB upload failed with status ${result.status}`;
            console.error("[ImgBB Service Error]:", errorMessage, result);
            return {
                url: "",
                display_url: "",
                delete_url: "",
                error: errorMessage,
            };
        }

        // Direct url from ImgBB
        const directUrl = result.data.url || result.data.display_url;

        return {
            url: directUrl,
            display_url: result.data.display_url || directUrl,
            delete_url: result.data.delete_url || "",
            error: null,
        };
    } catch (err: any) {
        console.error("[ImgBB Service Exception]:", err);
        return {
            url: "",
            display_url: "",
            delete_url: "",
            error: err.message || "Network error occurred while uploading to ImgBB.",
        };
    }
}
