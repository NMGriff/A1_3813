import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageHistoryComponent } from '../../components/message-history/message-history.component';
import { MessageInputComponent } from '../../components/message-input/message-input.component';
import { ChatMessage } from '../../components/message/message.component';
import { AuthService } from '../../services/auth.service';
import { ChatChannel, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MessageHistoryComponent, MessageInputComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
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
  private messageCreatedSubscription?: Subscription;
  private channelCreatedSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadChannels();
    this.messageCreatedSubscription = this.chatService.onMessageCreated().subscribe(({ channelId, message }) => {
      this.addMessageToChannel(channelId, message);
    });
    this.channelCreatedSubscription = this.chatService.onChannelCreated().subscribe((channel) => {
      this.addChannel(channel);
    });
  }

  ngOnDestroy() {
    this.messageCreatedSubscription?.unsubscribe();
    this.channelCreatedSubscription?.unsubscribe();
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
        const requestedChannelId = this.route.snapshot.queryParamMap.get('channel');

        if (requestedChannelId && this.channels.some((channel) => channel.id === requestedChannelId)) {
          this.selectedChannelId = requestedChannelId;
        }

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
      next: () => {},
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

  private addMessageToChannel(channelId: string, message: ChatMessage) {
    const user = this.authService.getUser();
    const username = user?.valid ? user.username : '';

    this.channels = this.channels.map((channel) => {
      if (channel.id !== channelId || channel.messages.some((existingMessage) => existingMessage.id === message.id)) {
        return channel;
      }

      return {
        ...channel,
        messages: [
          ...channel.messages,
          {
            ...message,
            isCurrentUser: message.author === username
          }
        ]
      };
    });
  }

  private addChannel(channel: ChatChannel) {
    if (this.channels.some((existingChannel) => existingChannel.id === channel.id)) {
      return;
    }

    this.channels = [
      ...this.channels,
      {
        ...channel,
        messages: channel.messages || []
      }
    ];
  }
}
