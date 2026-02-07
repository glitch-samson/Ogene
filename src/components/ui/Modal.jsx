import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button, cn } from './index';

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText,
    onConfirm
}) {
    const icons = {
        success: <CheckCircle className="text-green-500" size={32} />,
        warning: <AlertTriangle className="text-yellow-500" size={32} />,
        error: <AlertCircle className="text-red-500" size={32} />,
        info: <Info className="text-ogene-500" size={32} />
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-[101]"
                    >
                        <div className="p-6 pt-8 text-center">
                            <div className="flex justify-center mb-4">
                                {icons[type]}
                            </div>

                            {title && (
                                <h3 className="text-xl font-serif font-bold text-ogene-900 mb-2">
                                    {title}
                                </h3>
                            )}

                            <p className="text-ogene-500 text-sm leading-relaxed mb-8">
                                {message}
                            </p>

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full h-12 rounded-xl bg-ogene-900 text-white font-bold"
                                    onClick={() => {
                                        if (onConfirm) onConfirm();
                                        onClose();
                                    }}
                                >
                                    {confirmText}
                                </Button>

                                {cancelText && (
                                    <Button
                                        variant="ghost"
                                        className="w-full h-12 rounded-xl text-ogene-400 font-medium"
                                        onClick={onClose}
                                    >
                                        {cancelText}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 rounded-full text-ogene-300 hover:text-ogene-600 hover:bg-ogene-50 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
