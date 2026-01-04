"use client";

import { Input } from "../ui/input";
import { DatePicker } from "../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { type Category } from "@/server/db/types";

export function InteractionCreationInput({ categories }: { categories: Category[] }) {
    return (
        <>
            <section className="flex justify-center gap-4 w-full">
                <Input
                    type="text"
                    placeholder="Nom"
                    className="w-64"
                />
                <DatePicker date={new Date()} className="w-64" setDate={(date) => {
                    console.log(date)
                }} />
                <Select>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                                {category.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                </Select>
                <Button size="icon" className="hover:cursor-copy">
                    <Plus className="w-4 h-4" />
                </Button>
            </section>
        </>
    )
}