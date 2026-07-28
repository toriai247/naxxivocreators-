import React, { useState, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { BackArrowIcon, UploadIcon, CoinIcon } from '../common/AppIcons';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';
import type { Session } from '@supabase/auth-js';
import { motion, AnimatePresence } from 'framer-motion';
import { generateAvatar } from '../../utils/helpers';
import { uploadFileWithFallback } from '../../utils/storageUtils';
import { DirectImageUrlInput } from '../common/DirectImageUrlInput';

interface UploadCoverPageProps {
    onBack: () => void;
    session: Session;
}

const UPLOAD_COST = 25000;

const pageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

const UploadCoverPage: React.FC<UploadCoverPageProps> = ({ onBack, session }) => {
    const [step, setStep] = useState<'upload' | 'details'>('upload');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'image/png') {
                setError('Please upload a PNG image.');
                return;
            }
             if (file.size > 1 * 1024 * 1024) { // 1MB limit
                setError('File size cannot exceed 1MB.');
                return;
            }
            setError(null);
            setCoverFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setStep('details');
        }
    };

    const resetUpload = () => {
        setStep('upload');
        setCoverFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!name.trim() || !previewUrl) {
            setError('Please provide a name and a valid image URL.');
            return;
        }
        setIsModalOpen(true);
    };

    const handleConfirmSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            if (!previewUrl) throw new Error("Missing direct image URL.");
            const publicUrl = previewUrl;

            let successMessage = "";

            // 1. Attempt RPC call first
            const { data, error: rpcError } = await (supabase as any).rpc('create_user_profile_cover', {
                p_name: name,
                p_description: description,
                p_preview_url: publicUrl
            });

            if (rpcError) {
                console.warn("RPC create_user_profile_cover missing or failed, using direct client-side fallback:", rpcError);
                
                if (!session?.user?.id) {
                    throw new Error("You must be logged in to submit a profile cover ring.");
                }

                // Fallback Step A: Verify user XP balance
                const { data: profileData, error: profileErr } = await supabase
                    .from('profiles')
                    .select('xp_balance')
                    .eq('id', session.user.id)
                    .single();

                if (profileErr) {
                    throw new Error(`Could not verify XP balance: ${profileErr.message}`);
                }

                const currentXp = (profileData as any)?.xp_balance || 0;
                if (currentXp < UPLOAD_COST) {
                    throw new Error(`Insufficient XP balance. You need ${UPLOAD_COST.toLocaleString()} XP to submit a profile cover ring.`);
                }

                // Fallback Step B: Deduct XP from user profile
                const { error: deductErr } = await (supabase
                    .from('profiles') as any)
                    .update({ xp_balance: currentXp - UPLOAD_COST })
                    .eq('id', session.user.id);

                if (deductErr) {
                    throw new Error(`Failed to deduct XP: ${deductErr.message}`);
                }

                // Fallback Step C: Insert store item for review
                const { error: insertErr } = await (supabase
                    .from('store_items') as any)
                    .insert({
                        name: name.trim(),
                        description: description.trim(),
                        category: 'PROFILE_COVER',
                        price: 0,
                        preview_url: publicUrl,
                        is_active: false,
                        is_approved: false,
                        created_by_user_id: session.user.id
                    });

                if (insertErr) {
                    // Revert XP deduction if store item insertion failed
                    await (supabase
                        .from('profiles') as any)
                        .update({ xp_balance: currentXp })
                        .eq('id', session.user.id);

                    if (insertErr.code === '42501' || insertErr.message.toLowerCase().includes('permission') || insertErr.message.toLowerCase().includes('rls')) {
                        throw new Error("Database permission error (RLS). Please ask an Admin to go to Admin -> Storage & SQL Setup and copy/run the updated FIX_SQL_SCRIPT in Supabase SQL editor.");
                    }
                    throw new Error(`Failed to create cover item: ${insertErr.message}`);
                }

                successMessage = "Submission successful! Your profile cover ring is now under review.";
            } else {
                const resText = (data as string) || '';
                if (resText.startsWith('Error:')) {
                    throw new Error(resText);
                }
                successMessage = resText || "Submission successful! Your profile cover ring is now under review.";
            }

            alert(successMessage);
            onBack();

        } catch (err: any) {
            console.error("Cover upload submission failed:", err);
            setError(err.message || "An unexpected error occurred during submission.");
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Create a Profile Cover</h1>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow p-4">
                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            {...{
                                variants: pageVariants,
                                initial: "hidden",
                                animate: "visible",
                                exit: "exit",
                            } as any}
                            className="flex flex-col items-center justify-center h-full text-center"
                        >
                            <div className="w-full max-w-md bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm text-left">
                                <h2 className="text-lg font-bold text-[var(--theme-text)] mb-3 text-center">Provide Cover Image or Animated GIF URL</h2>
                                <DirectImageUrlInput
                                    value={previewUrl || ''}
                                    onChange={(url) => {
                                        setPreviewUrl(url);
                                        if (url) setStep('details');
                                        else setStep('upload');
                                    }}
                                    label="Cover Ring Direct URL (Supports Animated GIFs!)"
                                    placeholder="https://i.ibb.co/... or click '⚡ Upload GIF/Image' to generate"
                                    previewAspectRatio="cover"
                                />
                            </div>

                            <div className="mt-6 p-4 bg-[var(--theme-card-bg)] rounded-xl w-full max-w-sm text-left text-sm space-y-2">
                                <h3 className="font-bold text-base text-[var(--theme-text)]">Submission Guidelines</h3>
                                <div className="flex items-start gap-3">
                                    <CoinIcon className="w-5 h-5 mt-0.5 text-[var(--theme-primary)] flex-shrink-0" />
                                    <p className="text-[var(--theme-text-secondary)]"><strong>Cost:</strong> A one-time fee of <strong>{UPLOAD_COST.toLocaleString()} XP</strong> will be deducted upon submission.</p>
                                </div>
                                 <div className="flex items-start gap-3">
                                    <span className="mt-0.5">⚡</span>
                                    <p className="text-[var(--theme-text-secondary)]"><strong>Format & GIF System:</strong> Supports Animated GIFs (.gif), PNG, JPG, or WEBP! Use the <strong>'⚡ Upload GIF/Image'</strong> button above to upload directly from your device and auto-fill the URL box via ImgBB!</p>
                                 </div>
                                 <div className="flex items-start gap-3">
                                    <span className="mt-0.5">🧐</span>
                                    <p className="text-[var(--theme-text-secondary)]"><strong>Review:</strong> All submissions will be reviewed by an admin before appearing in the Bazaar.</p>
                                 </div>
                            </div>
                            
                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </motion.div>
                    )}

                    {step === 'details' && (
                         <motion.div
                            key="details"
                            {...{
                                variants: pageVariants,
                                initial: "hidden",
                                animate: "visible",
                                exit: "exit",
                            } as any}
                            className="flex flex-col h-full"
                        >
                            <div className="bg-[var(--theme-card-bg)] p-6 rounded-lg shadow-sm flex-grow">
                                <h3 className="font-bold text-center text-[var(--theme-text)] mb-4">Live Preview</h3>
                                <div className="relative w-40 h-40 mx-auto bg-[var(--theme-bg)] rounded-full flex items-center justify-center">
                                    <img src={generateAvatar('Sample')} alt="Sample Avatar" className="w-32 h-32 rounded-full object-cover"/>
                                    {previewUrl && <img src={previewUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-contain p-1" />}
                                </div>
                                <div className="text-center mt-4">
                                    <Button onClick={resetUpload} variant="secondary" size="small" className="w-auto">Change Image</Button>
                                </div>
                                
                                <div className="mt-6 space-y-4">
                                     <Input id="name" label="Cover Name" value={name} onChange={e => setName(e.target.value)} required />
                                     <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Description</label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={2}
                                            placeholder="A short, catchy description."
                                            className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border-transparent border rounded-lg text-[var(--theme-text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm"
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                                </div>
                            </div>
                             <div className="mt-4">
                                <Button onClick={handleSubmit} disabled={isSubmitting || !previewUrl || !name}>
                                    Submit for Review
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                title="Confirm Submission"
                message={`Submitting this cover will cost ${UPLOAD_COST.toLocaleString()} XP. This fee is non-refundable and does not guarantee approval. Are you sure you want to proceed?`}
                confirmText={`Yes, pay ${UPLOAD_COST.toLocaleString()} XP`}
                isConfirming={isSubmitting}
            />
        </div>
    );
};

export default UploadCoverPage;