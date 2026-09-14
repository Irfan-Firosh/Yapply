export const readErrorDetail = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") {
      return body.detail;
    }
  } catch {
    // Non-JSON error body: fall back to the caller's message.
  }
  return fallback;
};
