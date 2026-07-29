import React from 'react';
import LightroomEditorStudio from './LightroomEditorStudio';

interface ImageEditorPageProps {
    onBack: () => void;
}

export const ImageEditorPage: React.FC<ImageEditorPageProps> = ({ onBack }) => {
    const handleSave = (newUrl: string) => {
        try {
            const loaded = localStorage.getItem('studio_recent_edits');
            const recent = loaded ? JSON.parse(loaded) : [];
            const newItem = {
                id: String(Date.now()),
                url: newUrl,
                title: `NaxStudio Edit (${new Date().toLocaleDateString()})`,
                date: new Date().toLocaleTimeString()
            };
            const updated = [newItem, ...recent].slice(0, 16);
            localStorage.setItem('studio_recent_edits', JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save edit to localStorage", e);
        }
    };

    return (
        <LightroomEditorStudio
            onBack={onBack}
            onSave={handleSave}
        />
    );
};

export default ImageEditorPage;
