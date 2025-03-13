"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    PanelLeftClose,
    PanelLeft,
    ImageIcon,
    Menu,
    FileText,
} from "lucide-react"
import { getDirectoryContents } from "@/lib/file-actions"
import ContentViewer from "./content-viewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DirectoryHelper } from "./directory-helper"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AuthForm } from "./auth-form"
import path from "path"

interface FileNode {
    name: string
    path: string
    type: "file" | "directory" | "image"
    children?: FileNode[]
    size?: number
    mtime?: Date
}

export default function KnowledgeBase() {
    const [directoryPath, setDirectoryPath] = useState<string>("")
    const [structure, setStructure] = useState<FileNode[]>([])
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showHelper, setShowHelper] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [imagePreview, setImagePreview] = useState<{ path: string; name: string } | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    // Check if we're on mobile
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        // Check if user is already authenticated
        const checkAuth = () => {
            const authStatus = localStorage.getItem("kb_authenticated")
            setIsAuthenticated(authStatus === "true")
        }

        checkAuth()
    }, [])

    useEffect(() => {
        // Auto-collapse sidebar on mobile
        if (isMobile) {
            setSidebarCollapsed(true)
        } else {
            setSidebarCollapsed(false)
        }
    }, [isMobile])

    useEffect(() => {
        // Only load directory if authenticated
        if (isAuthenticated) {
            // Load default path from config
            const loadDefaultPath = async () => {
                try {
                    const response = await fetch("/api/config")
                    const data = await response.json()
                    if (data.defaultPath) {
                        setDirectoryPath(data.defaultPath)
                        loadDirectory(data.defaultPath)
                    }
                } catch (error) {
                    console.error("Failed to load config:", error)
                    // Fallback to a default path
                    setDirectoryPath("./public")
                    loadDirectory("./public")
                }
            }

            loadDefaultPath()
        }
    }, [isAuthenticated])

    const handleAuthentication = async (password: string): Promise<boolean> => {
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            })

            const data = await response.json()

            if (data.success) {
                // Store authentication status in localStorage
                localStorage.setItem("kb_authenticated", "true")
                setIsAuthenticated(true)
                return true
            }

            return false
        } catch (error) {
            console.error("Authentication error:", error)
            return false
        }
    }

    const loadDirectory = async (path: string) => {
        setIsLoading(true)
        try {
            const contents = await getDirectoryContents(path)
            setStructure(contents)
            setDirectoryPath(path)
            setError(null)
        } catch (error) {
            console.error("Failed to load directory:", error)
            setStructure([])
            setError(`Could not access directory: ${path}. Please check if the path exists and is accessible.`)
            setShowHelper(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDirectoryPath(e.target.value)
    }

    const toggleFolder = (path: string) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(path)) {
                newSet.delete(path)
            } else {
                newSet.add(path)
            }
            return newSet
        })
    }

    const selectFile = (path: string, type: "file" | "image") => {
        setSelectedFile(path)
        setImagePreview(null)

        // On mobile, close the sidebar after selecting a file
        if (isMobile) {
            setSidebarOpen(false)
        }
    }

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    const handleImageHover = (filePath: string, fileName: string) => {
        if (!isMobile) {
            // Only show preview on hover for desktop
            setImagePreview({ path: filePath, name: fileName })
        }
    }

    const handleImageLeave = () => {
        if (!isMobile) {
            setImagePreview(null)
        }
    }

    const formatFileSize = (bytes?: number): string => {
        if (bytes === undefined) return ""
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const handleLogout = () => {
        localStorage.removeItem("kb_authenticated")
        setIsAuthenticated(false)
    }

    const renderTree = (nodes: FileNode[], level = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedFolders.has(node.path)
            const ext = path.extname(node.name).toLowerCase()

            return (
                <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
                    {node.type === "directory" ? (
                        <div>
                            <div
                                className="flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer"
                                onClick={() => toggleFolder(node.path)}
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                                <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                <span className="truncate">{node.name}</span>
                            </div>
                            {isExpanded && node.children && <div>{renderTree(node.children, level + 1)}</div>}
                        </div>
                    ) : node.type === "image" ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer ml-5",
                                            selectedFile === node.path && "bg-accent",
                                        )}
                                        onClick={() => selectFile(node.path, "image")}
                                        onMouseEnter={() => handleImageHover(node.path, node.name)}
                                        onMouseLeave={handleImageLeave}
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                        <span className="truncate">{node.name}</span>
                                        {node.size && (
                                            <span className="ml-auto text-xs text-muted-foreground">{formatFileSize(node.size)}</span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                {!isMobile && (
                                    <TooltipContent side="right" className="p-0 overflow-hidden max-w-[300px] max-h-[200px]">
                                        <img
                                            src={`/api/file?path=${encodeURIComponent(node.path)}`}
                                            alt={node.name}
                                            className="max-w-full max-h-full object-contain"
                                            style={{ maxWidth: "300px", maxHeight: "200px" }}
                                        />
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        <div
                            className={cn(
                                "flex items-center py-1 px-2 hover:bg-accent rounded cursor-pointer ml-5",
                                selectedFile === node.path && "bg-accent",
                            )}
                            onClick={() => selectFile(node.path, "file")}
                        >
                            <File className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{node.name}</span>
                            {node.size && <span className="ml-auto text-xs text-muted-foreground">{formatFileSize(node.size)}</span>}
                        </div>
                    )}
                </div>
            )
        })
    }

    // If authentication state is still loading
    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    // If not authenticated, show login form
    if (!isAuthenticated) {
        return <AuthForm onAuthenticate={handleAuthentication} />
    }

    // Desktop sidebar
    const DesktopSidebar = () => (
        <div
            className={cn(
                "border-r transition-all duration-300 ease-in-out hidden md:block",
                sidebarCollapsed ? "w-0 overflow-hidden" : "w-1/4 min-w-[250px]",
            )}
        >
            <div className="h-full flex flex-col p-4">
                <div className="mb-4 flex space-x-2">
                    <Input value={directoryPath} onChange={handlePathChange} placeholder="Enter directory path" />
                    <Button onClick={() => loadDirectory(directoryPath)} size="sm">
                        Load
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowHelper(true)}>
                        Help
                    </Button>
                </div>
                {error && <div className="mb-4 p-2 text-sm text-white bg-red-500 rounded">{error}</div>}
                <ScrollArea className="flex-1">
                    {isLoading ? <div className="p-4 text-center">Loading...</div> : <div>{renderTree(structure)}</div>}
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen">
            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0">
                    <SheetHeader className="px-4 pt-4">
                        <SheetTitle>Knowledge Base</SheetTitle>
                    </SheetHeader>
                    <div className="h-full flex flex-col p-4 pt-0">
                        <div className="mb-4 flex space-x-2">
                            <Input value={directoryPath} onChange={handlePathChange} placeholder="Enter directory path" />
                            <Button onClick={() => loadDirectory(directoryPath)} size="sm">
                                Load
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setShowHelper(true)}>
                                Help
                            </Button>
                        </div>
                        {error && <div className="mb-4 p-2 text-sm text-white bg-red-500 rounded">{error}</div>}
                        <ScrollArea className="flex-1">
                            {isLoading ? <div className="p-4 text-center">Loading...</div> : <div>{renderTree(structure)}</div>}
                        </ScrollArea>
                        <div className="mt-4 pt-4 border-t">
                            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar */}
            <DesktopSidebar />

            {/* Main content area with header */}
            <div className={cn("flex-1 transition-all duration-300 ease-in-out flex flex-col")}>
                {/* Always visible header with sidebar toggle */}
                <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <div className="flex items-center overflow-hidden">
                        {isMobile ? (
                            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="mr-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="mr-2">
                                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                            </Button>
                        )}
                        {selectedFile ? (
                            <div className="flex items-center overflow-hidden">
                                <FileText className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                <h1 className="text-lg font-semibold truncate">{path.basename(selectedFile)}</h1>
                            </div>
                        ) : (
                            <h1 className="text-lg font-semibold">Knowledge Base</h1>
                        )}
                    </div>
                </div>
                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                    <ContentViewer filePath={selectedFile} hideHeader={true} />
                </div>
            </div>

            {/* Directory Helper Dialog */}
            <DirectoryHelper isOpen={showHelper} onClose={() => setShowHelper(false)} />
        </div>
    )
}

