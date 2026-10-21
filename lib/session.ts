// Works in both middleware (Edge) and server code: uses Web Crypto only.
export const COOKIE = "beacon_session";
const enc = new TextEncoder();

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(process.env.SESSION_SECRET ?? ""),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(days = 7) {
  const exp = String(Date.now() + days * 864e5);
  return `${exp}.${await sign(exp)}`;
}

export async function verifySession(value?: string) {
  if (!value || !process.env.SESSION_SECRET) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await sign(exp);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
