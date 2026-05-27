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

const PORT = 3000;
app.listen(PORT, () => console.log(`Auth API running on http://localhost:${PORT}`));
