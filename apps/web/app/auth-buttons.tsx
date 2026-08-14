"use client";

import { signIn, signOut } from "next-auth/react";

export function LoginButton() {
  return (
    <button 
      onClick={() => signIn()}
      className="btn btn-primary btn-sm"
    >
      Sign In
    </button>
  );
}

export function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn btn-secondary btn-sm"
    >
      Sign Out
    </button>
  );
}
