import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/auth-js';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, TablesInsert, Json } from '../../integrations/supabase/types';
import { BackArrowIcon } from '../common/AppIcons';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { motion } from 'framer-motion';

interface SubscriptionClaimPageProps {
    onBack: () => void;
    session: Session;
    showNotification: (details: any) => void;
    showBrowserNotification: (title: string, body: string) => void;
}

type SubscriptionWithProduct = Tables<'user_subscriptions'> & {
    products: {
        name: string;
        details: Json | null;
    } | null;
};
type Claim = Tables<'daily_claims'>;

const SubscriptionClaimPage: React.FC<SubscriptionClaimPageProps> = ({ onBack, session, showNotification, showBrowserNotification }) => {
    const [subscription, setSubscription] = useState<SubscriptionWithProduct | null>(null);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClaiming, setIsClaiming] = useState(false);
    const myId = session.user.id;
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: subData, error: subError } = await supabase
                .from('user_subscriptions')
                .select(`*, products (name, details)`)
                .eq('user_id', myId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (subError) {
                if (subError.code !== 'PGRST116') throw subError;
            }
            setSubscription(subData as any);
            
            if(subData) {
                const { data: claimData, error: claimError } = await supabase
                    .from('daily_claims')
                    .select('*')
                    .eq('user_subscription_id', (subData as any).id);
                
                if (claimError) throw claimError;
                setClaims((claimData as Claim[]) || []);
            }

        } catch (err: any) {
            setError(err.message || 'Failed to load subscription data.');
        } finally {
            setLoading(false);
        }
    }, [myId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClaim = async () => {
        if (!subscription || !subscription.products) return;
        setIsClaiming(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data: existingClaims, error: claimsError } = await supabase
                .from('daily_claims')
                .select('id')
                .eq('user_subscription_id', subscription.id)
                .eq('claim_date', today)
                .limit(1);

            if (claimsError) throw claimsError;
            if (existingClaims && existingClaims.length > 0) {
                throw new Error("You have already claimed your XP for today.");
            }

            const dailyXp = (subscription.products.details as any)?.daily_xp;
            if (!dailyXp || dailyXp <= 0) {
                throw new Error("No daily XP amount configured for this subscription.");
            }

            const newClaim: TablesInsert<'daily_claims'> = {
                user_id: myId,
                user_subscription_id: subscription.id,
                claimed_xp: dailyXp,
                claim_date: today,
            };

            const { error: insertError } = await supabase.from('daily_claims').insert(newClaim as any);
            if (insertError) throw new Error(`Failed to record your claim. Please try again. Details: ${insertError.message}`);

            const { error: rpcError } = await (supabase as any).rpc('add_xp_to_user', {
                user_id_to_update: myId,
                xp_to_add: dailyXp
            });
            if (rpcError) throw new Error(`Your claim was recorded, but we failed to add XP to your account. Please contact support with this message: ${rpcError.message}`);
            
            // Send notification
            const notification: TablesInsert<'notifications'> = {
                user_id: myId,
                type: 'XP_REWARD',
                content: { amount: dailyXp, reason: `Daily claim for ${subscription.products.name}.` }
            };
            await supabase.from('notifications').insert(notification as any);

            const successMessage = `You've claimed your daily ${dailyXp} XP!`;
            showNotification({ type: 'success', title: 'Claim Successful!', message: successMessage });
            showBrowserNotification('Daily Reward Claimed!', successMessage);
            await fetchData();

        } catch (err: any) {
             showNotification({ type: 'error', title: 'Claim Failed', message: err.message || 'Failed to claim XP. You may have already claimed today or there was an error.' });
             console.error(err);
        } finally {
            setIsClaiming(false);
        }
    };
    
    const today = new Date().toISOString().split('T')[0];
    const hasClaimedToday = claims.some(c => c.claim_date === today);
    const dailyXpToClaim = (subscription?.products?.details as any)?.daily_xp || 0;

    const renderClaimGrid = () => {
        if (!subscription || !subscription.products) return null;
        const totalDays = (subscription.products.details as any)?.duration_days || 7;
        const startDate = new Date(subscription.start_date);
        
        return (
            <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: totalDays }).map((_, i) => {
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + i);
                    const dayDateStr = dayDate.toISOString().split('T')[0];
                    const claim = claims.find(c => c.claim_date === dayDateStr);
                    
                    const isToday = dayDateStr === today;
                    const isFuture = dayDate > new Date();

                    let statusClasses = 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
                    if(claim) {
                        statusClasses = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
                    } else if (isToday) {
                         statusClasses = 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] animate-pulse';
                    } else if (!isFuture) {
                         statusClasses = 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400';
                    }

                    return (
                        <motion.div 
                            key={i}
                            {...{
                                initial: { opacity: 0, scale: 0.8 },
                                animate: { opacity: 1, scale: 1 },
                                transition: { delay: i * 0.05 },
                            } as any}
                            className={`p-2 rounded-lg text-center aspect-square flex flex-col justify-center items-center ${statusClasses}`}
                        >
                            <span className="text-xs font-medium">{`Day ${i + 1}`}</span>
                            <span className="text-lg font-bold">{claim ? '✓' : '–'}</span>
                        </motion.div>
                    );
                })}
            </div>
        );
    };
    
    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-[var(--theme-card-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Subscriptions & Claims</h1>
                <div className="w-6"></div>
            </header>

            <main className="p-4 space-y-6">
                {loading ? <div className="flex justify-center pt-20"><LoadingSpinner /></div> : 
                 error ? <p className="text-red-500 text-center">{error}</p> :
                 !subscription ? (
                    <div className="text-center p-8 bg-[var(--theme-card-bg)] rounded-lg">
                        <h2 className="text-xl font-semibold text-[var(--theme-text)]">No Active Subscription</h2>
                        <p className="text-[var(--theme-text-secondary)] mt-2">Visit the Top Up page to subscribe and earn daily XP!</p>
                    </div>
                 ) : (
                    <div className="bg-[var(--theme-card-bg)] p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold text-[var(--theme-text)]">{subscription.products?.name}</h2>
                        <p className="text-[var(--theme-text-secondary)]">Active until {new Date(subscription.end_date).toLocaleDateString()}</p>

                        <div className="my-6">
                            <Button onClick={handleClaim} disabled={hasClaimedToday || isClaiming}>
                                {isClaiming ? <LoadingSpinner /> : hasClaimedToday ? 'Claimed Today' : `Claim ${dailyXpToClaim} XP`}
                            </Button>
                        </div>
                        
                        <h3 className="font-semibold mb-3 text-[var(--theme-text)]">Claim History</h3>
                        {renderClaimGrid()}
                    </div>
                 )
                }
            </main>
        </div>
    );
};

export default SubscriptionClaimPage;