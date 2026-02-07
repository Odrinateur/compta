"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Trash2 } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/app/_components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/_components/ui/popover";

interface EtfSettingsFormProps {
    user: MeUser;
}

function EtfSettingsForm({ user }: EtfSettingsFormProps) {
    const utils = api.useUtils();
    const { data: etfs, isLoading } = api.stocks.getEtfs.useQuery({
        token: user.token,
    });

    const [name, setName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [annualFeePercent, setAnnualFeePercent] = useState("0");
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const handler = window.setTimeout(() => {
            setDebouncedQuery(searchValue.trim());
        }, 300);

        return () => window.clearTimeout(handler);
    }, [searchValue]);

    const { data: searchResults, isFetching: isSearching } =
        api.stocks.searchSymbols.useQuery(
            {
                token: user.token,
                query: debouncedQuery,
            },
            {
                enabled: debouncedQuery.length > 0,
                staleTime: 30_000,
            }
        );

    const createEtfMutation = api.stocks.createEtf.useMutation({
        onSuccess: async () => {
            await utils.stocks.getEtfs.invalidate({ token: user.token });
            setName("");
            setIdentifier("");
            setAnnualFeePercent("0");
        },
    });

    const deleteEtfMutation = api.stocks.deleteEtf.useMutation({
        onSuccess: async () => {
            await utils.stocks.getEtfs.invalidate({ token: user.token });
        },
    });

    const parsedAnnualFee = annualFeePercent.trim()
        ? Number(annualFeePercent)
        : null;
    const isAnnualFeeValid =
        parsedAnnualFee !== null &&
        Number.isFinite(parsedAnnualFee) &&
        parsedAnnualFee >= 0;

    const isPending =
        createEtfMutation.isPending ||
        !name.trim() ||
        !identifier.trim() ||
        !isAnnualFeeValid;

    const handleCreate = () => {
        if (isPending) return;
        createEtfMutation.mutate({
            token: user.token,
            name,
            identifier,
            annualFeePercent: parsedAnnualFee ?? 0,
        });
    };

    const filteredSearchResults = useMemo(() => {
        if (!searchResults) return [];
        return searchResults.filter((result) => result.symbol);
    }, [searchResults]);

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <section className="flex flex-wrap justify-center gap-3">
                <Input
                    type="text"
                    placeholder="Nom personnalise"
                    className="w-64"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="w-64">
                            <Input
                                type="text"
                                placeholder="ISIN ou ticker (ex: WPEA.PA)"
                                value={identifier}
                                onChange={(event) =>
                                    setIdentifier(event.target.value)
                                }
                                onFocus={() => setOpen(true)}
                            />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Rechercher un ETF"
                                value={searchValue}
                                onValueChange={setSearchValue}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {isSearching
                                        ? "Recherche en cours..."
                                        : "Aucun resultat"}
                                </CommandEmpty>
                                <CommandGroup heading="Suggestions Yahoo">
                                    {filteredSearchResults.map((result) => (
                                        <CommandItem
                                            key={result.symbol}
                                            value={result.symbol}
                                            onSelect={() => {
                                                setIdentifier(result.symbol);
                                                if (!name.trim()) {
                                                    setName(result.label);
                                                }
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {result.label}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {result.symbol}
                                                    {result.quoteType
                                                        ? ` - ${result.quoteType}`
                                                        : ""}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Frais annuels (%)"
                    className="w-52"
                    value={annualFeePercent}
                    onChange={(event) =>
                        setAnnualFeePercent(event.target.value)
                    }
                />
                <Button onClick={handleCreate} disabled={isPending}>
                    Ajouter
                </Button>
            </section>

            {isLoading ? (
                <Skeleton className="h-32 w-full" />
            ) : etfs && etfs.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="min-w-[600px] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Identifiant</TableHead>
                                    <TableHead>Yahoo</TableHead>
                                    <TableHead>Frais annuels</TableHead>
                                    <TableHead className="text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {etfs.map((etf) => (
                                    <TableRow key={etf.id}>
                                        <TableCell className="font-medium">
                                            {etf.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {etf.identifier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {etf.yahooSymbol}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {(
                                                    etf.annualFeePercent ?? 0
                                                ).toFixed(2)}
                                                %
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    deleteEtfMutation.mutate({
                                                        token: user.token,
                                                        id: etf.id,
                                                    })
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ) : (
                <div className="text-muted-foreground rounded-md border p-8 text-center">
                    Aucun ETF enregistre pour le moment.
                </div>
            )}
        </div>
    );
}

export { EtfSettingsForm };
