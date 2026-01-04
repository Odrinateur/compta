import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "bg-transparent selection:bg-primary dark:bg-input/30 file:bg-transparent disabled:opacity-50 shadow-xs border border-input file:border-0 rounded-md outline-none file:inline-flex px-3 py-0 disabled:cursor-not-allowed disabled:pointer-events-none w-full min-w-0 h-9 file:h-7 transition-[color,box-shadow] file:font-medium selection:text-primary-foreground placeholder:text-muted-foreground file:text-foreground md:text-sm file:text-sm text-base",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                "leading-[36px]",
                className
            )}
            {...props}
        />
    )
}

export { Input }
