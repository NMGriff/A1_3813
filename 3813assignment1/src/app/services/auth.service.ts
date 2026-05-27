import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AuthResponse =
  | { valid: false }
  | { valid: true; username: string; birthdate: string; age: number; email: string };

  
@Injectable({
  providedIn: 'root'
})
export class AuthService {
private key = 'currentUser';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('http://localhost:3000/api/auth', { email, password });
  }

  saveUser(user: AuthResponse) {
    if (user.valid) localStorage.setItem(this.key, JSON.stringify(user));
  }

  getUser(): AuthResponse | null {
    const raw = localStorage.getItem(this.key);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;   
  }

  logout() {
    localStorage.removeItem(this.key);
  }
}
