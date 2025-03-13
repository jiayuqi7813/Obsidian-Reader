"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { parseObsidianMarkdown } from "@/lib/markdown/obsidian-parser"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, Download, FileText } from "lucide-react"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface MarkdownRendererProps {
    content: string
    basePath?: string
    fileName: string
    hideHeader?: boolean
}

export default function MarkdownRenderer({
                                             content,
                                             basePath = "",
                                             fileName,
                                             hideHeader = false,
                                         }: MarkdownRendererProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState<string>("Image Preview")
    const [renderedContent, setRenderedContent] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const isMobile = useMediaQuery("(max-width: 768px)")

    useEffect(() => {
        let isMounted = true
        setIsLoading(true)
        setError(null)

        const renderContent = async () => {
            try {
                const rendered = await parseObsidianMarkdown(content, {
                    basePath,
                    assetsPath: `${basePath}/img`,
                })

                if (isMounted) {
                    setRenderedContent(rendered)
                    setIsLoading(false)
                }
            } catch (err) {
                console.error("Error rendering markdown:", err)
                if (isMounted) {
                    setError(`Failed to render markdown: ${err instanceof Error ? err.message : String(err)}`)
                    setIsLoading(false)
                }
            }
        }

        renderContent()

        return () => {
            isMounted = false
        }
    }, [content, basePath])

    if (!content || content.trim().length === 0) {
        return (
            <div className="h-full flex flex-col">
                {/* Top bar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md m-4">
                    No content to display or empty markdown file.
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                {/* Top bar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>
                    </div>
                )}

                <div className="p-4 flex justify-center items-center flex-1">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full flex flex-col">
                {/* Top bar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>
                    </div>
                )}

                <div className="p-4 bg-red-50 text-red-700 rounded-md m-4">
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                    <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
            {content.substring(0, 500)}
                        {content.length > 500 ? "..." : ""}
          </pre>
                </div>
            </div>
        )
    }

    const handleImageClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement
        if (target.tagName === "IMG") {
            const img = target as HTMLImageElement
            setImagePreview(img.src)
            // Set the title to the alt text or the filename
            setPreviewTitle(img.alt || img.src.split("/").pop() || "Image Preview")
        }
    }

    const zoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 3))
    }

    const zoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 0.5))
    }

    const downloadImage = () => {
        if (!imagePreview) return

        const link = document.createElement("a")
        link.href = imagePreview
        link.download = previewTitle
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <>
            <div className="h-full flex flex-col">
                {/* Accessible title for screen readers */}
                <VisuallyHidden>
                    <h2 id="markdown-viewer-title">Markdown Viewer: {fileName}</h2>
                </VisuallyHidden>

                {/* Top bar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div
                        className="flex items-center justify-between p-2 border-b bg-muted/30"
                        aria-labelledby="markdown-viewer-title"
                    >
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>
                    </div>
                )}

                {/* Markdown content */}
                <div className="flex-1 overflow-auto">
                    <div
                        className="prose dark:prose-invert w-full max-w-none md:text-base text-sm px-4 py-4"
                        style={{
                            maxWidth: isMobile ? "100%" : "65ch",
                            margin: "0 auto",
                            lineHeight: "1.7", // Slightly increase line height for better readability
                        }}
                        onClick={handleImageClick}
                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                    />
                </div>
            </div>

            {/* Image Preview Dialog */}
            <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
                <DialogContent className="max-w-[95vw] md:max-w-4xl p-0 overflow-hidden">
                    <DialogTitle className="sr-only">{previewTitle}</DialogTitle>

                    {/* Mobile-friendly toolbar */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-black/70 text-white p-2 flex justify-between items-center">
                        <div className="truncate max-w-[60%]">{previewTitle}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={zoomIn}>
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={zoomOut}>
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={downloadImage}>
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20"
                                onClick={() => setImagePreview(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4 touch-manipulation">
                        {imagePreview ? (
                            <img
                                src={imagePreview || "/placeholder.svg"}
                                alt={previewTitle}
                                className="max-w-full max-h-[80vh] object-contain"
                                style={{
                                    transform: `scale(${zoom})`,
                                    transition: "transform 0.2s ease",
                                }}
                                onError={(e) => {
                                    console.error("Failed to load preview image")
                                    e.currentTarget.src = "/placeholder.svg?height=400&width=400"
                                }}
                            />
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-muted rounded-md">No image to preview</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

