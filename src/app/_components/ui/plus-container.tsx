import * as React from "react";

import { cn } from "@/lib/utils";

function PlusContainer({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="plus-card-plus"
            className={cn(
                "absolute inset-0 pointer-events-none text-cross",
                className
            )}
            {...props}
        >
            <svg
                className="-top-[6.5px] -left-[6.5px] z-50 absolute"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                vectorEffect="non-scaling-stroke"
            >
                <path d="M6 0V12M0 6H12" stroke="currentColor"></path>
            </svg>
            <svg
                className="-bottom-[6.5px] -left-[6.5px] z-50 absolute"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                vectorEffect="non-scaling-stroke"
            >
                <path d="M6 0V12M0 6H12" stroke="currentColor"></path>
            </svg>
            <svg
                className="-top-[6.5px] -right-[6.5px] z-50 absolute"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                vectorEffect="non-scaling-stroke"
            >
                <path d="M6 0V12M0 6H12" stroke="currentColor"></path>
            </svg>
            <svg
                className="-right-[6.5px] -bottom-[6.5px] z-50 absolute"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                vectorEffect="non-scaling-stroke"
            >
                <path d="M6 0V12M0 6H12" stroke="currentColor"></path>
            </svg>
        </div>
    );
}

export { PlusContainer };
