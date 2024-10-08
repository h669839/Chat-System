import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent {
  channels: any[] = [];
  groups: any [] = [];
  channelName: string = '';
  groupId: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  user: any;

  constructor(private http: HttpClient) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadGroups();
  }
   // Load all groups
   loadGroups() {
    this.http.get('http://localhost:3000/groups', { params: { username: this.user.username } }).subscribe({
      next: (response: any) => {
        this.groups = response;
      },
      error: () => {
        this.errorMessage = 'An error occurred while loading groups.';
      }
    });
  }

  // Loads channels for the specific group from the server
  loadChannels() {
    if (!this.groupId) {
      this.errorMessage = 'No group selected to load channels.';
      return;
    }

    this.http.get(`http://localhost:3000/groups/${this.groupId}/channels`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.channels = response.channels;
            this.successMessage = 'Channels loaded successfully.';
          } else {
            this.errorMessage = response.message || 'No channels found.';
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while loading channels.';
        }
      });
  }

  // Creates a channel for a specific group
  createChannel() {
    if (!this.groupId || !this.channelName.trim()) {
      this.errorMessage = 'Please provide a group ID and channel name.';
      return;
    }

    this.http.post('http://localhost:3000/channels', { groupId: this.groupId, channelName: this.channelName })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Channel created successfully';
            this.loadChannels(); // Reload channels after creation
          } else {
            this.errorMessage = response.message || 'Failed to create the channel.';
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while creating the channel.';
        }
      });
  }

  // Adds a user to a specific channel within a group
  addUserToChannel(groupId: string, channelId: string, username: string) {
    if (!groupId || !channelId || !username.trim()) {
      this.errorMessage = 'Please provide valid group, channel, and username.';
      return;
    }

    this.http.post(`http://localhost:3000/groups/${groupId}/channels/${channelId}/users`, { username })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = `User ${username} added to channel successfully.`;
            this.loadChannels(); // Reload channels after adding a user
          } else {
            this.errorMessage = response.message || 'Failed to add user to the channel.';
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while adding the user to the channel.';
        }
      });
  }

  // Removes a user from a specific channel within a group
  removeUserFromChannel(groupId: string, channelId: string, username: string) {
    if (!groupId || !channelId || !username.trim()) {
      this.errorMessage = 'Please provide valid group, channel, and username.';
      return;
    }

    this.http.delete(`http://localhost:3000/groups/${groupId}/channels/${channelId}/users/${username}`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = `User ${username} removed from channel successfully.`;
            this.loadChannels(); // Reload channels after removing a user
          } else {
            this.errorMessage = response.message || 'Failed to remove user from the channel.';
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while removing the user from the channel.';
        }
      });
  }
}
