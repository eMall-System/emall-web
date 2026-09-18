import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import StyledComponentsRegistry from "@/lib/registry";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eMall Admin",
  description: "eMall Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <StyledComponentsRegistry>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
