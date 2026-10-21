import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

export async function middleware(req: NextRequest) {
  if (await verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/dashboard/:path*"] };
