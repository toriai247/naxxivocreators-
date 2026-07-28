import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, TablesInsert, TablesUpdate } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { BackArrowIcon, PlayIcon, PauseIcon, UploadIcon, DeleteIcon, CheckCircleIcon } from '../common/AppIcons';
import ConfirmationModal from '../common/ConfirmationModal';
import { uploadFileWithFallback } from '../../utils/storageUtils';

interface MusicLibraryPageProps {
    session: Session;
    onBack: () => void;
    showNotification: (details: any) => void;
}

type MusicTrack = Tables<'profile_music'>;
type ProfileGif = Tables<'profile_gifs'>;

const UPLOAD_GIF_COST = 75;

const MusicLibraryPage: React.FC<MusicLibraryPageProps> = ({ session, onBack, showNotification }) => {
    // Music State
    const [tracks, setTracks] = useState<MusicTrack[]>([]);
    const [selectedMusicId, setSelectedMusicId] = useState<number | null>(null);
    const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const musicFileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploadingMusic, setIsUploadingMusic] = useState(false);

    // GIF State
    const [gifs, setGifs] = useState<ProfileGif[]>([]);
    const [activeGifId, setActiveGifId] = useState<number | null>(null);
    const gifFileInputRef = useRef<HTMLInputElement | null>(null);
    const [isUploadingGif, setIsUploadingGif] = useState(false);
    const [isCostConfirmModalOpen, setIsCostConfirmModalOpen] = useState(false);
    const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
    const [deletingGif, setDeletingGif] = useState<ProfileGif | null>(null);

    // General State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const myId = session.user.id;

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [musicRes, gifsRes, profileRes] = await Promise.all([
                supabase.from('profile_music').select('*').eq('profile_id', myId),
                supabase.from('profile_gifs').select('*').eq('user_id', myId),
                supabase.from('profiles').select('active_gif_id, selected_music_id').eq('id', myId).maybeSingle()
            ]);

            if (musicRes.error) throw musicRes.error;
            setTracks(musicRes.data || []);

            if (gifsRes.error) throw gifsRes.error;
            setGifs(gifsRes.data || []);

            if (profileRes.error) throw profileRes.error;
            const profileData = profileRes.data as any;
            setActiveGifId(profileData?.active_gif_id || null);
            setSelectedMusicId(profileData?.selected_music_id || null);

        } catch (err: any) {
            let errorMessage = err.message || 'Failed to load library.';
            if (err.message && err.message.includes('column "selected_music_id" does not exist')) {
                errorMessage = "Database schema is out of date. The 'selected_music_id' column is missing from the 'profiles' table. Please run the required SQL update.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [myId]);

    useEffect(() => {
        fetchData();
        return () => {
            audioRef.current?.pause();
        }
    }, [fetchData]);

    const handleMusicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingMusic(true);
        try {
            const fileName = `${myId}-${Date.now()}-${file.name}`;
            const { publicUrl, error: uploadErr } = await uploadFileWithFallback(supabase, 'profile-music', fileName, file);
            if (uploadErr) throw new Error(uploadErr);

            const newTrack: TablesInsert<'profile_music'> = {
                profile_id: myId,
                music_url: publicUrl,
                file_name: file.name
            };
            const { error: insertError } = await supabase.from('profile_music').insert(newTrack as any);
            if (insertError) throw insertError;

            showNotification({ type: 'success', title: 'Upload Successful', message: `${file.name} has been added to your library.` });
            await fetchData();
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Upload Failed', message: err.message });
        } finally {
            setIsUploadingMusic(false);
            if (musicFileInputRef.current) musicFileInputRef.current.value = "";
        }
    };

    const handleSelectMusic = async (trackId: number) => {
        const payload: TablesUpdate<'profiles'> = { selected_music_id: trackId === selectedMusicId ? null : trackId };
        const { error } = await (supabase.from('profiles') as any).update(payload).eq('id', myId);
        if (error) {
            showNotification({ type: 'error', title: 'Error', message: 'Failed to set active music.' });
        } else {
            setSelectedMusicId(payload.selected_music_id || null);
            showNotification({ type: 'success', title: 'Updated', message: payload.selected_music_id ? 'Music equipped!' : 'Music unequipped.' });
        }
    };

    const handlePlayPause = (track: MusicTrack) => {
        if (playingTrackId === track.id) {
            audioRef.current?.pause();
            setPlayingTrackId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.music_url;
                audioRef.current.play().catch(e => console.error("Playback error:", e));
                setPlayingTrackId(track.id);
            } else {
                const newAudio = new Audio(track.music_url);
                newAudio.play().catch(e => console.error("Playback error:", e));
                newAudio.onended = () => setPlayingTrackId(null);
                audioRef.current = newAudio;
                setPlayingTrackId(track.id);
            }
        }
    };

    const handleGifUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploadingGif(true);
        try {
            const fileName = `${myId}-${Date.now()}-${file.name}`;
            const { publicUrl, error: uploadErr } = await uploadFileWithFallback(supabase, 'profile-gifs', fileName, file);
            if (uploadErr) throw new Error(uploadErr);

            // Deduct XP and insert GIF
            const { data: rawProf } = await supabase.from('profiles').select('xp_balance').eq('id', myId).single();
            const profileData = rawProf as any;
            if (profileData && profileData.xp_balance < UPLOAD_GIF_COST) {
                throw new Error(`Insufficient XP! You need ${UPLOAD_GIF_COST} XP to upload an animation.`);
            }

            const { error: insertError } = await (supabase.from('profile_gifs') as any).insert({
                user_id: myId,
                gif_url: publicUrl,
                storage_path: fileName
            });
            if (insertError) throw insertError;

            if (profileData) {
                await (supabase.from('profiles') as any).update({ xp_balance: profileData.xp_balance - UPLOAD_GIF_COST }).eq('id', myId);
            }

            showNotification({ type: 'success', title: 'Upload Successful', message: `Animation uploaded successfully!` });
            await fetchData();
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Upload Failed', message: err.message });
        } finally {
            setIsUploadingGif(false);
            if (gifFileInputRef.current) gifFileInputRef.current.value = "";
        }
    };

    const handleSelectGif = async (gifId: number) => {
        const payload: TablesUpdate<'profiles'> = { active_gif_id: gifId === activeGifId ? null : gifId };
        const { error } = await (supabase.from('profiles') as any).update(payload).eq('id', myId);
        if (error) {
            showNotification({ type: 'error', title: 'Error', message: 'Failed to set active animation.' });
        } else {
            setActiveGifId(payload.active_gif_id || null);
            showNotification({ type: 'success', title: 'Updated', message: payload.active_gif_id ? 'Animation equipped!' : 'Animation unequipped.' });
        }
    };

    const handleDeleteGif = async () => {
        if (!deletingGif) return;
        try {
            const { error } = await supabase.from('profile_gifs').delete().eq('id', deletingGif.id);
            if (error) throw error;
            if (activeGifId === deletingGif.id) {
                await (supabase.from('profiles') as any).update({ active_gif_id: null }).eq('id', myId);
                setActiveGifId(null);
            }
            showNotification({ type: 'success', title: 'Deleted', message: 'Animation removed successfully.' });
            await fetchData();
        } catch (err: any) {
            showNotification({ type: 'error', title: 'Error', message: err.message });
        } finally {
            setIsDeleteConfirmModalOpen(false);
            setDeletingGif(null);
        }
    };

    return (
         <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-[var(--theme-card-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Music & Animations</h1>
                <div className="w-6"></div>
            </header>

            <main className="p-4 space-y-6">
                {loading ? <div className="flex justify-center pt-20"><LoadingSpinner /></div> : 
                 error ? <p className="text-red-500 text-center">{error}</p> : (
                    <>
                        {/* Music Section */}
                        <section>
                             <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-bold text-[var(--theme-text)]">Profile Music</h2>
                                <Button size="small" className="w-auto px-4" onClick={() => musicFileInputRef.current?.click()} disabled={isUploadingMusic}>
                                    {isUploadingMusic ? <LoadingSpinner /> : <><UploadIcon className="mr-2"/> Upload</>}
                                </Button>
                                <input type="file" ref={musicFileInputRef} onChange={handleMusicUpload} accept="audio/*" className="hidden" />
                            </div>
                             <div className="space-y-2">
                                {tracks.map(track => (
                                    <div key={track.id} className="flex items-center p-3 bg-[var(--theme-card-bg)] rounded-lg">
                                        <button onClick={() => handlePlayPause(track)} className="text-[var(--theme-primary)] mr-3">
                                            {playingTrackId === track.id ? <PauseIcon/> : <PlayIcon />}
                                        </button>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-medium truncate text-[var(--theme-text)]">{track.file_name || 'Untitled Track'}</p>
                                        </div>
                                        <button onClick={() => handleSelectMusic(track.id)} className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${selectedMusicId === track.id ? 'bg-[var(--theme-primary)] text-white' : 'bg-[var(--theme-bg)] text-[var(--theme-text-secondary)]'}`}>
                                            {selectedMusicId === track.id ? 'Selected' : 'Select'}
                                        </button>
                                    </div>
                                ))}
                                {tracks.length === 0 && <p className="text-center text-sm text-[var(--theme-text-secondary)] py-4">No music uploaded yet.</p>}
                            </div>
                        </section>
                        {/* GIF Section */}
                         <section>
                             <div className="flex justify-between items-center mb-1">
                                <h2 className="text-lg font-bold text-[var(--theme-text)]">Profile Animations (GIFs)</h2>
                                <Button size="small" className="w-auto px-4" onClick={() => setIsCostConfirmModalOpen(true)} disabled={isUploadingGif}>
                                    {isUploadingGif ? <LoadingSpinner /> : <><UploadIcon className="mr-2"/> Upload GIF ({UPLOAD_GIF_COST} XP)</>}
                                </Button>
                                <input type="file" ref={gifFileInputRef} onChange={handleGifUpload} accept="image/gif" className="hidden" />
                            </div>
                            <p className="text-xs text-[var(--theme-text-secondary)] mb-3 flex items-center gap-1">
                                <span className="text-purple-500 font-bold">⚡ ImgBB System:</span>
                                <span>Upload animated GIFs directly from device — auto-generates permanent Direct URLs via Cloud Fallback!</span>
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {gifs.map(gif => (
                                    <div key={gif.id} className="relative group aspect-square bg-[var(--theme-card-bg)] rounded-lg overflow-hidden">
                                        <img src={gif.gif_url} alt="Profile animation" className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                                            {activeGifId === gif.id ? (
                                                 <div onClick={() => handleSelectGif(gif.id)} className="flex items-center text-white text-xs font-bold cursor-pointer"><CheckCircleIcon className="w-4 h-4 mr-1"/> Active</div>
                                            ) : (
                                                <Button size="small" variant="secondary" onClick={() => handleSelectGif(gif.id)} className="text-xs !h-7 w-full !bg-white/20 !text-white !border-white/50">Equip</Button>
                                            )}
                                            <button onClick={() => { setDeletingGif(gif); setIsDeleteConfirmModalOpen(true); }} className="absolute top-1 right-1 text-white hover:text-red-500">
                                                <DeleteIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             {gifs.length === 0 && <p className="text-center text-sm text-[var(--theme-text-secondary)] py-4">No GIFs uploaded yet.</p>}
                        </section>
                    </>
                 )}
            </main>
            <ConfirmationModal 
                isOpen={isCostConfirmModalOpen}
                onClose={() => setIsCostConfirmModalOpen(false)}
                onConfirm={() => { setIsCostConfirmModalOpen(false); gifFileInputRef.current?.click(); }}
                title="Upload Animation"
                message={`Uploading a new GIF costs ${UPLOAD_GIF_COST} XP. This fee is for processing and storage. Do you want to continue?`}
                confirmText={`Pay ${UPLOAD_GIF_COST} XP`}
            />
            <ConfirmationModal 
                isOpen={isDeleteConfirmModalOpen}
                onClose={() => setIsDeleteConfirmModalOpen(false)}
                onConfirm={handleDeleteGif}
                title="Delete GIF"
                message="Are you sure you want to permanently delete this animation? This cannot be undone."
                confirmText="Delete"
            />
        </div>
    );
};

export default MusicLibraryPage;