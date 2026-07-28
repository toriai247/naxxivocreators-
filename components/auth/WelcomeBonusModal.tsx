import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatXp } from '../../utils/helpers';

interface WelcomeBonusModalProps {
    isOpen: boolean;
    onClose: () => void;
    bonusAmount?: number;
}

const ConfettiPiece: React.FC<{ x: number, y: number, rotate: number, color: string }> = ({ x, y, rotate, color }) => (
    <motion.div
        style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            backgroundColor: color,
            width: '8px',
            height: '16px',
            opacity: 0,
        }}
        {...{
            animate: {
                y: '120vh',
                x: Math.random() > 0.5 ? '+=50vw' : '-=50vw',
                rotate: rotate + (Math.random() - 0.5) * 720,
                opacity: [0, 1, 1, 0],
            },
            transition: {
                duration: 3 + Math.random() * 2,
                ease: "linear",
                repeat: 0,
            },
        } as any}
    />
);

const WelcomeBonusModal: React.FC<WelcomeBonusModalProps> = ({ isOpen, onClose, bonusAmount = 100 }) => {
    // FIX: The type for the confetti state was too specific (JSX.Element[]), causing a namespace conflict. Changed to React.ReactNode[] for better compatibility.
    const [confetti, setConfetti] = useState<React.ReactNode[]>([]);
    const colors = ["#16A832", "#8EB69B", "#FBBF24", "#FFFFFF", "#DAF1DE"];

    useEffect(() => {
        if (isOpen) {
            const newConfetti = Array.from({ length: 50 }).map((_, i) => (
                <ConfettiPiece
                    key={i}
                    x={Math.random() * 100}
                    y={-20 - Math.random() * 30}
                    rotate={Math.random() * 360}
                    color={colors[Math.floor(Math.random() * colors.length)]}
                />
            ));
            setConfetti(newConfetti);
            const timer = setTimeout(onClose, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none p-4 overflow-hidden">
                    {confetti}
                    <motion.div
                        {...{
                            initial: { y: "150%" },
                            animate: { y: 0 },
                            exit: { y: "150%" },
                            transition: { type: 'spring', stiffness: 300, damping: 30 },
                        } as any}
                        className="bg-[var(--theme-primary)] text-[var(--theme-primary-text)] rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center pointer-events-auto"
                    >
                        <h2 className="text-2xl font-bold">Congratulations!</h2>
                        <p className="mt-2 text-lg">You've received a welcome bonus of</p>
                        <p className="text-5xl font-bold my-3 text-yellow-300 drop-shadow-lg">{formatXp(bonusAmount)} XP</p>
                        <p className="text-sm opacity-80">Welcome to the NAXXIVO community!</p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeBonusModal;
