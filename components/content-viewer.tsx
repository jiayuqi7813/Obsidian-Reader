"use client"

import { useState, useEffect } from "react"
import { getFileContent } from "@/lib/file-actions"
import MarkdownRenderer from "./markdown-renderer"
import { PDFViewer } from "./pdf-viewer"
import { ImageViewer } from "./image-viewer"
import path from "path"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ContentViewerProps {
    filePath: string | null
    hideHeader?: boolean
}

export default function ContentViewer({ filePath, hideHeader = false }: ContentViewerProps) {
    const [content, setContent] = useState<string | null>(null)
    const [fileType, setFileType] = useState<"markdown" | "pdf" | "image" | "unknown">("unknown")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string>("")
    const [apiUrl, setApiUrl] = useState<string>("")
    const isMobile = useMediaQuery("(max-width: 768px)")

    useEffect(() => {
        if (!filePath) {
            setContent(null)
            setFileType("unknown")
            return
        }

        // Set file name
        setFileName(path.basename(filePath))

        const loadFile = async () => {
            setIsLoading(true)
            setError(null)

            try {
                console.log("Loading file:", filePath)
                const ext = path.extname(filePath).toLowerCase()

                // Determine file type from extension
                if (ext === ".md" || ext === ".markdown") {
                    setFileType("markdown")
                    const content = await getFileContent(filePath)
                    console.log("Markdown content loaded, length:", content.length)
                    setContent(content)
                } else if (ext === ".pdf") {
                    setFileType("pdf")
                    // For PDFs, we'll use the API route to serve the file
                    const url = `/api/file?path=${encodeURIComponent(filePath)}`
                    setApiUrl(url)
                    setContent(url)
                } else if ([".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"].includes(ext)) {
                    setFileType("image")
                    const url = `/api/file?path=${encodeURIComponent(filePath)}`
                    setApiUrl(url)
                    setContent(url)
                } else {
                    setFileType("unknown")
                    setError("Unsupported file type. Only Markdown, PDF, and common image formats are supported.")
                }
            } catch (err) {
                console.error("Error loading file:", err)
                setError(`Failed to load file: ${err instanceof Error ? err.message : String(err)}`)
            } finally {
                setIsLoading(false)
            }
        }

        loadFile()
    }, [filePath])

    if (!filePath) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                    <p className="mb-2">Select a file from the directory to view its contents</p>
                    {isMobile && (
                        <p className="text-sm text-muted-foreground">Use the menu button in the top left to browse files</p>
                    )}
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p>Loading content...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md max-w-md">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full">
            {fileType === "markdown" && content && (
                <div className="h-full flex flex-col">
                    <MarkdownRenderer
                        content={content}
                        basePath={path.dirname(filePath)}
                        fileName={fileName}
                        hideHeader={hideHeader}
                    />
                </div>
            )}

            {fileType === "pdf" && apiUrl && (
                <div className="h-full">
                    <PDFViewer fileName={fileName} fileUrl={apiUrl} hideHeader={hideHeader} />
                </div>
            )}

            {fileType === "image" && apiUrl && (
                <div className="h-full">
                    <ImageViewer fileName={fileName} fileUrl={apiUrl} hideHeader={hideHeader} />
                </div>
            )}

            {fileType === "unknown" && (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                    Unsupported file type. Only Markdown, PDF, and common image formats are supported.
                </div>
            )}
        </div>
    )
}

