"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, MapPin, Send } from "lucide-react";
import { api } from "@/lib/api";

function ContactForm() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    plan === "enterprise"
      ? "I'm interested in the Beleqet Enterprise hiring plan for our organization."
      : ""
  );

  return (
    <div className="container-page py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <h1 className="text-pageH1">Get in touch</h1>
        <p className="text-muted mt-4 leading-relaxed">
          Have a question about a job listing, your account, or partnering with Beleqet? Send us a message and our
          team will get back to you.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 text-sm text-ink">
            <MapPin className="h-4 w-4 text-brandGreen" /> Addis Ababa, Ethiopia
          </div>
          <div className="flex items-center gap-3 text-sm text-ink">
            <Mail className="h-4 w-4 text-brandGreen" /> support@beleqet.com
          </div>
          <div className="flex items-center gap-3 text-sm text-ink">
            <Send className="h-4 w-4 text-brandGreen" /> Beleqet Telegram Channel
          </div>
        </div>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          try {
            await api.submitContact({
              fullName,
              email,
              message,
              plan: plan ?? undefined,
            });
            setSubmitted(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message");
          } finally {
            setLoading(false);
          }
        }}
        className="rounded-2xl border border-border bg-white p-7 space-y-4"
      >
        {submitted ? (
          <p className="text-sm text-brandGreen font-semibold">Thanks — your message has been sent.</p>
        ) : (
          <>
            {error && (
              <p className="text-sm text-redAccent bg-redAccent/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
              <label className="text-xs font-semibold text-ink">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send Message"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-muted">Loading…</div>}>
      <ContactForm />
    </Suspense>
  );
}
