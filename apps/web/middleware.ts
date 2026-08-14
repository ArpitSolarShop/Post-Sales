import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    // Protect all API routes except auth endpoints
    "/api/projects/:path*",
    "/api/dashboard/:path*",
    "/api/discom/:path*",
    "/api/employees/:path*",
    "/api/net-meter/:path*",
    "/api/audit-logs/:path*",
  ]
};
