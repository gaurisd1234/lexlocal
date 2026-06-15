import type { Metadata } from 'next'
import { Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'

const marathi = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600'],
  variable: '--font-marathi',
})

export const metadata: Metadata = {
  title: 'LexLocal — AI Rural Legal Assistant',
  description: 'आपल्या हक्कांची भाषा',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="mr">
      <body className={`${marathi.variable} font-sans`}>
        {children}
        </body>
    </html>
  )
}