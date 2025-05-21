"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ContentDisplayProps {
  messages: Message[]
}

export default function ContentDisplay({ messages }: ContentDisplayProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [content, setContent] = useState<{
    text: string[]
    code: string[]
    images: string[]
    html: string[]
  }>({
    text: [],
    code: [],
    images: [],
    html: [],
  })

  // Parse messages to extract different content types
  useEffect(() => {
    const extractedContent = {
      text: [] as string[],
      code: [] as string[],
      images: [] as string[],
      html: [] as string[],
    }

    messages.forEach((message) => {
      if (message.role === "assistant") {
        // Extract code blocks
        const codeRegex = /```(?:[\w-]+)?\n([\s\S]*?)```/g
        let codeMatch
        while ((codeMatch = codeRegex.exec(message.content)) !== null) {
          extractedContent.code.push(codeMatch[1])
        }

        // Extract image URLs
        const imageRegex = /!\[.*?\]$$(.*?)$$/g
        let imageMatch
        while ((imageMatch = imageRegex.exec(message.content)) !== null) {
          extractedContent.images.push(imageMatch[1])
        }

        // Extract HTML blocks
        const htmlRegex = /<html>([\s\S]*?)<\/html>/g
        let htmlMatch
        while ((htmlMatch = htmlRegex.exec(message.content)) !== null) {
          extractedContent.html.push(htmlMatch[1])
        }

        // Add the plain text (without code blocks)
        const plainText = message.content.replace(codeRegex, "").replace(imageRegex, "").replace(htmlRegex, "").trim()

        if (plainText) {
          extractedContent.text.push(plainText)
        }
      }
    })

    setContent(extractedContent)
  }, [messages])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {content.text.length === 0 &&
          content.code.length === 0 &&
          content.images.length === 0 &&
          content.html.length === 0 ? (
            <div className="text-center p-4">
              <p>No content to display yet. Start a conversation with the AI assistant.</p>
            </div>
          ) : (
            <>
              {content.text.map((text, index) => (
                <Card key={`text-${index}`}>
                  <CardContent className="p-4">
                    <div className="whitespace-pre-wrap">{text}</div>
                  </CardContent>
                </Card>
              ))}

              {content.code.map((code, index) => (
                <Card key={`code-${index}`}>
                  <CardContent className="p-4">
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                  </CardContent>
                </Card>
              ))}

              {content.images.map((image, index) => (
                <Card key={`image-${index}`}>
                  <CardContent className="p-4">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Content ${index}`}
                      className="max-w-full h-auto rounded-md"
                    />
                  </CardContent>
                </Card>
              ))}

              {content.html.map((html, index) => (
                <Card key={`html-${index}`}>
                  <CardContent className="p-4">
                    <div className="border rounded-md p-4">
                      <iframe
                        srcDoc={html}
                        title={`HTML Content ${index}`}
                        className="w-full h-[300px] border-0"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="text" className="space-y-4 mt-4">
          {content.text.length === 0 ? (
            <div className="text-center p-4">
              <p>No text content to display yet.</p>
            </div>
          ) : (
            content.text.map((text, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap">{text}</div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-4">
          {content.code.length === 0 ? (
            <div className="text-center p-4">
              <p>No code content to display yet.</p>
            </div>
          ) : (
            content.code.map((code, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                    <code>{code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-4 mt-4">
          {content.images.length === 0 ? (
            <div className="text-center p-4">
              <p>No image content to display yet.</p>
            </div>
          ) : (
            content.images.map((image, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Content ${index}`}
                    className="max-w-full h-auto rounded-md"
                  />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="html" className="space-y-4 mt-4">
          {content.html.length === 0 ? (
            <div className="text-center p-4">
              <p>No HTML content to display yet.</p>
            </div>
          ) : (
            content.html.map((html, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="border rounded-md p-4">
                    <iframe
                      srcDoc={html}
                      title={`HTML Content ${index}`}
                      className="w-full h-[300px] border-0"
                      sandbox="allow-scripts"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
