"use client";

import { type User } from "@/server/db/types";
import { api } from "@/trpc/react";
import { useState, useEffect } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../_components/ui/dialog";
import { Button } from "../../_components/ui/button";
import { Loader2, PencilIcon } from "lucide-react";
import { Label } from "../../_components/ui/label";
import { Input } from "../../_components/ui/input";

interface EditNameButtonProps {
    user: User;
    idTri: number;
    currentName: string;
}

export default function EditNameButton({ user, idTri, currentName }: EditNameButtonProps) {
    const utils = api.useUtils();
    const { data: tricount } = api.tricount.getTricountById.useQuery(
        { token: user.token, idTri },
        { initialData: { name: currentName, id: idTri } as { name: string; id: number } }
    );

    const currentTricountName = tricount?.name ?? currentName;
    const [name, setName] = useState(currentTricountName);
    const [open, setOpen] = useState(false);

    const updateTricountMutation = api.tricount.updateTricount.useMutation({
        onSuccess: async (_, variables) => {
            utils.tricount.getTricountById.setData(
                { token: user.token, idTri },
                (oldData) => oldData ? { ...oldData, name: variables.name } : undefined
            );
            await utils.tricount.getTricountsByUser.invalidate({ token: user.token });
            setOpen(false);
        }
    });

    useEffect(() => {
        if (!open) {
            setName(currentTricountName);
        }
    }, [currentTricountName, open]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setName(currentTricountName);
        }
    };

    const handleUpdateName = async () => {
        if (name.length === 0 || name === currentTricountName) {
            return;
        }

        await updateTricountMutation.mutateAsync({ token: user.token, idTri, name });
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <PencilIcon className="size-4" />
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit tricount name</DialogTitle>
                </DialogHeader>

                <div className="gap-2 grid">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter tricount name"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                void handleUpdateName();
                            }
                        }}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={updateTricountMutation.isPending}>Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        size={updateTricountMutation.isPending ? "icon" : "default"}
                        onClick={handleUpdateName}
                        disabled={updateTricountMutation.isPending || name.length === 0 || name === currentTricountName}
                    >
                        {updateTricountMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                            </>
                        ) : (
                            "Save"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

