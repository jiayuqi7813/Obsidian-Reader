"use client"

import { useEffect, useRef, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface PDFJsViewerProps {
    fileUrl: string
    fileName: string
    onError?: () => void
}

export function PDFJsViewer({ fileUrl, fileName, onError }: PDFJsViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [pdfDocument, setPdfDocument] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Directly use the fallback viewer since PDF.js is having issues
        if (onError) {
            onError()
        }
        return
    }, [onError])

    // The rest of the component is kept for reference but won't be used
    // since we're immediately falling back to the iframe viewer

    const changePage = (delta: number) => {
        const newPage = currentPage + delta
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    const changeZoom = (delta: number) => {
        const newScale = Math.max(0.5, Math.min(2.5, scale + delta))
        setScale(newScale)
    }

    const rotateClockwise = () => {
        setRotation((prevRotation) => (prevRotation + 90) % 360)
    }

    const handleDownload = () => {
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="flex flex-col w-full h-full bg-card rounded-lg shadow-md overflow-hidden">
            {/* Loading state */}
            <div className="flex-1 overflow-auto p-4 bg-muted/20 flex justify-center">
                <div className="flex flex-col items-center justify-center w-full">
                    <Skeleton className="h-[500px] w-[400px]" />
                    <div className="mt-4">Switching to alternative PDF viewer...</div>
                </div>
            </div>
        </div>
    )
}

