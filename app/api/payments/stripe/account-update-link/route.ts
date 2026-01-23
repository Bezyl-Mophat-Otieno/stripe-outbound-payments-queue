import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/db/schema/users'
import { stripeService } from '@/lib/services/stripe-service'
import z from 'zod'
import { verifyAccessToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // Get user ID from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
        )
    }
    const token = authHeader.slice(7)
    // Decode JWT to get user ID
        const jwtPayload = verifyAccessToken(token)
        if(!jwtPayload) return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
        )
    const userId = jwtPayload.userId
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user.stripeAccountId) {
      return NextResponse.json(
        { success: true,
          message: 'Stripe account not found' },
        { status: 404 }
      )
    }

    // Generate account update link
    const updateLink = await stripeService.createUpdateLink(
      user.stripeAccountId,
    )

    if(!updateLink || !z.url().safeParse(updateLink).success ) NextResponse.json({success: false, message: 'Failed to create Stripe Account Link'}, { status: 404 })

    return NextResponse.json({success: true, message: 'Stripe Account Link Created Successfully', data: {updateLink}}, { status: 201 })
  } catch (error) {
    console.error('[Stripe] Account update link error:', error)
    return NextResponse.json(
      { error: 'Failed to generate account update link' },
      { status: 500 }
    )
  }
}
