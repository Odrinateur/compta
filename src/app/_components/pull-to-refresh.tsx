"use client";

import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 80; // Distance en pixels pour déclencher le refresh
const RESISTANCE = 2.5; // Résistance lors du pull

export function PullToRefresh({ children }: { children: React.ReactNode }) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            // Ne déclencher que si on est en haut de la page
            if (window.scrollY === 0 && !isRefreshing && e.touches[0]) {
                startY.current = e.touches[0].clientY;
                setIsPulling(true);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isPulling || isRefreshing || !e.touches[0]) return;

            currentY.current = e.touches[0].clientY;
            const distance = Math.max(
                0,
                (currentY.current - startY.current) / RESISTANCE
            );

            if (distance > 0 && window.scrollY === 0) {
                e.preventDefault(); // Empêcher le scroll par défaut
                setPullDistance(distance);
            } else {
                setIsPulling(false);
                setPullDistance(0);
            }
        };

        const handleTouchEnd = () => {
            if (!isPulling || isRefreshing) return;

            if (pullDistance >= PULL_THRESHOLD) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);
                // Rafraîchir la page complètement
                window.location.reload();
            } else {
                // Animation de retour
                setPullDistance(0);
                setIsPulling(false);
            }
        };

        container.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });
        container.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isPulling, pullDistance, isRefreshing]);

    const pullPercentage = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);
    const shouldShowIndicator = pullDistance > 0 || isRefreshing;

    return (
        <div ref={containerRef} className="relative">
            {shouldShowIndicator && (
                <div
                    className="bg-white/80 backdrop-blur-sm top-0 right-0 left-0 z-50 fixed flex justify-center items-center transition-all duration-200"
                    style={{
                        height: `${Math.min(pullDistance, PULL_THRESHOLD)}px`,
                        opacity: Math.min(pullPercentage / 50, 1),
                    }}
                >
                    <div className="flex flex-col items-center gap-2">
                        {isRefreshing ? (
                            <>
                                <div className="border-2 border-gray-300 border-t-gray-900 rounded-full w-6 h-6 animate-spin" />
                                <span className="text-gray-600 text-sm">
                                    Actualisation...
                                </span>
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-6 h-6 transition-transform text-gray-600"
                                    style={{
                                        transform: `rotate(${
                                            pullPercentage >= 100 ? 180 : 0
                                        }deg)`,
                                    }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                    />
                                </svg>
                                <span className="text-gray-500 text-xs">
                                    {pullPercentage >= 100
                                        ? "Relâchez pour actualiser"
                                        : "Tirez pour actualiser"}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}
            <div
                style={{
                    transform: `translateY(${Math.min(
                        pullDistance,
                        PULL_THRESHOLD
                    )}px)`,
                    transition: isPulling ? "none" : "transform 0.3s ease-out",
                }}
            >
                {children}
            </div>
        </div>
    );
}
