export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(isFormData ? {} : { "Content-Type": "application/json" }), ...options.headers },
  });
  const body: { success: boolean; data?: T; error?: { message: string } } = await response.json();
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error?.message ?? "Request failed.");
  }
  return body.data;
}
