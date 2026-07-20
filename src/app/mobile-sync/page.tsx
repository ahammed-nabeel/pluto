"use client"

import { signIn } from "next-auth/react"
import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function SyncContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  useEffect(() => {
    if (token) {
      // Authenticate with the custom mobile-token provider
      signIn("mobile-token", { 
        token, 
        callbackUrl: "/dashboard",
        redirect: true 
      })
    } else {
      // If no token, redirect to normal login
      window.location.href = "/login"
    }
  }, [token])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="text-sm text-gray-500 font-medium">Syncing profile...</p>
      </div>
    </div>
  )
}

export default function MobileSyncPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SyncContent />
    </Suspense>
  )
}
