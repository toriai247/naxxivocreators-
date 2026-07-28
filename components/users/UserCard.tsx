import React, { useState } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import { generateAvatar, formatXp } from '../../utils/helpers';
import type { Tables, TablesInsert } from '../../integrations/supabase/types';
import Button from '../common/Button';
import { motion } from 'framer-motion';

type Profile = Pick<Tables<'profiles'>, 'id' | 'name' | 'username' | 'photo_url' | 'xp_balance' | 'created_at'>;

interface UserCardProps {
    profile: Profile;
    session: Session;
    isInitiallyFollowing: boolean;
    onViewProfile: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ profile, session, isInitiallyFollowing, onViewProfile }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);

    const isMyProfile = profile.id === session.user.id;

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking button
        if (isMyProfile) return;
        setIsUpdatingFollow(true);
        try {
            if (isFollowing) {
                await supabase.from('follows').delete().match({ follower_id: session.user.id, following_id: profile.id });
                setIsFollowing(false);
            } else {
                const newFollow: TablesInsert<'follows'> = { follower_id: session.user.id, following_id: profile.id };
                await supabase.from('follows').insert(newFollow as any);
                setIsFollowing(true);
            }
        } catch (error: any) {
            console.error("Failed to update follow status:", error.message);
        } finally {
            setIsUpdatingFollow(false);
        }
    };
    
    return (
        <motion.div
            {...{
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, amount: 0.3 },
                transition: { type: 'spring', duration: 0.8 },
            } as any}
            className="w-full"
        >
            <button
                onClick={() => onViewProfile(profile.id)}
                className="w-full flex items-center p-3 bg-[var(--theme-card-bg)] rounded-2xl hover:bg-opacity-80 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-ring)] shadow-sm"
            >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img 
                        src={profile.photo_url || generateAvatar(profile.name || profile.username)} 
                        alt={profile.name || ''} 
                        className="w-full h-full object-cover" 
                    />
                </div>
                <div className="ml-4 flex-grow overflow-hidden">
                    <p className="truncate font-bold text-[var(--theme-text)]">{profile.name || profile.username}</p>
                    <p className="text-sm truncate text-[var(--theme-primary)] font-semibold">{formatXp(profile.xp_balance)} XP</p>
                </div>
                {!isMyProfile && (
                    <div className="ml-2 w-28 flex-shrink-0">
                         <Button
                            onClick={handleFollowToggle}
                            size="small"
                            variant={isFollowing ? 'secondary' : 'primary'}
                            disabled={isUpdatingFollow}
                         >
                            {isUpdatingFollow ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                         </Button>
                    </div>
                )}
            </button>
        </motion.div>
    );
};

export default UserCard;