const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

app.use(express.json()); 

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
  next();
});
app.options('/api/auth', (_req, res) => res.sendStatus(200));
app.options('/api/register', (_req, res) => res.sendStatus(200));
app.options('/api/users', (_req, res) => res.sendStatus(200));
app.options('/api/users/:username/role', (_req, res) => res.sendStatus(200));
app.options('/api/users/:username', (_req, res) => res.sendStatus(200));
app.options('/api/groups', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/interest', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/members', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/members/:username', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/channels', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/channels/:channelId', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/channels/:channelId/ban', (_req, res) => res.sendStatus(200));
app.options('/api/channels', (_req, res) => res.sendStatus(200));
app.options('/api/channels/:channelId/messages', (_req, res) => res.sendStatus(200));
app.options('/api/groups/:groupId/channels/:channelId/messages', (_req, res) => res.sendStatus(200));

class User {
  constructor(username, birthdate, age, email, password, role = 'user') {
    this.username = username;
    this.birthdate = birthdate;
    this.age = age;
    this.email = email;
    this.password = password;
    this.role = role;
    this.valid = false;
  }
}

const users = [
  new User('Alan', '2001-02-03', 23, 'admin1@gmail.com', '123', 'super-admin'),
  new User('Phil', '1999-07-15', 25, 'admin2@gmail.com', '123', 'group-admin'),
  new User('Frank', '2000-11-30', 24, 'admin3@gmail.com', '123', 'user'),
];

const groups = [
  {
    id: 'global',
    name: 'Global',
    description: 'Shared group for everyone.',
    createdBy: 'Phil',
    memberUsernames: ['Alan', 'Phil', 'Frank'],
    pendingUsernames: [],
    channels: [
      {
        id: 'general',
        name: 'general',
        description: 'Shared chat for everyone.',
        bannedUsernames: [],
        messages: []
      }
    ]
  }
];

let nextMessageId = 1;

function findUser(username) {
  return users.find(u => u.username === username);
}

function requireUser(username, res) {
  const user = findUser(username);

  if (!user) {
    res.status(401).json({ valid: false, error: 'User not found' });
    return null;
  }

  return user;
}

function isSuperAdmin(user) {
  return user?.role === 'super-admin';
}

function isGroupAdmin(user) {
  return user?.role === 'group-admin' || isSuperAdmin(user);
}

function canManageGroup(user, group) {
  return isSuperAdmin(user) || (isGroupAdmin(user) && group.createdBy === user.username);
}

function createId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function publicUser(user) {
  return {
    username: user.username,
    birthdate: user.birthdate,
    age: user.age,
    email: user.email,
    role: user.role,
    valid: true
  };
}

function publicGroup(group, viewer) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdBy: group.createdBy,
    memberUsernames: group.memberUsernames,
    pendingUsernames: group.pendingUsernames,
    isMember: !!viewer && group.memberUsernames.includes(viewer.username),
    isPending: !!viewer && group.pendingUsernames.includes(viewer.username),
    canManage: !!viewer && canManageGroup(viewer, group),
    channels: group.channels.map(channel => publicChannel(group, channel))
  };
}

function publicChannel(group, channel) {
  return {
    id: channel.id,
    groupId: group.id,
    groupName: group.name,
    name: channel.name,
    description: channel.description,
    bannedUsernames: channel.bannedUsernames || [],
    messages: channel.messages
  };
}

function allChannels() {
  return groups.flatMap(group => group.channels.map(channel => ({ group, channel })));
}

function createMessage(author, body) {
  const createdAt = new Date();

  return {
    id: nextMessageId++,
    author,
    time: createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    body,
    createdAt: createdAt.toISOString()
  };
}


app.post('/api/auth', (req, res) => {
  const { email, password } = req.body || {};

  const found = users.find(u => u.email === email && u.password === password);

  if (found) {
    
    return res.json({
      username: found.username,
      birthdate: found.birthdate,
      age: found.age,
      email: found.email,
      role: found.role,
      valid: true
    });
  }

  return res.json({ valid: false });
});

app.post('/api/register', (req, res) => {
  const { username, birthdate, age, email, password } = req.body || {};

  if (!username || !birthdate || age === null || age === undefined || !email || !password) {
    return res.json({ valid: false });
  }

  const exists = users.some(u => u.email === email || u.username === username);

  if (exists) {
    return res.json({ valid: false });
  }

  const user = new User(username, birthdate, Number(age), email, password);
  users.push(user);

  return res.json({
    username: user.username,
    birthdate: user.birthdate,
    age: user.age,
    email: user.email,
    role: user.role,
    valid: true
  });
});

app.get('/api/users', (req, res) => {
  const viewer = requireUser(req.query.username, res);

  if (!viewer) {
    return;
  }

  return res.json(users.map(publicUser));
});

app.post('/api/users/:username/role', (req, res) => {
  const { actingUsername, role } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const target = findUser(req.params.username);
  const allowedRoles = ['super-admin', 'group-admin', 'user'];

  if (!actor) {
    return;
  }

  if (!isSuperAdmin(actor)) {
    return res.status(403).json({ valid: false, error: 'Only Super Admins can change roles' });
  }

  if (!target || !allowedRoles.includes(role)) {
    return res.status(400).json({ valid: false, error: 'Invalid user or role' });
  }

  target.role = role;
  io.emit('users:changed');
  return res.json(publicUser(target));
});

app.delete('/api/users/:username', (req, res) => {
  const actingUsername = req.query.actingUsername || req.body?.actingUsername;
  const actor = requireUser(actingUsername, res);
  const targetIndex = users.findIndex(u => u.username === req.params.username);

  if (!actor) {
    return;
  }

  if (targetIndex === -1) {
    return res.status(404).json({ valid: false, error: 'User not found' });
  }

  if (!isSuperAdmin(actor) && actor.username !== req.params.username) {
    return res.status(403).json({ valid: false, error: 'Only Super Admins can remove other users' });
  }

  users.splice(targetIndex, 1);
  for (const group of groups) {
    group.memberUsernames = group.memberUsernames.filter(username => username !== req.params.username);
    group.pendingUsernames = group.pendingUsernames.filter(username => username !== req.params.username);
    for (const channel of group.channels) {
      channel.bannedUsernames = channel.bannedUsernames.filter(username => username !== req.params.username);
    }
  }

  io.emit('users:changed');
  io.emit('groups:changed');
  return res.json({ valid: true });
});

app.get('/api/groups', (req, res) => {
  const viewer = findUser(req.query.username);
  return res.json(groups.map(group => publicGroup(group, viewer)));
});

app.post('/api/groups', (req, res) => {
  const { actingUsername, name, description } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';

  if (!actor) {
    return;
  }

  if (!isGroupAdmin(actor)) {
    return res.status(403).json({ valid: false, error: 'Only Group Admins and Super Admins can create groups' });
  }

  if (!cleanName) {
    return res.status(400).json({ valid: false, error: 'Group name is required' });
  }

  const id = createId(cleanName);

  if (!id) {
    return res.status(400).json({ valid: false, error: 'Group name must include letters or numbers' });
  }

  if (groups.some(group => group.id === id)) {
    return res.status(409).json({ valid: false, error: 'A group with that name already exists' });
  }

  const group = {
    id,
    name: cleanName,
    description: cleanDescription || 'No description yet.',
    createdBy: actor.username,
    memberUsernames: [actor.username],
    pendingUsernames: [],
    channels: []
  };

  groups.push(group);
  io.emit('groups:changed');
  return res.status(201).json(publicGroup(group, actor));
});

app.delete('/api/groups/:groupId', (req, res) => {
  const actingUsername = req.query.actingUsername || req.body?.actingUsername;
  const actor = requireUser(actingUsername, res);
  const groupIndex = groups.findIndex(group => group.id === req.params.groupId);

  if (!actor) {
    return;
  }

  if (groupIndex === -1) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (!canManageGroup(actor, groups[groupIndex])) {
    return res.status(403).json({ valid: false, error: 'You can only delete groups you administer' });
  }

  groups.splice(groupIndex, 1);
  io.emit('groups:changed');
  return res.json({ valid: true });
});

app.post('/api/groups/:groupId/interest', (req, res) => {
  const { username } = req.body || {};
  const user = requireUser(username, res);
  const group = groups.find(g => g.id === req.params.groupId);

  if (!user) {
    return;
  }

  if (!group) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (!group.memberUsernames.includes(user.username) && !group.pendingUsernames.includes(user.username)) {
    group.pendingUsernames.push(user.username);
  }

  io.emit('groups:changed');
  return res.json(publicGroup(group, user));
});

app.post('/api/groups/:groupId/members', (req, res) => {
  const { actingUsername, username } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const target = findUser(username);
  const group = groups.find(g => g.id === req.params.groupId);

  if (!actor) {
    return;
  }

  if (!group || !target) {
    return res.status(404).json({ valid: false, error: 'Group or user not found' });
  }

  if (!canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only add members to groups you administer' });
  }

  if (!group.memberUsernames.includes(target.username)) {
    group.memberUsernames.push(target.username);
  }

  group.pendingUsernames = group.pendingUsernames.filter(pending => pending !== target.username);
  io.emit('groups:changed');
  return res.json(publicGroup(group, actor));
});

app.delete('/api/groups/:groupId/members/:username', (req, res) => {
  const actingUsername = req.query.actingUsername || req.body?.actingUsername;
  const actor = requireUser(actingUsername, res);
  const group = groups.find(g => g.id === req.params.groupId);

  if (!actor) {
    return;
  }

  if (!group) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (actor.username !== req.params.username && !canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only remove users from groups you administer' });
  }

  group.memberUsernames = group.memberUsernames.filter(username => username !== req.params.username);
  group.pendingUsernames = group.pendingUsernames.filter(username => username !== req.params.username);
  io.emit('groups:changed');
  return res.json(publicGroup(group, actor));
});

app.post('/api/groups/:groupId/channels', (req, res) => {
  const { actingUsername, name, description } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const group = groups.find(g => g.id === req.params.groupId);
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';

  if (!actor) {
    return;
  }

  if (!group) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (!canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only create channels in groups you administer' });
  }

  if (!cleanName) {
    return res.status(400).json({ valid: false, error: 'Channel name is required' });
  }

  const id = createId(cleanName);

  if (!id) {
    return res.status(400).json({ valid: false, error: 'Channel name must include letters or numbers' });
  }

  if (group.channels.some(channel => channel.id === id)) {
    return res.status(409).json({ valid: false, error: 'A channel with that name already exists in this group' });
  }

  const channel = {
    id,
    name: cleanName,
    description: cleanDescription || 'No description yet.',
    bannedUsernames: [],
    messages: []
  };

  group.channels.push(channel);
  io.emit('groups:changed');
  io.emit('channel:created', publicChannel(group, channel));
  return res.status(201).json(publicChannel(group, channel));
});

app.delete('/api/groups/:groupId/channels/:channelId', (req, res) => {
  const actingUsername = req.query.actingUsername || req.body?.actingUsername;
  const actor = requireUser(actingUsername, res);
  const group = groups.find(g => g.id === req.params.groupId);

  if (!actor) {
    return;
  }

  if (!group) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (!canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only delete channels in groups you administer' });
  }

  group.channels = group.channels.filter(channel => channel.id !== req.params.channelId);
  io.emit('groups:changed');
  return res.json({ valid: true });
});

app.post('/api/groups/:groupId/channels/:channelId/ban', (req, res) => {
  const { actingUsername, username } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const group = groups.find(g => g.id === req.params.groupId);
  const channel = group?.channels.find(c => c.id === req.params.channelId);

  if (!actor) {
    return;
  }

  if (!group || !channel || !findUser(username)) {
    return res.status(404).json({ valid: false, error: 'Group, channel, or user not found' });
  }

  if (!canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only ban users from channels you administer' });
  }

  if (!channel.bannedUsernames.includes(username)) {
    channel.bannedUsernames.push(username);
  }

  io.emit('admin:report', {
    groupId: group.id,
    channelId: channel.id,
    username,
    reportedBy: actor.username,
    message: `${actor.username} banned ${username} from ${group.name}/${channel.name}`
  });
  io.emit('groups:changed');
  return res.json(publicChannel(group, channel));
});

app.get('/api/channels', (req, res) => {
  const viewer = findUser(req.query.username);
  const channels = allChannels()
    .filter(({ group, channel }) => {
      if (!viewer) {
        return false;
      }

      return group.memberUsernames.includes(viewer.username) && !channel.bannedUsernames.includes(viewer.username);
    })
    .map(({ group, channel }) => publicChannel(group, channel));

  return res.json(channels);
});

app.post('/api/channels', (req, res) => {
  const { actingUsername, groupId, name, description } = req.body || {};
  const actor = requireUser(actingUsername, res);
  const group = groups.find(g => g.id === groupId);
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanDescription = typeof description === 'string' ? description.trim() : '';

  if (!actor) {
    return;
  }

  if (!group) {
    return res.status(404).json({ valid: false, error: 'Group not found' });
  }

  if (!canManageGroup(actor, group)) {
    return res.status(403).json({ valid: false, error: 'You can only create channels in groups you administer' });
  }

  if (!cleanName) {
    return res.status(400).json({ valid: false, error: 'Channel name is required' });
  }

  const id = createId(cleanName);

  if (!id) {
    return res.status(400).json({ valid: false, error: 'Channel name must include letters or numbers' });
  }

  if (group.channels.some(c => c.id === id)) {
    return res.status(409).json({ valid: false, error: 'A channel with that name already exists' });
  }

  const channel = {
    id,
    name: cleanName,
    description: cleanDescription || 'No description yet.',
    bannedUsernames: [],
    messages: []
  };

  group.channels.push(channel);
  io.emit('groups:changed');
  io.emit('channel:created', publicChannel(group, channel));

  return res.status(201).json(publicChannel(group, channel));
});

app.get('/api/channels/:channelId/messages', (req, res) => {
  const found = allChannels().find(({ channel }) => channel.id === req.params.channelId);

  if (!found) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  return res.json(found.channel.messages);
});

app.get('/api/groups/:groupId/channels/:channelId/messages', (req, res) => {
  const group = groups.find(g => g.id === req.params.groupId);
  const channel = group?.channels.find(c => c.id === req.params.channelId);

  if (!group || !channel) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  return res.json(channel.messages);
});

app.post('/api/channels/:channelId/messages', (req, res) => {
  const { author, body } = req.body || {};
  const found = allChannels().find(({ channel }) => channel.id === req.params.channelId);

  if (!found) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  if (!author || !body || !body.trim() || !found.group.memberUsernames.includes(author) || found.channel.bannedUsernames.includes(author)) {
    return res.status(400).json({ valid: false, error: 'Author and message body are required' });
  }

  const message = createMessage(author, body.trim());
  found.channel.messages.push(message);
  io.emit('message:created', {
    groupId: found.group.id,
    channelId: found.channel.id,
    message
  });

  return res.status(201).json(message);
});

app.post('/api/groups/:groupId/channels/:channelId/messages', (req, res) => {
  const { author, body } = req.body || {};
  const group = groups.find(g => g.id === req.params.groupId);
  const channel = group?.channels.find(c => c.id === req.params.channelId);

  if (!group || !channel) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  if (!author || !body || !body.trim()) {
    return res.status(400).json({ valid: false, error: 'Author and message body are required' });
  }

  if (!group.memberUsernames.includes(author)) {
    return res.status(403).json({ valid: false, error: 'You must be a group member to chat in its channels' });
  }

  if (channel.bannedUsernames.includes(author)) {
    return res.status(403).json({ valid: false, error: 'You are banned from this channel' });
  }

  const message = createMessage(author, body.trim());
  channel.messages.push(message);
  io.emit('message:created', {
    groupId: group.id,
    channelId: channel.id,
    message
  });

  return res.status(201).json(message);
});

const PORT = 3000;
server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
