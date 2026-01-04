import { getServerApi } from "#/lib/eden";

export default async function HomePage() {
  // Use server API to forward user headers
  const api = await getServerApi();
  const { data, error } = await api.test.post();

  // Debug info - shows what URLs are being used
  const debugInfo = {
    internalBackendUrl: process.env.INTERNAL_BACKEND_URL || "(not set)",
    publicBackendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "(not set)",
    isServer: typeof window === "undefined",
    nodeEnv: process.env.NODE_ENV,
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold">Backend says:</h1>
      <p className="mt-4 p-4 bg-gray-100 rounded-lg text-xl">
        {data?.success ? "Success" : `Failure: ${error?.value}`}
      </p>

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
