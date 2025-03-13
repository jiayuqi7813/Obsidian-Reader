"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings } from "lucide-react"

interface SettingsDialogProps {
    directoryPath: string
    onDirectoryChange: (path: string) => void
    onLoadDirectory: (path: string) => void
    onLogout: () => void
}

export function SettingsDialog({ directoryPath, onDirectoryChange, onLoadDirectory, onLogout }: SettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [localPath, setLocalPath] = useState(directoryPath)

    const handleOpen = () => {
        setLocalPath(directoryPath)
        setIsOpen(true)
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    const handleSave = () => {
        onDirectoryChange(localPath)
        onLoadDirectory(localPath)
        setIsOpen(false)
    }

    const handleLogout = () => {
        onLogout()
        setIsOpen(false)
    }

    return (
        <>
            <Button variant="ghost" size="sm" onClick={handleOpen} title="设置">
                <Settings className="h-5 w-5" />
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>知识库设置</DialogTitle>
                        <DialogDescription>配置知识库目录路径和其他设置。</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="directory-path" className="text-sm font-medium">
                                知识库目录路径
                            </label>
                            <Input
                                id="directory-path"
                                value={localPath}
                                onChange={(e) => setLocalPath(e.target.value)}
                                placeholder="输入目录路径"
                            />
                            <p className="text-xs text-muted-foreground">指定包含 Markdown 和 PDF 文件的目录路径。</p>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={handleLogout} className="sm:mr-auto">
                            退出登录
                        </Button>
                        <DialogClose asChild>
                            <Button variant="secondary">取消</Button>
                        </DialogClose>
                        <Button onClick={handleSave}>保存并加载</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

