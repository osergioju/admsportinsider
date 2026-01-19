import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true }); // 🔥 força usar o .env

const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  family: 4,
});

export default db;
