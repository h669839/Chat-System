import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule} from '@angular/forms';
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
  channelName: string = '';
  groupId: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  user: any;

  constructor(private http: HttpClient) {
    this.user = JSON.parse(localStorage.getItem('user') || ('{}'));
    this.loadChannels();
  }

  //Loads all the channels
  loadChannels() {
    this.http.get('http://localhost:3000/channels')
      .subscribe( {next:
        (response: any) => {
          this.channels = response;
        }, error:
        (error) => {
          this.errorMessage = 'An error occurred while loading channels.';
        }
      }
      );
  }

  //Creates a channel
  createChannel() {
    this.http.post('http://localhost:3000/channels', { groupId: this.groupId, channelName: this.channelName })
      .subscribe( {
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Channel created successfully';
            this.loadChannels();
          } else {
            this.errorMessage = response.message;
          }
        }, error:
        (error) => {
          this.errorMessage = 'An error occurred while creating the channel.';
        }
      }
      );
  }

  //Adds a user to the specific channel
  addUserToChannel(groupId: string, channelId: string, username: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/channels/${channelId}/users`, { username })
      .subscribe( {next:
        (response: any) => {
          if (response.ok) {
            this.successMessage = 'User added to channel successfully';
            this.loadChannels();
          } else {
            this.errorMessage = response.message;
          }
        }, error:
        (error) => {
          this.errorMessage = 'An error occurred while adding the user to the channel.';
        }
      }
      );
  }

  //Removes a user to the specific channel
  removeUserFromChannel(groupId: string, channelId: string, username: string) {
    this.http.delete(`http://localhost:3000/groups/${groupId}/channels/${channelId}/users/${username}`)
      .subscribe({next:
        (response: any) => {
          if (response.ok) {
            this.successMessage = 'User removed from channel successfully';
            this.loadChannels();
          } else {
            this.errorMessage = response.message;
          }
        }, error:
        (error) => {
          this.errorMessage = 'An error occurred while removing the user from the channel.';
        }
      }
      );
  }
}
