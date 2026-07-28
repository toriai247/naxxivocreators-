import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import Input from '../common/Input';
import { TrashIcon, PlusCircleIcon, CheckCircleIcon } from '../common/AppIcons';
import { DirectImageUrlInput } from '../common/DirectImageUrlInput';

interface PresetAvatarRow {
    id: number;
    name: string;
    image_url: string;
    category: 'boys' | 'girls' | 'general';
    is_active: boolean;
    created_at?: string;
}

const AdminPresetAvatarsPage: React.FC = () => {
    const [avatars, setAvatars] = useState<PresetAvatarRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state for new preset
    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [category, setCategory] = useState<'boys' | 'girls' | 'general'>('boys');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterCat, setFilterCat] = useState<string>('all');

    const fetchAvatars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchErr } = await supabase
                .from('preset_avatars')
                .select('*')
                .order('id', { ascending: false });

            if (fetchErr) {
                throw fetchErr;
            }
            setAvatars(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch preset avatars from database.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvatars();
    }, [fetchAvatars]);

    const handleAddAvatar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !imageUrl.trim()) {
            alert('Please enter both name and image URL.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error: insertErr } = await (supabase.from('preset_avatars') as any)
                .insert([
                    {
                        name: name.trim(),
                        image_url: imageUrl.trim(),
                        category,
                        is_active: true
                    }
                ]);

            if (insertErr) throw insertErr;

            setName('');
            setImageUrl('');
            await fetchAvatars();
        } catch (err: any) {
            alert(`Error adding preset: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
        try {
            const { error: updErr } = await (supabase.from('preset_avatars') as any)
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (updErr) throw updErr;
            setAvatars(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
        } catch (err: any) {
            alert(`Error updating status: ${err.message}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this avatar preset?')) return;
        try {
            const { error: delErr } = await supabase
                .from('preset_avatars')
                .delete()
                .eq('id', id);

            if (delErr) throw delErr;
            setAvatars(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            alert(`Error deleting preset: ${err.message}`);
        }
    };

    const filteredAvatars = filterCat === 'all' 
        ? avatars 
        : avatars.filter(a => a.category === filterCat);

    return (
        <div className="p-6 space-y-8 overflow-y-auto max-h-full">
            <div className="bg-[var(--theme-card-bg)] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-[var(--theme-text)] mb-4 flex items-center space-x-2">
                    <PlusCircleIcon className="w-6 h-6 text-[var(--theme-primary)]" />
                    <span>Add New Preset Avatar</span>
                </h2>
                <form onSubmit={handleAddAvatar} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            id="avatarName"
                            label="Avatar Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Cyber Ninja"
                            required
                        />
                        <div>
                            <label htmlFor="avatarCategory" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Category
                            </label>
                            <select
                                id="avatarCategory"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="appearance-none block w-full px-4 py-2.5 bg-[var(--theme-bg)] border border-transparent rounded-lg text-[var(--theme-text)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)] text-sm"
                            >
                                <option value="boys">Boys 👦</option>
                                <option value="girls">Girls 👧</option>
                                <option value="general">General ✨</option>
                            </select>
                        </div>
                    </div>
                    <DirectImageUrlInput
                        value={imageUrl}
                        onChange={setImageUrl}
                        label="Direct Image URL / Auto-Upload"
                        placeholder="https://i.ibb.co/... or click side button to generate"
                        previewAspectRatio="square"
                    />
                    <div>
                        <Button type="submit" disabled={isSubmitting || !imageUrl} className="w-full sm:w-auto px-8">
                            {isSubmitting ? 'Adding...' : 'Add Preset'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-[var(--theme-card-bg)] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--theme-text)]">Existing Preset Avatars ({avatars.length})</h2>
                        <p className="text-sm text-[var(--theme-text-secondary)]">Manage profile pictures users can choose from during registration or edit profile.</p>
                    </div>
                    <div className="flex space-x-2 bg-[var(--theme-bg)] p-1 rounded-xl">
                        {['all', 'boys', 'girls', 'general'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCat(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filterCat === cat ? 'bg-[var(--theme-primary)] text-white shadow-sm' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]'}`}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="large" />
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-500/10 text-red-500 rounded-xl text-center">
                        <p>{error}</p>
                        <button onClick={fetchAvatars} className="mt-2 text-xs font-bold underline">Try Again</button>
                    </div>
                ) : filteredAvatars.length === 0 ? (
                    <div className="text-center py-12 text-[var(--theme-text-secondary)]">
                        No preset avatars found in this category. Add some above!
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredAvatars.map((item) => (
                            <div
                                key={item.id}
                                className={`relative rounded-2xl p-3 border-2 flex flex-col items-center bg-[var(--theme-bg)] transition-all ${item.is_active ? 'border-gray-200 dark:border-gray-800' : 'border-red-500/30 opacity-50'}`}
                            >
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-20 h-20 rounded-full object-cover mb-2 shadow-md bg-white"
                                />
                                <span className="text-xs font-bold text-center text-[var(--theme-text)] truncate w-full">{item.name}</span>
                                <span className="text-[10px] uppercase font-semibold text-[var(--theme-primary)] mb-3">{item.category}</span>

                                <div className="flex space-x-2 w-full mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleActive(item.id, item.is_active)}
                                        title={item.is_active ? "Deactivate" : "Activate"}
                                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${item.is_active ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'}`}
                                    >
                                        {item.is_active ? 'Active' : 'Hidden'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        title="Delete"
                                        className="p-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPresetAvatarsPage;
