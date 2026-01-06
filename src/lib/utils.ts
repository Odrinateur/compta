import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatAmount(amount: number): string {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(amount / 100);
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
    } else {
        let binary = "";
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary);
    }
}

export function base64ToUint8Array(base64: string): Uint8Array {
    if (typeof Buffer !== "undefined") {
        return new Uint8Array(Buffer.from(base64, "base64"));
    } else {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}


export const MAX_IMAGE_SIZE = 800; // Taille maximale en pixels
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                // Calculer les nouvelles dimensions en gardant le ratio
                if (width > height) {
                    if (width > MAX_IMAGE_SIZE) {
                        height = (height * MAX_IMAGE_SIZE) / width;
                        width = MAX_IMAGE_SIZE;
                    }
                } else {
                    if (height > MAX_IMAGE_SIZE) {
                        width = (width * MAX_IMAGE_SIZE) / height;
                        height = MAX_IMAGE_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Impossible de créer le contexte canvas"));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Impossible de compresser l'image"));
                            return;
                        }
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(resizedFile);
                    },
                    file.type,
                    0.8 // Qualité de compression (0.8 = 80%)
                );
            };
            img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier"));
        reader.readAsDataURL(file);
    });
}