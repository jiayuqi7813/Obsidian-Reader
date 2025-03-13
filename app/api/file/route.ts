import { type NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const filePath = url.searchParams.get("path")

  if (!filePath) {
    return NextResponse.json({ error: "No file path provided" }, { status: 400 })
  }

  try {
    // Security check to prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath)

    // Try to access the file
    try {
      await fs.access(normalizedPath)
    } catch (error) {
      // If the file doesn't exist in the specified path,
      // try looking in the img subdirectory of the parent folder
      const parentImgPath = path.join(path.dirname(path.dirname(normalizedPath)), "img", path.basename(normalizedPath))

      try {
        await fs.access(parentImgPath)
        // If we found the file in the parent img directory, use that
        const fileBuffer = await fs.readFile(parentImgPath)
        return serveFile(fileBuffer, parentImgPath)
      } catch (parentError) {
        // If both paths fail, return 404
        console.error(`File not found at either path:`, {
          original: normalizedPath,
          parent: parentImgPath,
        })
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
    }

    // Read and serve the file from the original path
    const fileBuffer = await fs.readFile(normalizedPath)
    return serveFile(fileBuffer, normalizedPath)
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}

function serveFile(fileBuffer: Buffer, filePath: string) {
  // Determine content type
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".md": "text/markdown",
    ".markdown": "text/markdown",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  }
  const contentType = contentTypes[ext] || "application/octet-stream"

  // Encode the filename for Content-Disposition header
  const filename = path.basename(filePath)
  const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, "%2A")

  // Return file using the Response constructor
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodedFilename}`,
      "Cache-Control": "public, max-age=60",
    },
  })
}

