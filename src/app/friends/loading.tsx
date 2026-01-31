export default function FriendsLoading() {
    return (
        <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="h-10 w-32 bg-muted/20 rounded-lg animate-pulse mb-2"></div>
                <div className="h-5 w-64 bg-muted/20 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <div className="h-7 w-48 bg-muted/20 rounded animate-pulse mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="glass-card p-4 rounded-xl animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted/20"></div>
                                        <div className="flex-1">
                                            <div className="h-5 w-32 bg-muted/20 rounded mb-2"></div>
                                            <div className="h-3 w-24 bg-muted/20 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 rounded-xl animate-pulse">
                        <div className="h-6 w-32 bg-muted/20 rounded mb-4"></div>
                        <div className="h-10 bg-muted/20 rounded mb-2"></div>
                        <div className="h-10 bg-muted/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
