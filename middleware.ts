import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ambil sesi user yang sedang aktif
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 1. Jika BELUM LOGIN dan mencoba akses area privat (/home atau /founder)
  if (!user && (path.startsWith("/home") || path.startsWith("/founder"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Jika SUDAH LOGIN, cek role khusus untuk rute /founder
  if (user && path.startsWith("/founder")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role?.toLowerCase() || "member";
    const isAuthorized = role === "founder" || role === "admin" || role === "staff";

    // Jika bukan founder/staff tapi nekat akses /founder, lempar balik ke /home
    if (!isAuthorized) {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

// Konfigurasi rute yang dipantau oleh middleware
export const config = {
  matcher: [
    /*
     * Melindungi semua rute kecuali file statis, favicon, dan halaman utama publik (/)
     */
    "/((?!_next/static|_next/image|favicon.ico|^/$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};