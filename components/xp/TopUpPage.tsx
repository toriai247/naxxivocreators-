import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, Json, TablesInsert } from '../../integrations/supabase/types';
import { BackArrowIcon, CoinIcon } from '../common/AppIcons';
import Button from '../common/Button';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';
import Input from '../common/Input';

interface TopUpPageProps {
    onBack: () => void;
    onPurchase: (productId: number) => void;
    onManageSubscriptions: () => void;
    showBrowserNotification: (title: string, body: string) => void;
}

type Product = Pick<Tables<'products'>, 'id' | 'product_type' | 'price' | 'icon' | 'name' | 'description' | 'details'>;

const TopUpPage: React.FC<TopUpPageProps> = ({ onBack, onPurchase, onManageSubscriptions, showBrowserNotification }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [giftCode, setGiftCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redeemMessage, setRedeemMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('id, product_type, price, icon, name, description, details')
                .eq('is_active', true)
                .order('price', { ascending: true });
            
            if (error) {
                console.error("Failed to fetch products:", error);
            } else {
                setProducts((data as any) || []);
            }
            setLoading(false);
        };
        fetchProducts();
    }, []);

    const handleRedeemCode = async () => {
        if (!giftCode.trim()) return;
        setIsRedeeming(true);
        setRedeemMessage(null);
        try {
            const { data: { user }, error: userError } = await (supabase.auth as any).getUser();
            if(userError || !user) throw new Error("You must be logged in to redeem a code.");

            let rpcResult: string = "";
            const { data: rpcData, error } = await (supabase as any).rpc('redeem_gift_code', {
                p_code: giftCode.trim(),
                p_user_id: user.id
            });

            if (error) {
                // Client-side fallback if RPC function is not installed in database
                if (
                    error.message?.toLowerCase().includes('schema cache') ||
                    error.message?.toLowerCase().includes('function') ||
                    error.message?.toLowerCase().includes('not find') ||
                    error.message?.toLowerCase().includes('404') ||
                    error.code === 'PGRST202'
                ) {
                    console.warn("RPC redeem_gift_code missing, performing client-side fallback redemption...");
                    const { data: rawCodeData, error: codeErr } = await supabase
                        .from('gift_codes')
                        .select('*')
                        .ilike('code', giftCode.trim())
                        .single();

                    const codeData = rawCodeData as any;
                    if (codeErr || !codeData) {
                        throw new Error("Invalid or unrecognized gift code.");
                    }
                    if (!codeData.is_active) {
                        throw new Error("This gift code is no longer active.");
                    }
                    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                        throw new Error("This gift code has expired.");
                    }
                    if (codeData.uses_remaining !== null && codeData.uses_remaining <= 0) {
                        throw new Error("This gift code has reached its maximum redemptions.");
                    }

                    // Check if user already redeemed
                    const { data: redemptions, error: redErr } = await supabase
                        .from('user_gift_code_redemptions')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('gift_code_id', codeData.id);

                    if (!redErr && redemptions && redemptions.length >= (codeData.max_uses_per_user || 1)) {
                        throw new Error(`You have already redeemed this code the maximum number of times (${codeData.max_uses_per_user || 1}).`);
                    }

                    // Record redemption
                    await supabase
                        .from('user_gift_code_redemptions')
                        .insert({
                            user_id: user.id,
                            gift_code_id: codeData.id
                        } as any);

                    // Decrement uses remaining
                    if (codeData.uses_remaining !== null && codeData.uses_remaining > 0) {
                        await (supabase
                            .from('gift_codes') as any)
                            .update({ uses_remaining: codeData.uses_remaining - 1 })
                            .eq('id', codeData.id);
                    }

                    // Grant XP to user profile
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('xp_balance')
                        .eq('id', user.id)
                        .single();

                    const currentXp = (profileData as any)?.xp_balance || 0;
                    const newXp = currentXp + (codeData.xp_reward || 0);

                    const { error: updateProfErr } = await (supabase
                        .from('profiles') as any)
                        .update({ xp_balance: newXp })
                        .eq('id', user.id);

                    if (updateProfErr) {
                        throw new Error(`Failed to update XP balance: ${updateProfErr.message}`);
                    }

                    rpcResult = `Success! You received ${codeData.xp_reward || 0} XP.`;
                } else {
                    throw error;
                }
            } else {
                rpcResult = (rpcData as string) || "Success! Code redeemed.";
            }

            if (rpcResult.startsWith('Success!')) {
                setRedeemMessage({ type: 'success', text: rpcResult });
                const xpAmount = parseInt(rpcResult.split(' ')[2] || '0');
                if (xpAmount > 0) {
                     const notification: TablesInsert<'notifications'> = {
                        user_id: user.id,
                        type: 'XP_REWARD',
                        content: { amount: xpAmount, reason: `Gift code redemption.` }
                    };
                    await supabase.from('notifications').insert(notification as any);
                }
                setGiftCode('');
                showBrowserNotification('Code Redeemed!', rpcResult);
            } else {
                 setRedeemMessage({ type: 'error', text: rpcResult || "An unknown error occurred." });
            }

        } catch (err: any) {
             setRedeemMessage({ type: 'error', text: err.message || "An unknown error occurred." });
        } finally {
            setIsRedeeming(false);
        }
    };

    const subscriptionPackages = products.filter(p => p.product_type === 'subscription');
    const xpPackages = products.filter(p => p.product_type === 'package');

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
             <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-[var(--theme-card-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto">Top Up XP</h1>
                <div className="w-6"></div> {/* Placeholder */}
            </header>

            {loading ? <div className="flex justify-center pt-20"><LoadingSpinner/></div> : (
                <main className="p-4 space-y-8">
                     {/* Gift Code Section */}
                    <section>
                         <h2 className="text-lg font-bold text-[var(--theme-text)] mb-3">Redeem Gift Code</h2>
                         <div className="bg-[var(--theme-card-bg)] p-4 rounded-xl shadow-md space-y-3">
                            <Input 
                                id="giftcode"
                                label="Enter your 7-character code"
                                value={giftCode}
                                onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                                maxLength={7}
                                disabled={isRedeeming}
                            />
                            {redeemMessage && (
                                <p className={`text-sm text-center ${redeemMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                    {redeemMessage.text}
                                </p>
                            )}
                             <Button onClick={handleRedeemCode} disabled={isRedeeming || !giftCode}>
                                 {isRedeeming ? <LoadingSpinner/> : 'Redeem Code'}
                             </Button>
                         </div>
                    </section>
                    
                    {/* Subscriptions Section */}
                    {subscriptionPackages.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-[var(--theme-text)] mb-3">Subscription Plans</h2>
                            <div className="space-y-4">
                                {subscriptionPackages.map((pkg, index) => (
                                    <motion.div
                                        key={pkg.id}
                                        {...{
                                            initial: { opacity: 0, x: -30 },
                                            animate: { opacity: 1, x: 0 },
                                            transition: { type: 'spring', delay: index * 0.15 },
                                        } as any}
                                        className="bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-secondary)] text-white p-5 rounded-2xl shadow-lg"
                                    >
                                        <div className="flex items-start">
                                            <div className="text-4xl mr-4">{pkg.icon || '🌟'}</div>
                                            <div className="flex-grow">
                                                <h3 className="font-bold text-xl">{pkg.name}</h3>
                                                <p className="text-xs text-white/70 mt-1">{pkg.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">${pkg.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => onPurchase(pkg.id)}
                                            className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white focus:ring-white"
                                        >
                                            Subscribe
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                            <Button onClick={onManageSubscriptions} variant="secondary" className="mt-4">
                                My Subscriptions & Daily Claims
                            </Button>
                        </section>
                    )}

                    {/* One-Time Purchase Section */}
                    {xpPackages.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-[var(--theme-text)] mb-3">XP Packages</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {xpPackages.map((pkg, index) => {
                                    const details = pkg.details as any;
                                    return (
                                        <motion.div
                                            key={pkg.id}
                                            {...{
                                                initial: { opacity: 0, y: 20 },
                                                animate: { opacity: 1, y: 0 },
                                                transition: { type: 'spring', delay: index * 0.1 },
                                            } as any}
                                            className="bg-[var(--theme-card-bg)] p-4 rounded-xl shadow-md text-center flex flex-col justify-between"
                                        >
                                            <div className="text-3xl mb-2">{pkg.icon || '💎'}</div>
                                            <p className="font-bold text-lg text-[var(--theme-text)]">{details?.xp_amount?.toLocaleString() ?? '0'} XP</p>
                                            <p className="text-sm text-[var(--theme-text-secondary)]">${pkg.price.toFixed(2)}</p>
                                            <Button 
                                                size="small"
                                                onClick={() => onPurchase(pkg.id)}
                                                className="mt-3 w-full"
                                            >
                                                Purchase
                                            </Button>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </main>
            )}
        </div>
    );
};

export default TopUpPage;