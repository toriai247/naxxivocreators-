import React, { useState, useEffect, lazy, Suspense } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../integrations/supabase/client';
import BottomNav from './layout/BottomNav';
import SearchOverlay from './search/SearchOverlay';
import PasswordModal from './common/PasswordModal';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationPopup, { type NotificationDetails } from './common/NotificationPopup';
import Button from './common/Button';
import type { Json } from '../integrations/supabase/types';

// Lazy load pages
const Profile = lazy(() => import('./Profile'));
const MessagesPage = lazy(() => import('./messages/MessagesPage'));
const ChatPage = lazy(() => import('./messages/ChatPage'));
const SettingsPage = lazy(() => import('./settings/SettingsPage'));
const EditProfilePage = lazy(() => import('./settings/EditProfilePage'));
const UsersPage = lazy(() => import('./users/UsersPage'));
const MusicLibraryPage = lazy(() => import('./music/MusicLibraryPage'));
const ToolsPage = lazy(() => import('./tools/ToolsPage'));
const AnimePage = lazy(() => import('./anime/AnimePage'));
const SeriesDetailPage = lazy(() => import('./anime/SeriesDetailPage'));
const CreateSeriesPage = lazy(() => import('./anime/CreateSeriesPage'));
const CreateEpisodePage = lazy(() => import('./anime/CreateEpisodePage'));
const TopUpPage = lazy(() => import('./xp/TopUpPage'));
const SubscriptionClaimPage = lazy(() => import('./xp/SubscriptionClaimPage'));
const ManualPaymentPage = lazy(() => import('./xp/ManualPaymentPage'));
const StorePage = lazy(() => import('./store/StorePage'));
const CollectionPage = lazy(() => import('./store/CollectionPage'));
const SellPage = lazy(() => import('./store/SellPage'));
const InfoPage = lazy(() => import('./info/InfoPage'));
const EarnXpPage = lazy(() => import('./xp/EarnXpPage'));
const UploadCoverPage = lazy(() => import('./store/UploadCoverPage'));
const NotificationsPage = lazy(() => import('./notifications/NotificationsPage'));
const EventsPage = lazy(() => import('./events/EventsPage'));
const LuckRoyalePage = lazy(() => import('./events/LuckRoyalePage'));
const ImageEditorPage = lazy(() => import('./editor/ImageEditorPage'));
const PasswordSecurityPage = lazy(() => import('./settings/PasswordSecurityPage'));
const PrivacyPage = lazy(() => import('./settings/PrivacyPage'));
const ImageCompressorPage = lazy(() => import('./tools/ImageCompressorPage'));

export type AuthView =
    'discover' | 'profile' | 'settings' | 'messages' | 'edit-profile' | 'music-library' |
    'tools' | 'anime' | 'anime-series' | 'create-series' | 'create-episode' |
    'top-up' | 'subscriptions' | 'manual-payment' |
    'store' | 'collection' | 'info' | 'earn-xp' | 'upload-cover' | 'notifications' | 'events' | 'luck-royale' | 'sell-page' |
    'password-security' | 'privacy' | 'image-editor' | 'image-compressor';

const pageVariants = {
    initial: { opacity: 0, y: 12 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -12 },
};

const pageTransition = {
    type: "tween",
    ease: "easeOut",
    duration: 0.22,
};

interface UserAppProps {
    session: Session;
    onEnterAdminView: () => void;
}

const UserApp: React.FC<UserAppProps> = ({ session, onEnterAdminView }) => {
    const [authView, setAuthView] = useState<AuthView>('discover');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
    const [viewingSeriesId, setViewingSeriesId] = useState<number | null>(null);
    const [paymentProductId, setPaymentProductId] = useState<number | null>(null);
    const [chattingWith, setChattingWith] = useState<{ id: string; name: string; photo_url: string | null; active_cover: { preview_url: string | null; asset_details: Json } | null } | null>(null);
    const [refreshAnimeKey, setRefreshAnimeKey] = useState(0);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    const [notification, setNotification] = useState<NotificationDetails | null>(null);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    
    const isLuckRoyale = authView === 'luck-royale';
    
    useEffect(() => {
        // Handle app shortcut navigation
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');
        if (view === 'profile' || view === 'messages' || view === 'discover' || view === 'tools') {
            setAuthView(view as AuthView);
            // Clean up the URL to prevent re-triggering on reload
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch initial unread count
        const fetchUnreadCount = async () => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false);
            if(error) console.error(error);
            setUnreadNotificationCount(count || 0);
        };
        fetchUnreadCount();

        // Listen for new notifications in real-time
        const channel = supabase
            .channel('public:notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${session.user.id}`
            }, (payload) => {
                setUnreadNotificationCount(current => current + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session.user.id]);
    
    const showNotification = (details: NotificationDetails) => {
        setNotification(details);
    };
    
    const showBrowserNotification = (title: string, body: string) => {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo192.png' });
        }
    };
    
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            setShowPermissionBanner(true);
        }
    }, []);

    const handleRequestPermission = () => {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification({ type: 'success', title: 'Notifications Enabled!', message: 'You will now receive updates from NAXXIVO.'});
            } else {
                 showNotification({ type: 'info', title: 'Notifications Blocked', message: 'You can enable them in your browser settings later.'});
            }
            setShowPermissionBanner(false);
        });
    };
    

    const handleLogout = async () => {
        await (supabase.auth as any).signOut();
    };

    const handleSetAuthView = (view: 'discover' | 'chess' | 'profile' | 'messages') => {
        setViewingProfileId(null);
        setChattingWith(null);
        setViewingSeriesId(null);
        setAuthView(view);
    };
    
    const handleNavigateToSettings = () => {
        setViewingProfileId(null);
        setAuthView('settings');
    }

    const handleNavigateToMusicLibrary = () => setAuthView('music-library');
    const handleNavigateToEditProfile = () => setAuthView('edit-profile');
    const handleNavigateToTools = () => setAuthView('tools');
    const handleNavigateToAnime = () => setAuthView('anime');
    const handleNavigateToCreateSeries = () => setAuthView('create-series');
    const handleNavigateToCreateEpisode = () => setAuthView('create-episode');
    const handleNavigateToTopUp = () => setAuthView('top-up');
    const handleNavigateToSubscriptions = () => setAuthView('subscriptions');
    const handleNavigateToManualPayment = (productId: number) => {
        setPaymentProductId(productId);
        setAuthView('manual-payment');
    }
    const handleNavigateToStore = () => setAuthView('store');
    const handleNavigateToCollection = () => setAuthView('collection');
    const handleNavigateToSellPage = () => setAuthView('sell-page');
    const handleNavigateToInfo = () => setAuthView('info');
    const handleNavigateToEarnXp = () => setAuthView('earn-xp');
    const handleNavigateToUploadCover = () => setAuthView('upload-cover');
    const handleNavigateToNotifications = () => setAuthView('notifications');
    const handleNavigateToEvents = () => setAuthView('events');
    const handleNavigateToLuckRoyale = () => setAuthView('luck-royale');
    const handleNavigateToPasswordSecurity = () => setAuthView('password-security');
    const handleNavigateToPrivacy = () => setAuthView('privacy');
    const handleNavigateToImageEditor = () => setAuthView('image-editor');
    const handleNavigateToImageCompressor = () => setAuthView('image-compressor');

    const handleViewProfile = (userId: string) => {
        setIsSearchOpen(false);
        setAuthView('profile');
        setViewingProfileId(userId);
    };

    const handleViewSeries = (seriesId: number) => {
        setViewingSeriesId(seriesId);
        setAuthView('anime-series');
    };

    let pageContent;
    if (chattingWith) {
         pageContent = (
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-[var(--theme-text-secondary)]">Loading...</div>}>
                <ChatPage session={session} otherUser={chattingWith} onBack={() => setChattingWith(null)}/>
            </Suspense>
        );
    } else {
        const CurrentPage = {
            discover: <UsersPage session={session} onViewProfile={handleViewProfile} />,
            messages: <MessagesPage session={session} onStartChat={setChattingWith} />,
            profile: <Profile 
                        session={session} 
                        userId={viewingProfileId || session.user.id} 
                        onBack={viewingProfileId ? () => { setViewingProfileId(null); setAuthView('discover');} : undefined}
                        onMessage={(user) => setChattingWith(user)}
                        onNavigateToSettings={handleNavigateToSettings}
                        onNavigateToTools={handleNavigateToTools}
                        onViewProfile={handleViewProfile}
                     />,
            settings: <SettingsPage 
                        session={session}
                        onBack={() => setAuthView('profile')} 
                        onNavigateToEditProfile={handleNavigateToEditProfile}
                        onNavigateToMusicLibrary={handleNavigateToMusicLibrary}
                        onLogout={handleLogout}
                        onNavigateToAdminPanel={() => setIsPasswordModalOpen(true)}
                        onNavigateToSubscriptions={handleNavigateToSubscriptions}
                        onNavigateToNotifications={handleNavigateToNotifications}
                        onNavigateToInfo={handleNavigateToInfo}
                        onNavigateToPasswordSecurity={handleNavigateToPasswordSecurity}
                        onNavigateToPrivacy={handleNavigateToPrivacy}
                      />,
            'edit-profile': <EditProfilePage 
                                session={session} 
                                onBack={() => setAuthView('settings')} 
                                onProfileUpdated={() => {
                                    setAuthView('profile');
                                    setViewingProfileId(null); 
                                    setTimeout(() => setViewingProfileId(session.user.id), 0);
                                }}
                            />,
            'music-library': <MusicLibraryPage
                                session={session}
                                onBack={() => setAuthView('profile')}
                                showNotification={showNotification}
                            />,
            tools: <ToolsPage 
                        onBack={() => setAuthView('profile')} 
                        onNavigateToAnime={handleNavigateToAnime} 
                        onNavigateToTopUp={handleNavigateToTopUp} 
                        onNavigateToMusicLibrary={handleNavigateToMusicLibrary} 
                        onNavigateToStore={handleNavigateToStore} 
                        onNavigateToCollection={handleNavigateToCollection}
                        onNavigateToSellPage={handleNavigateToSellPage}
                        onNavigateToInfo={handleNavigateToInfo} 
                        onNavigateToEarnXp={handleNavigateToEarnXp}
                        onNavigateToEvents={handleNavigateToEvents}
                        onNavigateToImageEditor={handleNavigateToImageEditor}
                        onNavigateToImageCompressor={handleNavigateToImageCompressor}
                   />,
            anime: <AnimePage 
                        key={refreshAnimeKey}
                        onBack={() => setAuthView('tools')}
                        onViewSeries={handleViewSeries}
                        onCreateSeries={handleNavigateToCreateSeries}
                        onCreateEpisode={handleNavigateToCreateEpisode}
                    />,
            'anime-series': <SeriesDetailPage 
                                seriesId={viewingSeriesId!} 
                                onBack={() => setAuthView('anime')} 
                            />,
            'create-series': <CreateSeriesPage onBack={() => setAuthView('anime')} onSeriesCreated={() => { setAuthView('anime'); setRefreshAnimeKey(k => k + 1); }} />,
            'create-episode': <CreateEpisodePage onBack={() => setAuthView('anime')} onEpisodeCreated={() => setAuthView('anime')} />,
            'top-up': <TopUpPage onBack={() => setAuthView('tools')} onPurchase={handleNavigateToManualPayment} onManageSubscriptions={handleNavigateToSubscriptions} showBrowserNotification={showBrowserNotification} />,
            'subscriptions': <SubscriptionClaimPage onBack={() => setAuthView('top-up')} session={session} showNotification={showNotification} showBrowserNotification={showBrowserNotification} />,
            'manual-payment': <ManualPaymentPage onBack={() => setAuthView('top-up')} session={session} productId={paymentProductId!} onSubmit={() => setAuthView('top-up')} showNotification={showNotification} />,
            store: <StorePage onBack={() => setAuthView('tools')} session={session} onNavigateToUploadCover={handleNavigateToUploadCover} showNotification={showNotification} />,
            collection: <CollectionPage onBack={() => setAuthView('tools')} session={session} showNotification={showNotification} />,
            'sell-page': <SellPage onBack={() => setAuthView('tools')} session={session} showNotification={showNotification} />,
            info: <InfoPage onBack={() => setAuthView('tools')} />,
            'earn-xp': <EarnXpPage onBack={() => setAuthView('tools')} session={session} />,
            'upload-cover': <UploadCoverPage onBack={() => setAuthView('store')} session={session} />,
            notifications: <NotificationsPage session={session} onBack={() => setAuthView('discover')} onMarkAllRead={() => setUnreadNotificationCount(0)} />,
            events: <EventsPage onBack={() => setAuthView('tools')} onNavigateToLuckRoyale={handleNavigateToLuckRoyale} />,
            'luck-royale': <LuckRoyalePage onBack={() => setAuthView('events')} session={session} showNotification={showNotification} />,
            'password-security': <PasswordSecurityPage onBack={() => setAuthView('settings')} showNotification={showNotification} />,
            'privacy': <PrivacyPage onBack={() => setAuthView('settings')} />,
            'image-editor': <ImageEditorPage onBack={() => setAuthView('tools')} />,
            'image-compressor': <ImageCompressorPage onBack={() => setAuthView('tools')} />,
        }[authView];

        const isFullScreenPage = [
            'profile', 'music-library', 'tools', 'anime', 'anime-series', 'create-series', 'create-episode',
            'top-up', 'subscriptions', 'manual-payment', 'settings', 'edit-profile', 'password-security', 'privacy',
            'store', 'collection', 'sell-page', 'info', 'earn-xp', 'upload-cover', 'notifications', 'events', 'luck-royale',
            'discover', 'messages', 'image-editor', 'image-compressor'
        ].includes(authView);

        const isHideBottomNav = isLuckRoyale || authView === 'image-editor' || authView === 'image-compressor';

        pageContent = (
            <>
                <main className={`${isHideBottomNav ? '' : `pb-24 sm:pb-28 ${!isFullScreenPage ? 'pt-4 px-4 sm:pt-8 sm:px-8 max-w-7xl mx-auto' : ''}`}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={authView + (viewingProfileId || '') + (viewingSeriesId || '')}
                            {...{
                                variants: pageVariants,
                                initial: "initial",
                                animate: "in",
                                exit: "out",
                                transition: pageTransition,
                            } as any}
                        >
                            <Suspense fallback={<div className="flex h-[80vh] items-center justify-center text-[var(--theme-text-secondary)]">Loading...</div>}>
                                {CurrentPage}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </main>
                {!isHideBottomNav && <BottomNav
                    activeView={authView}
                    setAuthView={handleSetAuthView as (view: 'discover' | 'chess' | 'profile' | 'messages') => void}
                />}
                <AnimatePresence>
                  {isSearchOpen && <SearchOverlay onClose={() => setIsSearchOpen(false)} onViewProfile={handleViewProfile} />}
                </AnimatePresence>
                 <PasswordModal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSuccess={() => {
                        setIsPasswordModalOpen(false);
                        onEnterAdminView();
                    }}
                    session={session}
                />
            </>
        )
    }

    return (
        <div className="w-full min-h-screen bg-[var(--theme-bg)] flex justify-center overflow-x-hidden">
            <div className={`w-full min-h-screen bg-[var(--theme-bg)] relative overflow-x-hidden ${isLuckRoyale ? 'h-screen overflow-hidden' : ''}`}>
                {showPermissionBanner && (
                    <div className="absolute top-0 left-0 right-0 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] p-3 z-[101] text-center shadow-lg">
                        <p className="text-sm">Want to get notified about rewards? Enable notifications!</p>
                        <div className="flex gap-2 justify-center mt-2">
                            <Button size="small" variant="secondary" onClick={handleRequestPermission} className="w-auto !text-[var(--theme-primary-text)] !bg-white/30 hover:!bg-white/50">Enable</Button>
                            <Button size="small" variant="secondary" onClick={() => setShowPermissionBanner(false)} className="w-auto !text-[var(--theme-primary-text)] !bg-transparent hover:!bg-white/20">Maybe Later</Button>
                        </div>
                    </div>
                )}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={chattingWith ? 'chat' : 'main'}
                        {...{
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            exit: { opacity: 0 },
                            transition: { duration: 0.3 },
                        } as any}
                    >
                        {pageContent}
                    </motion.div>
                </AnimatePresence>
                <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
            </div>
        </div>
    );
}

export default UserApp;