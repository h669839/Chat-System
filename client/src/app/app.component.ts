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
  isLoggedIn: boolean = false;
  isSuperAdmin: boolean = false;
  isGroupAdmin: boolean = false;
  isUser: boolean = false;

  constructor(private router: Router,private cdr: ChangeDetectorRef, private http: HttpClient) { }

  ngOnInit(): void {
    this.checkUserStatus();
    this.loadGroupsFromServer();
    this.loadChannelsFromServer();
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
    this.router.navigate(['/login']);

  }

  //Loads all the groups on the server.
  loadGroupsFromServer() {
    this.http.get('http://localhost:3000/groups').subscribe(
      {next:
      (response: any) => {
        localStorage.setItem('groups', JSON.stringify(response));
      }, error:
      (error) => {
        console.error('Failed to load groups from server', error);
      }
    }
    );
  }

  //Loads all the channels on the server.
  loadChannelsFromServer() {
    this.http.get('http://localhost:3000/channels').subscribe(
      {next: (response: any) => {
        localStorage.setItem('channels', JSON.stringify(response));
      }, error:
      (error) => {
        console.error('Failed to load channels from server', error);
      }
    }
    );
  }
}
