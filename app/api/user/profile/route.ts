import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { db } from '@/lib/db';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json({success: false, message: 'Invalid token' }, { status: 401 });
    }

    const userList = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (userList.length === 0) {
      return NextResponse.json({success: false, message: 'User not found' }, { status: 404 });
    }

    const user = userList[0];

    return NextResponse.json({
      success: true,
      message: 'User profile fetched successfully',
      data: {user}
    });
  } catch (error) {
    console.error('[v0] Get profile message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
