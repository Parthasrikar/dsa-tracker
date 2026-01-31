export default function ProblemsLoading() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="h-10 w-48 bg-muted/20 rounded-lg animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-muted/20 rounded animate-pulse"></div>
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="h-6 w-3/4 bg-muted/20 rounded mb-2"></div>
                                <div className="h-4 w-1/2 bg-muted/20 rounded"></div>
                            </div>
                            <div className="h-8 w-24 bg-muted/20 rounded-full"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-muted/20 rounded-full"></div>
                            <div className="h-6 w-20 bg-muted/20 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
