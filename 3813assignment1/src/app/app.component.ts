import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'week4';
constructor(private auth: AuthService, private router: Router) {}

isLoggedIn(): boolean {
  return this.auth.isLoggedIn();
}

canUseAdminPage(): boolean {
  return this.auth.isGroupAdmin();
}

logout() {
  this.auth.logout();
  this.router.navigate(['/login']);
}

}

