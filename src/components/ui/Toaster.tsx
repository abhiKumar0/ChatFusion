
'use client';

import React from 'react';
import { useToastStore, ToastType } from '@/store/useToastStore';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastVariants = {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
};

const ToastItem = ({ id, message, type }: { id: string; message: string; type: ToastType }) => {
    const removeToast = useToastStore((state) => state.removeToast);

    return (
        <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all select-none pointer-events-auto",
                "bg-background/80 border-border text-foreground", // Default theme aware
                "min-w-[300px] max-w-[400px]"
            )}
            layout
        >
            <div className="shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => removeToast(id)}
                className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export const Toaster = () => {
    const toasts = useToastStore((state) => state.toasts);

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} />
                ))}
            </AnimatePresence>
        </div>
    );
};
