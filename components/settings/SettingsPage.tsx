import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { motion } from 'framer-motion';
import {
    BackArrowIcon, UserCircleIcon, LockIcon, CreditCardIcon,
    BellIcon, ShieldCheckIcon, QuestionMarkCircleIcon, InfoIcon, LogoutIcon, AdminIcon, ChevronRightIcon
} from '../common/AppIcons';
import Button from '../common/Button';
import type { Session } from '@supabase/auth-js';
import type { Tables } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import Avatar from '../common/Avatar';
import { formatXp } from '../../utils/helpers';

interface SettingsPageProps {
    session: Session;
    onBack: () => void;
    onNavigateToEditProfile: () => void;
    onNavigateToMusicLibrary: () => void;
    onLogout: () => void;
    onNavigateToAdminPanel: () => void;
    onNavigateToSubscriptions: () => void;
    onNavigateToNotifications: () => void;
    onNavigateToInfo: () => void;
    onNavigateToPasswordSecurity: () => void;
    onNavigateToPrivacy: () => void;
}

const SettingsItem = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center p-4 text-left group transition-colors duration-200 rounded-lg dark:hover:bg-white/5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-[var(--theme-secondary)] group-hover:bg-[var(--theme-primary)]/20 transition-colors">
            {icon}
        </div>
        <div className="flex-grow">
            <p className="font-medium text-[var(--theme-text)]">{title}</p>
        </div>
        <ChevronRightIcon />
    </button>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    session, 
    onBack, 
    onLogout, 
    onNavigateToEditProfile, 
    onNavigateToMusicLibrary, 
    onNavigateToAdminPanel,
    onNavigateToSubscriptions,
    onNavigateToNotifications,
    onNavigateToInfo,
    onNavigateToPasswordSecurity,
    onNavigateToPrivacy
}) => {
    const [profile, setProfile] = useState<Pick<Tables<'profiles'>, 'is_admin' | 'xp_balance' | 'name' | 'username' | 'photo_url'> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin, xp_balance, name, username, photo_url')
                .eq('id', session.user.id)
                .single();
            if (data) {
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [session.user.id]);

    const canAccessAdmin = profile && (profile.is_admin || profile.xp_balance >= 10000);

    const accountSettings = [
        { icon: <UserCircleIcon className="text-blue-500" />, title: "Account Details", onClick: onNavigateToEditProfile },
        { icon: <LockIcon className="text-green-500" />, title: "Security & Password", onClick: onNavigateToPasswordSecurity },
        { icon: <CreditCardIcon className="text-purple-500" />, title: "Subscriptions", onClick: onNavigateToSubscriptions },
        { icon: <BellIcon className="text-yellow-500" />, title: "Notifications", onClick: onNavigateToNotifications },
    ];
    
    const moreSettings = [
        { icon: <ShieldCheckIcon className="text-teal-500" />, title: "Privacy Center", onClick: onNavigateToPrivacy },
        { icon: <QuestionMarkCircleIcon className="text-orange-500" />, title: "Help & Support", onClick: onNavigateToInfo },
        { icon: <InfoIcon className="text-indigo-500" />, title: "About NAXXIVO", onClick: onNavigateToInfo },
    ];

    if (loading) {
        return (
             <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
                <header className="flex-shrink-0 flex items-center p-4">
                    <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                    <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Settings</h1>
                    <div className="w-6"></div>
                </header>
                <div className="flex-grow flex items-center justify-center"><LoadingSpinner/></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
            <header className="flex-shrink-0 flex items-center p-4">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Settings</h1>
                <div className="w-6"></div> {/* Placeholder for centering */}
            </header>
            
            <main className="flex-grow overflow-y-auto px-4">
                <motion.div 
                    {...{
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.1 },
                    } as any}
                >
                    <button 
                        onClick={onNavigateToEditProfile}
                        className="w-full flex items-center p-4 bg-[var(--theme-card-bg)] rounded-2xl shadow-sm text-left mb-6 group"
                    >
                         <Avatar 
                            photoUrl={profile?.photo_url} 
                            name={profile?.name} 
                            size="lg"
                            containerClassName="flex-shrink-0"
                        />
                        <div className="ml-4 flex-grow">
                            <p className="font-bold text-lg text-[var(--theme-text)]">{profile?.name || profile?.username}</p>
                            <p className="text-sm text-[var(--theme-text-secondary)]">@{profile?.username}</p>
                        </div>
                        <ChevronRightIcon />
                    </button>
                </motion.div>

                <motion.div 
                    {...{
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.2 },
                    } as any}
                    className="bg-[var(--theme-card-bg)] rounded-2xl shadow-sm"
                >
                    {accountSettings.map((item, index) => (
                         <div key={item.title} className="border-b border-black/5 dark:border-white/5 last:border-b-0">
                            <SettingsItem {...item} />
                        </div>
                    ))}
                </motion.div>
                
                 <motion.div 
                    {...{
                        initial: { opacity: 0, y: -20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.3 },
                    } as any}
                    className="bg-[var(--theme-card-bg)] rounded-2xl shadow-sm mt-6"
                >
                    {moreSettings.map((item) => (
                         <div key={item.title} className="border-b border-black/5 dark:border-white/5 last:border-b-0">
                            <SettingsItem {...item} />
                        </div>
                    ))}
                </motion.div>
                
                {canAccessAdmin && (
                    <motion.div 
                        {...{
                            initial: { opacity: 0, y: -20 },
                            animate: { opacity: 1, y: 0 },
                            transition: { delay: 0.4 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-2xl shadow-sm mt-6"
                    >
                        <SettingsItem
                            icon={<AdminIcon className="text-red-500"/>}
                            title="Admin Panel"
                            onClick={onNavigateToAdminPanel}
                        />
                    </motion.div>
                )}
            </main>

            <footer className="p-4 flex-shrink-0">
                <Button onClick={onLogout} variant="secondary" className="!bg-red-500/10 !text-red-600 hover:!bg-red-500/20 !border-transparent">
                     <LogoutIcon className="mr-2"/>
                    Sign Out
                </Button>
            </footer>
        </div>
    );
};

export default SettingsPage;