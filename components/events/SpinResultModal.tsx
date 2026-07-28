// spinresultmodal.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Button from '../common/Button';
import { formatXp } from '../../utils/helpers';
import { GoldCoinIcon, SilverCoinIcon, DiamondIcon } from '../common/AppIcons';
import type { Enums } from '../../integrations/supabase/types';
import ConfettiExplosion from 'react-confetti-explosion';

interface SpinResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    results: any[];
}

const currencyIcons: Record<string, React.FC<{ className?: string }>> = {
    GOLD: GoldCoinIcon,
    SILVER: SilverCoinIcon,
    DIAMOND: DiamondIcon,
};
const currencyColors: Record<string, string> = {
    GOLD: 'text-yellow-400',
    SILVER: 'text-gray-300',
    DIAMOND: 'text-cyan-300',
};

const rarityStyles: Record<string, { 
    bg: string, 
    border: string, 
    shadow: string, 
    label: string, 
    text: string,
    glow: string 
}> = {
    COMMON: { 
        bg: 'bg-slate-800/70', 
        border: 'border-slate-600', 
        shadow: 'shadow-slate-500/20', 
        label: 'COMMON', 
        text: 'text-slate-300',
        glow: ''
    },
    RARE: { 
        bg: 'bg-blue-600/40', 
        border: 'border-blue-400', 
        shadow: 'shadow-lg shadow-blue-400/40', 
        label: 'RARE', 
        text: 'text-blue-300',
        glow: 'blue-glow'
    },
    LEGENDARY: { 
        bg: 'bg-yellow-500/40', 
        border: 'border-yellow-400', 
        shadow: 'shadow-lg shadow-yellow-400/50', 
        label: 'LEGENDARY', 
        text: 'text-yellow-300',
        glow: 'legendary-glow'
    },
};

const PrizeCard: React.FC<{ result: any, delay: number }> = ({ result, delay }) => {
    const rarity = rarityStyles[result.rarity] || rarityStyles.COMMON;
    const isLegendary = result.rarity === 'LEGENDARY';

    let prizeContent;
    switch (result.type) {
        case 'item':
            prizeContent = (
                <div className="w-full h-full flex items-center justify-center p-2">
                    <img 
                        src={result.details.preview_url} 
                        alt={result.details.name} 
                        className="max-h-full max-w-full object-contain drop-shadow-lg" 
                    />
                </div>
            );
            break;
        case 'currency':
            const CurrencyIcon = currencyIcons[result.details.type];
            prizeContent = (
                <div className="flex flex-col items-center justify-center h-full">
                    <CurrencyIcon className={`w-12 h-12 ${currencyColors[result.details.type]}`} />
                    <p className={`font-bold text-lg mt-1 ${currencyColors[result.details.type]}`}>{formatXp(result.details.amount)}</p>
                </div>
            );
            break;
        case 'consolation':
            prizeContent = (
                <div className="text-center p-2">
                    <p className="text-xs text-gray-300">Consolation</p>
                    <p className="font-bold text-purple-300">{result.details.amount} {result.details.type}</p>
                </div>
            );
            break;
        default: 
            prizeContent = null;
    }

    const cardVariants: Variants = {
        hidden: { 
            rotateY: 90,
            scale: 0.8,
            opacity: 0 
        },
        visible: { 
            rotateY: 0,
            scale: 1,
            opacity: 1,
            transition: { 
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.5 + delay * 0.1 
            }
        }
    };

    return (
        <div className="prize-card-container aspect-square">
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full h-full"
            >
                {/* Front Face */}
                <div className={`absolute w-full h-full flex flex-col items-center justify-between p-2 rounded-xl ${rarity.bg} border ${rarity.border} ${rarity.shadow} ${rarity.glow}`}>
                    <div className={`absolute top-1 text-[10px] font-bold tracking-widest uppercase ${rarity.text}`}>
                        {rarity.label}
                    </div>
                    <div className="flex-grow flex items-center justify-center w-full h-full">
                        {prizeContent}
                    </div>
                    
                    {result.is_duplicate && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-2 rounded-xl">
                            <p className="text-yellow-400 font-bold text-sm">DUPLICATE</p>
                            <p className="text-xs text-purple-300">+{result.consolation_prize.amount} {result.consolation_prize.type}</p>
                        </div>
                    )}
                </div>
                
                {/* Back Face */}
                <div 
                    className="absolute w-full h-full rounded-xl bg-gradient-to-br from-purple-800 to-slate-900 border border-purple-500/50 flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center text-purple-300 text-3xl font-logo animate-pulse">
                        ?
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const SpinResultModal: React.FC<SpinResultModalProps> = ({ isOpen, onClose, results }) => {
    const isLegendarySpin = useMemo(() => {
        return isOpen && results.some(r => r.rarity === 'LEGENDARY');
    }, [isOpen, results]);
    
    const isSingleItem = results.length === 1;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex justify-center items-center p-4 luck-royale-bg" onClick={onClose}>
                    {isLegendarySpin && (
                        <>
                            <div className="legendary-flash" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <ConfettiExplosion 
                                    particleCount={150}
                                    duration={3000}
                                    width={1600}
                                    colors={['#FFE700', '#FFAA00', '#FF0080', '#A100FF']}
                                />
                            </div>
                        </>
                    )}
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ 
                            delay: isLegendarySpin ? 1.0 : 0, 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 20 
                        }}
                        className="bg-slate-900/90 border-2 border-purple-500/50 w-full max-w-md rounded-2xl shadow-2xl p-6 relative flex flex-col text-white overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {isLegendarySpin && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5 }}
                                className="legendary-text absolute top-0 left-0 right-0 text-center pointer-events-none"
                            >
                                LEGENDARY!
                            </motion.div>
                        )}
                        
                        <div className="text-center mb-4 relative z-10">
                            <motion.h2 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: isLegendarySpin ? 1.2 : 0.2 }}
                                className="text-2xl font-bold tracking-wider uppercase bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                            >
                                RESULTS
                            </motion.h2>
                        </div>
                        
                        {isSingleItem ? (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: isLegendarySpin ? 1.4 : 0.4 }}
                                className="flex justify-center items-center my-6 h-40 w-40 mx-auto"
                            >
                                <PrizeCard result={results[0]} delay={0} />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: isLegendarySpin ? 1.4 : 0.4 }}
                                className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-2"
                            >
                                {results.map((result, index) => (
                                    <PrizeCard key={index} result={result} delay={index} />
                                ))}
                            </motion.div>
                        )}

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: isLegendarySpin ? 2.0 : 0.8 }}
                            className="mt-6"
                        >
                            <Button 
                                onClick={onClose} 
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/30"
                            >
                                Continue
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SpinResultModal;