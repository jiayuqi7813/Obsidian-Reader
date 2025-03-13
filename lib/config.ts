"use server"

import fs from "fs/promises"
import path from "path"

interface Config {
    defaultPath: string
    supportedFileTypes: {
        documents: string[]
        images: string[]
    }
    auth: {
        enabled: boolean
        password: string
    }
}

const CONFIG_PATH = path.join(process.cwd(), "config", "settings.json")
const DEFAULT_CONFIG: Config = {
    defaultPath: "./public",
    supportedFileTypes: {
        documents: [".md", ".markdown", ".pdf"],
        images: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
    },
    auth: {
        enabled: true,
        password: "knowledge123", // Default password
    },
}

export async function getConfig(): Promise<Config> {
    try {
        // First check for environment variables and use them if present
        const envDefaultPath = process.env.KB_DEFAULT_PATH
        const envPassword = process.env.KB_PASSWORD

        // Check if config file exists
        let configFromFile: Config
        try {
            await fs.access(CONFIG_PATH)
            // Read and parse config file
            const configData = await fs.readFile(CONFIG_PATH, "utf-8")
            configFromFile = JSON.parse(configData) as Config
        } catch (error) {
            // Create config directory if it doesn't exist
            try {
                await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
            } catch (err) {
                console.error("Failed to create config directory:", err)
            }

            // Create default config file
            await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8")
            configFromFile = DEFAULT_CONFIG
        }

        // Override with environment variables if present
        const config: Config = {
            ...configFromFile,
            defaultPath: envDefaultPath || configFromFile.defaultPath,
            auth: {
                ...configFromFile.auth,
                password: envPassword || configFromFile.auth.password,
            },
        }

        return config
    } catch (error) {
        console.error("Error loading config:", error)

        // If error, use environment variables or fallback to defaults
        return {
            ...DEFAULT_CONFIG,
            defaultPath: process.env.KB_DEFAULT_PATH || DEFAULT_CONFIG.defaultPath,
            auth: {
                ...DEFAULT_CONFIG.auth,
                password: process.env.KB_PASSWORD || DEFAULT_CONFIG.auth.password,
            },
        }
    }
}

export async function updateConfig(newConfig: Partial<Config>): Promise<Config> {
    try {
        const currentConfig = await getConfig()
        const updatedConfig = { ...currentConfig, ...newConfig }

        // Create config directory if it doesn't exist
        try {
            await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
        } catch (err) {
            // Ignore if directory already exists
        }

        // Write updated config
        await fs.writeFile(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), "utf-8")
        return updatedConfig
    } catch (error) {
        console.error("Error updating config:", error)
        throw new Error(`Failed to update config: ${error instanceof Error ? error.message : String(error)}`)
    }
}

export async function verifyPassword(password: string): Promise<boolean> {
    try {
        const config = await getConfig()

        // If authentication is disabled, always return true
        if (!config.auth.enabled) {
            return true
        }

        // Compare the provided password with the stored password
        return password === config.auth.password
    } catch (error) {
        console.error("Error verifying password:", error)
        return false
    }
}

