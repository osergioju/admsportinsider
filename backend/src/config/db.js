import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false, // aceita o cert da DigitalOcean
  },
  family: 4, // 🔥 força IPv4 (evita ENETUNREACH)
});
