import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  username = '';
  birthdate = '';
  age: number | null = null;
  email = '';
  password = '';
  confirmPassword = '';
  errorMsg = '';

  constructor(private router: Router, private auth: AuthService) {}

  register() {
    this.errorMsg = '';

    if (this.password !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match';
      return;
    }

    this.auth.register({
      username: this.username,
      birthdate: this.birthdate,
      age: this.age,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        if (res.valid) {
          this.auth.saveUser(res);
          this.router.navigate(['/profile']);
        } else {
          this.errorMsg = 'Registration failed';
        }
      },
      error: () => {
        this.errorMsg = 'Server error: could not reach API';
      }
    });
  }
}
