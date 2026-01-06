"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { loginAction } from "./login-action";
import { MAX_FILE_SIZE, resizeImage } from "@/lib/utils";

export default function LoginInput() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [picture, setPicture] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setPicture(null);
            setPreview(null);
            return;
        }

        // Vérifier la taille du fichier
        if (file.size > MAX_FILE_SIZE) {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setError(`L'image est trop grande. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            setPicture(null);
            setPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setError(null);

        // Nettoyer l'ancienne prévisualisation si elle existe
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        try {
            // Créer une prévisualisation
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);

            // Redimensionner l'image si nécessaire
            const resizedFile = await resizeImage(file);
            setPicture(resizedFile);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors du traitement de l'image");
            setPicture(null);
            setPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await loginAction(username, password, picture);
        } catch (err) {
            const error = err as Error & { digest?: string };
            if (error instanceof Error && error.digest?.startsWith("NEXT_REDIRECT")) {
                return;
            }
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
                type="text"
                placeholder="Username"
                className="w-64"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                required
            />
            <Input
                type="password"
                placeholder="Password"
                className="w-64"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                required
            />
            <div className="flex flex-col gap-2">
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-64"
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
                {preview && (
                    <div className="border rounded-md relative p-2 w-64 h-64 overflow-hidden">
                        <img
                            src={preview}
                            alt="Aperçu"
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}
            </div>

            {error && <p className="max-w-64 text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Login"}
            </Button>
        </form>
    );
}
