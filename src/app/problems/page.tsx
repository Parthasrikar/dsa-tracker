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
    const userProblems = await Problem.find({ userId: session.user.id })
        .select('title link notes status difficulty weekNumber starred tags rating createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const globalProblemsRaw = await Problem.aggregate([
        { $match: { link: { $nin: [null, ""] } } },
        {
            $group: {
                _id: "$link",
                title: { $first: "$title" },
                difficulty: { $first: "$difficulty" },
                tags: { $first: "$tags" },
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } },
        { $limit: 100 } // Limit to top 100 for now
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedProblems = userProblems.map((p: any) => {
        const { _id, createdAt, ...rest } = p;
        return {
            ...rest,
            _id: _id.toString(),
            createdAt: createdAt?.toISOString()
        };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serializedGlobalProblems = globalProblemsRaw.map((p: any) => ({
        _id: p._id, // link is the id
        title: p.title,
        link: p._id,
        difficulty: p.difficulty,
        tags: p.tags,
        count: p.count
    }));

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500">
                    Problems
                </h1>
                <p className="text-muted-foreground">Track and manage your coding problems.</p>
            </div>

            <ProblemList initialProblems={serializedProblems} globalProblems={serializedGlobalProblems} />
        </div>
    );
}
