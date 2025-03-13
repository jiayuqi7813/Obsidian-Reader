import { NextResponse } from "next/server"
import { verifyPassword } from "@/lib/config"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 })
        }

        const isValid = await verifyPassword(password)

        if (isValid) {
            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 })
        }
    } catch (error) {
        console.error("Authentication error:", error)
        return NextResponse.json({ success: false, message: "Authentication failed" }, { status: 500 })
    }
}

