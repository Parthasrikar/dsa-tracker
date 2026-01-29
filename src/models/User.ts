import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  image?: string;
  programConfig?: {
    startDate: Date;
    totalWeeks: number;
  };
  friends: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  image: { type: String },
  programConfig: {
    startDate: { type: Date },
    totalWeeks: { type: Number, default: 12 }
  },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
