import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageHistoryComponent } from '../../components/message-history/message-history.component';
import { MessageInputComponent } from '../../components/message-input/message-input.component';
import { ChatMessage } from '../../components/message/message.component';

type Channel = {
  id: string;
  name: string;
  description: string;
  messages: ChatMessage[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MessageHistoryComponent, MessageInputComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  channels: Channel[] = [
    {
      id: 'global',
      name: 'global',
      description: 'Shared chat for everyone.',
      messages: []
    }
  ];

  selectedChannelId = this.channels[0].id;

  get selectedChannel(): Channel {
    return this.channels.find((channel) => channel.id === this.selectedChannelId) || this.channels[0];
  }

  selectChannel(channelId: string) {
    this.selectedChannelId = channelId;
  }

  addMessage(message: string) {
    this.selectedChannel.messages = [
      ...this.selectedChannel.messages,
      {
        author: 'You',
        time: 'Just now',
        body: message,
        isCurrentUser: true
      }
    ];
  }
}
