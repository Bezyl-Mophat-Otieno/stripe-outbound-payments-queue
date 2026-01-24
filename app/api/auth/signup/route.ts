import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { hashPassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();

    const user = await db.insert(users).values({
      id: userId,
      fullName,
      email,
      password,
      hashedPassword,
    }).returning();

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    return NextResponse.json(
      {
        success: true,
        message: "User signed up successfully",
        data: { 
        user,         
        accessToken,
        refreshToken, 
       },
      },
      {
        status: 201,
        headers: {
          'X-Refresh-Token': refreshToken,
        },
      }
    );
  } catch (error) {
    console.error('[v0] Signup error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
