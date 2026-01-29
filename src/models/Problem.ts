import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProblemStatus = 'DONE' | 'ATTEMPTED' | 'PENDING';

export interface IProblem extends Document {
  title: string;
  link?: string;
  notes?: string;
  status: ProblemStatus;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  weekNumber: number; // Linked to week context
  dayId?: mongoose.Types.ObjectId; // Optional link to specific day
  starred?: boolean; // Mark as favorite/important (independent of status)
  tags?: string[]; // Tags like 'array', 'dp', 'graph', etc.
  rating?: number; // Personal rating 1-5
  userId: mongoose.Types.ObjectId; // User who owns this problem
}

const ProblemSchema: Schema = new Schema({
  title: { type: String, required: true },
  link: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['DONE', 'ATTEMPTED', 'PENDING'], default: 'PENDING' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  weekNumber: { type: Number, required: true },
  dayId: { type: Schema.Types.ObjectId, ref: 'Day' },
  starred: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  rating: { type: Number, min: 1, max: 5 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Problem: Model<IProblem> = mongoose.models.Problem || mongoose.model<IProblem>('Problem', ProblemSchema);
