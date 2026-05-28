import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ChatGroup, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-create-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-channel.component.html',
  styleUrl: './create-channel.component.css'
})
export class CreateChannelComponent implements OnInit {
  groups: ChatGroup[] = [];
  selectedGroupId = '';
  name = '';
  description = '';
  isSaving = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();

    if (!user?.valid) {
      return;
    }

    this.chatService.getGroups(user.username).subscribe({
      next: (groups) => {
        this.groups = groups.filter((group) => group.canManage);
        this.selectedGroupId = this.groups[0]?.id || '';
      },
      error: () => {
        this.errorMessage = 'Unable to load groups.';
      }
    });
  }

  createChannel() {
    const user = this.authService.getUser();
    const name = this.name.trim();
    const description = this.description.trim();

    this.errorMessage = '';

    if (!user?.valid) {
      this.errorMessage = 'You must be logged in.';
      return;
    }

    if (!this.selectedGroupId) {
      this.errorMessage = 'Select a group first.';
      return;
    }

    if (!name) {
      this.errorMessage = 'Channel name is required.';
      return;
    }

    this.isSaving = true;

    this.chatService.createChannel({
      actingUsername: user.username,
      groupId: this.selectedGroupId,
      name,
      description
    }).subscribe({
      next: (channel) => {
        this.router.navigate(['/'], { queryParams: { channel: `${channel.groupId}/${channel.id}` } });
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to create channel.';
        this.isSaving = false;
      }
    });
  }
}
