"use server"

import fs from "fs/promises"
import path from "path"
import { getConfig } from "./config"

interface FileNode {
  name: string
  path: string
  type: "file" | "directory" | "image"
  children?: FileNode[]
  size?: number
  mtime?: Date
}

// Function to get directory contents recursively
export async function getDirectoryContents(dirPath: string): Promise<FileNode[]> {
  try {
    // First check if directory exists
    await fs.access(dirPath)

    const config = await getConfig()
    const supportedDocuments = config.supportedFileTypes.documents
    const supportedImages = config.supportedFileTypes.images

    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const result: FileNode[] = []

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        try {
          const children = await getDirectoryContents(entryPath)
          result.push({
            name: entry.name,
            path: entryPath,
            type: "directory",
            children,
          })
        } catch (error) {
          // If we can't read a subdirectory, just add it without children
          result.push({
            name: entry.name,
            path: entryPath,
            type: "directory",
            children: [],
          })
        }
      } else {
        // Get file stats for size and modification time
        const stats = await fs.stat(entryPath)
        const ext = path.extname(entry.name).toLowerCase()

        // Check if it's a supported document
        if (supportedDocuments.includes(ext)) {
          result.push({
            name: entry.name,
            path: entryPath,
            type: "file",
            size: stats.size,
            mtime: stats.mtime,
          })
        }
        // Check if it's a supported image or has "Pasted image" in the name
        else if (supportedImages.includes(ext) || entry.name.includes("Pasted image")) {
          result.push({
            name: entry.name,
            path: entryPath,
            type: "image",
            size: stats.size,
            mtime: stats.mtime,
          })
        }
      }
    }

    // Sort directories first, then files
    return result.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      if (a.type === "directory") return -1
      if (b.type === "directory") return 1
      return 0
    })
  } catch (error) {
    console.error("Error reading directory:", error)
    throw new Error(`Failed to read directory: ${dirPath}`)
  }
}

// Function to get file content (for markdown files)
export async function getFileContent(filePath: string): Promise<string> {
  try {
    console.log("Reading file:", filePath)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      console.error("File does not exist:", filePath)
      throw new Error(`File does not exist: ${filePath}`)
    }

    // Read file content
    const content = await fs.readFile(filePath, "utf-8")
    console.log("File content length:", content.length)

    // Log warning if content is empty
    if (content.trim().length === 0) {
      console.warn("File is empty:", filePath)
    }

    return content
  } catch (error) {
    console.error("Error reading file:", error)
    throw new Error(
        `Failed to read file: ${filePath}. Error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

