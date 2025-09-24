# 3813 Software Frameworks Assignment 1


3813 Software Frameworks Assignment 
Phase 1 
Nathan Maaka s2758464

Github repo: https://github.com/NMGriff/A1_3813


## Component Data structure tree:
```
src/app/models/
 ├─ user.ts
 ├─ role.ts
 ├─ group.ts
 ├─ channel.ts
 └─ message.ts
 ```
 
### Description:
* user.ts:  A chat user has an id, username, email, roles, and groups they belong to.
* role.ts  The permission levels (like USER, GROUP_ADMIN, SUPER_ADMIN).
* group.ts  A collection of users. Tracks its name, owner, admins, members, and channels.
* channel.ts  A chat room inside a group. Holds its name, group id, and banned users.
* message.ts  A single chat post. Stores text, sender, channel, and timestamp.

