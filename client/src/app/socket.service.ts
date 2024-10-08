// socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
const SERVER_URI = 'http://localhost:3000'
@Injectable({
  providedIn: 'root'  // This makes the service available throughout the app
})
export class SocketService {
  private socket!: Socket;

  constructor() {}

  connect(): void {
    if (!this.socket) {
      this.socket = io(SERVER_URI);  // Connect to the server
    }
  }

  joinChannel(channelId: string, username: string): void {
    this.socket.emit('joinChannel', channelId, username);
  }

  sendMessage(message: any): void {
    this.socket.emit('newMessage', message);
  }

  onMessage(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('message', (message) => {
        observer.next(message);
      });
    });
  }

  onUserJoined(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('userJoined', (data) => {
        observer.next(data);
      });
    });
  }

  onUserLeft(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('userLeft', (data) => {
        observer.next(data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
