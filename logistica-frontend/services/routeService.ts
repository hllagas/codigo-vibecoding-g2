import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';
import type {
  Route,
  RouteCreate,
  RouteUpdate,
  RouteListParams,
  RouteStop,
  RouteStopCreate,
  RouteStopUpdate,
} from '@/types/route';
import type { PaginatedResponse } from '@/types/pagination';

export function listRoutes(params?: RouteListParams): Promise<PaginatedResponse<Route>> {
  return apiGet<PaginatedResponse<Route>>('/routes/', { params });
}

export function getRoute(id: number): Promise<Route> {
  return apiGet<Route>(`/routes/${id}/`);
}

export function createRoute(data: RouteCreate): Promise<Route> {
  return apiPost<Route>('/routes/', data);
}

export function updateRoute(id: number, data: RouteCreate): Promise<Route> {
  return apiPut<Route>(`/routes/${id}/`, data);
}

export function patchRoute(id: number, data: RouteUpdate): Promise<Route> {
  return apiPatch<Route>(`/routes/${id}/`, data);
}

export function deleteRoute(id: number): Promise<void> {
  return apiDelete<void>(`/routes/${id}/`);
}

export function listRouteStops(routeId: number): Promise<RouteStop[]> {
  return apiGet<RouteStop[]>(`/routes/${routeId}/stops/`);
}

export function createRouteStop(routeId: number, data: RouteStopCreate): Promise<RouteStop> {
  return apiPost<RouteStop>(`/routes/${routeId}/stops/`, data);
}

export function updateRouteStop(routeId: number, stopId: number, data: RouteStopCreate): Promise<RouteStop> {
  return apiPut<RouteStop>(`/routes/${routeId}/stops/${stopId}/`, data);
}

export function patchRouteStop(routeId: number, stopId: number, data: RouteStopUpdate): Promise<RouteStop> {
  return apiPatch<RouteStop>(`/routes/${routeId}/stops/${stopId}/`, data);
}

export function deleteRouteStop(routeId: number, stopId: number): Promise<void> {
  return apiDelete<void>(`/routes/${routeId}/stops/${stopId}/`);
}
