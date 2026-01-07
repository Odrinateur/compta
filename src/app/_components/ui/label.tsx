"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({
    className,
    ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            className={cn(
                "group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center gap-2 peer-disabled:cursor-not-allowed group-data-[disabled=true]:pointer-events-none select-none font-medium text-sm leading-none",
                className
            )}
            {...props}
        />
    );
}

export { Label };
