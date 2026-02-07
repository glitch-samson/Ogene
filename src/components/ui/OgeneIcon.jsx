import React from 'react';

export default function OgeneIcon({ size = 24, fill = "none", className = "", ...props }) {
    const isFilled = fill !== "none";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={fill === "currentColor" ? "currentColor" : fill}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Stylized Ogene Gong Shape */}
            <path d="M12 3c-4 0-6 2-6 6v8c0 2 2 4 6 4s6-2 6-4V9c0-4-2-6-6-6z" />
            <path d="M6 12c0 1.5 2.5 3 6 3s6-1.5 6-3" />
            {isFilled && (
                <path d="M12 3c-4 0-6 2-6 6v8c0 2 2 4 6 4s6-2 6-4V9c0-4-2-6-6-6z" fill="currentColor" fillOpacity="0.2" />
            )}
        </svg>
    );
}
