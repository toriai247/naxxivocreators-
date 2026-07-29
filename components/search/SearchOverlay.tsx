import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables } from '../../integrations/supabase/types';
import { motion } from 'framer-motion';
import { SearchIcon, BackArrowIcon } from '../common/AppIcons';
import LoadingSpinner from '../common/LoadingSpinner';
import { generateAvatar } from '../../utils/helpers';

interface SearchOverlayProps {
    onClose: () => void;
    onViewProfile: (userId: string) => void;
}

// Use a specific Pick type for search results to improve performance
type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url'>;

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose, onViewProfile }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedSearchTerm.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                // Select only required fields instead of '*'
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name, username, photo_url')
                    .or(`name.ilike.%${debouncedSearchTerm}%,username.ilike.%${debouncedSearchTerm}%`)
                    .limit(10);
                
                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        searchUsers();
    }, [debouncedSearchTerm]);

    return (
        <motion.div
            {...{
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                exit: { opacity: 0 },
            } as any}
            className="fixed inset-0 bg-slate-950/90 dark:bg-slate-950/90 backdrop-blur-xl z-[100] flex flex-col text-slate-100"
        >
            <header className="flex items-center p-4 sm:p-5 border-b border-amber-500/20 bg-slate-900/80 flex-shrink-0 gap-3">
                 <button onClick={onClose} className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-colors">
                    <BackArrowIcon />
                 </button>
                 <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                        <SearchIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search creators by name, @username, or keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950/80 border border-amber-400/40 focus:border-amber-400 rounded-2xl text-white placeholder-slate-400 px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] text-sm font-semibold transition-all"
                        autoFocus
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-300 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4 sm:p-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center pt-16">
                        <LoadingSpinner />
                        <p className="mt-3 text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">Searching creators...</p>
                    </div>
                )}
                {!loading && debouncedSearchTerm && results.length === 0 && (
                     <div className="text-center pt-16 p-8 bg-slate-900/50 rounded-3xl border border-amber-500/10 max-w-sm mx-auto">
                        <span className="text-3xl mb-2 block">🔍</span>
                        <p className="text-sm font-bold text-slate-200">No creators found</p>
                        <p className="text-xs text-slate-400 mt-1">No matching users for "{debouncedSearchTerm}".</p>
                     </div>
                )}
                {!loading && !debouncedSearchTerm && (
                    <div className="text-center pt-12 pb-6 max-w-md mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                            <span>👑 Discover Creators</span>
                        </div>
                        <p className="text-xs text-slate-400">Type a name, @handle, or topic above to find top creators.</p>
                    </div>
                )}
                <div className="space-y-3 max-w-2xl mx-auto">
                    {results.map(profile => (
                         <button
                            key={profile.id}
                            onClick={() => onViewProfile(profile.id)}
                            className="w-full flex items-center p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-amber-500/15 hover:border-amber-400/50 transition-all group text-left shadow-md hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        >
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border-2 border-amber-400/40 group-hover:border-amber-400 transition-colors">
                                <img 
                                    src={profile.photo_url || generateAvatar(profile.name || profile.username)} 
                                    alt={profile.name || ''} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="ml-4 flex-grow truncate">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-white group-hover:text-amber-300 transition-colors truncate text-sm">{profile.name || profile.username}</p>
                                    <span className="text-amber-400 text-xs font-black">✓</span>
                                </div>
                                <p className="text-xs font-bold text-amber-400/80 truncate">@{profile.username}</p>
                            </div>
                            <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shrink-0">
                                View →
                            </span>
                        </button>
                    ))}
                </div>
            </main>

        </motion.div>
    );
};

export default SearchOverlay;