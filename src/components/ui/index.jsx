import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', size = 'default', isLoading, children, ...props }) {
    const variants = {
        primary: 'bg-ogene-900 text-white hover:bg-ogene-800 shadow-sm',
        secondary: 'bg-white text-ogene-900 border border-ogene-300 hover:bg-ogene-50',
        ghost: 'hover:bg-ogene-100 text-ogene-700',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        default: 'h-10 px-4 py-2',
        lg: 'h-12 px-8 text-lg'
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ogene-950 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <span className="mr-2 animate-spin">⚪</span>}
            {children}
        </button>
    );
}

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "flex h-10 w-full rounded-md border border-ogene-300 bg-transparent px-3 py-2 text-sm placeholder:text-ogene-400 focus:outline-none focus:ring-2 focus:ring-ogene-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                className
            )}
            {...props}
        />
    );
}

export function Label({ className, children, ...props }) {
    return (
        <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block text-ogene-700", className)} {...props}>
            {children}
        </label>
    );
}

export function Alert({ title, children, variant = 'info', className }) {
    const variants = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        info: 'bg-ogene-50 text-ogene-800 border-ogene-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
    };

    return (
        <div className={cn("p-4 rounded-lg border flex flex-col gap-1", variants[variant], className)} role="alert">
            {title && <h4 className="font-bold text-sm tracking-tight">{title}</h4>}
            <div className="text-sm leading-relaxed">{children}</div>
        </div>
    );
}

export { default as Modal } from './Modal';
export { default as ArticleCard } from './ArticleCard';
export { default as OgeneIcon } from './OgeneIcon';
export { default as HeroSlider } from './HeroSlider';
