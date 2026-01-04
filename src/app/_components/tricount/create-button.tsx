"use client";

import { PlusIcon, Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { useRef, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { api } from "@/trpc/react";
import { redirect } from "next/navigation";

interface CreateTricountButtonProps {
    token: string;
}

export default function CreateTricountButton({ token }: CreateTricountButtonProps) {
    const [tricountName, setTricountName] = useState("");


    const ref = useRef<HTMLInputElement>(null);

    const createTricountMutation = api.tricount.createTricount.useMutation();

    const handleCreateTricount = async () => {
        if (tricountName.length === 0) {
            ref.current?.focus();
            return;
        }

        const newTricountId = await createTricountMutation.mutateAsync({ token, name: tricountName });

        redirect(`/tricount/${newTricountId}`);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <PlusIcon className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new tricount</DialogTitle>
                </DialogHeader>

                <div className="gap-2 grid">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        value={tricountName}
                        onChange={(e) => setTricountName(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter" && !createTricountMutation.isPending) {
                                e.preventDefault();
                                void handleCreateTricount();
                            }
                        }}
                        required
                        ref={ref}
                        disabled={createTricountMutation.isPending}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={createTricountMutation.isPending}>Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        size={createTricountMutation.isPending ? "icon" : "default"}
                        onClick={handleCreateTricount}
                        disabled={createTricountMutation.isPending}
                    >
                        {createTricountMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                            </>
                        ) : (
                            "Create"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}