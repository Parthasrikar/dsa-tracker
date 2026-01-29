import dbConnect from '@/lib/db';
import { Problem } from '@/models/Problem';
import ProblemList from '@/components/ProblemList';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProblemsPage() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  
  const problems = await Problem.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

  const serializedProblems = problems.map(p => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const problem = p as any; 
    return {
      ...problem,
      _id: problem._id.toString(),
      userId: problem.userId.toString(),
      dayId: problem.dayId?.toString(), // optional
      createdAt: problem.createdAt ? problem.createdAt.toISOString() : undefined,
      updatedAt: problem.updatedAt ? problem.updatedAt.toISOString() : undefined,
    };
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Problem Vault</h1>
        <p className="text-muted-foreground">Track your solved problems and questions for review.</p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ProblemList initialProblems={serializedProblems as unknown as any[]} />
    </div>
  );
}
