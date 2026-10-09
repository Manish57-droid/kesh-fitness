import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();
  return updateSession(request);
}

// Only admin pages need the session; the public site stays fully static.
export const config = { matcher: ["/admin/:path*"] };
