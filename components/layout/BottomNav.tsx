import React from 'react';
import { motion } from 'framer-motion';
import { ToolsIcon, UsersIcon, ProfileIcon } from '../common/AppIcons';
import type { AuthView } from '../UserApp';
import { usePerformanceMode } from '../../utils/performanceMode';

interface BottomNavProps {
    activeView: AuthView;
    setAuthView: (view: 'discover' | 'profile' | 'messages' | 'tools') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setAuthView }) => {
    const { isLowMode } = usePerformanceMode();

    const navItems = [
        { view: 'discover', label: 'Creators', icon: UsersIcon },
        { view: 'tools', label: 'Tools Hub', icon: ToolsIcon },
        { view: 'profile', label: 'Profile', icon: ProfileIcon },
    ];

    const profileSubPages: AuthView[] = [
        'settings', 'edit-profile', 'music-library', 'tools', 
        'anime', 'anime-series', 'create-series', 'create-episode',
        'top-up', 'subscriptions', 'manual-payment',
        'store', 'collection', 'info', 'earn-xp', 'upload-cover',
        'notifications', 'events'
    ];

    if (isLowMode) {
        // LOW PERFORMANCE MODE: Bright Light & Yellow 2D Buttons (0-Lag, Flat 2D borders)
        return (
            <nav className="fixed bottom-1 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] sm:max-w-md h-12 bg-amber-50/95 dark:bg-slate-900 border-2 border-amber-400 sm:rounded-xl z-50 shadow-md px-2 flex items-center justify-around select-none">
                {navItems.map((item) => {
                    const isActive = activeView === item.view || (item.view === 'profile' && profileSubPages.includes(activeView));
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.view}
                            onClick={() => setAuthView(item.view as any)}
                            className={`flex items-center justify-center gap-1.5 px-3.5 py-1 text-xs font-mono font-black uppercase transition-none ${
                                isActive
                                    ? 'bg-amber-400 text-slate-950 border-2 border-slate-950 rounded-lg shadow-none scale-100'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-amber-400 rounded-lg'
                            }`}
                        >
                            <Icon isActive={isActive} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        );
    }

    // HIGH PERFORMANCE MODE: Ultra Glassy Light & Gold Floating Buttons
    return (
        <nav className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-[94%] sm:w-[85%] sm:max-w-md h-14 sm:h-15 bg-amber-50/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-amber-300/60 dark:border-amber-500/30 z-50 rounded-full shadow-[0_10px_30px_rgba(245,158,11,0.22)] transition-all">
            <div className="h-full flex justify-around items-center px-3">
                {navItems.map((item) => {
                    const isActive = activeView === item.view || (item.view === 'profile' && profileSubPages.includes(activeView));
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.view}
                            onClick={() => setAuthView(item.view as any)}
                            className={`transition-all duration-200 relative flex flex-col items-center justify-center h-full w-20 sm:w-24 rounded-full ${
                                isActive
                                    ? 'text-slate-950 dark:text-amber-300 scale-105 font-black'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:scale-105 font-bold'
                            }`}
                            aria-label={item.label}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-nav-glass-pill"
                                    className="absolute inset-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 rounded-full border border-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.45)] -z-10"
                                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                            )}
                            <Icon isActive={isActive} />
                            <span className={`text-[10px] font-black mt-0.5 tracking-tight ${isActive ? 'text-slate-950' : ''}`}>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    {...{ layoutId: "active-nav-dot" } as any}
                                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-950 dark:bg-amber-300 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
