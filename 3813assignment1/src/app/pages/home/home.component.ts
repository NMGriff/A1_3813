import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageHistoryComponent } from '../../components/message-history/message-history.component';
import { MessageInputComponent } from '../../components/message-input/message-input.component';
import { ChatMessage } from '../../components/message/message.component';
import { AuthService } from '../../services/auth.service';
import { ChatChannel, ChatGroup, ChatService } from '../../services/chat.service';

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
      id: 'general',
      groupId: 'global',
      groupName: 'Global',
      name: 'general',
      description: 'Shared chat for everyone.',
      bannedUsernames: [],
      messages: []
    }
  ];

  selectedChannelId = this.channelKey(this.channels[0]);
  groups: ChatGroup[] = [];
  isLoading = false;
  errorMessage = '';
  groupMessage = '';
  private messageCreatedSubscription?: Subscription;
  private channelCreatedSubscription?: Subscription;
  private groupsChangedSubscription?: Subscription;

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
    this.groupsChangedSubscription = this.chatService.onGroupsChanged().subscribe(() => {
      this.loadGroups();
      this.loadChannels();
    });
  }

  ngOnDestroy() {
    this.messageCreatedSubscription?.unsubscribe();
    this.channelCreatedSubscription?.unsubscribe();
    this.groupsChangedSubscription?.unsubscribe();
  }

  get selectedChannel(): ChatChannel {
    return this.channels.find((channel) => this.channelKey(channel) === this.selectedChannelId) || this.channels[0];
  }

  channelKey(channel: ChatChannel): string {
    return `${channel.groupId}/${channel.id}`;
  }

  selectChannel(channel: ChatChannel) {
    this.selectedChannelId = this.channelKey(channel);
  }

  loadChannels() {
    const user = this.authService.getUser();
    const username = user?.valid ? user.username : '';

    this.isLoading = true;
    this.errorMessage = '';

    this.chatService.getChannels(username).subscribe({
      next: (channels) => {
        this.channels = this.addCurrentUserFlags(channels);
        const requestedChannelId = this.route.snapshot.queryParamMap.get('channel');

        if (requestedChannelId && this.channels.some((channel) => this.channelKey(channel) === requestedChannelId)) {
          this.selectedChannelId = requestedChannelId;
        }

        this.isLoading = false;

        if (!this.channels.some((channel) => this.channelKey(channel) === this.selectedChannelId)) {
          this.selectedChannelId = this.channels[0] ? this.channelKey(this.channels[0]) : 'global/general';
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load chat messages.';
        this.isLoading = false;
      }
    });

    this.loadGroups();
  }

  loadGroups() {
    const user = this.authService.getUser();
    const username = user?.valid ? user.username : '';

    this.chatService.getGroups(username).subscribe({
      next: (groups) => {
        this.groups = groups;
      },
      error: () => {
        this.groupMessage = 'Unable to load groups.';
      }
    });
  }

  addMessage(message: string) {
    const user = this.authService.getUser();
    const author = user?.valid ? user.username : 'Guest';
    const channel = this.selectedChannel;

    this.errorMessage = '';

    this.chatService.sendMessage(channel.groupId, channel.id, author, message).subscribe({
      next: () => {},
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to send message.';
      }
    });
  }

  requestGroupAccess(group: ChatGroup) {
    const user = this.authService.getUser();

    if (!user?.valid) {
      return;
    }

    this.groupMessage = '';
    this.chatService.registerGroupInterest(user.username, group.id).subscribe({
      next: () => {
        this.groupMessage = `Interest registered for ${group.name}.`;
        this.loadGroups();
      },
      error: (error) => {
        this.groupMessage = error?.error?.error || 'Unable to register interest.';
      }
    });
  }

  leaveGroup(group: ChatGroup) {
    const user = this.authService.getUser();

    if (!user?.valid) {
      return;
    }

    this.groupMessage = '';
    this.chatService.removeGroupMember(user.username, group.id, user.username).subscribe({
      next: () => {
        this.groupMessage = `You left ${group.name}.`;
        this.loadChannels();
      },
      error: (error) => {
        this.groupMessage = error?.error?.error || 'Unable to leave group.';
      }
    });
  }

  canCreateChannels(): boolean {
    return this.authService.isGroupAdmin();
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
    if (this.channels.some((existingChannel) => this.channelKey(existingChannel) === this.channelKey(channel))) {
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
