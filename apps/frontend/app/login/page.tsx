"use client";
import { authClient } from "#/lib/auth-client";

export default function LoginPage() {
    const handleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard" // Where to go after success
        });
    };

    return (
        <button onClick={handleLogin} className="p-2 bg-blue-500 text-white">
            Sign in with Google
        </button>
    );
}
