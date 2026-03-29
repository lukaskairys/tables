import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign in to TableTop</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in with your Google account to start planning game nights.
        </p>
        <div className="mt-8 flex justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
