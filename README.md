# Chat System
This project is a chat system that allows users to communicate in real-time within different groups and channels. The system features three levels of permissions: 
- Super Admin
- Group Admin
- User

The project is built using the MEAN stack(MongoDB, Express, Angular, Node.js) and includes a REST API for server-client communication. The MongoDB database is yet to be implemented.

## Repository Layout
### Git Repository Structrure
``` bash
/chat-system
│
├── /client               # Angular frontend application
│   ├── /src
│   │   ├── /app          # Angular components, services, and modules
│   │   ├── index.html    # Main HTML file for the Angular application
│   │   └── main.ts       # Entry point for the Angular application
│   ├── /server               # Node.js backend application
│   │   ├── index.js          # Entry point for the Node.js server
│   ├── package.json          # NPM dependencies and scripts
│   ├── .gitignore            # Specifies files to be ignored by Git
│   └── angular.json      # Angular CLI configuration
│
└── README.md             # Documentation of the project
```
## Data Structures
### Users
Users are represented as objects with the following structure:
``` javascript
{
   username: 'user1',
  password: 'password',
  id: '1',
  roles: ['User'],        // Roles can include 'Super Admin', 'Group Admin', 'User'
  groups: ['groupId1']    // Array of group IDs the user belongs to
}
```
### Groups
Groups are represented as objects woth the following structure:
``` javascript
{
  groupId: 'groupId1',
  name: 'Group 1',
  admins: ['adminId1'],   // Array of user IDs of the group's admins
  channels: ['channelId1'] // Array of channel IDs within the group
}
```
### Channels
Channels are represented as objects with the following structure:
``` javascript
{
  channelId: 'channelId1',
  channelName: 'General',
  groupId: 'groupId1',     // The group to which the channel belongs
  users: ['userId1']       // Array of user IDs who have joined the channel
}
```
## REST API
### Overview
The Angular frontend communicates with the Node.js server using a REST API. Below are the main API routes provided by the server:
### Routes
- #### User Routes
  - ##### 'Post /login'
    - Parametes: 'username', 'password'
    - Return Values: User object without password, or error message
    - Description: Authenticates the user and returns user data if successful.
  - ##### 'Post /users'
    - Parametes: 'username', 'email', 'role'
    - Return Values: Newly created user object, or error message
    - Description: Creates a new user (Super Admin only)
  - ##### 'DELETE /users/:id'
    - Parametes: 'id' (User ID)
    - Return Values: Deleted user object, or error message
    - Description: Deletes a user (Super Admin only)
- #### Group Routes
  - ##### 'GET /groups'
    - Parametes: None
    - Return Values: Array of all groups
    - Description: Retrieves all groups.
  - ##### 'Post /group'
    - Parameters: 'name', 'admin'
    - Return Values: Newly created group object, or error message
    - Description: Creates a new group  
  - ##### 'POST /groups/:groupId/interest'
    - Parameters: 'username'
    - Return Values: Success message, or error message
    - Description: Registers a user's interest in joining a group
  - ##### 'POST /groups/:groupId/interest-requests/:username/accept'
    - Parameters: 'groupId', 'username'
    - Return Values: Success message, or error message
    - Description: Accepts a user's request to join a group (Group Admin only).
- #### Channel Routes
  - ##### 'GET /channels'
    - Parametes: None
    - Return Values: Array of all channels
    - Description: Retrieves all channels.
  - ##### 'Post /channel'
    - Parameters: 'groupId', 'channelName'
    - Return Values: Newly created channel object, or error message
    - Description: Creates a new channel  
  - ##### 'GET /channels/:channelId/messages'
    - Parameters: 'channelId'
    - Return Values: Array of messages in the channel
    - Description: Retrieves all messages for a specific channel.
  - ##### 'POST /channels/:channelId/messages'
    - Parameters: 'sender', 'text'
    - Return Values: Newly created message object, or error message
    - Description: Sends a message to a specific channel
## Angular Architecture
### Components
- AdminComponent:
  - Provides an interface for Super Admins to manage the entire system. This includes     creating and deleting users, promoting or demoting users to/from Group Admins, and      overseeing all groups and channels.
    
- AdminUserManagementComponent:
  - Focuses on user management. This component allows Super Admins to view all users, create new users, delete users, and manage their roles (promote or demote).
    
- ChatComponent:
  - Handles the display and interaction of groups, channels, and messages for regular users. Users can view all groups, register interest in joining groups, view channels if they are members, and send messages within the channels they have joined.
    
- ChannelComponent:
  - Manages the creation and interaction of channels within groups. Group Admins can create new channels, view existing channels, and manage user participation within those channels.
    
- GroupComponent: 
  - Used by Group Admins to manage group membership, view and manage interest requests from users wanting to join the group, and promote or demote users to/from group admins. Group Admins can also create new groups and manage existing ones.
    
- LoginComponent:
  - Provides the login interface for all users. Users enter their credentials to authenticate and access the system. Depending on their role, they are directed to different parts of the application (e.g., Super Admin, Group Admin, or regular user).
    
- UserDashboardComponent:
  - Displays a personalized dashboard for users. It shows the groups the user belongs to, allows them to navigate to different channels within those groups, and provides options to leave groups or manage their account settings.
    
### Services
- HttpClient:
  - Used throughout the application to make HTTP requests to the Node.js backend. No additional services are created since all API interactions are directly handled within components.
    
### Models
- User Model: Represents user data including username, roles, and associated groups.
  
- Group Model: Represents group data including group name, admins, and associated channels.
  
- Channel Model: Represents channel data including channel name, associated group, and users.
