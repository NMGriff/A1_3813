import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, AuthResponse, UserRole } from '../../services/auth.service';
import { ChatGroup, ChatService, ChatUser } from '../../services/chat.service';

type ValidUser = Extract<AuthResponse, { valid: true }>;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  currentUser: ValidUser | null = null;
  users: ChatUser[] = [];
  groups: ChatGroup[] = [];
  roles: UserRole[] = ['user', 'group-admin', 'super-admin'];
  newGroupName = '';
  newGroupDescription = '';
  channelForms: Record<string, { name: string; description: string }> = {};
  banForms: Record<string, string> = {};
  statusMessage = '';
  errorMessage = '';
  private groupsChangedSubscription?: Subscription;
  private usersChangedSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.currentUser = user?.valid ? user : null;
    this.loadData();

    this.groupsChangedSubscription = this.chatService.onGroupsChanged().subscribe(() => this.loadGroups());
    this.usersChangedSubscription = this.chatService.onUsersChanged().subscribe(() => this.loadUsers());
  }

  ngOnDestroy() {
    this.groupsChangedSubscription?.unsubscribe();
    this.usersChangedSubscription?.unsubscribe();
  }

  get canUseAdminPage(): boolean {
    return !!this.currentUser && (this.currentUser.role === 'group-admin' || this.currentUser.role === 'super-admin');
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super-admin';
  }

  loadData() {
    this.loadUsers();
    this.loadGroups();
  }

  loadUsers() {
    if (!this.currentUser) {
      return;
    }

    this.chatService.getUsers(this.currentUser.username).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to load users.';
      }
    });
  }

  loadGroups() {
    if (!this.currentUser) {
      return;
    }

    this.chatService.getGroups(this.currentUser.username).subscribe({
      next: (groups) => {
        this.groups = groups;
        for (const group of groups) {
          this.channelForms[group.id] = this.channelForms[group.id] || { name: '', description: '' };

          for (const channel of group.channels) {
            const key = `${group.id}/${channel.id}`;
            this.banForms[key] = this.banForms[key] || '';
          }
        }
      },
      error: () => {
        this.errorMessage = 'Unable to load groups.';
      }
    });
  }

  createGroup() {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.createGroup({
      actingUsername: this.currentUser.username,
      name: this.newGroupName.trim(),
      description: this.newGroupDescription.trim()
    }).subscribe({
      next: () => {
        this.newGroupName = '';
        this.newGroupDescription = '';
        this.statusMessage = 'Group created.';
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to create group.';
      }
    });
  }

  deleteGroup(group: ChatGroup) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.deleteGroup(this.currentUser.username, group.id).subscribe({
      next: () => {
        this.statusMessage = 'Group deleted.';
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to delete group.';
      }
    });
  }

  createChannel(group: ChatGroup) {
    if (!this.currentUser) {
      return;
    }

    const form = this.channelForms[group.id] || { name: '', description: '' };
    this.clearMessages();
    this.chatService.createChannel({
      actingUsername: this.currentUser.username,
      groupId: group.id,
      name: form.name.trim(),
      description: form.description.trim()
    }).subscribe({
      next: () => {
        this.channelForms[group.id] = { name: '', description: '' };
        this.statusMessage = 'Channel created.';
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to create channel.';
      }
    });
  }

  deleteChannel(group: ChatGroup, channelId: string) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.deleteChannel(this.currentUser.username, group.id, channelId).subscribe({
      next: () => {
        this.statusMessage = 'Channel deleted.';
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to delete channel.';
      }
    });
  }

  approveMember(group: ChatGroup, username: string) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.addGroupMember(this.currentUser.username, group.id, username).subscribe({
      next: () => {
        this.statusMessage = `${username} added to ${group.name}.`;
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to add member.';
      }
    });
  }

  removeMember(group: ChatGroup, username: string) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.removeGroupMember(this.currentUser.username, group.id, username).subscribe({
      next: () => {
        this.statusMessage = `${username} removed from ${group.name}.`;
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to remove member.';
      }
    });
  }

  changeRole(user: ChatUser, role: UserRole) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.changeUserRole(this.currentUser.username, user.username, role).subscribe({
      next: (updatedUser) => {
        if (updatedUser.username === this.currentUser?.username) {
          this.authService.saveUser(updatedUser);
          this.currentUser = updatedUser;
        }

        this.statusMessage = `${user.username} role updated.`;
        this.loadUsers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to update role.';
      }
    });
  }

  deleteUser(username: string) {
    if (!this.currentUser) {
      return;
    }

    this.clearMessages();
    this.chatService.deleteUser(this.currentUser.username, username).subscribe({
      next: () => {
        this.statusMessage = `${username} removed.`;
        this.loadData();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to delete user.';
      }
    });
  }

  banUser(group: ChatGroup, channelId: string) {
    if (!this.currentUser) {
      return;
    }

    const key = `${group.id}/${channelId}`;
    const username = (this.banForms[key] || '').trim();

    if (!username) {
      this.errorMessage = 'Choose a user to ban.';
      return;
    }

    this.clearMessages();
    this.chatService.banChannelUser(this.currentUser.username, group.id, channelId, username).subscribe({
      next: () => {
        this.banForms[key] = '';
        this.statusMessage = `${username} banned and reported to Super Admins.`;
        this.loadGroups();
      },
      error: (error) => {
        this.errorMessage = error?.error?.error || 'Unable to ban user.';
      }
    });
  }

  roleLabel(role: UserRole): string {
    if (role === 'super-admin') {
      return 'Super Admin';
    }

    if (role === 'group-admin') {
      return 'Group Admin';
    }

    return 'User';
  }

  private clearMessages() {
    this.statusMessage = '';
    this.errorMessage = '';
  }
}
