"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    className?: string
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [formattedDate, setFormattedDate] = React.useState<string>("Sélectionner une date")

    React.useEffect(() => {
        if (date) {
            setFormattedDate(
                date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })
            )
        } else {
            setFormattedDate("Sélectionner une date")
        }
    }, [date])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    id="date"
                    className={cn("justify-between w-48 font-normal", className)}
                >
                    {formattedDate}
                    <ChevronDownIcon />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto overflow-hidden" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        setDate(date)
                        setOpen(false)
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
