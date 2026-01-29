import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeek extends Document {
  weekNumber: number;
  startDate: Date;
  satisfaction?: number;
  reflection?: string; // "summary of satisfaction details"
  goals?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
}

const WeekSchema: Schema = new Schema({
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  satisfaction: { type: Number, min: 1, max: 10 },
  reflection: { type: String }, // End of week summary
  goals: { type: String }, // Planned at start of week
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure weeks are unique per user
WeekSchema.index({ userId: 1, weekNumber: 1 }, { unique: true });

// Prevent overwrite on HMR
export const Week: Model<IWeek> = mongoose.models.Week || mongoose.model<IWeek>('Week', WeekSchema);
