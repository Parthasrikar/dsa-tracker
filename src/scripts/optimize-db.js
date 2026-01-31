/**
 * Database Optimization Script
 * Run this script to add indexes to MongoDB collections for better query performance
 * 
 * Usage: node scripts/optimize-db.js
 */

import dbConnect from '../lib/db.js';
import { User } from '../models/User.js';
import { Day } from '../models/Day.js';
import { Problem } from '../models/Problem.js';
import { FriendRequest } from '../models/FriendRequest.js';

async function optimizeDatabase() {
    console.log('🔧 Starting database optimization...');

    try {
        await dbConnect();
        console.log('✅ Connected to database');

        // User indexes
        console.log('📊 Creating User indexes...');
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        await User.collection.createIndex({ friends: 1 });
        console.log('✅ User indexes created');

        // Day indexes
        console.log('📊 Creating Day indexes...');
        await Day.collection.createIndex({ userId: 1, date: 1 });
        await Day.collection.createIndex({ userId: 1, isCompleted: 1 });
        await Day.collection.createIndex({ userId: 1, weekNumber: 1 });
        console.log('✅ Day indexes created');

        // Problem indexes
        console.log('📊 Creating Problem indexes...');
        await Problem.collection.createIndex({ userId: 1, createdAt: -1 });
        await Problem.collection.createIndex({ userId: 1, status: 1 });
        await Problem.collection.createIndex({ userId: 1, weekNumber: 1 });
        await Problem.collection.createIndex({ userId: 1, starred: 1 });
        console.log('✅ Problem indexes created');

        // FriendRequest indexes
        console.log('📊 Creating FriendRequest indexes...');
        await FriendRequest.collection.createIndex({ to: 1, status: 1 });
        await FriendRequest.collection.createIndex({ from: 1, status: 1 });
        console.log('✅ FriendRequest indexes created');

        console.log('🎉 Database optimization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error optimizing database:', error);
        process.exit(1);
    }
}

optimizeDatabase();
