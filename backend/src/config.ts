function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  isProduction: process.env.NODE_ENV === "production",
  jwtSecret: required("JWT_SECRET"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};
