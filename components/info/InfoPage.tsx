import React, { useState } from 'react';
import { BackArrowIcon, ChevronRightIcon } from '../common/AppIcons';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoPageProps {
    onBack: () => void;
}

const AccordionItem = ({ title, children, i }: { title: string, children: React.ReactNode, i: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <motion.div
            {...{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: i * 0.1 },
            } as any}
            className="bg-[var(--theme-card-bg)] rounded-lg shadow-sm overflow-hidden"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h2 className="font-semibold text-[var(--theme-text)]">{title}</h2>
                <motion.div {...{ animate: { rotate: isOpen ? 90 : 0 } } as any}>
                    <ChevronRightIcon />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        {...{
                            initial: "collapsed",
                            animate: "open",
                            exit: "collapsed",
                            variants: {
                                open: { opacity: 1, height: 'auto' },
                                collapsed: { opacity: 0, height: 0 }
                            },
                            transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
                        } as any}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 text-sm text-[var(--theme-text-secondary)] space-y-2 prose dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

const InfoPage: React.FC<InfoPageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-[var(--theme-secondary)]/30 bg-[var(--theme-header-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-header-text)] hover:opacity-80"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-header-text)] mx-auto">The Game Manual</h1>
                <div className="w-6"></div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-3">
                {/* FIX: The AccordionItem component requires children. I have wrapped the content within the component. */}
                <AccordionItem title="Welcome to NAXXIVO!" i={0}>
                    <p>Your gaming saga starts here. Get to know the basics:</p>
                    <ul>
                        <li><strong>XP (Experience Points):</strong> This is your social currency. Earn it by completing daily tasks, engaging with the community, and participating in events.</li>
                        <li><strong>Currencies:</strong> Gold, Silver, and Diamond coins are special tokens used for exclusive events like Luck Royale. Earn them through subscriptions or special promotions.</li>
                        <li><strong>Leaderboards:</strong> Compete with other gamers! Climb the ranks by earning the most XP or special currencies each season.</li>
                         <li><strong>Your Profile:</strong> This is your personal space. Customize it with animated covers, profile music, and more to show off your unique style.</li>
                    </ul>
                </AccordionItem>
                {/* FIX: The AccordionItem component requires children. I have wrapped the content within the component. */}
                <AccordionItem title="Customization Hub" i={1}>
                    <p>Make your profile uniquely yours.</p>
                    <ul>
                        <li><strong>The Bazaar:</strong> The official marketplace for exclusive profile items. Discover animated covers, profile music, and rare badges. New items are added regularly!</li>
                        <li><strong>My Inventory:</strong> This is your personal inventory. After buying an item, find it here and click "Equip" to apply it to your profile instantly.</li>
                        <li><strong>Become a Creator:</strong> Don't just buy, create! You can design and submit your own Profile Covers. If approved, they'll appear in the Bazaar for other users to purchase, earning you recognition.</li>
                    </ul>
                </AccordionItem>
                 {/* FIX: The AccordionItem component requires children. I have wrapped the content within the component. */}
                 <AccordionItem title="Events & Rewards" i={2}>
                    <p>Participate in exciting activities to earn rewards.</p>
                    <ul>
                        <li><strong>Daily Tasks:</strong> The best way to earn free XP. New tasks are available every day, so check back often to maximize your earnings.</li>
                        <li><strong>Luck Royale:</strong> Test your luck! Use your Gold, Silver, or Diamond coins to spin for ultra-rare and exclusive items that cannot be found anywhere else.</li>
                        <li><strong>Top-Up Center:</strong> Need a boost? Securely purchase XP packages or subscribe for the best value. Subscriptions include a large amount of XP upfront and free daily XP claims.</li>
                    </ul>
                </AccordionItem>
                 {/* FIX: The AccordionItem component requires children. I have wrapped the content within the component. */}
                 <AccordionItem title="Community Guidelines" i={3}>
                    <p>Help us keep NAXXIVO a safe and positive space for everyone.</p>
                    <ol>
                        <li><strong>Be Respectful:</strong> Treat everyone with kindness. Harassment, bullying, and hate speech will not be tolerated.</li>
                        <li><strong>Keep it Authentic:</strong> Do not post spam, repetitive content, or unsolicited advertisements.</li>
                        <li><strong>Protect Privacy:</strong> Do not share private information about others without their explicit consent.</li>
                        <li><strong>Report, Don't Retaliate:</strong> If you see something that violates the rules, please report it to our team.</li>
                    </ol>
                </AccordionItem>
                 {/* FIX: The AccordionItem component requires children. I have wrapped the content within the component. */}
                 <AccordionItem title="The Future of NAXXIVO" i={4}>
                    <p>We are constantly working to make your journey more exciting. Here's a sneak peek at what's on the horizon:</p>
                    <ul>
                        <li><strong>Gifting System:</strong> Send items from The Bazaar directly to your friends to celebrate milestones or just because!</li>
                        <li><strong>Profile Achievements:</strong> Earn unique badges for your profile by reaching milestones, completing challenges, and participating in events.</li>
                        <li><strong>Enhanced Messaging:</strong> Look forward to voice notes and fun stickers in your private chats.</li>
                        <li><strong>Interactive Community Events:</strong> Participate in platform-wide events with unique stories and collaborative goals to earn massive rewards.</li>
                        <li><strong>Profile Themes:</strong> Unlock complete visual overhauls for your profile page, changing colors, layouts, and more.</li>
                    </ul>
                </AccordionItem>
            </main>
        </div>
    );
};

export default InfoPage;
