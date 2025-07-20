import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./global.css"
import { Web3Provider } from "@/components/providers/web3-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DecentralizedOrganMatch - Blockchain Organ Donation Platform",
  description: "Secure, transparent organ donor-recipient matching platform powered by blockchain technology",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  )
}
