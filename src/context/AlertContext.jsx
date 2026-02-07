import React, { createContext, useContext, useState, useCallback } from 'react';
import Modal from '../components/ui/Modal';

const AlertContext = createContext(null);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: null,
        onClose: null
    });

    const showAlert = useCallback(({
        title,
        message,
        type = 'info',
        confirmText = 'OK',
        cancelText = null,
        onConfirm = null,
        onCloseCallback = null
    }) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            confirmText,
            cancelText,
            onConfirm,
            onClose: onCloseCallback
        });
    }, []);

    const closeAlert = useCallback(() => {
        if (alertConfig.onClose) {
            alertConfig.onClose();
        }
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    }, [alertConfig]);

    // Convenient wrappers
    const success = (message, title = 'Success') => showAlert({ message, title, type: 'success' });
    const error = (message, title = 'Error') => showAlert({ message, title, type: 'error' });
    const warn = (message, title = 'Warning') => showAlert({ message, title, type: 'warning' });
    const info = (message, title = 'Info') => showAlert({ message, title, type: 'info' });

    const confirm = (message, onConfirm, title = 'Confirm Action') => showAlert({
        message,
        title,
        type: 'warning',
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel',
        onConfirm
    });

    return (
        <AlertContext.Provider value={{ showAlert, closeAlert, success, error, warn, info, confirm }}>
            {children}
            <Modal
                {...alertConfig}
                onClose={closeAlert}
            />
        </AlertContext.Provider>
    );
};
