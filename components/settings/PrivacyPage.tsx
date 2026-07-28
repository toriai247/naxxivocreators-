import React, { useState } from 'react';
import { BackArrowIcon } from '../common/AppIcons';

interface PrivacyPageProps {
    onBack: () => void;
}

const PrivacyToggle = ({ title, description, isEnabled, onToggle }: { title: string, description: string, isEnabled: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-4">
        <div>
            <h3 className="font-semibold text-[var(--theme-text)]">{title}</h3>
            <p className="text-sm text-[var(--theme-text-secondary)]">{description}</p>
        </div>
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEnabled ? 'bg-[var(--theme-primary)]' : 'bg-gray-400'}`}
            aria-checked={isEnabled}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
    const [isPrivate, setIsPrivate] = useState(false);
    const [allowDms, setAllowDms] = useState(true);

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">Privacy Center</h1>
                <div className="w-6"></div>
            </header>

            <main className="p-4">
                <div className="bg-[var(--theme-card-bg)] p-4 rounded-2xl shadow-sm divide-y divide-[var(--theme-secondary)]/50">
                    <PrivacyToggle
                        title="Private Account"
                        description="When your account is private, only people you approve can see your posts and follow you."
                        isEnabled={isPrivate}
                        onToggle={() => setIsPrivate(!isPrivate)}
                    />
                    <PrivacyToggle
                        title="Allow DMs from Everyone"
                        description="Turn this off to only allow messages from people you follow."
                        isEnabled={allowDms}
                        onToggle={() => setAllowDms(!allowDms)}
                    />
                </div>
                 <p className="text-xs text-center text-[var(--theme-text-secondary)] mt-4">More privacy settings are coming soon!</p>
            </main>
        </div>
    );
};

export default PrivacyPage;