import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  newMessage: string = '';
  currentUser: any;
  currentChannelId: string = '';
  groups: any[] = [];
  channels: any[] = [];
  selectedGroupId: string = '';
  selectedChannelId: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.loadGroups();
  }
  //Loads all of the groups
  loadGroups() {
    this.http.get('http://localhost:3000/groups')
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
    const group = this.groups.find(g => g.groupId === groupId);
    if (group && this.currentUser.groups.includes(groupId)) {
      this.http.get('http://localhost:3000/channels')
        .subscribe({
          next: (response: any) => {
            this.channels = response.filter((channel: any) => channel.groupId === groupId);
          },
          error: () => {
            this.errorMessage = 'An error occurred while loading channels.';
          }
        });
    } else {
      this.errorMessage = 'You are not a member of this group. Please register interest to join.';
    }
  }

  //User joins the channel to write a message.
  joinChannel() {
    if (this.selectedChannelId) {
      this.currentChannelId = this.selectedChannelId;
       // Load existing messages for the channel
      this.loadMessages();
    } else {
      this.errorMessage = 'Please select a channel to join.';
    }
  }

  //Loads all of the messages.
  loadMessages() {
    if (this.currentChannelId) {
      this.http.get(`http://localhost:3000/channels/${this.currentChannelId}/messages`)
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
    }
  }

  //Sends a message
  sendMessage() {
    if (this.newMessage.trim() && this.currentChannelId) {
      const message = { text: this.newMessage, sender: this.currentUser.username };

      this.http.post(`http://localhost:3000/channels/${this.currentChannelId}/messages`, message)
        .subscribe({
          next: (response: any) => {
            if (response.ok) {
              this.messages.push(response.message);
              this.newMessage = '';
            } else {
              this.errorMessage = response.message;
            }
          },
          error: () => {
            this.errorMessage = 'An error occurred while sending the message.';
          }
        });
    }
  }

  //Register interest for a group the user is not a part of.
  registerInterestInGroup(groupId: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/interest`, { username: this.currentUser.username })
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
    this.http.post(`http://localhost:3000/groups/${groupId}/leave`, { username: this.currentUser.username })
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
    this.http.delete(`http://localhost:3000/users/${this.currentUser.id}`)
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

