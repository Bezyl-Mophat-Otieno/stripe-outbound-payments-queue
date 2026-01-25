import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.headers.get('x-refresh-token');

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token required' },
        { status: 401 }
      );
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    const newAccessToken = generateAccessToken(decoded.userId);

    return NextResponse.json(
      {
        success: true,
        message: 'Access token refreshed successfully',
        data: { accessToken: newAccessToken },
      },
      {
        status: 200,
        headers: {
          'X-Access-Token': newAccessToken,
        },
      }
    );
  } catch (error) {
    console.error('[v0] Refresh token error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
