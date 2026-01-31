export default function LeaderboardLoading() {
    return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Leaderboard</h1>
                    <p className="text-muted-foreground">Top performers based on consistency.</p>
                </div>

                <div className="flex bg-muted/20 p-1 rounded-lg">
                    <div className="px-4 py-2 text-sm font-medium rounded-md bg-background shadow text-foreground">
                        Global
                    </div>
                    <div className="px-4 py-2 text-sm font-medium rounded-md text-muted-foreground">
                        Friends Only
                    </div>
                </div>
            </div>

            {/* Loading Spinner */}
            <div className="flex items-center justify-center py-20">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-full"></div>
                    </div>
                </div>
            </div>

            <p className="text-center text-muted-foreground text-sm mt-4">Loading leaderboard...</p>
        </div>
    );
}
