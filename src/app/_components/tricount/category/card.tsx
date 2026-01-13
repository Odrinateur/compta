"use client";

import { useState } from "react";
import { type MeUser, type TricountCategoryRegex } from "@/server/db/types";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { H3 } from "../../ui/typography";
import { CustomDialog } from "../../custom-dialog";

interface TricountCategoryCardProps {
    categoryRegex: TricountCategoryRegex;
    user: MeUser;
    idTri: number;
}

function RegexItem({
    regex,
    categoryId,
    user,
    idTri,
}: {
    regex: { id: number; regex: string };
    categoryId: number;
    user: MeUser;
    idTri: number;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedRegex, setEditedRegex] = useState(regex.regex);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const utils = api.useUtils();

    const updateMutation = api.tricountCategory.updateCategoryRegex.useMutation(
        {
            onSuccess: async () => {
                await utils.tricountCategory.getCategoriesRegexes.invalidate({
                    token: user.token,
                    idTri,
                });
                setIsEditing(false);
            },
        }
    );

    const deleteMutation = api.tricountCategory.deleteCategoryRegex.useMutation(
        {
            onSuccess: async () => {
                await utils.tricountCategory.getCategoriesRegexes.invalidate({
                    token: user.token,
                    idTri,
                });
                setDeleteDialogOpen(false);
            },
        }
    );

    const handleSave = () => {
        if (editedRegex.trim() === "") return;
        void updateMutation.mutate({
            token: user.token,
            idTri,
            idCategory: categoryId,
            idRegex: regex.id,
            regex: editedRegex.trim(),
        });
    };

    const handleCancel = () => {
        setEditedRegex(regex.regex);
        setIsEditing(false);
    };

    const handleDelete = () => {
        void deleteMutation.mutate({
            token: user.token,
            idTri,
            idCategory: categoryId,
            idRegex: regex.id,
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    value={editedRegex}
                    onChange={(e) => setEditedRegex(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") handleCancel();
                    }}
                    className="flex-1 h-10"
                    autoFocus
                />
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                >
                    <Check />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                >
                    <X />
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <span className="bg-muted rounded flex flex-1 items-center px-4 py-1 h-10">
                    {regex.regex}
                </span>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                >
                    <Pencil />
                </Button>
                <CustomDialog
                    open={deleteDialogOpen}
                    setOpen={setDeleteDialogOpen}
                    title="Supprimer la regex"
                    description={
                        <>
                            Êtes-vous sûr de vouloir supprimer la regex{" "}
                            <span className="font-mono font-semibold">
                                {regex.regex}
                            </span>
                            ? Cette action est irréversible.
                        </>
                    }
                    trigger={
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 />
                        </Button>
                    }
                    variant="destructive"
                    confirmText="Supprimer"
                    onConfirm={handleDelete}
                    confirmLoading={deleteMutation.isPending}
                />
            </div>
        </>
    );
}

function AddRegexInput({
    categoryId,
    user,
    idTri,
}: {
    categoryId: number;
    user: MeUser;
    idTri: number;
}) {
    const [newRegex, setNewRegex] = useState("");
    const utils = api.useUtils();

    const createMutation = api.tricountCategory.createCategoryRegex.useMutation(
        {
            onSuccess: async () => {
                await utils.tricountCategory.getCategoriesRegexes.invalidate({
                    token: user.token,
                    idTri,
                });
                setNewRegex("");
            },
        }
    );

    const handleAdd = () => {
        if (newRegex.trim() === "") return;
        void createMutation.mutate({
            token: user.token,
            idTri,
            idCategory: categoryId,
            regex: newRegex.trim(),
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Input
                value={newRegex}
                onChange={(e) => setNewRegex(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                }}
                placeholder="Nouvelle regex..."
                className="flex-1"
            />
            <Button
                size="icon"
                variant="ghost"
                onClick={handleAdd}
                disabled={createMutation.isPending || newRegex.trim() === ""}
            >
                <Plus className="size-4" />
            </Button>
        </div>
    );
}

function TricountCategoryCard({
    categoryRegex,
    user,
    idTri,
}: TricountCategoryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <H3 className="text-xl">{categoryRegex.name}</H3>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {categoryRegex.regexes.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {categoryRegex.regexes.map((regex) => (
                            <RegexItem
                                key={regex.id}
                                regex={regex}
                                categoryId={categoryRegex.id}
                                user={user}
                                idTri={idTri}
                            />
                        ))}
                    </div>
                )}
                <AddRegexInput
                    categoryId={categoryRegex.id}
                    user={user}
                    idTri={idTri}
                />
            </CardContent>
        </Card>
    );
}

function TricountCategoryCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="w-32 h-6" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="w-full h-9" />
                <Skeleton className="w-full h-9" />
            </CardContent>
        </Card>
    );
}

interface TricountCategoryCardGridProps {
    user: MeUser;
    idTri: number;
}

function TricountCategoryCardGrid({
    user,
    idTri,
}: TricountCategoryCardGridProps) {
    const { data: categoriesRegexes, isLoading } =
        api.tricountCategory.getCategoriesRegexes.useQuery({
            token: user.token,
            idTri,
        });

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 w-full">
                {Array.from({ length: 3 }).map((_, index) => (
                    <TricountCategoryCardSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (!categoriesRegexes || categoriesRegexes.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center py-12 text-center">
                <p className="text-muted-foreground text-sm">
                    Aucune catégorie disponible
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {categoriesRegexes.map((categoryRegex) => (
                <TricountCategoryCard
                    key={categoryRegex.id}
                    categoryRegex={categoryRegex}
                    user={user}
                    idTri={idTri}
                />
            ))}
        </div>
    );
}

function TricountCategoryCardGridSkeleton() {
    return (
        <div className="flex flex-col gap-4 w-full">
            {Array.from({ length: 3 }).map((_, index) => (
                <TricountCategoryCardSkeleton key={index} />
            ))}
        </div>
    );
}

export {
    TricountCategoryCard,
    TricountCategoryCardSkeleton,
    TricountCategoryCardGrid,
    TricountCategoryCardGridSkeleton,
};
