import { test as base, type APIRequestContext } from "@playwright/test";

export { expect } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE ?? "http://localhost:8000/api/v1";

function url(endpoint: string) {
  return `${API_BASE}/${endpoint.replace(/^\//, "")}`;
}

interface AuthedApi {
  get(endpoint: string): ReturnType<APIRequestContext["get"]>;
  post(endpoint: string, payload: Record<string, unknown>): ReturnType<APIRequestContext["post"]>;
  patch(endpoint: string, payload: Record<string, unknown>): ReturnType<APIRequestContext["patch"]>;
  delete(endpoint: string): ReturnType<APIRequestContext["delete"]>;
  /** POST to endpoint, returns the `id` of the created resource. */
  seed(endpoint: string, payload: Record<string, unknown>): Promise<number | string>;
  /** DELETE endpoint/:id/. */
  remove(endpoint: string, id: number | string): Promise<void>;
}

export const test = base.extend<{ api: AuthedApi }>({
  api: async ({ request }, use) => {
    const tokenRes = await request.post(`${API_BASE}/auth/token/`, {
      data: {
        username: process.env.E2E_USERNAME ?? "admin",
        password: process.env.E2E_PASSWORD ?? "admin",
      },
    });
    const { access } = await tokenRes.json();
    const headers = { Authorization: `Bearer ${access}` };

    const api: AuthedApi = {
      get: (endpoint) => request.get(url(endpoint), { headers }),
      post: (endpoint, payload) => request.post(url(endpoint), { data: payload, headers }),
      patch: (endpoint, payload) => request.patch(url(endpoint), { data: payload, headers }),
      delete: (endpoint) => request.delete(url(endpoint), { headers }),

      async seed(endpoint, payload) {
        const res = await request.post(url(endpoint), { data: payload, headers });
        const body = await res.json();
        return body.id;
      },

      async remove(endpoint, id) {
        await request.delete(`${url(endpoint)}/${id}/`, { headers });
      },
    };

    await use(api);
  },
});
