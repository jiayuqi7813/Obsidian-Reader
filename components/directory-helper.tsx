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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpCircle, FolderTree, LogOut } from "lucide-react"

interface DirectoryHelperProps {
  isOpen: boolean
  onClose: () => void
  directoryPath: string
  onDirectoryChange: (path: string) => void
  onLoadDirectory: (path: string) => void
  onLogout: () => void
}

export function DirectoryHelper({
                                  isOpen,
                                  onClose,
                                  directoryPath,
                                  onDirectoryChange,
                                  onLoadDirectory,
                                  onLogout,
                                }: DirectoryHelperProps) {
  const [localPath, setLocalPath] = useState(directoryPath)

  // Reset local path when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalPath(directoryPath)
    } else {
      onClose()
    }
  }

  const handleSave = () => {
    onDirectoryChange(localPath)
    onLoadDirectory(localPath)
    onClose()
  }

  return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>知识库设置</DialogTitle>
            <DialogDescription>配置知识库目录路径和查看帮助信息</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">
                <FolderTree className="h-4 w-4 mr-2" />
                目录设置
              </TabsTrigger>
              <TabsTrigger value="help">
                <HelpCircle className="h-4 w-4 mr-2" />
                帮助信息
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="py-4">
              <div className="space-y-4">
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

                <div className="pt-4">
                  <Button onClick={handleSave} className="w-full">
                    保存并加载目录
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="help" className="py-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">使用说明</h4>
                <ul className="text-sm space-y-2 list-disc pl-5">
                  <li>
                    路径应相对于项目根目录（例如，<code>./public</code>）。
                  </li>
                  <li>确保应用程序可以访问该目录。</li>
                  <li>仅支持 Markdown（.md、.markdown）和 PDF（.pdf）文件。</li>
                  <li>支持子目录，将以树状结构显示。</li>
                  <li>图片文件（.jpg、.png 等）将在 Markdown 中显示。</li>
                  <li>
                    Docker 部署时，默认路径为 <code>/data</code>。
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onLogout} className="sm:mr-auto">
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
            <DialogClose asChild>
              <Button variant="secondary">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}

