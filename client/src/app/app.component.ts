import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'client';

  user: any;
  selectedGroupId: any;
  isLoggedIn: boolean = false;
  isSuperAdmin: boolean = false;
  isGroupAdmin: boolean = false;
  isUser: boolean = false;
  groups: any[] = [];
  channels: any[] = [];

  constructor(private router: Router,private cdr: ChangeDetectorRef, private http: HttpClient) { }

  ngOnInit(): void {
    this.checkUserStatus();
  }
  //Checks what role the user is logged in as, and displays the corresponding navbar.
  checkUserStatus() {
    console.log('Checking user status...');
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
      console.log('Parsed User Data:', this.user);
      this.isLoggedIn = true;
      const roles = this.user.roles;
      if(roles.includes('Super Admin')) {
        this.isSuperAdmin = true;
        this.isGroupAdmin = true;
      }
      else if(roles.includes('Group Admin')) {
        this.isGroupAdmin = true;
      }
      this.loadGroupsFromServer();
      } 
    this.cdr.detectChanges();
  } 
  //Checks if the login is a success and trigger a change manually.
  onLoginSuccess() {
    this.checkUserStatus(); // Re-check user status on login success
    this.cdr.detectChanges(); // Trigger change detection manually
  }
  //Logs out the user, and navigates them back to the login page.
  logout() {
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.isSuperAdmin = false;
    this.isGroupAdmin = false;
    this.isUser = false;
    localStorage.clear();
    this.router.navigate(['/login']);

  }

  // Loads all the groups from the server for the current user
  loadGroupsFromServer() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
    if (!currentUser.username) {
      console.error('No user found in local storage');
      return;
    }
  
    this.http.get('http://localhost:3000/groups', { params: { username: currentUser.username } }).subscribe({
      next: (response: any) => {
        this.groups = response;
      },
      error: (error) => {
        console.error('Failed to load groups from server', error);
      }
    });
  }  
}
