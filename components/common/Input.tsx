import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    rightElement?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, rightElement, className, ...props }) => {
    return (
        <div>
            <label 
                htmlFor={id} 
                className="block text-sm font-medium text-[var(--theme-text-secondary)] mb-1"
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    {...props}
                    className={`block w-full px-4 py-3 bg-[var(--theme-card-bg-alt)] border border-[var(--theme-input-border)] rounded-lg text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] sm:text-sm transition-all duration-300 ${className}`}
                />
                {rightElement && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;