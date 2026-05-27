import { Component, Input } from '@angular/core';

export type ChatMessage = {
  id: number;
  author: string;
  time: string;
  body: string;
  createdAt: string;
  isCurrentUser?: boolean;
};

@Component({
  selector: 'app-message',
  standalone: true,
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent {
  @Input() message!: ChatMessage;
}
