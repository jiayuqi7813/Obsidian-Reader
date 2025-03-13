"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface ImageViewerProps {
    fileName: string
    fileUrl: string
    hideHeader?: boolean
}

export function ImageViewer({ fileName, fileUrl, hideHeader = false }: ImageViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const isMobile = useMediaQuery("(max-width: 768px)")

    const handleImageLoad = () => {
        setIsLoading(false)
    }

    const handleImageError = () => {
        setLoadError("Failed to load image. The file may be corrupted or inaccessible.")
        setIsLoading(false)
    }

    const zoomIn = () => {
        setZoom((prev) => Math.min(prev + 0.25, 3))
    }

    const zoomOut = () => {
        setZoom((prev) => Math.max(prev - 0.25, 0.5))
    }

    const rotate = () => {
        setRotation((prev) => (prev + 90) % 360)
    }

    return (
        <div className={`w-full mx-auto ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
            <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full">
                {/* Accessible title for screen readers */}
                <VisuallyHidden>
                    <h2 id="image-viewer-title">Image Viewer: {fileName}</h2>
                </VisuallyHidden>

                {/* Toolbar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div
                        className="flex items-center justify-between p-2 border-b bg-muted/30"
                        aria-labelledby="image-viewer-title"
                    >
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {!isMobile && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom in">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom out">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={rotate} title="Rotate">
                                        <RotateCw className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const link = document.createElement("a")
                                    link.href = fileUrl
                                    link.download = fileName
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                }}
                                title="Download image"
                            >
                                <Download className="h-4 w-4" />
                                {!isMobile && <span className="ml-1 hidden sm:inline">Download</span>}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, "_blank")} title="Open in new tab">
                                <ExternalLink className="h-4 w-4" />
                                {!isMobile && <span className="ml-1 hidden sm:inline">Open</span>}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                title={isFullscreen ? "Exit fullscreen" : "Fullscreen view"}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main content area */}
                <div className="flex-1 flex items-center justify-center bg-muted/20 overflow-auto">
                    {isLoading && (
                        <div className="absolute flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                <p>Loading image...</p>
                            </div>
                        </div>
                    )}

                    {loadError ? (
                        <div className="bg-destructive/10 text-destructive p-4 rounded-md max-w-md">
                            <h3 className="font-bold mb-2">Error Loading Image</h3>
                            <p>{loadError}</p>
                            <div className="mt-4 flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, "_blank")}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open in Browser
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 touch-manipulation">
                            <img
                                src={fileUrl || "/placeholder.svg"}
                                alt={fileName}
                                className="max-w-full max-h-full object-contain"
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transition: "transform 0.2s ease",
                                }}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

