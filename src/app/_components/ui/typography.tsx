import * as React from "react";

import { cn } from "@/lib/utils";

function H1({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) {
    return (
        <h1
            className={cn(
                "scroll-m-20 font-extrabold text-text-primary text-4xl text-center text-balance tracking-tight",
                className
            )}
            {...props}
        />
    );
}

function H2({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) {
    return (
        <h2
            className={cn(
                "first:mt-0 pb-2 scroll-m-20 font-semibold text-text-primary text-3xl tracking-tight",
                className
            )}
            {...props}
        />
    );
}

function H3({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) {
    return (
        <h3
            className={cn(
                "scroll-m-20 font-semibold text-text-primary text-2xl tracking-tight",
                className
            )}
            {...props}
        />
    );
}

function H4({ className, ...props }: React.HTMLProps<HTMLHeadingElement>) {
    return (
        <h4
            className={cn(
                "scroll-m-20 font-semibold text-text-primary text-xl tracking-tight",
                className
            )}
            {...props}
        />
    );
}

function P({ className, ...props }: React.HTMLProps<HTMLParagraphElement>) {
    return (
        <p
            className={cn(
                "not-first:mt-6 text-text-secondary leading-7",
                className
            )}
            {...props}
        />
    );
}

function Span({ className, ...props }: React.HTMLProps<HTMLSpanElement>) {
    return (
        <span
            className={cn("text-text-secondary leading-7", className)}
            {...props}
        />
    );
}

function InlineCode({ className, ...props }: React.HTMLProps<HTMLSpanElement>) {
    return (
        <code
            className={cn(
                "bg-muted rounded relative px-[0.3rem] py-[0.2rem] font-mono font-semibold text-text-secondary text-sm",
                className
            )}
            {...props}
        />
    );
}

function Link({ className, ...props }: React.HTMLProps<HTMLAnchorElement>) {
    return (
        <a
            className={cn(
                "text-primary decoration-1 decoration-dotted hover:decoration-solid underline underline-offset-4 has-[code]:no-underline",
                className
            )}
            {...props}
        />
    );
}

export { H1, H2, H3, H4, P, Span, InlineCode, Link };
