import { Component, Input } from '@angular/core';

export type ChatMessage = {
  author: string;
  time: string;
  body: string;
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
