import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMsg = '';

   constructor(private router: Router, private auth: AuthService) {}

   login() {
    
    this.errorMsg = '';

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.valid) {
          this.auth.saveUser(res);         
          this.router.navigate(['/profile']); 
        } else {
          this.errorMsg = 'Invalid email or password';
        }
      },
      error: () => {
        this.errorMsg = 'Server error: could not reach API';
      }
    });
  }
}
