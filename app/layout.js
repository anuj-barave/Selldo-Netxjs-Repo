import './globals.css'

export const metadata = {
  title: 'Sell.do',
  description: 'A focused CRM workspace for modern sales teams.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}