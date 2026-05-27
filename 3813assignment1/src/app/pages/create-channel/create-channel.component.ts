import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-channel.component.html',
  styleUrl: './create-channel.component.css'
})
export class CreateChannelComponent {
  name = '';
  description = '';
  isSaving = false;
  errorMessage = '';

  constructor(
    private chatService: ChatService,
    private router: Router
  ) {}

  createChannel() {
    const name = this.name.trim();
    const description = this.description.trim();

    this.errorMessage = '';

    if (!name) {
      this.errorMessage = 'Channel name is required.';
      return;
    }

    this.isSaving = true;

    this.chatService.createChannel({ name, description }).subscribe({
      next: (channel) => {
        this.router.navigate(['/'], { queryParams: { channel: channel.id } });
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to create channel.';
        this.isSaving = false;
      }
    });
  }
}
