export default function InsightsLoading() {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="h-10 w-48 bg-muted/20 rounded-lg animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-muted/20 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
                        <div className="h-5 w-32 bg-muted/20 rounded mb-4"></div>
                        <div className="h-12 w-24 bg-muted/20 rounded"></div>
                    </div>
                ))}
            </div>

            <div className="glass-card p-6 rounded-xl animate-pulse mb-6">
                <div className="h-6 w-48 bg-muted/20 rounded mb-4"></div>
                <div className="h-64 bg-muted/20 rounded"></div>
            </div>

            <div className="glass-card p-6 rounded-xl animate-pulse">
                <div className="h-6 w-48 bg-muted/20 rounded mb-4"></div>
                <div className="h-48 bg-muted/20 rounded"></div>
            </div>
        </div>
    );
}
