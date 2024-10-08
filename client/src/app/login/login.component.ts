import { Component, EventEmitter,Output} from '@angular/core';
import { HttpClient,HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppComponent } from '../app.component';
import { ChangeDetectorRef } from '@angular/core';


const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json'
  })
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
  errorMessage: string = '';

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
        if (response.ok) {
          // Store user info in localStorage
          localStorage.setItem('user', JSON.stringify(response));
          this.appComponent.checkUserStatus(); // Call method in AppComponent to update state
          this.cdr.detectChanges(); // Trigger change detection manually
          // Redirect based on role
          this.router.navigate(['/user-dashboard']);
         
        }
      }, error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Invalid username or password. Please try again.';
          this.resetForm();
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
        }
      } 
    });
  }

  // Method to reset the input fields
  resetForm() {
    this.username = '';
    this.password = '';
  }
}