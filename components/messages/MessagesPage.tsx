import React, { useState, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import { SearchIcon as SearchIconSVG, PencilSquareIcon, MessageIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Json } from '../../integrations/supabase/types';
import Avatar from '../common/Avatar';


// --- Local Types --- //
interface ProfileStub {
    id: string;
    name: string | null;
    username: string;
    photo_url: string | null;
    active_cover: { preview_url: string | null; asset_details: Json } | null;
}

type FetchedMessage = {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
    recipient_id: string;
};

interface Conversation {
    other_user: ProfileStub;
    last_message: {
        content: string;
        created_at: string;
    };
    unread_count: number;
}

interface MessagesPageProps {
    session: Session;
    onStartChat: (user: ProfileStub) => void;
}


const MessagesPage: React.FC<MessagesPageProps> = ({ session, onStartChat }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const myId = session.user.id;

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch recent messages
                const { data: rawMessages, error: messagesError } = await supabase
                    .from('messages')
                    .select('content, created_at, is_read, sender_id, recipient_id')
                    .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
                    .order('created_at', { ascending: false });

                if (messagesError) throw messagesError;
                const typedMessages = (rawMessages as any[]) || [];
                
                const conversationsMap = new Map<string, { last_message: any; unread_count: number }>();
                const otherUserIds = new Set<string>();

                for (const message of typedMessages) {
                    const otherUserId = message.sender_id === myId ? message.recipient_id : message.sender_id;
                    otherUserIds.add(otherUserId);

                    if (!conversationsMap.has(otherUserId)) {
                        conversationsMap.set(otherUserId, {
                            last_message: message,
                            unread_count: 0
                        });
                    }
                    if (!message.is_read && message.recipient_id === myId) {
                        const existing = conversationsMap.get(otherUserId)!;
                        existing.unread_count += 1;
                    }
                }
                
                // Fetch some users to simulate "online" status
                const { data: onlineUsersData, error: onlineUsersError } = await supabase
                    .from('profiles')
                    .select('id')
                    .limit(10);
                if(onlineUsersError) throw onlineUsersError;
                setOnlineUserIds(new Set(((onlineUsersData as any[]) || []).map(u => u.id)));

                if (otherUserIds.size === 0) {
                    setConversations([]);
                    setLoading(false);
                    return;
                }
                
                // Fetch profiles for the conversations
                let { data: typedProfiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, name, username, photo_url, active_cover:active_cover_id(preview_url, asset_details)')
                    .in('id', Array.from(otherUserIds));

                if (profilesError) {
                    const fallback = await supabase
                        .from('profiles')
                        .select('id, name, username, photo_url')
                        .in('id', Array.from(otherUserIds));
                    typedProfiles = fallback.data as any;
                    profilesError = fallback.error;
                }

                if (profilesError) throw profilesError;
                
                const profilesMap = new Map((typedProfiles || []).map(p => [p.id, p]));

                const convos: Conversation[] = Array.from(conversationsMap.entries()).map(([userId, convoData]) => ({
                    other_user: profilesMap.get(userId) as ProfileStub,
                    last_message: {
                        content: convoData.last_message.content,
                        created_at: convoData.last_message.created_at,
                    },
                    unread_count: convoData.unread_count,
                })).filter(c => c.other_user);

                setConversations(convos);

            } catch (err: any) {
                setError(err.message || 'Failed to load conversations.');
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [myId]);

     const filteredConversations = useMemo(() => {
        if (!searchTerm) return conversations;
        return conversations.filter(convo =>
            convo.other_user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            convo.other_user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [conversations, searchTerm]);
    
    return (
        <div className="bg-[var(--theme-bg)] h-screen flex flex-col">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)]">
                <div className="w-6"></div> {/* Placeholder */}
                <h1 className="text-2xl font-bold text-[var(--theme-text)]">Chats</h1>
                <button className="text-[var(--theme-primary)] hover:opacity-80">
                    <PencilSquareIcon />
                </button>
            </header>
            
            <div className="p-4 flex-shrink-0">
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--theme-text-secondary)]">
                        <SearchIconSVG />
                    </div>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--theme-card-bg-alt)] border-transparent rounded-full text-[var(--theme-text)] placeholder-[var(--theme-text-secondary)] px-4 py-2.5 pl-12 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]"
                    />
                </div>
            </div>
            
            <main className="flex-grow overflow-y-auto">
                {loading && (
                     <div className="flex justify-center pt-20">
                        <LoadingSpinner />
                    </div>
                )}
                
                {error && (
                    <div className="text-center pt-20 px-4 text-red-500" role="alert">
                        <p>Error loading messages: {error}</p>
                    </div>
                )}

                {!loading && !error && filteredConversations.length === 0 && (
                    <div className="text-center py-16 px-4 flex flex-col items-center">
                        <MessageIcon className="w-16 h-16 text-[var(--theme-text-secondary)]/50 mb-4" />
                        <h2 className="text-xl font-semibold text-[var(--theme-text)]">No conversations yet</h2>
                        <p className="text-[var(--theme-text-secondary)] mt-2">Find users on the Discover page to start a chat.</p>
                    </div>
                )}

                {!loading && filteredConversations.length > 0 && (
                    <div className="space-y-1 px-3">
                         <AnimatePresence>
                            {filteredConversations.map(({ other_user, last_message, unread_count }, index) => {
                                const isUnread = unread_count > 0;
                                const isOnline = onlineUserIds.has(other_user.id);
                                return (
                                 <motion.button 
                                    key={other_user.id} 
                                    {...{
                                        initial: { opacity: 0, y: 20 },
                                        animate: { opacity: 1, y: 0 },
                                        exit: { opacity: 0, scale: 0.95 },
                                        transition: { delay: index * 0.05 },
                                        whileTap: { scale: 0.98 }
                                    } as any}
                                    onClick={() => onStartChat(other_user)}
                                    className="w-full flex items-center p-3 space-x-4 rounded-2xl hover:bg-[var(--theme-card-bg-alt)] transition-colors text-left"
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar
                                            photoUrl={other_user.photo_url}
                                            name={other_user.name || other_user.username}
                                            activeCover={other_user.active_cover}
                                            size="lg"
                                        />
                                        {isOnline && <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--theme-bg)]" />}
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <p className={`truncate font-bold text-[var(--theme-text)]`}>{other_user.name || other_user.username}</p>
                                            <span className="text-xs text-[var(--theme-text-secondary)] flex-shrink-0 ml-2">{new Date(last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex justify-between items-start mt-1">
                                            <p className={`text-sm truncate ${isUnread ? 'text-[var(--theme-text)] font-semibold' : 'text-[var(--theme-text-secondary)]'}`}>{last_message.content}</p>
                                            {isUnread && (
                                                <span className="h-5 w-5 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs flex items-center justify-center rounded-full font-bold flex-shrink-0 ml-2">{unread_count}</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.button>
                            )})}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MessagesPage;