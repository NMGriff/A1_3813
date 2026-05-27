import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../components/message/message.component';

export type ChatChannel = {
  id: string;
  name: string;
  description: string;
  messages: ChatMessage[];
};

export type CreateChannelRequest = {
  name: string;
  description: string;
};

export type MessageCreatedEvent = {
  channelId: string;
  message: ChatMessage;
};

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000/api';
  private socket: Socket = io('http://localhost:3000');

  constructor(private http: HttpClient) {}

  getChannels(): Observable<ChatChannel[]> {
    return this.http.get<ChatChannel[]>(`${this.apiUrl}/channels`);
  }

  createChannel(channel: CreateChannelRequest): Observable<ChatChannel> {
    return this.http.post<ChatChannel>(`${this.apiUrl}/channels`, channel);
  }

  sendMessage(channelId: string, author: string, body: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/channels/${channelId}/messages`, {
      author,
      body
    });
  }

  onMessageCreated(): Observable<MessageCreatedEvent> {
    return new Observable<MessageCreatedEvent>((subscriber) => {
      const handler = (event: MessageCreatedEvent) => subscriber.next(event);

      this.socket.on('message:created', handler);

      return () => {
        this.socket.off('message:created', handler);
      };
    });
  }

  onChannelCreated(): Observable<ChatChannel> {
    return new Observable<ChatChannel>((subscriber) => {
      const handler = (channel: ChatChannel) => subscriber.next(channel);

      this.socket.on('channel:created', handler);

      return () => {
        this.socket.off('channel:created', handler);
      };
    });
  }
}
