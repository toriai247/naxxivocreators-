import React from 'react';

interface IconProps {
    className?: string;
}

export const LuckRoyaleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2.69l.34 2.27.94-1.29 1.62 1.62-1.29.94 2.27.34-1.74 1.95 1.95 1.74-.34 2.27-2.27-.34.94 1.29-1.62 1.62-1.29-.94-.34 2.27-1.95-1.74L8.05 20.7l.34-2.27-.94 1.29-1.62-1.62 1.29-.94-2.27-.34 1.74-1.95-1.95-1.74.34-2.27 2.27.34-.94-1.29 1.62-1.62 1.29.94.34-2.27z"/>
        <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
);

export const DiamondSpinIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L2 7l10 15L22 7l-10-5z" />
        <path d="M2 7l10 15l10-15" />
        <path d="M12 2v20" />
        <path d="M2.7 10.3a11 11 0 0 0 18.6 0" />
    </svg>
);

export const TreasureHuntIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="8" width="18" height="12" rx="2" ry="2"/>
        <path d="M8 8V6a4 4 0 1 1 8 0v2"/>
        <path d="M12 14v-1"/>
        <path d="M12 11h.01"/>
    </svg>
);
