import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true });

const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4
});

export default db;
