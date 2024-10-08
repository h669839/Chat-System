import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
  user: any;
  groups: any[] = [];
  channels: any[] = [];
  selectedGroupId: string = '';
  successMessage: string = '';
  errorMessage: string = '';


  constructor(private http: HttpClient) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadUserGroups();
  }

  // Loads all the groups the user is part of from the server
  loadUserGroups() {
    this.http.get('http://localhost:3000/groups', { params: { username: this.user.username } })
      .subscribe({
        next: (response: any) => {
          this.groups = response;
          if (this.groups.length === 0) {
            this.errorMessage = 'You are not part of any groups.';
          }
        },
        error: () => {
          this.errorMessage = 'Failed to load groups from the server.';
        }
      });
  }

  // Loads all channels for the selected group from the server
  loadUserChannels(groupId: string) {
    this.selectedGroupId = groupId;

    if (!groupId) {
      this.errorMessage = 'No group selected.';
      return;
    }

    this.http.get(`http://localhost:3000/groups/${groupId}/channels`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.channels = response.channels;
          } else {
            this.errorMessage = response.message || 'No channels found for the selected group.';
          }
        },
        error: () => {
          this.errorMessage = 'Failed to load channels from the server.';
        }
      });
  }

  // A user joins a channel if they are not already a part of it
  joinChannel(channelId: string) {
    if (this.user && this.selectedGroupId && channelId) {
      const channelData = { username: this.user.username };

      this.http.post(`http://localhost:3000/groups/${this.selectedGroupId}/channels/${channelId}/users`, channelData)
        .subscribe({
          next: (response: any) => {
            if (response.ok) {
              this.successMessage = `You have successfully joined the channel ${response.channel.channelName}.`;
              this.loadUserChannels(this.selectedGroupId); // Reload channels to update membership
            } else {
              this.errorMessage = response.message || 'Could not join the channel.';
            }
          },
          error: () => {
            this.errorMessage = 'Failed to join the channel.';
          }
        });
    } else {
      this.errorMessage = 'Could not join the channel. Ensure you are logged in and a group/channel is selected.';
    }
  }
}
