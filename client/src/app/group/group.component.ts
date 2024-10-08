import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent {
  groups: any[] = [];
  users: any[] = [];
  interestRequests: any[] = [];
  groupName: string = '';
  selectedGroupId: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  user: any;

  constructor(private http: HttpClient) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.loadGroups();
  }

  //Loads groups, and filters after roles.
  loadGroups() {
    this.http.get('http://localhost:3000/groups', { params: { username: this.user.username } })
      .subscribe({
        next: (response: any) => {
          if (this.user.roles.includes('Super Admin')) {
            // Super Admin can see all groups
            this.groups = response;
          } else {
            // Group Admin can only see groups they created
            this.groups = response.filter((group: any) => this.user.groups.includes(group.groupId));
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while loading groups.';
        }
      });
  }

  //Creates a group
  createGroup() {
    this.http.post('http://localhost:3000/group', { name: this.groupName, admin: this.user.username })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Group created successfully';
            this.loadGroups();
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while creating the group.';
        }
      });
  }

  //Loads the users that is a part of the specific group.
  loadUsers(groupId: string) {
    this.selectedGroupId = groupId;
    this.http.get(`http://localhost:3000/groups/${groupId}/users`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.users = response.users;
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while loading users.';
        }
      });
  }

  // Add a user to the specific group
addUserToGroup(groupId: string, username: string) {
  const currentAdmin = JSON.parse(localStorage.getItem('user') || '{}').username; // Get the current logged-in admin

  this.http.post(`http://localhost:3000/groups/${groupId}/users`, { username, admin: currentAdmin }) // Pass admin
    .subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.successMessage = 'User added to group successfully';
          this.loadGroups();
        } else {
          this.errorMessage = response.message;
        }
      },
      error: () => {
        this.errorMessage = 'An error occurred while adding the user to the group.';
      }
    });
}


   //Removes a user to that specific group.
  removeUserFromGroup(groupId: string, username: string) {
    this.http.delete(`http://localhost:3000/groups/${groupId}/users/${username}`)
    .subscribe({
      next: (response: any) => {
        if (response.ok) {
          this.successMessage = 'User removed from group successfully';
          this.loadGroups();
        } else {
          this.errorMessage = response.message;
        }
      },
      error: () => {
        this.errorMessage = 'An error occurred while removing the user from the group.';
      }
    });
  }

  //Promotes a user to Group Admin
  promoteUserToAdmin(groupId: string, username: string) {
    if (this.user.roles.includes('Super Admin')) {
      this.http.post(`http://localhost:3000/groups/${groupId}/promote`, { username })
        .subscribe({
          next: (response: any) => {
            if (response.ok) {
              this.successMessage = 'User promoted to Group Admin successfully';
              this.loadGroups();
            } else {
              this.errorMessage = response.message;
            }
          },
          error: () => {
            this.errorMessage = 'An error occurred while promoting the user.';
          }
        });
    } else {
      this.errorMessage = 'Only Super Admins can promote users to Group Admin.';
    }
  }

  //Demotes a user from Group Admin
  demoteUserFromAdmin(groupId: string, username: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/demote`, { username })
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'User demoted from Group Admin successfully';
            this.loadGroups();
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while demoting the user.';
        }
      });
  }

  // Loads all of the interest request for a group.
  loadInterestRequests(groupId: string) {
    this.selectedGroupId = groupId;
    this.http.get(`http://localhost:3000/groups/${groupId}/interest-requests`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.interestRequests = response.requests;
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while loading interest requests.';
        }
      });
  }

  //Accepts the interest request and the user joins the group.
  acceptRequest(groupId: string, username: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/interest-requests/${username}/accept`, {})
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Request accepted successfully.';
            this.loadInterestRequests(groupId); // Reload the requests
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while accepting the request.';
        }
      });
  }
  
  //Denies the interest request and the user do not join the group.
  denyRequest(groupId: string, username: string) {
    this.http.post(`http://localhost:3000/groups/${groupId}/interest-requests/${username}/deny`, {})
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'Request denied successfully.';
            this.loadInterestRequests(groupId); // Reload the requests
          } else {
            this.errorMessage = response.message;
          }
        },
        error: () => {
          this.errorMessage = 'An error occurred while denying the request.';
        }
      });
  }
}