"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "adidevjj@gmail.com";
const GITHUB_URL = "https://github.com/adikyochan/realtime-collab-task-manager";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">

      {/* Navbar */}
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900 tracking-tight">
          RealTasks
        </span>
        <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="bg-gray-900 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-xl">
          Sign in
        </Button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg space-y-6">

          {/* Logo mark */}
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 tracking-tight">
              RealTasks
            </h1>
            <p className="text-base text-gray-500 leading-relaxed max-w-sm mx-auto">
              A real-time collaborative task manager. Create tasks, assign them
              to teammates, and watch updates happen instantly.
            </p>
          </div>

          {/* Features row */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Real-time updates
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Task assignment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Google sign in
            </span>
          </div>

          {/* CTA */}
          <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="bg-gray-900 hover:bg-gray-700 text-white px-8 py-5 rounded-xl text-sm font-medium flex items-center gap-3 mx-auto">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-xs text-gray-400">
            New here? Your account is created automatically on first sign in.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>{"© " + new Date().getFullYear() + " RealTasks"}</span>
          <span className="text-gray-200">{"—"}</span>
          <a href={"mailto:" + CONTACT_EMAIL} className="hover:text-gray-600 transition-colors">
            {CONTACT_EMAIL}
          </a>
        </div>

        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          {"View on GitHub"}
        </a>
      </footer>
    </div>
  );
}