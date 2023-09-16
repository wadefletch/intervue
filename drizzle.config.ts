import type { Config } from "drizzle-kit";
import "dotenv/config";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  breakpoints: true,
} satisfies Config;
