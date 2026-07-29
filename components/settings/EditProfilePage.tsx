import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import Button from '../common/Button';
import Input from '../common/Input';
import type { Tables, TablesUpdate } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon, PencilSquareIcon, UploadIcon } from '../common/AppIcons';
import { generateAvatar } from '../../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { AVATAR_PRESETS, fetchDatabasePresets, type AvatarPreset } from '../../utils/avatarPresets';
import { uploadFileWithFallback } from '../../utils/storageUtils';
import { DirectImageUrlInput } from '../common/DirectImageUrlInput';

interface EditProfilePageProps {
    session: Session;
    onBack: () => void;
    onProfileUpdated: () => void;
}

type ProfileData = Pick<Tables<'profiles'>, 'name' | 'username' | 'bio' | 'photo_url' | 'cover_url'>;

const EditProfilePage: React.FC<EditProfilePageProps> = ({ session, onBack, onProfileUpdated }) => {
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');
    const [discordUrl, setDiscordUrl] = useState('');
    const [gender, setGender] = useState('');
    const [bioTagline, setBioTagline] = useState('');
    const [contentKeywords, setContentKeywords] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactLocation, setContactLocation] = useState('');
    const [telegramUrl, setTelegramUrl] = useState('');
    const [whatsappUrl, setWhatsappUrl] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [bioLinks, setBioLinks] = useState<Array<{ id: string; title: string; url: string; icon?: string; bgColor?: string }>>([]);
    
    const [modalFor, setModalFor] = useState<'avatar' | 'cover' | null>(null);
    const [tempUrl, setTempUrl] = useState('');
    const [picTab, setPicTab] = useState<'url' | 'presets' | 'upload'>('presets');
    const [presetCategory, setPresetCategory] = useState<'boys' | 'girls' | 'general'>('boys');
    const [presetsList, setPresetsList] = useState<AvatarPreset[]>(AVATAR_PRESETS);
    const [isUploadingPic, setIsUploadingPic] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchProfileAndPresets = async () => {
            setLoading(true);
            try {
                // Fetch presets from database
                const dbPresets = await fetchDatabasePresets(supabase);
                setPresetsList(dbPresets);

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();
                if (error) throw error;
                
                const profileData = data as any;
                if (profileData) {
                    setName(profileData.name || '');
                    setUsername(profileData.username || '');
                    setBio(profileData.bio || '');
                    setPhotoUrl(profileData.photo_url || '');
                    setCoverUrl(profileData.cover_url || '');
                    setWebsiteUrl(profileData.website_url || '');
                    setYoutubeUrl(profileData.youtube_url || '');
                    setFacebookUrl(profileData.facebook_url || '');
                    setInstagramUrl(profileData.instagram_url || '');
                    setTwitterUrl(profileData.twitter_url || '');
                    setTiktokUrl(profileData.tiktok_url || '');
                    setDiscordUrl(profileData.discord_url || '');
                    setGender(profileData.gender || '');
                    setBioTagline(profileData.bio_tagline || '');
                    setContentKeywords(profileData.content_keywords || '');
                    setContactEmail(profileData.contact_email || '');
                    setContactPhone(profileData.contact_phone || '');
                    setContactLocation(profileData.contact_location || '');
                    setTelegramUrl(profileData.telegram_url || '');
                    setWhatsappUrl(profileData.whatsapp_url || '');
                    setLinkedinUrl(profileData.linkedin_url || '');
                    setGithubUrl(profileData.github_url || '');
                    setBioLinks(Array.isArray(profileData.bio_links) ? (profileData.bio_links as any) : []);
                    if (profileData.gender && (profileData.gender.toLowerCase().includes('girl') || profileData.gender.toLowerCase() === 'female')) {
                        setPresetCategory('girls');
                    } else {
                        setPresetCategory('boys');
                    }
                } else {
                    throw new Error("Profile not found");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileAndPresets();
    }, [session.user.id]);
    
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    }

    const openUrlModal = (type: 'avatar' | 'cover') => {
        setModalFor(type);
        setTempUrl(type === 'avatar' ? photoUrl : coverUrl);
        if (type === 'avatar') {
            setPicTab('presets');
            if (gender && (gender.toLowerCase().includes('girl') || gender.toLowerCase() === 'female')) {
                setPresetCategory('girls');
            } else {
                setPresetCategory('boys');
            }
        } else {
            setPicTab('url');
        }
    };

    const handleUrlSubmit = () => {
        if (modalFor === 'avatar') {
            setPhotoUrl(tempUrl);
        } else {
            setCoverUrl(tempUrl);
        }
        setModalFor(null);
        setTempUrl('');
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        
        if (!name.trim() || !username.trim()) {
            setError("Name and username cannot be empty.");
            return;
        }

        setIsSaving(true);
        try {
            const updates: TablesUpdate<'profiles'> = {
                name,
                username,
                bio,
                photo_url: photoUrl,
                cover_url: coverUrl,
                website_url: websiteUrl,
                youtube_url: youtubeUrl,
                facebook_url: facebookUrl,
                instagram_url: instagramUrl,
                twitter_url: twitterUrl,
                tiktok_url: tiktokUrl,
                discord_url: discordUrl,
                gender: gender || null,
                bio_tagline: bioTagline || null,
                content_keywords: contentKeywords || null,
                contact_email: contactEmail || null,
                contact_phone: contactPhone || null,
                contact_location: contactLocation || null,
                telegram_url: telegramUrl || null,
                whatsapp_url: whatsappUrl || null,
                linkedin_url: linkedinUrl || null,
                github_url: githubUrl || null,
                bio_links: bioLinks as any,
            };

            const { error: updateError } = await (supabase
                .from('profiles') as any)
                .update(updates)
                .eq('id', session.user.id);

            if (updateError) throw updateError;
            
            showSuccess("Profile saved successfully!");
            onProfileUpdated();
            
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex items-center justify-center pt-20"><LoadingSpinner /></div>;
    }

    return (
        <div className="pb-6">
             <header className="flex items-center p-4">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Edit Profile</h1>
                <div className="w-6"></div> {/* Placeholder */}
             </header>
            
             <div className="relative mb-20">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                    {coverUrl ? <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[var(--theme-secondary)] to-[var(--theme-primary)]"></div>}
                    <button onClick={() => openUrlModal('cover')} className="absolute bottom-2 right-2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                        <PencilSquareIcon className="w-5 h-5" />
                    </button>
                </div>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative group">
                        <img src={photoUrl || generateAvatar(username)} alt="Profile" className="w-32 h-32 rounded-full object-cover border-8 border-[var(--theme-bg)] shadow-lg" />
                        <button onClick={() => openUrlModal('avatar')} className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                           <PencilSquareIcon className="w-8 h-8"/>
                        </button>
                    </div>
                </div>
             </div>

             <form className="space-y-8 px-4" onSubmit={handleSaveChanges}>
                 <section className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} required />
                        <Input id="username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSaving} required />
                     </div>
                     <div className="mt-6">
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Gender (Helps customize avatar choices)</label>
                        <select
                            id="gender"
                            value={gender}
                            onChange={(e) => {
                                setGender(e.target.value);
                                if (e.target.value === 'girls' || e.target.value === 'female' || e.target.value === 'girl') setPresetCategory('girls');
                                else if (e.target.value === 'boys' || e.target.value === 'male' || e.target.value === 'boy') setPresetCategory('boys');
                            }}
                            disabled={isSaving}
                            className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border border-transparent rounded-lg text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm"
                        >
                            <option value="">Select Gender</option>
                            <option value="boys">Boys 👦</option>
                            <option value="girls">Girls 👧</option>
                            <option value="other">Other / Custom</option>
                        </select>
                     </div>
                     <div className="mt-6">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bio</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="appearance-none block w-full px-4 py-3 bg-[var(--theme-bg)] border border-transparent rounded-lg text-[var(--theme-text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] sm:text-sm"
                            disabled={isSaving}
                        />
                    </div>
                 </section>
                
                <section className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-[var(--theme-text)] mb-4">Social Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                        <Input id="websiteUrl" label="Website URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} disabled={isSaving} />
                        <Input id="youtubeUrl" label="YouTube URL" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} disabled={isSaving} />
                        <Input id="facebookUrl" label="Facebook URL" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} disabled={isSaving} />
                        <Input id="instagramUrl" label="Instagram URL" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} disabled={isSaving} />
                        <Input id="twitterUrl" label="X (Twitter) URL" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} disabled={isSaving} />
                        <Input id="tiktokUrl" label="TikTok URL" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} disabled={isSaving} />
                        <Input id="discordUrl" label="Discord Invite URL" value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} disabled={isSaving} />
                        <Input id="telegramUrl" label="Telegram URL / Username" value={telegramUrl} onChange={e => setTelegramUrl(e.target.value)} disabled={isSaving} />
                        <Input id="whatsappUrl" label="WhatsApp Link / Number" value={whatsappUrl} onChange={e => setWhatsappUrl(e.target.value)} disabled={isSaving} />
                        <Input id="linkedinUrl" label="LinkedIn Profile URL" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} disabled={isSaving} />
                        <Input id="githubUrl" label="GitHub Profile URL" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} disabled={isSaving} />
                    </div>
                </section>

                <section className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-[var(--theme-text)] mb-2">🎯 Creator Content Keywords & Topics</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-4">Add comma-separated keywords describing your content (e.g. <code>Gaming, Anime AMV, Tech Reviews, Vlogs, Music, Motion Design</code>). This makes your profile easily discoverable in creator searches!</p>
                    <div className="space-y-4">
                        <Input 
                            id="contentKeywords" 
                            label="Content Keywords / Niche Tags" 
                            value={contentKeywords} 
                            onChange={e => setContentKeywords(e.target.value)} 
                            placeholder="e.g. Gaming, Anime AMV, Tech Reviews, Vlogs, Music, Editing" 
                            disabled={isSaving} 
                        />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] font-extrabold uppercase text-indigo-400 mr-1 flex items-center">Quick Add:</span>
                            {['🎮 Gaming', '🎬 Vlogs', '🎨 Editing & AMV', '🎵 Music', '💻 Tech & Dev', '🍿 Anime', '⚽ Sports', '📸 Photography', '🎓 Education'].map(tag => {
                                const cleanTag = tag.replace(/^[^\w\s]+/, '').trim();
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => {
                                            const existing = contentKeywords ? contentKeywords.split(',').map(s => s.trim()).filter(Boolean) : [];
                                            if (!existing.includes(cleanTag)) {
                                                const updated = [...existing, cleanTag].join(', ');
                                                setContentKeywords(updated);
                                            }
                                        }}
                                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        + {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm">
                    <h3 className="text-lg font-bold text-[var(--theme-text)] mb-2">✨ Smart Bio Tagline & Contact Info</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-4">This info will be publicly visible on your Bio Link Hub when visitors view your shareable link without login!</p>
                    <div className="space-y-6">
                        <Input id="bioTagline" label="Bio Tagline (Short catchy quote)" value={bioTagline} onChange={e => setBioTagline(e.target.value)} placeholder="e.g., Anime Creator & Streamer 🎮✨" disabled={isSaving} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input id="contactEmail" label="Public Email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="hello@example.com" disabled={isSaving} />
                            <Input id="contactPhone" label="Public Phone / SMS" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 234 567 8900" disabled={isSaving} />
                            <Input id="contactLocation" label="Location / City" value={contactLocation} onChange={e => setContactLocation(e.target.value)} placeholder="Tokyo, Japan" disabled={isSaving} />
                        </div>
                    </div>
                </section>

                <section className="bg-[var(--theme-card-bg)] p-6 rounded-2xl shadow-sm border-2 border-indigo-500/20">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-[var(--theme-text)] flex items-center gap-2">
                            <span>🔗 Bio Link Hub (Linktree Custom Buttons)</span>
                        </h3>
                        <button
                            type="button"
                            onClick={() => {
                                setBioLinks([...bioLinks, { id: String(Date.now()), title: 'My New Link', url: 'https://', icon: '🌐', bgColor: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }]);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-md"
                        >
                            + Add Link Button
                        </button>
                    </div>
                    <p className="text-xs text-[var(--theme-text-secondary)] mb-4">Add custom buttons to your public Bio Link Hub. Customize title, link, icon, and button color!</p>
                    
                    {bioLinks.length === 0 ? (
                        <div className="p-6 text-center bg-[var(--theme-bg)] rounded-xl border border-dashed border-gray-500/20">
                            <p className="text-xs text-[var(--theme-text-secondary)]">No custom link buttons added. Click "+ Add Link Button" above!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bioLinks.map((link, idx) => (
                                <div key={link.id || idx} className="p-4 bg-[var(--theme-bg)] rounded-xl border border-gray-500/20 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 w-full flex-1">
                                        <input
                                            type="text"
                                            value={link.title}
                                            onChange={(e) => {
                                                const updated = [...bioLinks];
                                                updated[idx].title = e.target.value;
                                                setBioLinks(updated);
                                            }}
                                            placeholder="Button Title"
                                            className="px-3 py-2 bg-[var(--theme-card-bg)] rounded-lg text-xs font-bold text-[var(--theme-text)] border border-gray-500/20 focus:outline-none focus:border-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            value={link.url}
                                            onChange={(e) => {
                                                const updated = [...bioLinks];
                                                updated[idx].url = e.target.value;
                                                setBioLinks(updated);
                                            }}
                                            placeholder="https://..."
                                            className="px-3 py-2 bg-[var(--theme-card-bg)] rounded-lg text-xs font-mono text-[var(--theme-text)] border border-gray-500/20 focus:outline-none focus:border-indigo-500 sm:col-span-2"
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                value={link.icon || '🌐'}
                                                onChange={(e) => {
                                                    const updated = [...bioLinks];
                                                    updated[idx].icon = e.target.value;
                                                    setBioLinks(updated);
                                                }}
                                                className="px-2 py-2 bg-[var(--theme-card-bg)] rounded-lg text-sm border border-gray-500/20"
                                            >
                                                <option value="🌐">🌐 Web</option>
                                                <option value="🛍️">🛍️ Shop</option>
                                                <option value="🎮">🎮 Gaming</option>
                                                <option value="💼">💼 Work</option>
                                                <option value="🎵">🎵 Music</option>
                                                <option value="📺">📺 Stream</option>
                                                <option value="💬">💬 Chat</option>
                                                <option value="✨">✨ VIP</option>
                                            </select>
                                            <select
                                                value={link.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}
                                                onChange={(e) => {
                                                    const updated = [...bioLinks];
                                                    updated[idx].bgColor = e.target.value;
                                                    setBioLinks(updated);
                                                }}
                                                className="px-2 py-2 bg-[var(--theme-card-bg)] rounded-lg text-xs font-semibold border border-gray-500/20 flex-1"
                                            >
                                                <option value="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)">🟣 Purple Gradient</option>
                                                <option value="linear-gradient(135deg, #059669 0%, #0d9488 100%)">🟢 Emerald Gradient</option>
                                                <option value="linear-gradient(135deg, #e11d48 0%, #f97316 100%)">🔴 Sunset Gradient</option>
                                                <option value="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)">🔵 Blue Gradient</option>
                                                <option value="linear-gradient(135deg, #1f2937 0%, #111827 100%)">⚫ Classic Black</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBioLinks(bioLinks.filter((_, i) => i !== idx));
                                        }}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold self-end sm:self-center shrink-0"
                                        title="Delete Link"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
                 <div className="pt-2">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
            
            {error && <p className="text-red-500 text-sm mt-4 text-center px-4">{error}</p>}
            {successMessage && <p className="text-green-600 text-sm mt-4 text-center px-4">{successMessage}</p>}

            <AnimatePresence>
                {modalFor && (
                    <motion.div
                        {...{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 },
                        } as any}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={() => setModalFor(null)}
                    >
                        <motion.div
                            {...{
                                initial: { scale: 0.9, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.9, opacity: 0 },
                                transition: { type: 'spring', stiffness: 300, damping: 30 },
                            } as any}
                            className={`bg-[var(--theme-card-bg)] rounded-2xl p-6 w-full ${modalFor === 'avatar' ? 'max-w-lg' : 'max-w-sm'} shadow-xl border border-gray-200 dark:border-gray-800`}
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-bold text-[var(--theme-text)] mb-2">
                                {modalFor === 'avatar' ? 'Choose Profile Picture' : 'Set Cover Photo URL'}
                            </h2>

                            {modalFor === 'avatar' && (
                                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setPicTab('presets')}
                                        className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${picTab === 'presets' ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}
                                    >
                                        🎨 Avatar Presets
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPicTab('url')}
                                        className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${picTab !== 'presets' ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}
                                    >
                                        🔗 Direct URL / ☁️ Upload
                                    </button>
                                </div>
                            )}

                            {modalFor === 'avatar' && picTab === 'presets' ? (
                                <div>
                                    <div className="flex items-center justify-center space-x-2 mb-4 bg-[var(--theme-bg)] p-1.5 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setPresetCategory('boys')}
                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center space-x-1 ${presetCategory === 'boys' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                                        >
                                            <span>👦</span>
                                            <span>Boys</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPresetCategory('girls')}
                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center space-x-1 ${presetCategory === 'girls' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                                        >
                                            <span>👧</span>
                                            <span>Girls</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPresetCategory('general')}
                                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center space-x-1 ${presetCategory === 'general' ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                                        >
                                            <span>✨</span>
                                            <span>All / Gen</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1 hide-scrollbar">
                                        {presetsList.filter(p => presetCategory === 'general' ? true : p.category === presetCategory).map((preset) => {
                                            const isSelected = tempUrl === preset.url;
                                            return (
                                                <div
                                                    key={preset.id}
                                                    onClick={() => setTempUrl(preset.url)}
                                                    className={`cursor-pointer rounded-xl p-1.5 transition-all flex flex-col items-center border-2 ${isSelected ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/10 scale-105 shadow-md' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-[var(--theme-bg)]'}`}
                                                >
                                                    <img src={preset.url} alt={preset.label} className="w-14 h-14 rounded-full object-cover mb-1 bg-white shadow-inner" />
                                                    <span className="text-[10px] text-center font-medium truncate w-full text-[var(--theme-text)]">{preset.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <DirectImageUrlInput
                                        value={tempUrl}
                                        onChange={setTempUrl}
                                        label={modalFor === 'avatar' ? "Profile Picture Direct URL (Animated GIFs Supported!)" : "Cover Photo Direct URL (Animated GIFs Supported!)"}
                                        placeholder="https://i.ibb.co/... or click '⚡ Upload GIF/Image' to auto-generate"
                                        previewAspectRatio={modalFor === 'avatar' ? 'square' : 'cover'}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <Button variant="secondary" size="small" className="w-auto px-4" onClick={() => setModalFor(null)}>Cancel</Button>
                                <Button size="small" className="w-auto px-4" onClick={handleUrlSubmit}>
                                    {modalFor === 'avatar' && picTab === 'presets' ? 'Select Avatar' : 'Set Image'}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditProfilePage;