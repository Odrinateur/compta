"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type DialogVariant = "confirm" | "destructive" | "info" | "custom";

interface CustomDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    isMounted?: boolean;
    withIsMounted?: boolean;
    title: string;
    /** Description du dialog (peut être un ReactNode pour du contenu HTML) */
    description?: React.ReactNode;
    /** Contenu du body de la modal */
    children?: React.ReactNode;
    /** Element qui déclenche l'ouverture de la modal (optionnel si contrôlé via open/setOpen) */
    trigger?: React.ReactNode;
    /** Variante du dialog: confirm (défaut), destructive, info (un seul bouton), custom (footer personnalisé) */
    variant?: DialogVariant;
    /** Texte du bouton de confirmation */
    confirmText?: string;
    /** Callback appelé lors de la confirmation */
    onConfirm?: () => void;
    /** Texte du bouton d'annulation */
    cancelText?: string;
    /** Callback appelé lors de l'annulation (par défaut ferme la modal) */
    onCancel?: () => void;
    /** Footer personnalisé (utilisé avec variant="custom") */
    footer?: React.ReactNode;
    /** Afficher le footer (true par défaut sauf si variant="custom" sans footer) */
    showFooter?: boolean;
    /** Afficher le bouton de fermeture X */
    showCloseButton?: boolean;
    /** Classes CSS additionnelles pour le contenu */
    className?: string;
    /** Classes CSS additionnelles pour le header */
    headerClassName?: string;
    /** Classes CSS additionnelles pour le footer */
    footerClassName?: string;
    /** Désactiver le bouton de confirmation */
    confirmDisabled?: boolean;
    /** État de chargement du bouton de confirmation */
    confirmLoading?: boolean;
}

export function CustomDialog({
    open,
    setOpen,
    isMounted = true,
    withIsMounted = false,
    title,
    description,
    children,
    trigger,
    variant = "confirm",
    onConfirm,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    onCancel,
    footer,
    showFooter = true,
    showCloseButton = true,
    className,
    headerClassName,
    footerClassName,
    confirmDisabled = false,
    confirmLoading = false,
}: CustomDialogProps) {
    useEffect(() => {
        if (withIsMounted && !isMounted) {
            setOpen(false);
        }
    }, [withIsMounted, isMounted, setOpen]);

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            setOpen(false);
        }
    };

    const handleConfirm = () => {
        onConfirm?.();
    };

    const getConfirmButtonVariant = () => {
        switch (variant) {
            case "destructive":
                return "destructive";
            default:
                return "default";
        }
    };

    const renderFooter = () => {
        if (!showFooter) return null;

        // Footer personnalisé
        if (variant === "custom") {
            return footer ? (
                <DialogFooter className={footerClassName}>
                    {footer}
                </DialogFooter>
            ) : null;
        }

        // Variante info: un seul bouton
        if (variant === "info") {
            return (
                <DialogFooter className={footerClassName}>
                    <Button variant="default" onClick={() => setOpen(false)}>
                        {confirmText}
                    </Button>
                </DialogFooter>
            );
        }

        // Variantes confirm et destructive: deux boutons
        return (
            <DialogFooter className={footerClassName}>
                <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={confirmLoading}
                >
                    {cancelText}
                </Button>
                <Button
                    variant={getConfirmButtonVariant()}
                    onClick={handleConfirm}
                    disabled={confirmDisabled || confirmLoading}
                >
                    {confirmLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        confirmText
                    )}
                </Button>
            </DialogFooter>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className={cn(className)}
                showCloseButton={showCloseButton}
            >
                <DialogHeader className={headerClassName}>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
}
