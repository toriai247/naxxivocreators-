import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from './integrations/supabase/client';
import LoadingSpinner from './components/common/LoadingSpinner';
import AuthPage from './components/auth/AuthPage';
import AuthForm from './components/auth/AuthForm';
import UserApp from './components/UserApp';
import AdminPanel from './components/admin/AdminPanel';
import WelcomeBonusModal from './components/auth/WelcomeBonusModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables, TablesUpdate } from './integrations/supabase/types';
import ConnectivityStatusOverlay from './components/common/ConnectivityStatusOverlay';
import PublicBioPage from './components/profile/PublicBioPage';

type AuthMode = 'onboarding' | 'login' | 'signup';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<AuthMode>('onboarding');
    const [isAdminView, setIsAdminView] = useState(false);
    const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [publicUserId, setPublicUserId] = useState<string | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const uid = queryParams.get('user') || queryParams.get('bio') || queryParams.get('profile');
        if (uid) {
            setPublicUserId(uid);
        } else if (window.location.pathname.startsWith('/profile/')) {
            const pathId = window.location.pathname.split('/profile/')[1]?.split('/')[0];
            if (pathId) setPublicUserId(pathId);
        } else if (window.location.pathname.startsWith('/bio/')) {
            const pathId = window.location.pathname.split('/bio/')[1]?.split('/')[0];
            if (pathId) setPublicUserId(pathId);
        }
    }, []);

    useEffect(() => {
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredInstallPrompt(null);
        }
    };

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null }}) => {
            setSession(session);
            setIsUserLoggedIn(!!session);
            setLoading(false); // Initial loading is done after first session check
        });

        // Setup auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            // Only change logged in status on explicit sign in or sign out events
            if (event === 'SIGNED_OUT') {
                setIsUserLoggedIn(false);
                setAuthMode('onboarding'); // Reset auth flow
            } else if (event === 'SIGNED_IN') {
                setIsUserLoggedIn(true);
            }
        });

        // Cleanup function
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Effect for connectivity
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => {
            setIsOffline(true);
            setIsServerDown(false); // Can't be a server issue if we're offline
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Effect for server health check
    useEffect(() => {
        if (isOffline) {
            return;
        }

        let isMounted = true;

        const healthCheck = async () => {
            try {
                // A very lightweight query to check server responsiveness.
                const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
                if (!isMounted) return;
                // "Failed to fetch" is a common browser message for network errors (CORS, DNS, server down).
                if (error && error.message.includes('Failed to fetch')) {
                    setIsServerDown(true);
                } else {
                    // If it succeeds or has a different error (like RLS), the server is responsive.
                    setIsServerDown(false);
                }
            } catch (e) {
                if(isMounted) {
                    setIsServerDown(true);
                }
            }
        };

        healthCheck(); // Initial check
        const intervalId = setInterval(healthCheck, 30000); // Check every 30 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [isOffline]);

    // Effect to react to session changes (login/logout) and profile updates
    useEffect(() => {
        if (session) {
            const getProfileAndSetupListener = async () => {
                // Fetch initial profile data
                const { data: rawProfile } = await supabase
                    .from('profiles')
                    .select('has_seen_welcome_bonus')
                    .eq('id', session.user.id)
                    .single();

                const profile = rawProfile as any;
                if (profile && !profile.has_seen_welcome_bonus) {
                    setShowWelcomeBonus(true);
                    await (supabase.from('profiles') as any).update({ has_seen_welcome_bonus: true }).eq('id', session.user.id);
                }
            };
            getProfileAndSetupListener();

        } else {
            // Handle user logout
            setIsAdminView(false);
        }
    }, [session]);

    if (publicUserId) {
        return (
            <PublicBioPage 
                userId={publicUserId} 
                onLoginClick={() => { 
                    window.history.pushState({}, '', '/'); 
                    setPublicUserId(null); 
                    if (!isUserLoggedIn) setAuthMode('login'); 
                }} 
            />
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--theme-bg)]">
                <LoadingSpinner />
            </div>
        );
    }
    
    return (
        <>
            <ConnectivityStatusOverlay isOffline={isOffline} isServerDown={!isOffline && isServerDown} />
            
            {!isUserLoggedIn ? (
                <div className="w-full min-h-screen flex items-center justify-center bg-[var(--theme-bg)]">
                    {authMode === 'onboarding' && <AuthPage onSetMode={setAuthMode} onInstallClick={handleInstallClick} showInstallButton={!!deferredInstallPrompt} />}
                    {(authMode === 'login' || authMode === 'signup') && <AuthForm mode={authMode} onSetMode={setAuthMode} />}
                </div>
            ) : (session && (
                <>
                    <AnimatePresence>
                        {isAdminView ? (
                            <motion.div key="admin-view" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } as any}>
                                <AdminPanel session={session} onExitAdminView={() => setIsAdminView(false)} />
                            </motion.div>
                        ) : (
                            <motion.div key="user-app" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } as any}>
                                <UserApp session={session} onEnterAdminView={() => setIsAdminView(true)} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <WelcomeBonusModal
                        isOpen={showWelcomeBonus}
                        onClose={() => setShowWelcomeBonus(false)}
                    />
                </>
            ))}
        </>
    );
};

export default App;