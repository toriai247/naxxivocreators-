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
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-[var(--theme-text)]">Task Management</h2>
                <button
                    onClick={handleCreateNew}
                    className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-white font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    Create New Task
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">Title</th>
                                <th className="admin-th">Type</th>
                                <th className="admin-th">Reward</th>
                                <th className="admin-th">Goal</th>
                                <th className="admin-th">Interval</th>
                                <th className="admin-th">Status</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="admin-tbody">
                             {tasks.map(task => (
                                <tr key={task.id} className="admin-tr">
                                    <td className="admin-td font-medium text-[var(--theme-text)]">{task.title}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)] font-mono">{task.type}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{task.xp_reward} XP</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{task.required_count}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)] capitalize">{task.reset_interval.toLowerCase()}</td>
                                    <td className="admin-td">
                                        <span className={`status-badge ${task.is_active ? 'status-badge-active' : 'status-badge-inactive'}`}>
                                            {task.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => handleEdit(task)} className="btn-edit">Edit</button>
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