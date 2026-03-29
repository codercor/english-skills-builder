import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAuthConfigured } from "@/auth";

const protectedPrefixes = [
  "/home",
  "/onboarding",
  "/assessment",
  "/practice",
  "/review",
  "/progress",
  "/profile",
  "/league",
  "/ops",
];

type MiddlewareRequest = NextRequest & {
  auth?: unknown;
};

export default async function middleware(request: MiddlewareRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isAuthConfigured) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home/:path*",
    "/onboarding/:path*",
    "/assessment/:path*",
    "/practice/:path*",
    "/review/:path*",
    "/progress/:path*",
    "/profile/:path*",
    "/league/:path*",
    "/ops/:path*",
  ],
};
