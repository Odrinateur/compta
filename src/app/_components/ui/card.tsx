import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { PlusContainer } from "./plus-container";

const cardWrapperVariants = cva("border-b flex justify-center w-full", {
    variants: {
        grayed: {
            true: "bg-[image:repeating-linear-gradient(315deg,var(--color-grayed)_0,var(--color-grayed)_1px,transparent_0,transparent_50%)] bg-[length:10px_10px] bg-card bg-fixed text-grayed",
        },
        plus: {
            true: "",
        },
    },
    defaultVariants: {
        grayed: false,
        plus: false,
    },
});

function CardWrapper({
    className,
    grayed,
    plus,
    wrapperClassName,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof cardWrapperVariants> & { wrapperClassName?: string }) {
    return (
        <div
            data-slot="card"
            className={cn(cardWrapperVariants({ grayed, plus }), wrapperClassName)}
        >
            <div
                data-slot="card-wrapper"
                className={cn(
                    "bg-card border-x group/wrapper w-full text-card-foreground",
                    plus && "relative",
                    className
                )}
                {...props}
            >
                {plus && <PlusContainer />}
                {props.children}
            </div>
        </div>
    );
}

const cardVariants = cva(
    "bg-card [&:not(:last-child)]:border-border [&:not(:last-child)]:border-r group-[.grid-rows-2]/wrapper:[&:nth-child(-n+2)]:border-b group-[.grid-rows-3]/wrapper:[&:nth-child(-n+3)]:border-b group-[.grid-rows-4]/wrapper:[&:nth-child(-n+4)]:border-b relative flex flex flex-col justify-center items-center text-card-foreground",
    {
        variants: {
            link: {
                true: "bg-card-link hover:bg-card-link-hover",
            },
        },
        defaultVariants: {
            link: false,
        },
    }
);

function Card({
    className,
    link = false,
    href,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof cardVariants> & { href?: string }) {
    const classNames = className ?? "";
    const hasMarginRight = /\b(mr-|me-|mx-|m-)\w+/.test(classNames);
    const hasMarginLeft = /\b(ml-|ms-|mx-|m-)\w+/.test(classNames);

    const cardClasses = cn(
        cardVariants({ link }),
        hasMarginRight && "border-r border-border",
        hasMarginLeft && "border-l border-border",
        link && "bg-transparent h-full",
        className
    );

    if (link && href) {
        const { children, ...divProps } = props;
        return (
            <a
                data-slot="card-link"
                href={href}
                className={cn("bg-card-link hover:bg-card-link-hover")}
            >
                <div
                    data-slot="plus-card"
                    className={cardClasses}
                    {...divProps}
                >
                    {children}
                </div>
            </a>
        );
    }

    return (
        <div data-slot="plus-card" className={cardClasses} {...props}>
            {props.children}
        </div>
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "@container/card-header items-start gap-1.5 grid has-data-[slot=card-action]:grid-cols-[1fr_auto] grid-rows-[auto_auto] auto-rows-min px-6 [.border-b]:pb-6",
                className
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn("font-semibold leading-none", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "justify-self-end self-start col-start-2 row-span-2 row-start-1",
                className
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("px-6", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
            {...props}
        />
    );
}

export {
    CardWrapper,
    Card,
    cardWrapperVariants,
    cardVariants,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
    CardFooter,
};
