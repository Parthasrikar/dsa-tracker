import { getSession } from '@/lib/auth';
import { Problem } from '@/models/Problem';
import { Day } from '@/models/Day';
import dbConnect from '@/lib/db';
import { redirect } from 'next/navigation';
import GlobalAnalysisView from '@/components/GlobalAnalysisView';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function InsightsPage() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect('/login');
    }

    await dbConnect();

    // Parallel queries for better performance
    const [problems, days] = await Promise.all([
        Problem.find({ userId: session.user.id })
            .select('title status difficulty weekNumber starred tags rating createdAt')
            .sort({ createdAt: -1 })
            .lean(),
        Day.find({ userId: session.user.id })
            .select('date isCompleted weekNumber')
            .sort({ date: 1 })
            .lean()
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedProblems = problems.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        createdAt: p.createdAt?.toISOString()
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consistencyData = days.map((d: any) => ({
        date: d.date.toISOString().split('T')[0],
        isCompleted: d.isCompleted,
        weekNumber: d.weekNumber
    }));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                    Insights
                </h1>
                <p className="text-muted-foreground">Analyze your progress and performance.</p>
            </div>

            <GlobalAnalysisView
                problems={serializedProblems}
                consistencyData={consistencyData}
                showCopyButton={false}
            />
        </div>
    );
}
