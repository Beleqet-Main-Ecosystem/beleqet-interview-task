import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = { title: "Pricing | Beleqet Jobs" };

export default function PricingPage() {
  return <PricingClient />;
}
