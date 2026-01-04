export default function TricountLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex flex-col justify-start items-start gap-4 px-8 py-4 h-full">
            {children}
        </main>
    )
}