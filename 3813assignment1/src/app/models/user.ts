import { Role } from "./role";

export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    roles: Role[];
    groups: string[];
}

export interface AuthSession {
  token: string;
  user: User;
}