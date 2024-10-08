import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  newMessage: string = '';
  user: any;
  groups: any[] = [];
  channels: any[] = [];
  selectedGroupId: string = '';
  selectedChannelId: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  usersInChannel: string[] = [];



  constructor(private http: HttpClient, private socketService: SocketService) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  ngOnInit() {
    this.loadGroups();
  }

  ngOnDestroy() {
    this.socketService.disconnect();
  }

  //Loads all of the groups
  loadGroups() {
    this.http.get(`http://localhost:3000/groups`,  { params: { username: this.user.username } })
    .subscribe({
      next: (response: any) => {
        this.groups = response;
      },
      error: () => {
        this.errorMessage = 'An error occurred while loading groups.';
      }
    });
  }

  //Loads all the channels in a specific group
  loadChannelsForGroup(groupId: string) {
    this.selectedGroupId = groupId;
      this.http.get(`http://localhost:3000/groups/${groupId}/channels`)
        .subscribe({
          next: (response: any) => {
            if(response.ok) {
            this.channels = response.channels;
            } else {
              this.errorMessage = response.message;
            }
          },
          error: () => {
            this.errorMessage = 'An error occurred while loading channels.';
          }
        });
      }

  // Join a channel and start receiving messages
  joinChannel(channelId: string) {
    if (!channelId || !this.user.username) {
      this.errorMessage = 'Invalid channel or user.';
      return;
    }
  
    this.selectedChannelId = channelId;
  
    // Connect the socket and join the channel
    this.socketService.connect();
    this.socketService.joinChannel(channelId, this.user.username);
  
    // Load existing messages for the channel
    this.http.get(`http://localhost:3000/channels/${channelId}/messages`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.messages = response.messages;
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while loading messages.';
        }
      });
  
    // Listen for new messages
    this.socketService.onMessage().subscribe((message) => {
      this.messages.push(message);
    });
  }

  
  //Send message to a specific channel
  sendMessage() {
    if (!this.newMessage.trim()) {
      this.errorMessage = 'Cannot send an empty message.';
      return;
    }

    const message = {
      text: this.newMessage,
      sender: this.user.username,
      channelId: this.selectedChannelId
    };

    this.socketService.sendMessage(message);
    this.newMessage = '';  // Clear the message input
  }
  
  //Register interest for a group the user is not a part of.
  registerInterestInGroup(groupId: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/interest`, { username: this.user.username })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Registered interest in group successfully.';
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while registering interest in the group.';
        }
      });
  }

  //Leaves the group
  leaveGroup(groupId: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/leave`, { username: this.user.username })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'You have left the group successfully.';
            this.loadGroups();
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while leaving the group.';
        }
      });
  }

  //Deletes their own user.
  deleteUser() {
    this.http.delete(`http://localhost:3000/users/${this.user.id}`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Your account has been deleted successfully.';
            localStorage.removeItem('user');
            // Redirect to login or home page
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while deleting your account.';
        }
      });
  }
}

