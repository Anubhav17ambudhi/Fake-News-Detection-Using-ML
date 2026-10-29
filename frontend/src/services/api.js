// By default, relative URL '/api/v1/verify' uses the Vite dev proxy (target: http://127.0.0.1:8000)
// This avoids CORS issues entirely without modifying any backend code.
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function verifyArticle(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 20) {
    throw new Error(`Article too short. Please provide at least 20 words (currently ${words.length}).`);
  }

  const endpoint = `${API_BASE}/api/v1/verify`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  } catch (networkError) {
    throw new Error(
      'Unable to connect to backend server. Make sure FastAPI is running on http://127.0.0.1:8000 (run: uvicorn main:app --reload in the backend folder).'
    );
  }

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // ignore json parse error
    }

    if (response.status === 400) {
      throw new Error(`Validation Error: ${errorDetail}`);
    } else if (response.status === 504) {
      throw new Error(`Timeout Error: ${errorDetail}`);
    } else {
      throw new Error(errorDetail);
    }
  }

  const data = await response.json();
  return data;
}

export async function checkBackendConnection() {
  try {
    const res = await fetch(`${API_BASE}/docs`, { method: 'GET', mode: 'no-cors' });
    return true;
  } catch (err) {
    return false;
  }
}
