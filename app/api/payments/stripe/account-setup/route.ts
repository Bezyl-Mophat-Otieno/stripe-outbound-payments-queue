import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe-service";
import {z} from 'zod'
import { env } from "@/env";

const AccountSetupSchema = z.object({
    fullName: z.string().min(1, "User FullName is required"),
    email: z.email()
})

const urlSchema = z.url("Invalid URL format");


const baseUrl = env.BASE_URL
export async function POST (request: NextRequest,){
    try {
    const body = await request.json()
    const validatedRequestBody = AccountSetupSchema.parse(body)
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
    if(!account.id) NextResponse.json({success: false, message: `Failed to create user's stripe account`}, { status: 404 })
    const accountLink = await stripeService.createOnboardingLink(account.id, baseUrl)
    if(!accountLink || !urlSchema.safeParse(accountLink).success ) NextResponse.json({success: false, message: 'Failed to create a stripe account link'}, { status: 404 })

    return NextResponse.json({success: true, message: 'Stripe Account Created Successfully', data: accountLink}, { status: 200 })

    } catch (e){
        console.log(e)
    }
}