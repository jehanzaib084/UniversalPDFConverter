import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Image to PDF Converter - Convert Any Image to PDF Fast & Free",
  description:
    "Convert any image format (JPG, JPEG, PNG, WebP, GIF, etc.) into a single PDF document quickly and efficiently online. Free, fast, and easy to use.",
  metadataBase: new URL("https://universal-pdf-converter-yrj8.vercel.app/"), // IMPORTANT: Update this with your actual domain
  keywords: [
    "Image to PDF",
    "JPG to PDF",
    "JPEG to PDF",
    "PNG to PDF",
    "WebP to PDF",
    "GIF to PDF",
    "convert images to PDF",
    "online PDF converter",
    "free PDF tool",
    "any image to PDF",
    "fast image to pdf",
  ],
  openGraph: {
    title: "Image to PDF Converter - Convert Any Image to PDF Fast & Free",
    description:
      "Convert any image format (JPG, JPEG, PNG, WebP, GIF, etc.) into a single PDF document quickly and efficiently online. Free, fast, and easy to use.",
    url: "https://universal-pdf-converter-yrj8.vercel.app/", // IMPORTANT: Update this with your actual domain
    siteName: "Image to PDF Converter",
    images: [
      {
        url: "/placeholder.svg?height=630&width=1200", // Placeholder for an Open Graph image
        width: 1200,
        height: 630,
        alt: "Image to PDF Converter",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to PDF Converter - Convert Any Image to PDF Fast & Free",
    description:
      "Convert any image format (JPG, JPEG, PNG, WebP, GIF, etc.) into a single PDF document quickly and efficiently online. Free, fast, and easy to use.",
    images: ["/placeholder.svg?height=630&width=1200"], // Placeholder for Twitter card image
  },
  // --- Favicon and Icons Configuration ---
  icons: {
    icon: [
      { url: "/my_favicon/favicon.ico", sizes: "any" },
      { url: "/my_favicon/icon0.svg", type: "image/svg+xml" },
      { url: "/my_favicon/icon1.png", type: "image/png" },
    ],
    apple: "/my_favicon/apple-icon.png",
  },
  manifest: "/my_favicon/manifest.json",
  // -------------------------------------
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Schema Markup for SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Image to PDF Converter",
              operatingSystem: "Web",
              applicationCategory: "Multimedia",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9", // IMPORTANT: Update with actual rating if available
                reviewCount: "1500", // IMPORTANT: Update with actual review count if available
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Convert any image format (JPG, JPEG, PNG, WebP, GIF, etc.) into a single PDF document quickly and efficiently online. Free, fast, and easy to use.",
              url: "https://universal-pdf-converter-yrj8.vercel.app/", // IMPORTANT: Update this with your actual domain
              screenshot: "https://universal-pdf-converter-yrj8.vercel.app/placeholder.svg?height=630&width=1200", // IMPORTANT: Update with actual screenshot URL
              featureList: [
                "Convert JPG to PDF",
                "Convert PNG to PDF",
                "Convert WebP to PDF",
                "Convert GIF to PDF",
                "Convert any image to PDF",
                "Multiple image conversion",
                "Image reordering",
                "Client-side processing",
                "Fast conversion",
                "Free to use",
                "Online tool",
                "No watermarks",
                "Secure file handling",
              ],
            }),
          }}
        />
        {/* Additional favicon links for broader compatibility */}
        <link rel="icon" href="/my_favicon/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/my_favicon/icon0.svg" />
        <link rel="icon" type="image/png" href="/my_favicon/icon1.png" />
        <link rel="apple-touch-icon" href="/my_favicon/apple-icon.png" />
        <link rel="manifest" href="/my_favicon/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
