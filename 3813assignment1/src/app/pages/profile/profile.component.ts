import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthResponse } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

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
  errorMessage = '';
  //user: AuthResponse | null = null;

  constructor(
    private auth: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

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

  deleteMe() {
    if (!this.user) {
      return;
    }

    this.errorMessage = '';
    this.chatService.deleteUser(this.user.username, this.user.username).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/register']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to delete your account.';
      }
    });
  }
}
