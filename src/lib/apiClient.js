// src/lib/apiClient.js

/**
 * fetch con manejo uniforme de errores. Si la sesión expiró, manda al login.
 */
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
  }

  if (!res.ok) {
    throw new Error(data?.error || 'No se pudo completar la operación');
  }

  return data;
}
