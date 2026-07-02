import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

export const metadata: Metadata = {
  title: "Beleqet Jobs | Find Your Next Opportunity Faster",
  description:
    "Search verified jobs from trusted employers across Ethiopia. Discover thousands of job opportunities, get instant alerts on Telegram, and apply faster with Beleqet Vacancy Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <Header />
          <EmailVerificationBanner />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
