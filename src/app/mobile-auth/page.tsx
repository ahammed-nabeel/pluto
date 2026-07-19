import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { Loader2 } from "lucide-react";

const JWT_SECRET = process.env.AUTH_SECRET || "fallback_secret_for_dev";

export default async function MobileAuthPage(props: { searchParams: Promise<{ provider?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  
  if (!session?.user?.email) {
    // If not logged in, trigger sign in for the requested provider
    if (searchParams.provider === 'google' || searchParams.provider === 'microsoft-entra-id') {
      await signIn(searchParams.provider, { redirectTo: "/mobile-auth" });
    } else {
      // Fallback to default login page if no provider specified
      redirect("/login");
    }
  }

  // User is logged in! Generate mobile token
  const token = jwt.sign(
    { 
      id: session.user.id, 
      email: session.user.email, 
      role: session.user.role 
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Redirect back to mobile app
  const deepLink = `pluto://auth?token=${token}`;
  
  // We use a client-side redirect to ensure the OS intercepts the custom scheme properly
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-6 p-6 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Authentication Successful</h1>
        <p className="text-slate-500">Returning you to the Pluto app...</p>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-slate-400 mb-3">Not redirecting automatically?</p>
        <a 
          href={deepLink} 
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          Return to App
        </a>
      </div>
      
      <script dangerouslySetInnerHTML={{ __html: `window.location.replace("${deepLink}");` }} />
    </div>
  );
}
