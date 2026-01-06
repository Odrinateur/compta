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
        // Node.js environment
        return Buffer.from(bytes).toString("base64");
    } else {
        // Cloudflare Workers environment (Web API)
        let binary = "";
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary);
    }
}

export function base64ToUint8Array(base64: string): Uint8Array {
    if (typeof Buffer !== "undefined") {
        // Node.js environment
        return new Uint8Array(Buffer.from(base64, "base64"));
    } else {
        // Cloudflare Workers environment (Web API)
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}