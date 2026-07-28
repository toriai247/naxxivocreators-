// luckroyalepage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, Enums, Json } from '../../integrations/supabase/types';
import { BackArrowIcon, GoldCoinIcon, SilverCoinIcon, DiamondIcon } from '../common/AppIcons';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { formatXp } from '../../utils/helpers';
import SpinResultModal from './SpinResultModal';
import ConfettiExplosion from 'react-confetti-explosion';

interface LuckRoyalePageProps {
    onBack: () => void;
    session: Session;
    showNotification: (details: any) => void;
}

type Prize = Tables<'luck_royale_prizes'> & {
    store_items: Pick<Tables<'store_items'>, 'id' | 'name' | 'preview_url'> | null
};
type Config = {
    costs: {
        GOLD: { single: number, ten: number },
        SILVER: { single: number, ten: number },
        DIAMOND: { single: number, ten: number },
    },
    duplicate_consolation: { type: string, amount: number };
    is_active: boolean;
};
type Currency = Enums<'currency'>;

const DEFAULT_LUCK_ROYALE_CONFIG: Config = {
    costs: {
        GOLD: { single: 100, ten: 900 },
        SILVER: { single: 50, ten: 450 },
        DIAMOND: { single: 10, ten: 90 }
    },
    duplicate_consolation: { type: 'GOLD', amount: 50 },
    is_active: true
};

const currencyIcons: Record<string, React.FC<{ className?: string }>> = {
    GOLD: GoldCoinIcon,
    SILVER: SilverCoinIcon,
    DIAMOND: DiamondIcon,
};
const currencyColors: Record<string, string> = {
    GOLD: 'text-yellow-400',
    SILVER: 'text-gray-300',
    DIAMOND: 'text-cyan-300',
}
const rarityStyles: Record<string, { bg: string, border: string, shadow: string, glow: string }> = {
    COMMON: { 
        bg: 'bg-slate-700/50', 
        border: 'border-slate-500', 
        shadow: '',
        glow: ''
    },
    RARE: { 
        bg: 'bg-blue-600/30', 
        border: 'border-blue-400', 
        shadow: 'shadow-lg shadow-blue-500/30',
        glow: 'blue-glow'
    },
    LEGENDARY: { 
        bg: 'bg-yellow-500/30', 
        border: 'border-yellow-400', 
        shadow: 'shadow-lg shadow-yellow-400/50',
        glow: 'legendary-glow'
    },
};

const PrizeDisplay = ({ prize }: { prize: Prize }) => {
    if (prize.prize_type === 'CURRENCY') {
        const Icon = currencyIcons[prize.currency_type!];
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Icon className={`w-10 h-10 ${currencyColors[prize.currency_type!]}`} />
                <p className={`font-bold text-lg mt-1 ${currencyColors[prize.currency_type!]}`}>{formatXp(prize.currency_amount!)}</p>
            </div>
        );
    }
    return (
        <div className="w-full h-full flex items-center justify-center p-2">
            <img 
                src={prize.store_items?.preview_url || ''} 
                alt={prize.store_items?.name || ''} 
                className="max-h-full max-w-full object-contain drop-shadow-lg" 
            />
        </div>
    );
};

const LuckRoyalePage: React.FC<LuckRoyalePageProps> = ({ onBack, session, showNotification }) => {
    const [config, setConfig] = useState<Config | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [spinResult, setSpinResult] = useState<any[] | null>(null);
    const [spinResultForAnimation, setSpinResultForAnimation] = useState<any[] | null>(null);
    const [rotation, setRotation] = useState(0);
    const [userBalances, setUserBalances] = useState({ GOLD: 0, SILVER: 0, DIAMOND: 0 });
    const [activeCurrency, setActiveCurrency] = useState<Currency>('GOLD');
    const [isExploding, setIsExploding] = useState(false);

    const fetchData = useCallback(async (initialLoad = false) => {
        if(initialLoad) setLoading(true);

        try {
            const [configRes, prizesRes, profileRes] = await Promise.all([
                supabase.from('app_settings').select('value').eq('key', 'luck_royale_config').single(),
                supabase.from('luck_royale_prizes').select('*, store_items(id, name, preview_url)').eq('is_active', true),
                supabase.from('profiles').select('gold_coins, silver_coins, diamond_coins').eq('id', session.user.id).single(),
            ]);

            if (configRes.error && configRes.error.code !== 'PGRST116') {
                console.warn("Could not load event configuration from DB, using default:", configRes.error.message);
            }
            setConfig(((configRes.data as any)?.value as Config) || DEFAULT_LUCK_ROYALE_CONFIG);

            if (prizesRes.error) throw prizesRes.error;
            setPrizes((prizesRes.data as any[]) || []);

            if (profileRes.error) throw profileRes.error;
            const profileData = profileRes.data as any;
            setUserBalances({
                GOLD: profileData?.gold_coins || 0,
                SILVER: profileData?.silver_coins || 0,
                DIAMOND: profileData?.diamond_coins || 0,
            });

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Error', message: err.message });
        } finally {
            if(initialLoad) setLoading(false);
        }
    }, [session.user.id, showNotification]);

    useEffect(() => {
        fetchData(true);
    }, [fetchData]);

    const handleSpin = async (spinCount: 1 | 10) => {
        if (isSpinning || !config) return;

        const filteredPrizes = prizes.filter(p => p.currency === activeCurrency);
        if (filteredPrizes.length < 2) {
            showNotification({ type: 'error', title: 'Spin Failed', message: 'Not enough prizes in this pool to spin.' });
            return;
        }

        setIsSpinning(true);
        setIsExploding(false);

        try {
            const { data, error } = await (supabase as any).rpc('spin_luck_royale', { spin_count: spinCount, p_currency: activeCurrency });

            if (error) throw error;
            const resObj = data as any;
            if (resObj?.error) throw new Error(resObj.error);

            const results = resObj?.prizes || [];
            setSpinResultForAnimation(results);

            const hasLegendary = results.some((r: any) => r.rarity === 'LEGENDARY');
            if (hasLegendary) {
                setIsExploding(true);
            }

            const rarityOrder = { 'LEGENDARY': 3, 'RARE': 2, 'COMMON': 1 };
            const prizeToAnimateTo = results
                .map((result: any) => {
                    if (result.type === 'consolation' || !result.details) return null;
                    return filteredPrizes.find(p => {
                        if (p.prize_type === 'ITEM' && result.type === 'item') return p.item_id === result.details.id;
                        if (p.prize_type === 'CURRENCY' && result.type === 'currency') return p.currency_type === result.details.type && p.currency_amount === result.details.amount;
                        return false;
                    });
                })
                .filter((p: Prize | null): p is Prize => p !== null)
                .sort((a: Prize, b: Prize) => (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) - (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0))[0] || filteredPrizes[0];

            const targetPrizeIndex = Math.max(0, filteredPrizes.findIndex(p => p.id === prizeToAnimateTo!.id));
            const prizeCount = filteredPrizes.length;
            const segmentAngle = 360 / prizeCount;
            const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8;
            const baseTargetAngle = 360 - (targetPrizeIndex * segmentAngle) - randomOffset;

            setRotation(prev => {
                const spins = spinCount === 1 ? 5 : 8;
                const existingRevolutions = Math.floor(prev / 360);
                return (existingRevolutions + spins) * 360 + baseTargetAngle;
            });

        } catch (err: any) {
            showNotification({ type: 'error', title: 'Spin Failed', message: err.message });
            setIsSpinning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen luck-royale-bg">
                <LoadingSpinner />
            </div>
        );
    }

    if (!config || !config.is_active) {
        return (
            <div className="flex flex-col justify-center items-center h-screen luck-royale-bg text-center p-8">
                <h2 className="text-2xl font-semibold text-white mb-2">Event Not Active</h2>
                <p className="text-purple-200 mt-2">The Luck Royale event is currently offline. Check back later!</p>
                <Button 
                    onClick={onBack} 
                    className="mt-6 w-auto mx-auto px-6 py-2 bg-purple-600 hover:bg-purple-500"
                >
                    Go Back
                </Button>
            </div>
        );
    }
    
    const filteredPrizes = prizes.filter(p => p.currency === activeCurrency);
    const numPrizes = Math.max(2, filteredPrizes.length);
    const segmentAngle = 360 / numPrizes;
    const currentCost = config.costs[activeCurrency];
    const ActiveCurrencyIcon = currencyIcons[activeCurrency];
    
    return (
        <>
            <div className="min-h-screen text-gray-200 flex flex-col font-sans luck-royale-bg">
                {isExploding && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <ConfettiExplosion 
                            particleCount={200}
                            duration={3000}
                            width={2000}
                            colors={['#FFE700', '#FFAA00', '#FF0080', '#A100FF']}
                        />
                    </div>
                )}
                
                <header className="flex-shrink-0 flex items-center p-4 bg-slate-900/70 backdrop-blur-sm sticky top-0 z-20 border-b border-purple-500/30">
                    <motion.button 
                        onClick={onBack} 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-purple-300 hover:text-white"
                    >
                        <BackArrowIcon />
                    </motion.button>
                    <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mx-auto tracking-wider uppercase"
                    >
                        Luck Royale
                    </motion.h1>
                    <div className={`flex items-center gap-2 text-sm font-bold ${currencyColors[activeCurrency]} px-3 py-1.5 rounded-full border border-purple-400/30 bg-slate-800/70 backdrop-blur-sm`}>
                        <ActiveCurrencyIcon className="w-5 h-5"/>
                        {formatXp(userBalances[activeCurrency])}
                    </div>
                </header>
                
                <main className="flex-grow overflow-y-auto p-4 flex flex-col items-center justify-center">
                    <div className="flex justify-center p-1 bg-slate-800/70 rounded-full my-4 backdrop-blur-sm border border-purple-500/20">
                        {(['GOLD', 'SILVER', 'DIAMOND'] as Currency[]).map(currency => (
                            <motion.button 
                                key={currency} 
                                onClick={() => setActiveCurrency(currency)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative px-4 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${activeCurrency === currency ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {activeCurrency === currency && (
                                    <motion.div 
                                        layoutId="active-currency-pill" 
                                        className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full z-0"
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {React.createElement(currencyIcons[currency], { className: `w-4 h-4` })}
                                    {currency.charAt(0) + currency.slice(1).toLowerCase()}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="relative w-80 h-80 md:w-96 md:h-96 my-6 flex items-center justify-center">
                        <div className="absolute top-[-28px] left-1/2 -translate-x-1/2 z-10">
                            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[32px] border-t-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.9)] animate-pulse"></div>
                        </div>

                        <div className="absolute inset-0 rounded-full bg-radial-gradient from-purple-500/10 to-transparent pointer-events-none" />

                        <motion.div
                            className="w-full h-full rounded-full relative"
                            animate={{ rotate: rotation }}
                            transition={{ duration: spinResultForAnimation ? 5.5 : 0, ease: [0.25, 1, 0.5, 1] }}
                            onAnimationComplete={() => {
                                if (spinResultForAnimation) {
                                    setSpinResult(spinResultForAnimation);
                                    setSpinResultForAnimation(null);
                                    fetchData();
                                }
                            }}
                        >
                            <div className="absolute inset-0 rounded-full bg-slate-900/80 border-2 border-purple-500/30 shadow-inner" />
                            <div className="absolute inset-[-12px] rounded-full border-2 border-purple-500/50 animate-[spin-glow_3s_ease-in-out_infinite]" />
                            
                            {Array.from({ length: 36 }).map((_, i) => (
                                <div 
                                    key={`glow-${i}`} 
                                    className="absolute top-0 left-0 w-full h-full"
                                    style={{ transform: `rotate(${i * 10}deg)` }}
                                >
                                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-purple-500/80 to-transparent origin-left" />
                                </div>
                            ))}

                            {filteredPrizes.map((prize, i) => {
                                const rarity = rarityStyles[prize.rarity] || rarityStyles.COMMON;
                                const isLegendary = prize.rarity === 'LEGENDARY';
                                return (
                                    <React.Fragment key={prize.id}>
                                        <div className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${i * segmentAngle}deg)` }}>
                                            <div className={`absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-purple-500/80 to-transparent origin-left ${rarity.glow}`} />
                                        </div>
                                        <div className="absolute top-0 left-0 w-full h-full" style={{ transform: `rotate(${i * segmentAngle + segmentAngle / 2}deg)` }}>
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className={`absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 flex items-center justify-center rounded-full p-1 ${rarity.bg} border-2 ${rarity.border} ${rarity.shadow} ${isLegendary ? 'legendary-pulse' : ''}`}
                                            >
                                                <div style={{ transform: `rotate(-${i * segmentAngle + segmentAngle / 2}deg)` }} className="w-full h-full flex items-center justify-center">
                                                    <PrizeDisplay prize={prize} />
                                                </div>
                                            </motion.div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </motion.div>
                    </div>

                    <div className="w-full max-w-sm space-y-3 my-4">
                        <motion.button
                            onClick={() => handleSpin(10)}
                            disabled={isSpinning || userBalances[activeCurrency] < currentCost.ten}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isSpinning || userBalances[activeCurrency] < currentCost.ten ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30'}`}
                        >
                            Spin x10 ({currentCost.ten.toLocaleString()})
                        </motion.button>
                        <motion.button
                            onClick={() => handleSpin(1)}
                            disabled={isSpinning || userBalances[activeCurrency] < currentCost.single}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isSpinning || userBalances[activeCurrency] < currentCost.single ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30'}`}
                        >
                            Spin x1 ({currentCost.single.toLocaleString()})
                        </motion.button>
                    </div>
                </main>
            </div>
            
            <SpinResultModal 
                isOpen={!!spinResult}
                onClose={() => { setSpinResult(null); setIsSpinning(false); }}
                results={spinResult || []}
            />
        </>
    );
};

export default LuckRoyalePage;