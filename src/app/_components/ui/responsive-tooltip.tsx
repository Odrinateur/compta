"use client"

import * as React from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
import { Popover, PopoverTrigger } from "./popover"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"


function useHoverSupport() {
    const [supportsHover, setSupportsHover] = React.useState(true)

    React.useEffect(() => {
        const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)")

        const updateHoverSupport = () => {
            setSupportsHover(mediaQuery.matches)
        }

        updateHoverSupport()
        mediaQuery.addEventListener("change", updateHoverSupport)

        return () => {
            mediaQuery.removeEventListener("change", updateHoverSupport)
        }
    }, [])

    return supportsHover
}

interface ResponsiveTooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    side?: "top" | "right" | "bottom" | "left"
    className?: string
    sideOffset?: number
}

export function ResponsiveTooltip({
    children,
    content,
    side = "top",
    className,
    sideOffset = 0,
}: ResponsiveTooltipProps) {
    const supportsHover = useHoverSupport()

    if (supportsHover) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent side={side} className={className} sideOffset={sideOffset}>
                    {content}
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    data-slot="popover-content"
                    side={side}
                    sideOffset={sideOffset}
                    className={cn(
                        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-popover-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance focus:outline-none",
                        className
                    )}
                >
                    {content}
                    <PopoverPrimitive.Arrow className="bg-foreground fill-foreground rounded-[2px] z-50 size-2.5 rotate-45 translate-y-[calc(-50%_-_2px)]" />
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </Popover>
    )
}

