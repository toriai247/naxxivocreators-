import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables, Json } from '../../integrations/supabase/types';
import Button from '../common/Button';
import { generateAvatar } from '../../utils/helpers';

type StoreItem = Tables<'store_items'>;

interface CoverEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (assetDetails: Json) => void;
    item: StoreItem;
}

const CoverEditorModal: React.FC<CoverEditorModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [scale, setScale] = useState(1);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);

    const initialTransform = (item?.asset_details as { transform?: { scale: number; translateX: number; translateY: number; } })?.transform;
    
    useEffect(() => {
        if (isOpen) {
            setScale(initialTransform?.scale || 1);
            setTranslateX(initialTransform?.translateX || 0);
            setTranslateY(initialTransform?.translateY || 0);
        }
    }, [isOpen, initialTransform]);

    const handleSave = () => {
        const baseAssetDetails = (item.asset_details && typeof item.asset_details === 'object' && !Array.isArray(item.asset_details))
            ? item.asset_details
            : {};

        const newAssetDetails = {
            ...baseAssetDetails,
            transform: {
                scale,
                translateX,
                translateY
            }
        };
        onSave(newAssetDetails);
    };

    const handleReset = () => {
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
    };

    const baseTransform = 'translate(-50%, -50%)';
    const dynamicTransform = ` translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`;
    const transformStyle = {
        transform: `${baseTransform}${dynamicTransform}`
    };


    const ControlButton: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
        <button type="button" onClick={onClick} className="w-10 h-10 bg-[var(--theme-card-bg-alt)] rounded-md flex items-center justify-center font-mono text-lg hover:bg-[var(--theme-secondary-hover)] transition-colors">
            {children}
        </button>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        {...{
                            initial: { opacity: 0, scale: 0.9 },
                            animate: { opacity: 1, scale: 1 },
                            exit: { opacity: 0, scale: 0.9 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-4xl w-full flex flex-col md:flex-row"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Preview Pane */}
                        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-black/20 rounded-l-lg">
                            <h3 className="font-bold mb-4 text-[var(--theme-text)]">Live Preview</h3>
                            <div className="relative w-48 h-48">
                                {/* Sample Avatar */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32">
                                    <img src={generateAvatar('sample-user')} alt="Sample Avatar" className="w-full h-full rounded-full object-cover border-4 border-white" />
                                </div>
                                {/* Cover being edited */}
                                {item.preview_url && (
                                     <img src={item.preview_url} alt="Cover Preview" className="absolute top-1/2 left-1/2 pointer-events-none" style={transformStyle} />
                                )}
                            </div>
                        </div>

                        {/* Controls Pane */}
                        <div className="w-full md:w-64 p-6 space-y-6">
                            <h3 className="text-xl font-bold text-[var(--theme-text)]">Adjust Cover</h3>
                            {/* Position Controls */}
                            <div>
                                <label className="text-sm font-medium text-[var(--theme-text-secondary)]">Position</label>
                                <div className="grid grid-cols-3 gap-2 mt-2 justify-items-center">
                                    <div></div>
                                    {/* FIX: The ControlButton component requires children. I have added the up arrow as a child. */}
                                    <ControlButton onClick={() => setTranslateY(y => y - 5)}>↑</ControlButton>
                                    <div></div>
                                    {/* FIX: The ControlButton component requires children. I have added the left arrow as a child. */}
                                    <ControlButton onClick={() => setTranslateX(x => x - 5)}>←</ControlButton>
                                    <div className="w-10 h-10"></div>
                                    {/* FIX: The ControlButton component requires children. I have added the right arrow as a child. */}
                                    <ControlButton onClick={() => setTranslateX(x => x + 5)}>→</ControlButton>
                                    <div></div>
                                    {/* FIX: The ControlButton component requires children. I have added the down arrow as a child. */}
                                    <ControlButton onClick={() => setTranslateY(y => y + 5)}>↓</ControlButton>
                                    <div></div>
                                </div>
                            </div>
                            {/* Zoom Controls */}
                            <div>
                                <label className="text-sm font-medium text-[var(--theme-text-secondary)]">Scale</label>
                                <div className="flex gap-2 mt-2">
                                    {/* FIX: The ControlButton component requires children. I have added the minus symbol as a child. */}
                                    <ControlButton onClick={() => setScale(s => s - 0.05)}>-</ControlButton>
                                    <div className="flex-grow flex items-center justify-center bg-[var(--theme-card-bg-alt)] rounded-md text-sm">{scale.toFixed(2)}</div>
                                    {/* FIX: The ControlButton component requires children. I have added the plus symbol as a child. */}
                                    <ControlButton onClick={() => setScale(s => s + 0.05)}>+</ControlButton>
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-2 border-[var(--theme-secondary)]">
                                <Button onClick={handleSave} className="w-full">Save Changes</Button>
                                <Button onClick={handleReset} variant="secondary" className="w-full">Reset</Button>
                                <Button onClick={onClose} variant="secondary" className="w-full">Close</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CoverEditorModal;
