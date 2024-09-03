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

  //Loads all the groups a user is a part in
  loadUserGroups() {
    if (localStorage.getItem('groups')) {
      const allGroups = JSON.parse(localStorage.getItem('groups') || '[]');
      this.groups = allGroups.filter((group: any) => this.user.groups.includes(group.groupId));
    } else {
      this.errorMessage = 'No groups found in local storage.';
    }

  }

  //Loads all the channels a user is a part in.
  loadUserChannels(groupId: string) {
    this.selectedGroupId = groupId;
    if (localStorage.getItem('channels')) {
      const allChannels = JSON.parse(localStorage.getItem('channels') || '[]');
      this.channels = allChannels.filter((channel: any) => channel.groupId === groupId);
    } else {
      this.errorMessage = 'No channels found in local storage.';
    }
  }

  //A user joins a channel if they are not a part of it already.
  joinChannel(channelId: string) {
    if (this.user && this.selectedGroupId && channelId) {
      const allChannels = JSON.parse(localStorage.getItem('channels') || '[]');
      const channel = allChannels.find((ch: any) => ch.channelId === channelId);

      if (channel) {
        if (!channel.users.includes(this.user.username)) {
          channel.users.push(this.user.username);
          localStorage.setItem('channels', JSON.stringify(allChannels));
          this.successMessage = `You have successfully joined the channel ${channel.channelName}.`;
        } else {
          this.errorMessage = 'You are already a member of this channel.';
        }
      } else {
        this.errorMessage = 'Channel not found.';
      }
    } else {
      this.errorMessage = 'Could not join the channel. Ensure you are logged in and a group/channel is selected.';
    }
  }

}
