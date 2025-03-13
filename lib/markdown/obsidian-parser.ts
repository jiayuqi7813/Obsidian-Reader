import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import remarkGfm from "remark-gfm"
import { visit } from "unist-util-visit"
import path from "path"
import rehypeSanitize from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"

interface ObsidianParserOptions {
    basePath: string
    assetsPath?: string
}

// Custom plugin to handle Obsidian-style image links
function remarkObsidianImages(options: ObsidianParserOptions) {
    return (tree: any) => {
        // Process only text nodes that contain Obsidian image syntax
        visit(tree, "text", (node, index, parent) => {
            if (!parent || index === null) return

            // Check if the text contains Obsidian image syntax
            if (!/!\[\[.*?\]\]/.test(node.value)) return

            // Split the text by Obsidian image syntax
            const parts = node.value.split(/(!\[\[.*?\]\])/)
            if (parts.length === 1) return

            // Create new nodes to replace the current text node
            const newNodes = []

            for (const part of parts) {
                // Check if this part is an Obsidian image reference
                const match = part.match(/!\[\[(.*?)\]\]/)

                if (match) {
                    // It's an image reference, create an image node
                    const imagePath = match[1]
                    const imageUrl = resolveImagePath(imagePath, options)

                    newNodes.push({
                        type: "image",
                        url: imageUrl,
                        alt: imagePath,
                    })
                } else if (part.trim()) {
                    // It's regular text
                    newNodes.push({
                        type: "text",
                        value: part,
                    })
                }
            }

            // Replace the current node with the new nodes
            parent.children.splice(index, 1, ...newNodes)
            // @ts-ignore
            return [visit.SKIP, index + newNodes.length]
        })
    }
}

// Custom plugin to preserve line breaks like Obsidian does
function remarkPreserveLineBreaks() {
    return (tree: any) => {
        visit(tree, "paragraph", (node) => {
            // Process text nodes within paragraphs
            for (let i = 0; i < node.children.length - 1; i++) {
                const child = node.children[i]

                // If this is a text node and ends with a newline
                if (child.type === "text" && child.value.endsWith("\n")) {
                    // Insert a line break node after this text node
                    node.children.splice(i + 1, 0, {
                        type: "break",
                    })

                    // Remove the newline from the text node
                    child.value = child.value.replace(/\n$/, "")

                    // Skip the newly inserted node
                    i++
                }
            }
        })
    }
}

// Custom plugin to fix ordered lists rendering
function remarkFixOrderedLists() {
    return (tree: any) => {
        visit(tree, "listItem", (node) => {
            if (!node.children || node.children.length === 0) return

            // Check if this is an ordered list item
            if (node.ordered) {
                // Process the first paragraph in the list item
                const firstChild = node.children[0]
                if (firstChild.type === "paragraph" && firstChild.children) {
                    // Remove any break nodes that might be at the beginning
                    const children = firstChild.children
                    for (let i = 0; i < children.length; i++) {
                        if (children[i].type === "break" && i === 0) {
                            // Remove the break at the beginning of the list item
                            children.splice(i, 1)
                            i--
                        }
                    }
                }
            }
        })
    }
}

// Helper function to resolve image paths
function resolveImagePath(imagePath: string, options: ObsidianParserOptions): string {
    // Handle Pasted images
    if (imagePath.startsWith("Pasted image")) {
        return `/api/file?path=${encodeURIComponent(path.join(options.basePath, "img", imagePath))}`
    }

    // Handle relative paths
    if (!imagePath.startsWith("/") && !imagePath.startsWith("http")) {
        return `/api/file?path=${encodeURIComponent(path.join(options.basePath, imagePath))}`
    }

    return imagePath
}

// Parse Obsidian Markdown to HTML
export async function parseObsidianMarkdown(content: string, options: ObsidianParserOptions): Promise<string> {
    try {
        // Process the markdown to HTML
        const result = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkPreserveLineBreaks) // Add our custom plugin to preserve line breaks
            .use(remarkFixOrderedLists) // Fix ordered lists rendering
            .use(remarkObsidianImages, options)
            .use(remarkRehype, { allowDangerousHtml: true }) // Allow HTML to pass through
            .use(rehypeSanitize)
            .use(rehypeStringify)
            .process(content)

        // Post-process the HTML to fix any remaining list rendering issues
        let html = result.toString()

        // Fix any remaining issues with ordered lists by removing breaks after list markers
        html = html.replace(/<li><p>(\d+\.\s*)<br>/g, "<li><p>$1")

        return html
    } catch (error) {
        console.error("Error parsing Obsidian markdown:", error)
        return `<div class="error">Error parsing markdown: ${error instanceof Error ? error.message : String(error)}</div>`
    }
}

