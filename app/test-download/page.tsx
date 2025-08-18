"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export default function TestDownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false)

  const testFiles = [
    {
      name: "test-file.pdf",
      url: "/api/files/1/8/34/1755525416544_04-2025-3-03579312-Fee-Voucher.pdf",
      size: 52378
    }
  ]

  const handleDownload = async (file: any) => {
    setIsDownloading(true)
    try {
      console.log('Downloading file:', file)
      
      if (!file.url) {
        toast({
          title: "Error",
          description: "File URL is not available",
          variant: "destructive"
        })
        return
      }
      
      // Fetch the file
      const response = await fetch(file.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get the file blob
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download started",
        description: `${file.name} is being downloaded`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">File Download Test</h1>
      
      <div className="space-y-4">
        {testFiles.map((file, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-gray-500">Size: {file.size} bytes</p>
              <p className="text-sm text-gray-500">URL: {file.url}</p>
            </div>
            <Button 
              onClick={() => handleDownload(file)}
              disabled={isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-medium mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click the Download button above</li>
          <li>Check your browser's download folder</li>
          <li>The file should be downloaded with the correct name</li>
          <li>Check the browser console for any errors</li>
        </ol>
      </div>
    </div>
  )
} 