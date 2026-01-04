"use client";

import { api } from "#/lib/eden";
import { useEffect, useState } from "react";

export function ClientApiTest() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await api.post();
        if (data) {
          setData(data as string);
        } else if (error) {
          setError(String(error.value));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mt-8 p-6 bg-green-50 rounded-lg w-full max-w-2xl">
      <h2 className="text-2xl font-semibold mb-4">
        🌐 Client-side API Call (POST /)
      </h2>
      <div className="p-4 bg-white rounded-lg">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : (
          <p className="text-lg">{data}</p>
        )}
      </div>
    </div>
  );
}
