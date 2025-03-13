"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink, FileText, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface MobilePDFViewerProps {
    fileName: string
    fileUrl: string
}

export function MobilePDFViewer({ fileName, fileUrl }: MobilePDFViewerProps) {
    const [viewMode, setViewMode] = useState<"options" | "preview">("options")

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

    // Simple options view with buttons to download or open in browser
    if (viewMode === "options") {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center overflow-hidden">
                        <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                        <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                    </div>
                </div>

                <div className="flex-1 p-4 flex flex-col items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>PDF Viewer</CardTitle>
                            <CardDescription>Choose how you want to view this PDF</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full" onClick={openInNewTab} variant="default">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in Browser
                            </Button>

                            <Button className="w-full" onClick={downloadPDF} variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </Button>

                            <Button className="w-full" onClick={() => setViewMode("preview")} variant="secondary">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview First Page
                            </Button>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground">
                            <p>For the best experience, we recommend opening the PDF in your device's browser or PDF viewer app.</p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        )
    }

    // Simple preview mode - just shows the PDF directly
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                <div className="flex items-center overflow-hidden">
                    <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <h2 className="text-lg font-semibold truncate">{fileName}</h2>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={downloadPDF} title="Download PDF">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={openInNewTab} title="Open in new tab">
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode("options")} title="View options">
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 bg-muted/10 p-2">
                <div className="w-full h-full bg-white rounded-md overflow-hidden">
                    <object data={fileUrl} type="application/pdf" width="100%" height="100%" className="w-full h-full">
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
                                    <Button onClick={() => setViewMode("options")} variant="secondary">
                                        Back to Options
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </object>
                </div>
            </div>
        </div>
    )
}

