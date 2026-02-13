"use client";

import { type MeUser } from "@/server/db/types";
import { api } from "@/trpc/react";
import { useState } from "react";
import { CustomDialog } from "../../custom-dialog";
import { Button } from "../../ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { Label } from "../../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../ui/select";

interface AddUserButtonProps {
    user: MeUser;
    idTri: number;
}

export default function AddUserButton({ user, idTri }: AddUserButtonProps) {
    const [username, setUsername] = useState("");
    const [open, setOpen] = useState(false);

    const utils = api.useUtils();

    const addUserMutation = api.tricount.addUserToTricount.useMutation({
        onSuccess: async () => {
            await utils.tricount.getUsersInTricount.invalidate({
                token: user.token,
                idTri,
            });
            await utils.tricount.getUsersNotInTricount.invalidate({
                token: user.token,
                idTri,
            });
        },
    });

    const { data: usersNotInTricount, refetch } =
        api.tricount.getUsersNotInTricount.useQuery(
            { token: user.token, idTri },
            { enabled: false }
        );

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            void refetch();
        }
    };

    const handleAddUser = async () => {
        if (username.length === 0) {
            return;
        }

        await addUserMutation.mutateAsync({
            token: user.token,
            idTri,
            username,
        });

        setOpen(false);
    };

    return (
        <CustomDialog
            open={open}
            setOpen={handleOpenChange}
            title="Ajouter un utilisateur"
            trigger={
                <Button variant="outline" size="icon" className="size-8">
                    <UserPlus className="size-4" />
                </Button>
            }
            variant="custom"
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={addUserMutation.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleAddUser}
                        disabled={
                            addUserMutation.isPending ||
                            usersNotInTricount?.length === 0
                        }
                    >
                        {addUserMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Ajouter"
                        )}
                    </Button>
                </>
            }
        >
            <div className="gap-2 grid">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Select
                    value={username}
                    onValueChange={(value) => setUsername(value)}
                    disabled={usersNotInTricount?.length === 0}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                        {usersNotInTricount?.map((user) => (
                            <SelectItem key={user.users} value={user.users}>
                                {user.users}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CustomDialog>
    );
}
