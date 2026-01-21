import { NextRequest, NextResponse } from "next/server";
import { StripeAccountSetupParams, stripeService } from "@/lib/services/stripe-service";
import {z} from 'zod'
import { env } from "@/env";

const AccountSetupSchema = z.object({
    fullName: z.string().min(1, "User FullName is required"),
    email: z.email()
})

const baseUrl = env.BASE_URL
export async function POST (request: NextRequest,){
    try {
    const body = await request.json()
    const validatedRequestBody = AccountSetupSchema.parse(body)
    const payload: StripeAccountSetupParams = {
        display_name: validatedRequestBody.fullName,
        contact_email: validatedRequestBody.email
    }
    const account  = await stripeService.setupAccount(payload)
    if(!account) NextResponse.json({success: false, message: `Failed to create user's stripe account`}, { status: 404 })
    const accountLink = await stripeService.createOnboardingLink(account.id, baseUrl)
    if(!accountLink) NextResponse.json({success: false, message: 'Failed to create a stripe account link'}, { status: 404 })

    return NextResponse.json({success: true, message: 'Stripe Account Created Successfully', data: accountLink}, { status: 200 })

    } catch (e){
        console.log(e)
    }
}