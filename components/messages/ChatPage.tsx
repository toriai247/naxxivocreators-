import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import LoadingSpinner from '../common/LoadingSpinner';
import type { Tables, TablesInsert, Json } from '../../integrations/supabase/types';
import { BackArrowIcon, ReadReceiptIcon } from '../common/AppIcons';
import { motion } from 'framer-motion';
import Avatar from '../common/Avatar';

// --- Types --- //
interface ChatPageProps {
    session: any;
    otherUser: { id: string; name: string; photo_url: string | null; active_cover: { preview_url: string | null; asset_details: Json } | null };
    onBack: () => void;
}

type Message = Tables<'messages'>;

// --- Icons --- //
const PaperPlaneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);


const ChatPage: React.FC<ChatPageProps> = ({ session, otherUser, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const myId = session.user.id;

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await (supabase as any).rpc('get_chat_messages', {
                user_a_id: myId,
                user_b_id: otherUser.id
            });

            if (error) throw error;
            setMessages((data as unknown as Message[]) || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [myId, otherUser.id]);

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel(`messages_from_${myId}_to_${otherUser.id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `recipient_id=eq.${myId}`
            }, (payload) => {
                setMessages(currentMessages => [...currentMessages, payload.new as Message]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMessages, myId, otherUser.id]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData: TablesInsert<'messages'> = {
            sender_id: myId,
            recipient_id: otherUser.id,
            content: newMessage.trim(),
        };

        const tempId = Date.now();
        const optimisticMessage = { 
            ...messageData, 
            id: tempId, 
            created_at: new Date().toISOString(), 
            is_read: false, 
            status: 'sending' 
        };

        setNewMessage('');
        setMessages(current => [...current, optimisticMessage as Message]);

        const { error } = await supabase.from('messages').insert(messageData as any);

        if (error) {
            console.error('Failed to send message:', error);
            setError('Failed to send message. Please try again.');
            // Revert optimistic update on failure
            setMessages(current => current.filter(m => m.id !== tempId));
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[var(--theme-bg)]">
            <header className="flex-shrink-0 bg-[var(--theme-header-bg)]/80 backdrop-blur-lg p-3 flex items-center justify-between border-b border-[var(--theme-secondary)]/30 text-[var(--theme-header-text)]">
                 <div className="flex items-center space-x-3">
                     <button onClick={onBack} className="hover:opacity-80 transition-opacity"><BackArrowIcon /></button>
                     <Avatar
                        photoUrl={otherUser.photo_url}
                        name={otherUser.name}
                        activeCover={otherUser.active_cover}
                        size="sm"
                     />
                     <div>
                        <h1 className="font-bold text-base leading-tight">{otherUser.name}</h1>
                        <p className="text-xs text-green-500">Online</p>
                     </div>
                 </div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 flex flex-col">
                <div className="flex-grow space-y-4">
                    {loading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {!loading && !error && messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            {...{
                                layout: true,
                                initial: { opacity: 0, y: 20, scale: 0.9 },
                                animate: { opacity: 1, y: 0, scale: 1 },
                                transition: { type: 'spring', stiffness: 300, damping: 25 },
                            } as any}
                            className={`flex flex-col gap-1 ${msg.sender_id === myId ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`flex items-end gap-2 max-w-sm ${msg.sender_id === myId ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.sender_id !== myId && 
                                    <Avatar
                                        photoUrl={otherUser.photo_url}
                                        name={otherUser.name}
                                        activeCover={otherUser.active_cover}
                                        size="xxs"
                                        containerClassName="self-end mb-1"
                                    />
                                }
                                <div className={`p-3 rounded-2xl ${msg.sender_id === myId ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-br-lg' : 'bg-[var(--theme-card-bg-alt)] text-[var(--theme-text)] rounded-bl-lg'}`}>
                                    <p className="text-sm break-words">{msg.content}</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-1.5 text-xs text-[var(--theme-text-secondary)] px-2 ${msg.sender_id === myId ? '' : 'ml-8'}`}>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {msg.sender_id === myId && <ReadReceiptIcon isRead={msg.is_read} />}
                            </div>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </main>

             <footer className="flex-shrink-0 p-3 bg-[var(--theme-card-bg)] border-t border-[var(--theme-secondary)]/30">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow bg-[var(--theme-bg)] border-transparent rounded-full text-[var(--theme-text)] placeholder-[var(--theme-text-secondary)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--theme-ring)]"
                        autoFocus
                    />
                    <button type="submit" className="p-3 bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-full disabled:opacity-50 transition-transform hover:scale-110" disabled={!newMessage.trim()}>
                        <PaperPlaneIcon />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatPage;