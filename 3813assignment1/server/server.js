const express = require('express');
const app = express();

app.use(express.json()); 

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  next();
});
app.options('/api/auth', (_req, res) => res.sendStatus(200));
app.options('/api/register', (_req, res) => res.sendStatus(200));
app.options('/api/channels', (_req, res) => res.sendStatus(200));
app.options('/api/channels/:channelId/messages', (_req, res) => res.sendStatus(200));

class User {
  constructor(username, birthdate, age, email, password) {
    this.username = username;
    this.birthdate = birthdate;
    this.age = age;
    this.email = email;
    this.password = password;
    this.valid = false;
  }
}


const users = [
  new User('Alan', '2001-02-03', 23, 'admin1@gmail.com', '123'),
  new User('Phil', '1999-07-15', 25, 'admin2@gmail.com', '123'),
  new User('Frank', '2000-11-30', 24, 'admin3@gmail.com', '123'),
];

const channels = [
  {
    id: 'global',
    name: 'global',
    description: 'Shared chat for everyone.',
    messages: []
  }
];

let nextMessageId = 1;

function publicChannel(channel) {
  return {
    id: channel.id,
    name: channel.name,
    description: channel.description,
    messages: channel.messages
  };
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

  const exists = users.some(u => u.email === email);

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
    valid: true
  });
});

app.get('/api/channels', (_req, res) => {
  return res.json(channels.map(publicChannel));
});

app.get('/api/channels/:channelId/messages', (req, res) => {
  const channel = channels.find(c => c.id === req.params.channelId);

  if (!channel) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  return res.json(channel.messages);
});

app.post('/api/channels/:channelId/messages', (req, res) => {
  const { author, body } = req.body || {};
  const channel = channels.find(c => c.id === req.params.channelId);

  if (!channel) {
    return res.status(404).json({ valid: false, error: 'Channel not found' });
  }

  if (!author || !body || !body.trim()) {
    return res.status(400).json({ valid: false, error: 'Author and message body are required' });
  }

  const message = createMessage(author, body.trim());
  channel.messages.push(message);

  return res.status(201).json(message);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
