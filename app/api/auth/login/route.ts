import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { verifyPassword } from '@/lib/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({success: false, message: 'Email and password required' }, { status: 400 });
    }

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const user = userList[0];
    const passwordMatch = await verifyPassword(password, user.hashedPassword);

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "User logged in successfully",
        data: { 
        user,         
        accessToken,
        refreshToken, 
       },
      },
      {
        status: 200,
        headers: {
          'X-Refresh-Token': refreshToken,
        },
      }
    );
  } catch (error) {
    console.error('[v0] Login error:', error);
    return NextResponse.json({success: false, messge: 'Internal server error' }, { status: 500 });
  }
}
