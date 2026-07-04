"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "Free",
    desc: "Post a single job listing",
    features: ["1 job listing", "30 days visibility", "Standard placement"],
    cta: "Get Started Free",
  },
  {
    id: "featured",
    name: "Featured",
    price: "ETB 1,500",
    desc: "Get priority placement and more reach",
    features: ["5 job listings", "60 days visibility", "Featured badge", "Telegram channel boost"],
    highlight: true,
    cta: "Choose Featured",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    desc: "For high-volume hiring teams",
    features: ["Unlimited listings", "Dedicated account manager", "Employer branding page", "API access"],
    cta: "Contact Sales",
  },
];

export default function PricingClient() {
  const { user } = useAuth();
  const router = useRouter();

  function handlePlan(planId: string) {
    if (planId === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    if (user?.role === "EMPLOYER" || user?.role === "ADMIN") {
      router.push(`/post-job?plan=${planId}`);
      return;
    }

    if (user?.role === "JOB_SEEKER") {
      router.push("/dashboard");
      return;
    }

    router.push(`/register?role=EMPLOYER&plan=${planId}`);
  }

  return (
    <div className="container-page py-16">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-pageH1">Simple pricing for employers</h1>
        <p className="text-muted mt-3">
          Choose a plan that fits your hiring needs and start reaching qualified candidates today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-7 flex flex-col ${
              plan.highlight ? "border-brandGreen bg-brandGreen text-white shadow-cardHover" : "border-border bg-white"
            }`}
          >
            <h3 className={`text-sm font-semibold ${plan.highlight ? "text-white/80" : "text-muted"}`}>
              {plan.name}
            </h3>
            <p className="text-3xl font-extrabold mt-2">{plan.price}</p>
            <p className={`text-sm mt-2 ${plan.highlight ? "text-white/70" : "text-muted"}`}>{plan.desc}</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-white" : "text-brandGreen"}`} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handlePlan(plan.id)}
              className={`mt-7 w-full rounded-full py-3 text-sm font-semibold transition-colors ${
                plan.highlight
                  ? "bg-white text-brandGreen hover:bg-white/90"
                  : "bg-brandGreen text-white hover:bg-darkGreen"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted mt-10">
        Already have an account?{" "}
        <Link href="/login" className="text-brandGreen font-semibold hover:underline">
          Sign in
        </Link>{" "}
        or{" "}
        <Link href="/post-job" className="text-brandGreen font-semibold hover:underline">
          post a job
        </Link>
        .
      </p>
    </div>
  );
}
