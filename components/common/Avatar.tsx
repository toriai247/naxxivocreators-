import React from 'react';
import { generateAvatar } from '../../utils/helpers';
import type { Json } from '../../integrations/supabase/types';

interface AvatarProps {
    photoUrl: string | null | undefined;
    name: string | null | undefined;
    activeCover?: {
        preview_url: string | null;
        asset_details: Json | null;
    } | null;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    containerClassName?: string;
    imageClassName?: string;
}

const sizeClasses = {
    xxs: 'w-6 h-6',
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
};

const Avatar: React.FC<AvatarProps> = ({ photoUrl, name, activeCover, size = 'md', containerClassName = '', imageClassName = '' }) => {
    const transform = (activeCover?.asset_details as { transform?: { scale: number; translateX: number; translateY: number; } })?.transform;
    const baseTransform = 'translate(-50%, -50%)';
    const dynamicTransform = transform 
        ? ` translateX(${transform.translateX}px) translateY(${transform.translateY}px) scale(${transform.scale})`
        : '';
    const transformStyle = {
        transform: `${baseTransform}${dynamicTransform}`
    };

    return (
        <div className={`relative flex-shrink-0 ${sizeClasses[size]} ${containerClassName}`}>
            <img
                src={photoUrl || generateAvatar(name || '')}
                alt={name || 'User avatar'}
                className={`w-full h-full rounded-full object-cover bg-gray-200 ${imageClassName}`}
            />
            {activeCover?.preview_url && (
                <img
                    src={activeCover.preview_url}
                    alt="Profile Cover"
                    className="absolute top-1/2 left-1/2 pointer-events-none w-auto h-auto"
                    style={transformStyle}
                />
            )}
        </div>
    );
};

export default Avatar;
