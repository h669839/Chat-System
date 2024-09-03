import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent {

  user: any;

  constructor(private router: Router) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }
  //Navigates to user management page
  navigateToUserManagement() {
    this.router.navigate(['/admin-user-management']);
  }
  //Navigates to group management page
  navigateToGroupManagement() {
    this.router.navigate(['/group']);
  }
  //Navigates to channel management page
  navigateToChannelManagement() {
    this.router.navigate(['/channel']);
  }
}

