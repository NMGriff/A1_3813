import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthSession, User } from '../models/user';
import { Role } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }
}
