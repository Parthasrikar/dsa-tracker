export default function LeaderboardLoading() {
    return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="h-10 w-56 bg-muted/20 rounded-lg animate-pulse mb-2"></div>
                    <div className="h-5 w-64 bg-muted/20 rounded animate-pulse"></div>
                </div>

                <div className="h-10 w-48 bg-muted/20 rounded-lg animate-pulse"></div>
            </div>

            <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="glass-card p-4 rounded-xl flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-12 bg-muted/20 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-6 w-48 bg-muted/20 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-muted/20 rounded"></div>
                        </div>
                        <div className="text-right px-4">
                            <div className="h-8 w-12 bg-muted/20 rounded mb-1"></div>
                            <div className="h-3 w-12 bg-muted/20 rounded"></div>
                        </div>
                        <div className="text-right px-4 hidden sm:block">
                            <div className="h-8 w-12 bg-muted/20 rounded mb-1"></div>
                            <div className="h-3 w-12 bg-muted/20 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
