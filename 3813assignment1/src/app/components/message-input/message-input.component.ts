import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.css'
})
export class MessageInputComponent {
  @Output() sendMessage = new EventEmitter<string>();

  message = '';

  send() {
    const message = this.message.trim();

    if (!message) return;

    this.sendMessage.emit(message);
    this.message = '';
  }
}
