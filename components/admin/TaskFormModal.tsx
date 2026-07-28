import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables } from '../../integrations/supabase/types';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';

type Task = Tables<'tasks'>;

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Partial<Task>) => Promise<void>;
    taskToEdit: Task | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, taskToEdit }) => {
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        type: '',
        xp_reward: 10,
        required_count: 1,
        reset_interval: 'DAILY',
        is_active: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (taskToEdit) {
            setFormData(taskToEdit);
        } else {
            setFormData({
                title: '', description: '', type: '', xp_reward: 10, required_count: 1,
                reset_interval: 'DAILY', is_active: true
            });
        }
    }, [taskToEdit, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: keyof Task, value: boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({
            ...formData,
            xp_reward: Number(formData.xp_reward),
            required_count: Number(formData.required_count),
        });
        setIsSaving(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
                    <motion.div
                        {...{
                            initial: { opacity: 0, y: -50 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 50 },
                        } as any}
                        className="bg-[var(--theme-card-bg)] rounded-lg shadow-xl max-w-2xl w-full flex flex-col border border-[var(--theme-secondary)]"
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-[var(--theme-secondary)]">
                                <h2 className="text-xl font-bold text-[var(--theme-text)]">{taskToEdit ? 'Edit Task' : 'Create New Task'}</h2>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <Input id="title" label="Task Title" name="title" value={formData.title || ''} onChange={handleChange} required />
                                <Input id="type" label="Task Type (Unique Identifier)" name="type" value={formData.type || ''} onChange={handleChange} required placeholder="e.g., LIKE_POSTS" disabled={!!taskToEdit} />
                                <p className="text-xs text-[var(--theme-text-secondary)] -mt-2">This is a unique key for the system and cannot be changed after creation.</p>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Description</label>
                                    <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} className="admin-textarea" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input id="xp_reward" label="XP Reward" name="xp_reward" type="number" value={formData.xp_reward || ''} onChange={handleChange} required />
                                    <Input id="required_count" label="Required Count" name="required_count" type="number" value={formData.required_count || ''} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1">Reset Interval</label>
                                    <select name="reset_interval" value={formData.reset_interval} onChange={handleChange} className="admin-select">
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="ONCE">Once (Never Resets)</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-[var(--theme-card-bg-alt)]/50 p-3 rounded-md">
                                    <label htmlFor="is_active" className="text-sm font-medium text-[var(--theme-text)]/90">Task is Active</label>
                                    <button type="button" onClick={() => handleToggle('is_active', !formData.is_active)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${formData.is_active ? 'bg-[var(--theme-primary)]' : 'bg-gray-600'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 bg-black/20 flex justify-end space-x-3 border-t border-[var(--theme-secondary)]">
                                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-auto">Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="w-auto px-6">
                                    {isSaving ? <LoadingSpinner /> : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TaskFormModal;