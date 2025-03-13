"use client"

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

interface DirectoryHelperProps {
  isOpen: boolean
  onClose: () => void
}

export function DirectoryHelper({ isOpen, onClose }: DirectoryHelperProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Directory Helper</DialogTitle>
          <DialogDescription>
            To use the knowledge base, you need to specify a directory containing Markdown and PDF files. Here are some
            tips:
            <br />
            <br />- The path should be relative to the project root (e.g., <code>./public</code>).
            <br />- Ensure the directory exists and is accessible by the application.
            <br />- Only Markdown (.md, .markdown) and PDF (.pdf) files are supported.
            <br />- Subdirectories are supported and will be displayed in a tree structure.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

