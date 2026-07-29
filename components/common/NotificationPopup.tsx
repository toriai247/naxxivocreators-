import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, InfoIcon, XCircleIcon } from './AppIcons';

export interface NotificationDetails {
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
}

interface NotificationPopupProps {
    notification: NotificationDetails | null;
    onClose: () => void;
}

const icons = {
    success: (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
            <CheckCircleIcon className="w-6 h-6" />
        </div>
    ),
    error: (
        <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
            <XCircleIcon className="w-6 h-6" />
        </div>
    ),
    info: (
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10">
            <InfoIcon className="w-6 h-6" />
        </div>
    ),
};

const borderGlow = {
    success: 'border-emerald-500/40 shadow-[0_10px_35px_rgba(16,185,129,0.25)]',
    error: 'border-rose-500/40 shadow-[0_10px_35px_rgba(244,63,94,0.25)]',
    info: 'border-indigo-500/40 shadow-[0_10px_35px_rgba(99,102,241,0.25)]',
};

const progressBarBg = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-indigo-500',
};

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notification, onClose }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (notification) {
            setProgress(100);
            const interval = setInterval(() => {
                setProgress(prev => Math.max(0, prev - 2.5));
            }, 100);

            const timer = setTimeout(() => {
                onClose();
            }, 4000);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [notification, onClose]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="fixed top-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-md z-[99999] mx-auto pointer-events-auto"
                >
                    <div className={`relative overflow-hidden rounded-3xl bg-slate-950/90 dark:bg-slate-900/95 backdrop-blur-xl border p-4 sm:p-5 flex items-start gap-3.5 text-white ${borderGlow[notification.type]}`}>
                        {/* Status Icon */}
                        {icons[notification.type]}

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs sm:text-sm font-black text-white tracking-wide">
                                {notification.title}
                            </p>
                            <p className="text-xs font-semibold text-slate-300 mt-0.5 leading-snug break-words">
                                {notification.message}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0"
                            aria-label="Close notification"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Auto-dismiss progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                            <div 
                                className={`h-full transition-all duration-100 ease-linear ${progressBarBg[notification.type]}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationPopup;
