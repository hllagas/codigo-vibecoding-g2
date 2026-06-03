export interface ContentType {
  app_label: string;
  model: string;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: ContentType;
}

export interface Group {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  groups: Group[];
  date_joined: string;
}

export interface UserCreate {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  is_active: boolean;
  is_superuser: boolean;
  group_ids: number[];
}

export interface UserUpdate {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  group_ids?: number[];
}

export interface GroupCreate {
  name: string;
  permission_ids: number[];
}

export interface GroupUpdate {
  name?: string;
  permission_ids?: number[];
}

export interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  groups: Group[];
  date_joined: string;
}
