import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await connectDB();
    
    // Find all users that don't have the serviceOperations field
    const usersToUpdate = await User.find({
      $or: [
        { serviceOperations: { $exists: false } },
        { serviceOperations: null }
      ]
    });
    
    console.log(`Found ${usersToUpdate.length} users to migrate`);
    
    // Update each user to add the serviceOperations field
    const updatePromises = usersToUpdate.map(user => 
      User.findByIdAndUpdate(
        user._id,
        { 
          $set: { serviceOperations: [] }
        },
        { new: true }
      )
    );
    
    const updatedUsers = await Promise.all(updatePromises);
    
    console.log(`Successfully migrated ${updatedUsers.length} users`);
    
    return NextResponse.json({ 
      message: `Successfully migrated ${updatedUsers.length} users`,
      migratedCount: updatedUsers.length
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Migration failed" }, { status: 500 });
  }
} 