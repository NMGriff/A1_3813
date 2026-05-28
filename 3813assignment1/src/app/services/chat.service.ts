import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '../components/message/message.component';
import { UserRole } from './auth.service';

export type ChatChannel = {
  id: string;
  groupId: string;
  groupName: string;
  name: string;
  description: string;
  bannedUsernames: string[];
  messages: ChatMessage[];
};

export type CreateChannelRequest = {
  actingUsername: string;
  groupId: string;
  name: string;
  description: string;
};

export type ChatUser = {
  username: string;
  birthdate: string;
  age: number;
  email: string;
  role: UserRole;
  valid: true;
};

export type ChatGroup = {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  memberUsernames: string[];
  pendingUsernames: string[];
  isMember: boolean;
  isPending: boolean;
  canManage: boolean;
  channels: ChatChannel[];
};

export type CreateGroupRequest = {
  actingUsername: string;
  name: string;
  description: string;
};

export type MessageCreatedEvent = {
  groupId: string;
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

  getChannels(username: string): Observable<ChatChannel[]> {
    return this.http.get<ChatChannel[]>(`${this.apiUrl}/channels`, {
      params: { username }
    });
  }

  createChannel(channel: CreateChannelRequest): Observable<ChatChannel> {
    return this.http.post<ChatChannel>(`${this.apiUrl}/channels`, channel);
  }

  sendMessage(groupId: string, channelId: string, author: string, body: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/groups/${groupId}/channels/${channelId}/messages`, {
      author,
      body
    });
  }

  getUsers(username: string): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.apiUrl}/users`, {
      params: { username }
    });
  }

  changeUserRole(actingUsername: string, username: string, role: UserRole): Observable<ChatUser> {
    return this.http.post<ChatUser>(`${this.apiUrl}/users/${username}/role`, {
      actingUsername,
      role
    });
  }

  deleteUser(actingUsername: string, username: string): Observable<{ valid: boolean }> {
    return this.http.delete<{ valid: boolean }>(`${this.apiUrl}/users/${username}`, {
      params: { actingUsername }
    });
  }

  getGroups(username: string): Observable<ChatGroup[]> {
    return this.http.get<ChatGroup[]>(`${this.apiUrl}/groups`, {
      params: { username }
    });
  }

  createGroup(group: CreateGroupRequest): Observable<ChatGroup> {
    return this.http.post<ChatGroup>(`${this.apiUrl}/groups`, group);
  }

  deleteGroup(actingUsername: string, groupId: string): Observable<{ valid: boolean }> {
    return this.http.delete<{ valid: boolean }>(`${this.apiUrl}/groups/${groupId}`, {
      params: { actingUsername }
    });
  }

  registerGroupInterest(username: string, groupId: string): Observable<ChatGroup> {
    return this.http.post<ChatGroup>(`${this.apiUrl}/groups/${groupId}/interest`, {
      username
    });
  }

  addGroupMember(actingUsername: string, groupId: string, username: string): Observable<ChatGroup> {
    return this.http.post<ChatGroup>(`${this.apiUrl}/groups/${groupId}/members`, {
      actingUsername,
      username
    });
  }

  removeGroupMember(actingUsername: string, groupId: string, username: string): Observable<ChatGroup> {
    return this.http.delete<ChatGroup>(`${this.apiUrl}/groups/${groupId}/members/${username}`, {
      params: { actingUsername }
    });
  }

  deleteChannel(actingUsername: string, groupId: string, channelId: string): Observable<{ valid: boolean }> {
    return this.http.delete<{ valid: boolean }>(`${this.apiUrl}/groups/${groupId}/channels/${channelId}`, {
      params: { actingUsername }
    });
  }

  banChannelUser(actingUsername: string, groupId: string, channelId: string, username: string): Observable<ChatChannel> {
    return this.http.post<ChatChannel>(`${this.apiUrl}/groups/${groupId}/channels/${channelId}/ban`, {
      actingUsername,
      username
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

  onGroupsChanged(): Observable<void> {
    return new Observable<void>((subscriber) => {
      const handler = () => subscriber.next();

      this.socket.on('groups:changed', handler);

      return () => {
        this.socket.off('groups:changed', handler);
      };
    });
  }

  onUsersChanged(): Observable<void> {
    return new Observable<void>((subscriber) => {
      const handler = () => subscriber.next();

      this.socket.on('users:changed', handler);

      return () => {
        this.socket.off('users:changed', handler);
      };
    });
  }
}
