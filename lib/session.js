import { createHmac, createHash, timingSafeEqual, randomBytes } from "crypto";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest();
}

export function passwordsMatch(input, expected) {
  return timingSafeEqual(digest(input), digest(expected));
}

export function sign(payload) {
  const secret = required("SESSION_SECRET");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verify(token) {
  if (!token || !token.includes(".")) return null;
  const secret = required("SESSION_SECRET");
  const [body, mac] = token.split(".");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!timingSafeEqual(digest(mac), digest(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newSession() {
  return sign({
    sub: "operator",
    nonce: randomBytes(16).toString("base64url"),
    exp: Date.now() + 12 * 60 * 60 * 1000,
  });
}
