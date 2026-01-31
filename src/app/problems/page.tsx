import { getSession } from '@/lib/auth';
import { Problem } from '@/models/Problem';
import dbConnect from '@/lib/db';
import { redirect } from 'next/navigation';
import ProblemList from '@/components/ProblemList';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProblemsPage() {
    const session = await getSession();
    if (!session || !session.user) {
        redirect('/login');
    }

    await dbConnect();

    // Optimized query with lean() for better performance
    const problems = await Problem.find({ userId: session.user.id })
        .select('title link notes status difficulty weekNumber starred tags rating createdAt')
        .sort({ createdAt: -1 })
        .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedProblems = problems.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
        createdAt: p.createdAt?.toISOString()
    }));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                    Problems
                </h1>
                <p className="text-muted-foreground">Track and manage your coding problems.</p>
            </div>

            <ProblemList initialProblems={serializedProblems} />
        </div>
    );
}
