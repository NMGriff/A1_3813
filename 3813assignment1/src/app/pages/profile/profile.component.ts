import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

type ValidUser = Extract<AuthResponse, { valid: true }>; 


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: ValidUser | null = null;
  //user: AuthResponse | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const u = this.auth.getUser();
    this.user = u && u.valid ? u : null;
    //this.user = this.auth.getUser();
  }

  save() {
    if (this.user) {
      localStorage.setItem('currentUser', JSON.stringify(this.user));
      alert('Profile saved');
    }
  }
}
