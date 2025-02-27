import type React from "react"
import type { Metadata } from "next"
import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import "./globals.css"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Abanza",
  description: "Image generator for Abanza",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="flex h-full flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-lg font-semibold">Image Generator</h1>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
                {children}
                <Toaster />

              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}