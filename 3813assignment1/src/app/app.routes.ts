import { Routes } from '@angular/router';

// Components
import { LoginComponent } from './auth/login/login.component';
import { ChatLayoutComponent } from './chat/chat-layout/chat-layout.component';
import { ChatWindowComponent } from './chat/chat-window/chat-window.component';
import { SuperAdminPanelComponent } from './admin/super-admin-panel/super-admin-panel.component';
import { GroupAdminPanelComponent } from './admin/group-admin-panel/group-admin-panel.component';
import { SettingsComponent } from './profile/settings/settings.component';

// Guards (Option B/C – keep at least authGuard; remove role guards if not using them)
import { authGuard } from './guards/auth.guard';
import { superAdminGuard } from './guards/super-admin.guard';
import { groupAdminGuard } from './guards/group-admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ChatLayoutComponent,
    canActivate: [authGuard],               // minimal protection for authenticated users
    children: [
      { path: '', component: ChatWindowComponent },
      { path: 'admin/super', component: SuperAdminPanelComponent, canActivate: [superAdminGuard] },
      { path: 'admin/group', component: GroupAdminPanelComponent, canActivate: [groupAdminGuard] },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
