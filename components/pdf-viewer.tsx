"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Download,
    ExternalLink,
    FileText,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
} from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

interface PDFViewerProps {
    fileName: string
    fileUrl: string
    hideHeader?: boolean
}

export function PDFViewer({ fileName, fileUrl, hideHeader = false }: PDFViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const isMobile = useMediaQuery("(max-width: 768px)")
    const objectRef = useRef<HTMLObjectElement>(null)

    // Mobile PDF.js specific states
    const [pdfJsLoaded, setPdfJsLoaded] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [scale, setScale] = useState(1.0)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [pdfDoc, setPdfDoc] = useState<any>(null)

    // Force hide loading indicator after a timeout
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading) {
                console.log("Force hiding loading indicator after timeout")
                setIsLoading(false)
            }
        }, 3000) // 3 seconds timeout

        return () => clearTimeout(timer)
    }, [isLoading])

    // Handle load event for desktop viewer
    const handleLoad = () => {
        console.log("PDF loaded")
        setIsLoading(false)
    }

    // Handle error - switch to fallback
    const handleError = () => {
        console.log("Error loading PDF")
        setLoadError(true)
        setIsLoading(false)
    }

    // Load PDF.js for mobile
    useEffect(() => {
        if (!isMobile) return

        // Check if PDF.js is already loaded
        if (window.pdfjsLib) {
            setPdfJsLoaded(true)
            return
        }

        // Load PDF.js worker
        const workerScript = document.createElement("script")
        workerScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        document.head.appendChild(workerScript)

        // Set worker source
        const mainScript = document.createElement("script")
        mainScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        mainScript.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
            setPdfJsLoaded(true)
        }
        document.head.appendChild(mainScript)

        return () => {
            try {
                if (document.head.contains(workerScript)) {
                    document.head.removeChild(workerScript)
                }
                if (document.head.contains(mainScript)) {
                    document.head.removeChild(mainScript)
                }
            } catch (e) {
                console.error("Error removing scripts:", e)
            }
        }
    }, [isMobile])

    // Load PDF document for mobile
    useEffect(() => {
        if (!isMobile || !pdfJsLoaded || !window.pdfjsLib) return

        const loadPdf = async () => {
            try {
                setIsLoading(true)

                // Load the PDF document
                const loadingTask = window.pdfjsLib.getDocument(fileUrl)
                const pdf = await loadingTask.promise
                setPdfDoc(pdf)
                setTotalPages(pdf.numPages)

                // Render the first page
                await renderPage(pdf, 1)

                setIsLoading(false)
            } catch (error) {
                console.error("Error loading PDF:", error)
                setLoadError(true)
                setIsLoading(false)
            }
        }

        loadPdf()
    }, [fileUrl, pdfJsLoaded, isMobile])

    // Render PDF page for mobile
    const renderPage = async (pdf: any, pageNumber: number) => {
        if (!canvasRef.current || !containerRef.current) return

        try {
            // Get the page
            const page = await pdf.getPage(pageNumber)

            // Get device pixel ratio
            const pixelRatio = window.devicePixelRatio || 1

            // Determine scale based on container width
            let viewport = page.getViewport({ scale: 1.0 })
            const canvas = canvasRef.current
            const container = containerRef.current

            const containerWidth = container.clientWidth
            const containerHeight = container.clientHeight

            // Calculate scale to fit width
            const scaleX = containerWidth / viewport.width
            const scaleY = containerHeight / viewport.height
            const newScale = Math.min(scaleX, scaleY) * 0.95 // 95% to add some margin

            setScale(newScale)
            viewport = page.getViewport({ scale: newScale })

            // Set canvas dimensions with pixel ratio for high DPI displays
            const context = canvas.getContext("2d")
            canvas.width = Math.floor(viewport.width * pixelRatio)
            canvas.height = Math.floor(viewport.height * pixelRatio)
            canvas.style.width = `${Math.floor(viewport.width)}px`
            canvas.style.height = `${Math.floor(viewport.height)}px`

            // Scale context for high DPI display
            context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            }

            await page.render(renderContext).promise

            setCurrentPage(pageNumber)
        } catch (error) {
            console.error("Error rendering page:", error)
            setLoadError(true)
        }
    }

    // Navigate to previous page
    const prevPage = () => {
        if (currentPage <= 1 || !pdfDoc) return
        renderPage(pdfDoc, currentPage - 1)
    }

    // Navigate to next page
    const nextPage = () => {
        if (currentPage >= totalPages || !pdfDoc) return
        renderPage(pdfDoc, currentPage + 1)
    }

    // Zoom in
    const zoomIn = () => {
        if (!pdfDoc) return
        const newScale = scale * 1.2
        setScale(newScale)
        renderPage(pdfDoc, currentPage)
    }

    // Zoom out
    const zoomOut = () => {
        if (!pdfDoc) return
        const newScale = scale / 1.2
        setScale(newScale)
        renderPage(pdfDoc, currentPage)
    }

    const downloadPDF = () => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const openInNewTab = () => {
        window.open(fileUrl, "_blank")
    }

    // Handle window resize for mobile
    useEffect(() => {
        if (!isMobile) return

        const handleResize = () => {
            if (pdfDoc) renderPage(pdfDoc, currentPage)
        }

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [pdfDoc, currentPage, isMobile])

    // Render fallback UI when PDF loading fails
    if (loadError) {
        return (
            <div className="h-full flex items-center justify-center p-4">
                <div className="bg-yellow-50 text-yellow-800 rounded-md max-w-md p-6">
                    <h3 className="font-bold text-lg mb-3">PDF Viewer Error</h3>
                    <p>Unable to display the PDF. You can try the following alternatives:</p>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button onClick={downloadPDF} variant="outline" className="w-full justify-start">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button onClick={openInNewTab} variant="outline" className="w-full justify-start">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in new tab
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full mx-auto ${isFullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
            <div className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full">
                {/* Accessible title for screen readers */}
                <VisuallyHidden>
                    <h2 id="pdf-viewer-title">PDF Viewer: {fileName}</h2>
                </VisuallyHidden>

                {/* Toolbar - only show if hideHeader is false */}
                {!hideHeader && (
                    <div
                        className="flex items-center justify-between p-2 border-b bg-muted/30"
                        aria-labelledby="pdf-viewer-title"
                    >
                        <div className="flex items-center overflow-hidden">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                            <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            {isMobile && pdfJsLoaded && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom in">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom out">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button variant="ghost" size="sm" onClick={downloadPDF} title="Download PDF">
                                <Download className="h-4 w-4" />
                                {!isMobile && <span className="ml-1 hidden sm:inline">Download</span>}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={openInNewTab} title="Open in new tab">
                                <ExternalLink className="h-4 w-4" />
                                {!isMobile && <span className="ml-1 hidden sm:inline">Open</span>}
                            </Button>
                            {!isMobile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen view"}
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main content area */}
                <div className="flex-1 relative bg-muted/10">
                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                <p>Loading PDF...</p>
                            </div>
                        </div>
                    )}

                    {/* Desktop PDF Viewer */}
                    {!isMobile && (
                        <object
                            ref={objectRef}
                            data={fileUrl}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            className="w-full h-full"
                            onLoad={handleLoad}
                            onError={handleError}
                        >
                            <div className="h-full flex items-center justify-center p-4">
                                <div className="text-center">
                                    <p className="mb-4">Unable to display PDF directly.</p>
                                    <div className="flex flex-col gap-2">
                                        <Button onClick={openInNewTab}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open in Browser
                                        </Button>
                                        <Button onClick={downloadPDF} variant="outline">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </object>
                    )}

                    {/* Mobile PDF Viewer with PDF.js */}
                    {isMobile && (
                        <div className="flex-1 relative bg-muted/10 overflow-auto h-full" ref={containerRef}>
                            {/* PDF Canvas */}
                            <div className="flex flex-col items-center justify-start min-h-full p-4">
                                <canvas ref={canvasRef} className="shadow-lg"></canvas>
                            </div>
                        </div>
                    )}
                </div>

                {/* Page navigation for mobile */}
                {isMobile && totalPages > 0 && (
                    <div className="flex items-center justify-center p-2 border-t bg-muted/30">
                        <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage <= 1} className="mr-2">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPage}
                            disabled={currentPage >= totalPages}
                            className="ml-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

// Add TypeScript interface for PDF.js
declare global {
    interface Window {
        pdfjsLib: any
    }
}

