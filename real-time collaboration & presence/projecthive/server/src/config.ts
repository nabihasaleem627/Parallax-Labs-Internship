import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'projecthive-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  dbPath: process.env.DB_PATH ?? new URL('../data/db.json', import.meta.url).pathname,
  persist: process.env.PERSIST !== 'false',
  clientOrigin: process.env.CLIENT_ORIGIN ?? '*',
};
