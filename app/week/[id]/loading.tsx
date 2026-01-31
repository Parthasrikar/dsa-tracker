export default function WeekLoading() {
    return (
        <div className="animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="h-10 w-64 bg-muted/20 rounded-lg animate-pulse mb-2"></div>
                <div className="h-5 w-80 bg-muted/20 rounded animate-pulse"></div>
            </div>

            {/* Week Goals Section */}
            <div className="glass-card p-6 rounded-xl mb-6 animate-pulse">
                <div className="h-6 w-32 bg-muted/20 rounded mb-4"></div>
                <div className="h-24 bg-muted/20 rounded"></div>
            </div>

            {/* Days Grid */}
            <div className="space-y-4 mb-8">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-muted/20 rounded-full"></div>
                                <div>
                                    <div className="h-6 w-24 bg-muted/20 rounded mb-2"></div>
                                    <div className="h-4 w-32 bg-muted/20 rounded"></div>
                                </div>
                            </div>
                            <div className="h-8 w-8 bg-muted/20 rounded"></div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-muted/20 rounded"></div>
                            <div className="h-4 w-3/4 bg-muted/20 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analysis Section */}
            <div className="glass-card p-6 rounded-xl animate-pulse">
                <div className="h-6 w-48 bg-muted/20 rounded mb-4"></div>
                <div className="h-64 bg-muted/20 rounded"></div>
            </div>
        </div>
    );
}
