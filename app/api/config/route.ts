import { NextResponse } from "next/server"
import { getConfig, updateConfig } from "@/lib/config"

export async function GET() {
    try {
        const config = await getConfig()
        return NextResponse.json(config)
    } catch (error) {
        console.error("Error fetching config:", error)
        return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const updatedConfig = await updateConfig(body)
        return NextResponse.json(updatedConfig)
    } catch (error) {
        console.error("Error updating config:", error)
        return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
    }
}

