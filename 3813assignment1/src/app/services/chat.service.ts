import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../components/message/message.component';

export type ChatChannel = {
  id: string;
  name: string;
  description: string;
  messages: ChatMessage[];
};

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getChannels(): Observable<ChatChannel[]> {
    return this.http.get<ChatChannel[]>(`${this.apiUrl}/channels`);
  }

  sendMessage(channelId: string, author: string, body: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/channels/${channelId}/messages`, {
      author,
      body
    });
  }
}
