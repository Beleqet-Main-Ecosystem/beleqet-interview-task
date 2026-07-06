-- ============================================================================
-- Migration: 20260706000000_global_payment_gateway
-- Task IDs:  Global-Payments-001 (Stripe) & Global-Payments-002 (PayPal)
-- Description:
--   Creates the `payments` table and supporting enums for the Beleqet
--   Global Payment Gateway module.
--
-- Design decisions:
--   - `provider_payment_id` has a UNIQUE constraint because Stripe pi_…
--     and PayPal order IDs are already globally unique within their namespace.
--   - `amount` is stored as INTEGER (smallest currency unit) for consistency
--     with Stripe's API; PayPal amounts are multiplied by 100 before insert.
--   - `currency` is VARCHAR(3) enforcing ISO 4217.
--   - `metadata` is JSONB for efficient querying of custom key-value pairs.
--   - All indexes are chosen to support:
--       1. User payment history (userId + createdAt)
--       2. Webhook event lookup (providerPaymentId)
--       3. Admin status dashboards (status + provider)
--       4. Multi-currency analytics (currency + status)
--
-- GDPR notes:
--   - No PII columns — userId is a UUID FK, metadata is pre-sanitised.
--   - ON DELETE CASCADE ensures user data is removed with user account.
-- ============================================================================

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "PaymentProvider" AS ENUM (
  'STRIPE',
  'PAYPAL'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED'
);

-- ─── payments table ──────────────────────────────────────────────────────────

CREATE TABLE "payments" (
  "id"                  UUID          NOT NULL DEFAULT gen_random_uuid(),
  "userId"              UUID          NOT NULL,
  "provider"            "PaymentProvider" NOT NULL,
  "providerPaymentId"   VARCHAR(255)  NOT NULL,
  "amount"              INTEGER       NOT NULL,
  "currency"            VARCHAR(3)    NOT NULL DEFAULT 'USD',
  "status"              "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "description"         TEXT,
  "metadata"            JSONB,
  "refundedAt"          TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payments_pkey"                    PRIMARY KEY ("id"),
  CONSTRAINT "payments_providerPaymentId_key"   UNIQUE ("providerPaymentId"),
  CONSTRAINT "payments_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- 1. User payment history — most common query (list my payments, newest first)
CREATE INDEX "payments_userId_createdAt_idx"
  ON "payments" ("userId", "createdAt" DESC);

-- 2. Webhook event processing — lookup by Stripe/PayPal ID
--    Already covered by the UNIQUE constraint, but explicit index for clarity:
CREATE INDEX "payments_providerPaymentId_idx"
  ON "payments" ("providerPaymentId");

-- 3. Admin dashboard — filter by status and provider
CREATE INDEX "payments_status_provider_idx"
  ON "payments" ("status", "provider");

-- 4. Multi-currency analytics — aggregate by currency
CREATE INDEX "payments_currency_status_idx"
  ON "payments" ("currency", "status");
