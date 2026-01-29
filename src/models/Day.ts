import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDay extends Document {
  weekNumber: number;
  dayName: string; // 'Mon', 'Tue', etc.
  date: Date;
  isCompleted: boolean;
  notes?: string;
  plan?: string;
  userId: mongoose.Types.ObjectId;
}

const DaySchema: Schema = new Schema({
  weekNumber: { type: Number, required: true },
  dayName: { type: String, required: true }, // Short name for UI
  date: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false }, // consistency tick
  notes: { type: String },
  plan: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Compound index to ensure uniqueness of day within a week or just by date FOR A SPECIFIC USER
DaySchema.index({ userId: 1, date: 1 }, { unique: true });

export const Day: Model<IDay> = mongoose.models.Day || mongoose.model<IDay>('Day', DaySchema);
