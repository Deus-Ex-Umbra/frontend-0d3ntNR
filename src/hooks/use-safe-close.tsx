import { useState, useCallback, useEffect } from 'react';

interface UseSafeCloseProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    isDirty: boolean;
    isLoading?: boolean;
}

interface UseSafeCloseReturn {
    handleOpenChange: (open: boolean) => void;
    closeConfirmationProps: {
        open: boolean;
        onOpenChange: (open: boolean) => void;
        onConfirm: () => void;
        onCancel: () => void;
    };
}

export function useSafeClose({
    isOpen,
    onOpenChange,
    isDirty,
    isLoading = false,
}: UseSafeCloseProps): UseSafeCloseReturn {
    const [showConfirmation, setShowConfirmation] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setShowConfirmation(false);
        }
    }, [isOpen]);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                onOpenChange(true);
                return;
            }
            if (isLoading) {
                return;
            }

            if (isDirty) {
                setShowConfirmation(true);
            } else {
                onOpenChange(false);
            }
        },
        [isLoading, isDirty, onOpenChange]
    );

    const confirmClose = useCallback(() => {
        setShowConfirmation(false);
        onOpenChange(false);
    }, [onOpenChange]);

    const cancelClose = useCallback(() => {
        setShowConfirmation(false);
    }, []);

    return {
        handleOpenChange,
        closeConfirmationProps: {
            open: showConfirmation,
            onOpenChange: setShowConfirmation,
            onConfirm: confirmClose,
            onCancel: cancelClose,
        },
    };
}
