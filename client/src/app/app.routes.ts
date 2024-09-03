import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ChatComponent } from './chat/chat.component';
import { AdminComponent } from './admin/admin.component';
import { AdminUserManagementComponent } from './admin-user-management/admin-user-management.component';
import { GroupComponent } from './group/group.component';
import { ChannelComponent } from './channel/channel.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'chat', component: ChatComponent },
    { path: 'admin', component: AdminComponent },
    { path: 'admin-user-management', component: AdminUserManagementComponent },
    { path: 'group', component: GroupComponent },
    { path: 'channel', component: ChannelComponent },
    { path: 'user-dashboard', component: UserDashboardComponent }
];
