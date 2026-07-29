import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Tables, Enums } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import TaskFormModal from './TaskFormModal';

type Task = Tables<'tasks'>;

const AdminTasksPage: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*').order('created_at');
        if (error) {
            alert(`Error fetching tasks: ${error.message}`);
        } else {
            setTasks(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateNew = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };
    
    const handleSaveTask = async (taskData: Partial<Task>) => {
        try {
            const { error } = await supabase.from('tasks').upsert(taskData as any).select();
            if (error) throw error;
            setIsModalOpen(false);
            await fetchTasks();
        } catch (error: any) {
            console.error('Save failed:', error);
            let detailMessage = 'An unknown error occurred.';
            if (error) {
                if (error.message) {
                    detailMessage = `Message: ${error.message}`;
                    if (error.details) detailMessage += `\nDetails: ${error.details}`;
                    if (error.hint) detailMessage += `\nHint: ${error.hint}`;
                    if (error.code) detailMessage += `\nCode: ${error.code}`;
                } else {
                    try {
                        detailMessage = JSON.stringify(error, null, 2);
                    } catch {
                        detailMessage = "Could not stringify the error object. Check the console for more details.";
                    }
                }
            }
            alert(`Save failed: ${detailMessage}`);
        }
    };


    return (
        <div className="space-y-3 font-sans">
            {/* Control Bar */}
            <div className="bg-yellow-400 border border-slate-900 p-3.5 text-slate-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
                <div>
                    <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono">TASK ENGINE & XP REWARDS</h2>
                    <p className="text-[10px] text-slate-800 font-mono font-bold">Configure daily, weekly, and special tasks for user XP reward distribution</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-900 text-xs font-black transition-none font-mono"
                >
                    + CREATE NEW TASK
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12 text-slate-500 text-xs font-mono"><LoadingSpinner /></div>
            ) : tasks.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 text-center text-xs text-slate-500 font-mono">
                    NO TASKS CONFIGURED IN DATABASE
                </div>
            ) : (
                <div className="border border-slate-200 bg-white overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider font-mono">
                                <th className="p-3 border-r border-slate-200">Task Title</th>
                                <th className="p-3 border-r border-slate-200">Type Key</th>
                                <th className="p-3 border-r border-slate-200">XP Reward</th>
                                <th className="p-3 border-r border-slate-200">Goal Count</th>
                                <th className="p-3 border-r border-slate-200">Reset Interval</th>
                                <th className="p-3 border-r border-slate-200">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {tasks.map(task => (
                                <tr key={task.id} className="hover:bg-yellow-50/60 transition-none">
                                    <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                                        {task.title}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono text-[10px] text-yellow-700 font-bold">
                                        {task.type}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-black text-emerald-600 font-mono">
                                        +{task.xp_reward} XP
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-slate-700 font-mono">
                                        {task.required_count}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-[10px] uppercase text-slate-500 font-mono">
                                        {task.reset_interval}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono">
                                        <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                                            task.is_active
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                            {task.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleEdit(task)} 
                                            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-slate-900 text-[10px] font-black active:bg-yellow-500 transition-none font-mono"
                                        >
                                            [EDIT TASK]
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <TaskFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveTask}
                    taskToEdit={editingTask}
                />
            )}
        </div>
    );
};

export default AdminTasksPage;