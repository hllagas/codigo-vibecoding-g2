import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api';
import type { Group, GroupCreate, GroupUpdate, Permission, User, UserCreate, UserUpdate } from '@/types/user';

// Users
export function listUsers(): Promise<User[]> {
  return apiGet<User[]>('/users/');
}

export function getUser(id: number): Promise<User> {
  return apiGet<User>(`/users/${id}/`);
}

export function createUser(data: UserCreate): Promise<User> {
  return apiPost<User>('/users/', data);
}

export function updateUser(id: number, data: UserUpdate): Promise<User> {
  return apiPatch<User>(`/users/${id}/`, data);
}

export function deleteUser(id: number): Promise<void> {
  return apiDelete<void>(`/users/${id}/`);
}

// Groups / Roles
export function listGroups(): Promise<Group[]> {
  return apiGet<Group[]>('/groups/');
}

export function createGroup(data: GroupCreate): Promise<Group> {
  return apiPost<Group>('/groups/', data);
}

export function updateGroup(id: number, data: GroupUpdate): Promise<Group> {
  return apiPut<Group>(`/groups/${id}/`, data);
}

export function deleteGroup(id: number): Promise<void> {
  return apiDelete<void>(`/groups/${id}/`);
}

// Permissions
export function listPermissions(): Promise<Permission[]> {
  return apiGet<Permission[]>('/permissions/');
}
