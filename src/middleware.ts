import { NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = 5;
const rateLimiterStore = new Map();

async function customRateLimiter(ip: string, limit: number, duration: number) {
  const currentTime = Date.now();
  const resetTime = currentTime + duration * 60000;

  const requestCount = rateLimiterStore.get(ip) || { count: 0, resetTime };

  if (currentTime > requestCount.resetTime) {
    requestCount.count = 1;
    requestCount.resetTime = resetTime;
    rateLimiterStore.set(ip, requestCount);
    return { success: true, resetTime };
  }

  requestCount.count += 1;

  if (requestCount.count > limit) {
    return { success: false, resetTime: requestCount.resetTime };
  }

  rateLimiterStore.set(ip, requestCount);
  return { success: true, resetTime: requestCount.resetTime };
}

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
  try {
    const { success, resetTime } = await customRateLimiter(ip, RATE_LIMIT, 1);

    if (!success) {
      const resetIn = new Date(resetTime).toLocaleTimeString();
      return new NextResponse(
        `You have exceeded the rate limit. Try again after ${resetIn}.`
      );
    }

    return NextResponse.next();
  } catch (error) {
    return new NextResponse(
      "Sorry, something went wrong. Please try again later!"
    );
  }
}

export const config = {
  matcher: "/api/message/:path*",
};
