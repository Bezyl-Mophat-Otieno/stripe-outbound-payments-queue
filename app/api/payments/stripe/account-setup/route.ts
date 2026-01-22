import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/db/schema/users'
import { stripeService } from '@/lib/services/stripe-service'
import {success, z} from 'zod'
import { verifyAccessToken } from '@/lib/jwt'

const AccountSetupSchema = z.object({
    fullName: z.string().min(1, "User FullName is required"),
    email: z.email()
})


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
    const  userId = jwtPayload.userId
    const body = await request.json()
    const validatedRequestBody = AccountSetupSchema.parse(body)

    // Get user from database
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentUser = user[0]

    // If account already exists, return i
    if (currentUser.stripeAccountId) {
        return NextResponse.json({
            success: true, 
            message: 'Stripe Account Created Successfully',
            data: currentUser.stripeAccountId
        }, { status: 200 })
    }

    const payload = {
                        name: validatedRequestBody.fullName,
                        email: validatedRequestBody.email,
                        legal_entity_data: {
                            business_type: "individual" as const,
                            country: "us",
                        },
                        configuration: {
                            recipient_data: {
                            features: {
                                bank_accounts: {
                                local: {
                                    requested: true
                                }
                                }
                            }
                    }
                }
    }

    const account  = await stripeService.setupAccount(payload)

    await db
      .update(users)
      .set({ stripeAccountId: account.id })
      .where(eq(users.id, userId))

    return NextResponse.json({success: true, message: 'Stripe Account Created Successfully', data: account.id}, { status: 201 })

  } catch (error) {
    console.error('[Stripe] Account setup error:', error)
    return NextResponse.json(
      { success: true, message: 'Failed to setup Stripe account' },
      { status: 500 }
    )
  }
}
