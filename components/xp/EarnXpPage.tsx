import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables } from '../../integrations/supabase/types';
import { BackArrowIcon, TrophyIcon, CheckCircleIcon } from '../common/AppIcons';
import LoadingSpinner from '../common/LoadingSpinner';
import { motion } from 'framer-motion';

interface EarnXpPageProps {
    session: Session;
    onBack: () => void;
}

type Task = Tables<'tasks'>;
type UserTaskProgress = Tables<'user_task_progress'>;

type TaskWithProgress = Task & {
    progress: UserTaskProgress | null;
};

const TaskCard: React.FC<{ task: TaskWithProgress, delay: number }> = ({ task, delay }) => {
    const progressCount = task.progress?.progress_count || 0;
    const requiredCount = task.required_count;
    const isCompleted = progressCount >= requiredCount;
    const progressPercent = Math.min((progressCount / requiredCount) * 100, 100);

    return (
        <motion.div
            {...{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: delay * 0.1 },
            } as any}
            className="bg-[var(--theme-card-bg)] p-4 rounded-xl shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-[var(--theme-text)]">{task.title}</h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] mt-1">{task.description}</p>
                </div>
                <div className="flex-shrink-0 ml-4 text-center">
                    <p className="font-bold text-lg text-[var(--theme-primary)]">+{task.xp_reward}</p>
                    <p className="text-xs text-[var(--theme-text-secondary)]">XP</p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)] mb-1">
                    <span>Progress</span>
                    <span>{progressCount} / {requiredCount}</span>
                </div>
                <div className="w-full bg-[var(--theme-bg)] rounded-full h-2.5">
                    <motion.div
                        className="bg-[var(--theme-primary)] h-2.5 rounded-full"
                        {...{
                            initial: { width: 0 },
                            animate: { width: `${progressPercent}%` },
                            transition: { duration: 0.5, ease: 'easeOut' },
                        } as any}
                    />
                </div>
                 {isCompleted && (
                    <div className="flex items-center justify-center mt-3 text-sm font-semibold text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="w-5 h-5 mr-1.5" />
                        Completed!
                    </div>
                )}
            </div>
        </motion.div>
    );
};


const EarnXpPage: React.FC<EarnXpPageProps> = ({ session, onBack }) => {
    const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (tasksError) throw tasksError;

            const { data: progressData, error: progressError } = await supabase
                .from('user_task_progress')
                .select('*')
                .eq('user_id', session.user.id);
            
            if (progressError) throw progressError;

            const progressMap = new Map((progressData as any[] || []).map(p => [p.task_id, p]));

            const combinedTasks = (tasksData as any[] || []).map(task => ({
                ...task,
                progress: progressMap.get(task.id) || null,
            }));

            setTasks(combinedTasks);
        } catch (err: any) {
            setError(err.message || "Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    }, [session.user.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="min-h-screen bg-[var(--theme-bg)]">
            <header className="flex items-center p-4 border-b border-black/10 dark:border-white/10 bg-[var(--theme-card-bg)] sticky top-0 z-10">
                <button onClick={onBack} className="text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"><BackArrowIcon /></button>
                <h1 className="text-xl font-bold text-[var(--theme-text)] mx-auto flex items-center gap-2">
                    <TrophyIcon /> Earn XP
                </h1>
                <div className="w-6"></div> {/* Placeholder */}
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center pt-20"><LoadingSpinner /></div>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : tasks.length === 0 ? (
                    <p className="text-center text-[var(--theme-text-secondary)] pt-10">No tasks available right now. Check back later!</p>
                ) : (
                    tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} delay={index} />
                    ))
                )}
            </main>
        </div>
    );
};

export default EarnXpPage;