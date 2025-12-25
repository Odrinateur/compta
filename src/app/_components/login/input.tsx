"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { loginAction } from "./login-action";

export default function LoginInput() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await loginAction(username, password);
        } catch (err) {
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
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Login"}
            </Button>
        </form>
    );
}
