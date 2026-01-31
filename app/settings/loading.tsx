export default function SettingsLoading() {
    return (
        <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <div className="h-8 w-48 bg-muted/30 rounded-lg animate-pulse mb-2"></div>
                <div className="h-4 w-80 bg-muted/20 rounded animate-pulse"></div>
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

            <p className="text-center text-muted-foreground text-sm">Loading settings...</p>
        </div>
    );
}
