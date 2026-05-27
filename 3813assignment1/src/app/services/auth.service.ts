import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AuthResponse =
  | { valid: false }
  | { valid: true; username: string; birthdate: string; age: number; email: string };

export type RegisterUser = {
  username: string;
  birthdate: string;
  age: number | null;
  email: string;
  password: string;
};

  
@Injectable({
  providedIn: 'root'
})
export class AuthService {
private key = 'currentUser';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:3000/api/auth', { email, password });
  }

  register(user: RegisterUser): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:3000/api/register', user);
  }

  saveUser(user: AuthResponse) {
    if (user.valid) localStorage.setItem(this.key, JSON.stringify(user));
  }

  getUser(): AuthResponse | null {
    const raw = localStorage.getItem(this.key);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;   
  }

  isLoggedIn(): boolean {
    const user = this.getUser();
    return !!(user && user.valid);
  }

  logout() {
    localStorage.removeItem(this.key);
  }
}
