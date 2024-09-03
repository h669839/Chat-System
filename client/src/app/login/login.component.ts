import { Component, EventEmitter,Output} from '@angular/core';
import { HttpClient,HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../app.component';
import { ChangeDetectorRef } from '@angular/core';


const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @Output() loginSuccess: EventEmitter<void> = new EventEmitter<void>();
  username: string = '';
  password: string = '';

  constructor(
    private http: HttpClient,
    private router: Router, 
    private appComponent: AppComponent,
    private cdr: ChangeDetectorRef) {}

  //Checks the if the login credentials are correct, and saves the user to localStorage.
  //It also redirects the user depending on their role.
  login() {
   let user = {username:this.username, password:this.password};

    this.http.post('http://localhost:3000/login', user, httpOptions)
      .subscribe({ 
        next: (response: any) => {  
          console.log("Responsive received:", response);
        if (response.ok) {
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify(response));
          this.appComponent.checkUserStatus(); // Call method in AppComponent to update state
          this.cdr.detectChanges(); // Trigger change detection manually
          // Redirect based on role
          const roles = response.roles;
          if (roles.includes('Super Admin')) {
            this.router.navigate(['/admin']);
          } else if (roles.includes('Group Admin')) {
            this.router.navigate(['/group']);
          } else {
            this.router.navigate(['/chat']);
          }
        } else {
          this.router.navigate(['/login']);
        }
      }
    });
  }
}