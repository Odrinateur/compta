"use client";

import { PlusIcon, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState, useEffect } from "react";
import { CustomDialog } from "../custom-dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { api } from "@/trpc/react";
import { redirect } from "next/navigation";
import { DialogFooter } from "../ui/dialog";

interface CreateTricountButtonProps {
    token: string;
}

export default function CreateTricountButton({
    token,
}: CreateTricountButtonProps) {
    const [tricountName, setTricountName] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const ref = useRef<HTMLInputElement>(null);

    const createTricountMutation = api.tricount.createTricount.useMutation();

    const handleCreateTricount = async () => {
        if (tricountName.length === 0) {
            ref.current?.focus();
            return;
        }

        const newTricountId = await createTricountMutation.mutateAsync({
            token,
            name: tricountName,
        });

        redirect(`/tricount/${newTricountId}`);
    };

    return (
        <CustomDialog
            open={open}
            setOpen={setOpen}
            withIsMounted
            isMounted={isMounted}
            title="Create a new tricount"
            trigger={
                <Button size="icon">
                    <PlusIcon className="size-4" />
                </Button>
            }
            variant="custom"
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={createTricountMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleCreateTricount}
                        disabled={createTricountMutation.isPending}
                    >
                        {createTricountMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Create"
                        )}
                    </Button>
                </>
            }
        >
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    value={tricountName}
                    onChange={(e) => setTricountName(e.target.value)}
                    onKeyDown={(e) => {
                        if (
                            e.key === "Enter" &&
                            !createTricountMutation.isPending
                        ) {
                            e.preventDefault();
                            void handleCreateTricount();
                        }
                    }}
                    required
                    ref={ref}
                    disabled={createTricountMutation.isPending}
                />
            </div>
        </CustomDialog>
    );
}
