export default function CountLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex flex-col justify-start gap-4 px-8 py-4 h-full">
            {children}
        </main>
    );
}