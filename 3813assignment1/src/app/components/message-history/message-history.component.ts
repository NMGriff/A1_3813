import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, MessageComponent } from '../message/message.component';

@Component({
  selector: 'app-message-history',
  standalone: true,
  imports: [CommonModule, MessageComponent],
  templateUrl: './message-history.component.html',
  styleUrl: './message-history.component.css'
})
export class MessageHistoryComponent implements AfterViewChecked, AfterViewInit, OnChanges {
  @Input() messages: ChatMessage[] = [];
  @ViewChild('messageHistory') messageHistory?: ElementRef<HTMLElement>;

  private shouldScrollToBottom = true;

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    if (!this.shouldScrollToBottom) return;

    this.scrollToBottom();
    this.shouldScrollToBottom = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['messages']) {
      this.shouldScrollToBottom = true;
    }
  }

  private scrollToBottom() {
    const messageHistory = this.messageHistory?.nativeElement;

    if (!messageHistory) return;

    messageHistory.scrollTop = messageHistory.scrollHeight;
  }
}
