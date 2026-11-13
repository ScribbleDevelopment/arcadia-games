import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const productionOrigins = [
  "https://v0-arcadia-games.vercel.app",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
].filter((origin): origin is string => Boolean(origin))

const trustedOrigins = [
  ...(process.env.NODE_ENV === "development"
    ? [
        "http://localhost:3000",
        process.env.V0_RUNTIME_URL,
        process.env.V0_DEV_APP_URL,
        process.env.V0_BUILD_URL,
        process.env.V0_SANDBOX_URL,
      ]
    : productionOrigins),
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL ?? "http://localhost:3000"),
  trustedOrigins,
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        },
      }
    : {}),
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
