import { api } from "#/lib/eden";

export default async function HomePage() {
  // Simple GET request using Eden Treaty
  const { data, error } = await api.test.post();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Backend says:</h1>
      <p className="mt-4 p-4 bg-gray-100 rounded-lg text-xl">
        {data?.success ? "Success" : `Failure: ${error?.value}`}
      </p>
    </main>
  );
}
