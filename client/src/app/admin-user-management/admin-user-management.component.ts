import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent {
  users: any[] = [];
  username: string = '';
  email: string = '';
  role: string = 'User';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient) {
    this.loadUsers();
  }
  //Loads every user
  loadUsers() {
    this.http.get('http://localhost:3000/users')
    .subscribe({ next:
      (response: any) => {
        this.users = response;
      },
      error: (error) => {
        this.errorMessage = 'An error occurred while loading users.';
      }
    }
    );
  }
  // Creates a user
  createUser() {
    this.http.post('http://localhost:3000/users', { username: this.username, email: this.email, role: this.role })
      .subscribe( { 
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'User created successfully';
            this.loadUsers();
          } else {
            this.errorMessage = response.message;
          }
        }, error: (error) => {
          this.errorMessage = 'An error occurred while creating the user.';
        }
      }
      );
  }

  //Deletes a user
  deleteUser(userId: string) {
    this.http.delete(`http://localhost:3000/users/${userId}`)
      .subscribe({
        next: (response: any) => {
          if (response.ok) {
            this.successMessage = 'User deleted successfully';
            this.loadUsers();
          } else {
            this.errorMessage = response.message;
          }
        }
      }
      );
  }

  //Promotes a user to Super Admin
  promoteUser(userId: string) {
    this.http.post(`http://localhost:3000/users/${userId}/promote`, { role: 'Super Admin' })
      .subscribe(
        (response: any) => {
          if (response.ok) {
            this.successMessage = 'User promoted successfully';
            this.loadUsers();
          } else {
            this.errorMessage = response.message;
          }
        }
      );
  }

  //Demotes a user from Super Admin
  demoteUser(userId: string) {
    this.http.post(`http://localhost:3000/users/${userId}/demote`, { role: 'Super Admin' })
      .subscribe(
        (response: any) => {
          if (response.ok) {
            this.successMessage = 'User demoted successfully';
            this.loadUsers();
          } else {
            this.errorMessage = response.message;
          }
        }
      );
  }
}
