"use client";

import { type MeUser } from "@/server/db/types";
import { api } from "@/trpc/react";
import { useState, useEffect } from "react";
import { CustomDialog } from "../../_components/custom-dialog";
import { Button } from "../../_components/ui/button";
import { Loader2, PencilIcon } from "lucide-react";
import { Label } from "../../_components/ui/label";
import { Input } from "../../_components/ui/input";

interface EditNameButtonProps {
    user: MeUser;
    idTri: number;
    currentName: string;
}

export default function EditNameButton({
    user,
    idTri,
    currentName,
}: EditNameButtonProps) {
    const utils = api.useUtils();
    const { data: tricount } = api.tricount.getTricountById.useQuery(
        { token: user.token, idTri },
        {
            initialData: { name: currentName, id: idTri } as {
                name: string;
                id: number;
            },
        }
    );

    const currentTricountName = tricount?.name ?? currentName;
    const [name, setName] = useState(currentTricountName);
    const [open, setOpen] = useState(false);

    const updateTricountMutation = api.tricount.updateTricount.useMutation({
        onSuccess: async (_, variables) => {
            utils.tricount.getTricountById.setData(
                { token: user.token, idTri },
                (oldData) =>
                    oldData ? { ...oldData, name: variables.name } : undefined
            );
            await utils.tricount.getTricountsByUser.invalidate({
                token: user.token,
            });
            setOpen(false);
        },
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

        await updateTricountMutation.mutateAsync({
            token: user.token,
            idTri,
            name,
        });
    };

    return (
        <>
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
            <CustomDialog
                open={open}
                setOpen={handleOpenChange}
                title="Modifier le nom du tricount"
                variant="custom"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={updateTricountMutation.isPending}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            onClick={handleUpdateName}
                            disabled={
                                updateTricountMutation.isPending ||
                                name.length === 0 ||
                                name === currentTricountName
                            }
                        >
                            {updateTricountMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                "Enregistrer"
                            )}
                        </Button>
                    </>
                }
            >
                <div className="grid gap-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Entrez le nom du tricount"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                void handleUpdateName();
                            }
                        }}
                    />
                </div>
            </CustomDialog>
        </>
    );
}
