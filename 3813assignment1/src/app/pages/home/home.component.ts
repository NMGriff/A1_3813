import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageHistoryComponent } from '../../components/message-history/message-history.component';
import { MessageInputComponent } from '../../components/message-input/message-input.component';
import { ChatMessage } from '../../components/message/message.component';
import { AuthService } from '../../services/auth.service';
import { ChatChannel, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MessageHistoryComponent, MessageInputComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  channels: ChatChannel[] = [
    {
      id: 'global',
      name: 'global',
      description: 'Shared chat for everyone.',
      messages: []
    }
  ];

  selectedChannelId = this.channels[0].id;
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.loadChannels();
  }

  get selectedChannel(): ChatChannel {
    return this.channels.find((channel) => channel.id === this.selectedChannelId) || this.channels[0];
  }

  selectChannel(channelId: string) {
    this.selectedChannelId = channelId;
  }

  loadChannels() {
    this.isLoading = true;
    this.errorMessage = '';

    this.chatService.getChannels().subscribe({
      next: (channels) => {
        this.channels = this.addCurrentUserFlags(channels);
        this.isLoading = false;

        if (!this.channels.some((channel) => channel.id === this.selectedChannelId)) {
          this.selectedChannelId = this.channels[0]?.id || 'global';
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load chat messages.';
        this.isLoading = false;
      }
    });
  }

  addMessage(message: string) {
    const user = this.authService.getUser();
    const author = user?.valid ? user.username : 'Guest';
    const channelId = this.selectedChannel.id;

    this.errorMessage = '';

    this.chatService.sendMessage(channelId, author, message).subscribe({
      next: (savedMessage) => {
        this.channels = this.channels.map((channel) => {
          if (channel.id !== channelId) return channel;

          return {
            ...channel,
            messages: [
              ...channel.messages,
              {
                ...savedMessage,
                isCurrentUser: true
              }
            ]
          };
        });
      },
      error: () => {
        this.errorMessage = 'Unable to send message.';
      }
    });
  }

  private addCurrentUserFlags(channels: ChatChannel[]): ChatChannel[] {
    const user = this.authService.getUser();
    const username = user?.valid ? user.username : '';

    return channels.map((channel) => ({
      ...channel,
      messages: channel.messages.map((message: ChatMessage) => ({
        ...message,
        isCurrentUser: message.author === username
      }))
    }));
  }
}
