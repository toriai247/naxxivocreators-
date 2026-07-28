import React from 'react';
import { motion } from 'framer-motion';
import { MessageIcon, DiscoverIcon, ProfileIcon, ChessIcon } from '../common/AppIcons';
import type { AuthView } from '../UserApp';

interface BottomNavProps {
    activeView: AuthView;
    setAuthView: (view: 'discover' | 'chess' | 'profile' | 'messages') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setAuthView }) => {
    const navItems = [
        { view: 'discover', label: 'Discover', icon: DiscoverIcon },
        { view: 'chess', label: 'Chess', icon: ChessIcon },
        { view: 'messages', label: 'Messages', icon: MessageIcon },
        { view: 'profile', label: 'Profile', icon: ProfileIcon },
    ];

    const profileSubPages: AuthView[] = [
        'settings', 'edit-profile', 'music-library', 'tools', 
        'anime', 'anime-series', 'create-series', 'create-episode',
        'top-up', 'subscriptions', 'manual-payment',
        'store', 'collection', 'info', 'earn-xp', 'upload-cover',
        'notifications', 'events'
    ];

    return (
        <nav className="fixed bottom-0 sm:bottom-4 left-1/2 -translate-x-1/2 w-full sm:w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-20 sm:h-22 bg-[var(--theme-header-bg)]/85 backdrop-blur-xl border-t sm:border border-[var(--theme-secondary)]/30 sm:border-white/10 z-50 sm:rounded-full sm:shadow-[0_10px_35px_rgba(0,0,0,0.4)] transition-all">
            <div className="h-full flex justify-around items-center px-2 sm:px-6">
                {navItems.map((item) => {
                    const isActive = activeView === item.view || (item.view === 'profile' && profileSubPages.includes(activeView));
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.view}
                            onClick={() => setAuthView(item.view as 'discover' | 'chess' | 'profile' | 'messages')}
                            className={`transition-all duration-200 relative flex flex-col items-center justify-center h-full sm:h-16 w-20 sm:w-24 sm:rounded-2xl ${isActive ? 'text-[var(--theme-primary)] sm:bg-white/5 sm:scale-105' : 'text-[var(--theme-header-text)]/70 hover:text-[var(--theme-header-text)] hover:scale-105'}`}
                            aria-label={item.label}
                        >
                            <Icon isActive={isActive} />
                            <span className="text-[10px] sm:text-xs font-semibold mt-1 tracking-wide">{item.label}</span>
                            {isActive && <motion.div {...{layoutId: "active-nav-dot"} as any} className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-[var(--theme-primary)] rounded-full shadow-[0_0_8px_var(--theme-primary)]" />}
                        </button>
                    )
                })}
            </div>
        </nav>
    );
};

export default BottomNav;