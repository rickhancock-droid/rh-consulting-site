import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "RH Consulting",
  description: "AI strategy and ROI calculators for modern businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-brand-ink bg-brand-bg">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

