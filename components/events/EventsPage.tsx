// eventspage.tsx
import React, { useRef } from 'react';
import { BackArrowIcon } from '../common/AppIcons';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { LuckRoyaleIcon, DiamondSpinIcon, TreasureHuntIcon } from '../common/EventIcons';

interface EventsPageProps {
    onBack: () => void;
    onNavigateToLuckRoyale: () => void;
}

// Arrow icon for the CTA
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
);


const EventCard: React.FC<{ 
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    delay: number, 
    comingSoon?: boolean, 
    onClick?: () => void, 
    colors: { glow: string, icon: string, from: string, to: string }
}> = ({ 
    title, 
    description, 
    icon, 
    delay, 
    comingSoon = false, 
    onClick, 
    colors
}) => {
    const cardRef = useRef<HTMLButtonElement>(null);
    
    // 3D tilt effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={cardRef}
            onClick={onClick}
            disabled={comingSoon || !onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: delay * 0.1 }}
            style={{ 
                rotateX, 
                rotateY,
                '--glow-color': colors.glow,
                '--icon-color': colors.icon,
            } as any}
            className="event-card w-full aspect-[1.4/1] md:aspect-[2/1] disabled:opacity-60 disabled:cursor-not-allowed group"
        >
            <div className="event-card-glow" />
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.from} ${colors.to}`} />
            <div className="event-card-bg-pattern" />
            <div className="event-card-shine" />
            
            <div className="event-card-icon-container">
                {icon}
            </div>

            <div className="relative z-10 p-6 h-full flex flex-col justify-between text-left text-white">
                <div>
                    <h3 className="font-logo text-2xl md:text-3xl text-white drop-shadow-lg">{title}</h3>
                    <p className="text-sm text-white/80 mt-2 max-w-xs">{description}</p>
                </div>

                <div className="flex justify-between items-end">
                    {comingSoon ? (
                        <div className="bg-black/40 text-white/90 text-xs font-bold px-3 py-1 rounded-full z-10 backdrop-blur-sm border border-white/10">
                            COMING SOON
                        </div>
                    ) : (
                         <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
                            <ArrowRightIcon />
                        </div>
                    )}
                </div>
            </div>
        </motion.button>
    );
};

const EventsPage: React.FC<EventsPageProps> = ({ onBack, onNavigateToLuckRoyale }) => {
    const events = [
        {
            title: "Luck Royale",
            description: "Spin for exclusive items and dazzling effects.",
            icon: <LuckRoyaleIcon />,
            onClick: onNavigateToLuckRoyale,
            comingSoon: false,
            colors: { glow: 'rgba(192, 132, 252, 0.7)', icon: '#c084fc', from: 'from-purple-600/50', to: 'to-indigo-800/50' },
        },
        {
            title: "Diamond Spin",
            description: "Premium, limited-edition rewards for high rollers.",
            icon: <DiamondSpinIcon />,
            comingSoon: true,
            colors: { glow: 'rgba(34, 211, 238, 0.7)', icon: '#22d3ee', from: 'from-cyan-600/50', to: 'to-blue-800/50' },
        },
        {
            title: "Treasure Hunt",
            description: "Find hidden treasures across the platform.",
            icon: <TreasureHuntIcon />,
            comingSoon: true,
            colors: { glow: 'rgba(245, 158, 11, 0.7)', icon: '#f59e0b', from: 'from-amber-600/50', to: 'to-orange-800/50' },
        },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen event-page-bg"
        >
            <header className="p-4 text-center sticky top-0 z-10 bg-black/30 backdrop-blur-lg border-b border-white/10">
                <div className="relative flex items-center justify-center">
                    <motion.button 
                        onClick={onBack} 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute left-0 text-purple-300 hover:text-white"
                    >
                        <BackArrowIcon />
                    </motion.button>
                    <motion.h1 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-logo text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                    >
                        Event Center
                    </motion.h1>
                </div>
            </header>

            <main className="p-4 md:p-6 space-y-6">
                {events.map((event, index) => (
                    <EventCard
                        key={event.title}
                        title={event.title}
                        description={event.description}
                        icon={event.icon}
                        delay={index}
                        onClick={event.onClick}
                        comingSoon={event.comingSoon}
                        colors={event.colors}
                    />
                ))}
            </main>
        </motion.div>
    );
};

export default EventsPage;