export default function TricountLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex flex-col justify-start items-start gap-4 px-4 sm:px-8 py-4">
            {children}
        </main>
    )
}