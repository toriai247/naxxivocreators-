import React from 'react';
import type { NotificationWithActor } from './NotificationsPage';
import Avatar from '../common/Avatar';
import { formatXp } from '../../utils/helpers';
import { HeartIcon, CommentIcon, UserPlusIcon, MessageIcon, CheckCircleIcon, XCircleIcon, TrophyIcon } from '../common/AppIcons';

interface NotificationItemProps {
    notification: NotificationWithActor;
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};


const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
    const { actor_id, profiles: actor, type, content, created_at, is_read } = notification;

    let icon: React.ReactNode;
    let message: React.ReactNode;

    const actorName = <strong className="font-semibold text-[var(--theme-text)]">{actor?.name || actor?.username || 'Someone'}</strong>;

    switch (type) {
        case 'NEW_FOLLOWER':
            icon = <UserPlusIcon className="text-blue-500" />;
            message = <>{actorName} started following you.</>;
            break;
        case 'POST_LIKE':
            icon = <HeartIcon filled={true} className="text-red-500" />;
            message = <>{actorName} liked your post.</>;
            break;
        case 'POST_COMMENT':
            icon = <CommentIcon className="text-indigo-500" />;
            message = <>{actorName} commented on your post.</>;
            break;
        case 'PAYMENT_APPROVED':
            icon = <CheckCircleIcon className="text-green-500" />;
            message = <>Your purchase of <strong>{(content as any)?.productName}</strong> has been approved!</>;
            break;
        case 'PAYMENT_REJECTED':
            icon = <XCircleIcon className="text-red-500" />;
            message = <>Your payment for <strong>{(content as any)?.productName}</strong> was rejected. Reason: {(content as any)?.reason}</>;
            break;
        case 'XP_REWARD':
            icon = <TrophyIcon className="text-yellow-500" />;
            message = <>You received <strong>{formatXp((content as any)?.amount)} XP</strong> for {(content as any)?.reason}</>;
            break;
        default:
            icon = <div className="w-6 h-6" />;
            message = 'You have a new notification.';
    }

    return (
        <button className={`w-full flex items-center p-4 text-left transition-colors ${!is_read ? 'bg-[var(--theme-primary)]/5' : 'bg-transparent hover:bg-[var(--theme-card-bg-alt)]'}`}>
            <div className="w-8 h-8 flex items-center justify-center mr-4">{icon}</div>
            {actor && (
                <div className="mr-3">
                    <Avatar
                        photoUrl={actor.photo_url}
                        name={actor.name || actor.username}
                        size="sm"
                    />
                </div>
            )}
            <div className="flex-grow">
                <p className="text-sm text-[var(--theme-text-secondary)]">{message}</p>
                <p className="text-xs text-[var(--theme-text-secondary)]/70 mt-0.5">{timeAgo(created_at)}</p>
            </div>
            {!is_read && (
                 <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-3"></div>
            )}
        </button>
    );
};

export default NotificationItem;