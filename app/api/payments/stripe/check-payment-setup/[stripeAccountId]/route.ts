import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/services/stripe-service";

export async function GET (_: NextRequest, {params}: { params: Promise<{stripeAccountId: string}> }){
    try {
    const {stripeAccountId} = await params
    const hasPaymentSetup  = await stripeService.verifyPaymentSetup(stripeAccountId)

    if(!hasPaymentSetup) NextResponse.json({success: false, message: 'User has yet to setup his/her payment details'}, { status: 404 })

    return NextResponse.json({success: true, message: 'User payment details have been sucessfully setup', data: hasPaymentSetup}, { status: 200 })

    } catch (e){
        console.log(e)
    }
}
