import { Pool } from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ override: true });

const ca = process.env.DB_CA_CERT
  ? Buffer.from(process.env.DB_CA_CERT, "base64").toString("utf-8")
  : undefined;

const pool = new Pool({
  host: process.env.DB_HOST,

  port: Number(process.env.DB_PORT || 25060),
  database: process.env.DB_NAME,      // nome da instância gerenciada
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  ssl: ca
    ? {
        rejectUnauthorized: true,
        ca
      }
    : undefined,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool; 