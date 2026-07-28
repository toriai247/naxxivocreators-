import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfflineIcon, ServerIcon } from './AppIcons';

interface ConnectivityStatusOverlayProps {
    isOffline: boolean;
    isServerDown: boolean;
}

const ConnectivityStatusOverlay: React.FC<ConnectivityStatusOverlayProps> = ({ isOffline, isServerDown }) => {
    const shouldShow = isOffline || isServerDown;
    const content = isOffline ? {
        icon: <OfflineIcon />,
        title: "No Internet Connection",
        message: "You are currently offline. Please check your network settings and try again."
    } : {
        icon: <ServerIcon />,
        title: "Service Temporarily Unavailable",
        message: "Our services are temporarily unavailable. We are performing some maintenance and will be back shortly. Thank you for your patience."
    };

    return (
        <AnimatePresence>
            {shouldShow && (
                <motion.div
                    {...{
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                    } as any}
                    className="fixed inset-0 bg-[var(--theme-bg)]/95 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                >
                    <div className="text-center text-[var(--theme-text-secondary)]">
                        <motion.div 
                            {...{
                                initial: { scale: 0.5, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                transition: { delay: 0.2, type: 'spring' },
                            } as any}
                            className="flex justify-center mb-4"
                        >
                            {content.icon}
                        </motion.div>
                        <h1 className="text-2xl font-bold text-[var(--theme-text)] mb-2">{content.title}</h1>
                        <p>{content.message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConnectivityStatusOverlay;