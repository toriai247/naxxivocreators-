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
            className="fixed inset-0 bg-[var(--theme-bg)]/80 backdrop-blur-lg z-[100] flex flex-col"
        >
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
                 <button onClick={onClose} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-primary)] mr-3"><BackArrowIcon /></button>
                 <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--theme-card-bg-alt)] border-transparent rounded-full text-[var(--theme-text)] placeholder-gray-500 px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]"
                        autoFocus
                    />
                </div>
            </header>
            
            <main className="flex-grow overflow-y-auto p-4">
                {loading && (
                    <div className="flex justify-center pt-10"><LoadingSpinner /></div>
                )}
                {!loading && debouncedSearchTerm && results.length === 0 && (
                     <div className="text-center text-[var(--theme-text-secondary)] pt-10">No users found for "{debouncedSearchTerm}".</div>
                )}
                <div className="space-y-3">
                    {results.map(profile => (
                         <button
                            key={profile.id}
                            onClick={() => onViewProfile(profile.id)}
                            className="w-full flex items-center p-2 rounded-lg hover:bg-[var(--theme-card-bg-alt)] transition-colors"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img 
                                    src={profile.photo_url || generateAvatar(profile.name || profile.username)} 
                                    alt={profile.name || ''} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="ml-4 text-left">
                                <p className="font-semibold text-[var(--theme-text)] truncate">{profile.name || profile.username}</p>
                                <p className="text-sm text-[var(--theme-text-secondary)] truncate">@{profile.username}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </main>

        </motion.div>
    );
};

export default SearchOverlay;