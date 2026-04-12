// Root layout — delegates rendering to the locale-aware [locale] layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
