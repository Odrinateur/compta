"use client";

import { type User } from "@/server/db/types";
import { api } from "@/trpc/react";
import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Loader2, PlusIcon } from "lucide-react";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";

interface AddUserButtonProps {
    user: User;
    idTri: number;
}

export default function AddUserButton({ user, idTri }: AddUserButtonProps) {
    const [username, setUsername] = useState("");
    const [role, setRole] = useState<"writer" | "reader">("reader");
    const [open, setOpen] = useState(false);

    const utils = api.useUtils();

    const addUserMutation = api.tricount.addUserToTricount.useMutation({
        onSuccess: async () => {
            await utils.tricount.getUsersInTricount.invalidate({ token: user.token, idTri });
            await utils.tricount.getUsersNotInTricount.invalidate({ token: user.token, idTri });
        }
    });

    const { data: usersNotInTricount, refetch } = api.tricount.getUsersNotInTricount.useQuery(
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

        await addUserMutation.mutateAsync({ token: user.token, idTri, userId: username, role });

        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="size-8">
                    <PlusIcon className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a user</DialogTitle>
                </DialogHeader>

                <div className="gap-2 grid">
                    <Label htmlFor="username">Username</Label>
                    <Select
                        value={username}
                        onValueChange={(value) => setUsername(value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                            {usersNotInTricount?.map((user) => (
                                <SelectItem key={user.users} value={user.users}>{user.users}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Label htmlFor="role">Role</Label>
                    <Select
                        value={role}
                        onValueChange={(value) => setRole(value as "writer" | "reader")}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="writer">Writer</SelectItem>
                            <SelectItem value="reader">Reader</SelectItem>
                        </SelectContent>
                    </Select>

                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={addUserMutation.isPending}>Cancel</Button>
                    </DialogClose>
                    <Button
                        type="submit"
                        size={addUserMutation.isPending ? "icon" : "default"}
                        onClick={handleAddUser}
                        disabled={addUserMutation.isPending}
                    >
                        {addUserMutation.isPending ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                            </>
                        ) : (
                            "Add"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
