import { serverApi } from "#/lib/eden-server";
import { ClientApiTest } from "#/components/ClientApiTest";

export default async function HomePage() {
  // Use server API to forward user headers
  const response = await serverApi.test.post();
  const data = response.data as { success: boolean } | undefined;
  const error = response.error;

  // Debug info - shows what URLs are being used
  const debugInfo = {
    internalBackendUrl: process.env.INTERNAL_BACKEND_URL || "(not set)",
    publicBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "(not set)",
    isServer: typeof window === "undefined",
    nodeEnv: process.env.NODE_ENV,
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-black">
      <h1 className="text-4xl font-bold mb-8">API Testing</h1>

      <div className="p-6 bg-purple-50 rounded-lg w-full max-w-2xl mb-4">
        <h2 className="text-2xl font-semibold mb-4">
          🔧 Server-side API Call (POST /test)
        </h2>
        <div className="p-4 bg-white rounded-lg">
          {data?.success ? (
            <p className="text-green-600 text-lg font-semibold">✓ Success</p>
          ) : (
            <p className="text-red-600">
              ✗ Failure: {error ? JSON.stringify(error.value) : "Unknown error"}
            </p>
          )}
        </div>
      </div>

      <ClientApiTest />

      <div className="mt-8 p-6 bg-blue-50 rounded-lg w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">
          🔍 Debug Info (Server-side)
        </h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <span className="font-bold">INTERNAL_BACKEND_URL:</span>{" "}
            <span className="text-blue-600">
              {debugInfo.internalBackendUrl}
            </span>
          </div>
          <div>
            <span className="font-bold">NEXT_PUBLIC_BACKEND_URL:</span>{" "}
            <span className="text-blue-600">{debugInfo.publicBackendUrl}</span>
          </div>
          <div>
            <span className="font-bold">Is Server:</span>{" "}
            <span className="text-blue-600">{String(debugInfo.isServer)}</span>
          </div>
          <div>
            <span className="font-bold">NODE_ENV:</span>{" "}
            <span className="text-blue-600">{debugInfo.nodeEnv}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
