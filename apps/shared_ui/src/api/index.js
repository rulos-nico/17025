import express from 'express';

connst port = process.env.PORT ?? 1234;
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
