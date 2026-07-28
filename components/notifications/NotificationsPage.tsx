import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, Json } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import { BackArrowIcon } from '../common/AppIcons';
import NotificationItem from './NotificationItem';

export type NotificationWithActor = Tables<'notifications'> & {
    profiles: Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url' | 'active_cover_id'> | null;
};

interface NotificationsPageProps {
    session: Session;
    onBack: () => void;
    onMarkAllRead: () => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ session, onBack, onMarkAllRead }) => {
    const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*, profiles:actor_id ( id, name, username, photo_url, active_cover_id )')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications((data as any[]) || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    }, [session.user.id]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);
    
    const handleMarkAllReadClick = async () => {
        try {
            const { error } = await (supabase
                .from('notifications') as any)
                .update({ is_read: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false);
            if(error) throw error;
            onMarkAllRead();
            // Optimistically update UI
            setNotifications(current => current.map(n => ({...n, is_read: true})));
        } catch (err: any) {
            console.error("Failed to mark all as read:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Notifications</h1>
                <button onClick={handleMarkAllReadClick} className="text-sm font-medium text-[var(--theme-primary)] hover:opacity-80">
                    Mark All Read
                </button>
            </header>

            <main>
                {loading ? (
                    <div className="flex justify-center pt-20"><LoadingSpinner /></div>
                ) : error ? (
                    <p className="text-center text-red-500 p-4">{error}</p>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20 px-4">
                        <h2 className="text-xl font-semibold text-[var(--theme-text)]">All Caught Up!</h2>
                        <p className="text-[var(--theme-text-secondary)] mt-2">You have no new notifications.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--theme-secondary)]/30">
                        {notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;