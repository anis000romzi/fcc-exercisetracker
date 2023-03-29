const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String,
  user_id: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app
  .route('/api/users')
  .get(async (req, res) => {
    try {
      const data = await User.find({});
      res.send(data);
    } catch (error) {
      res.json({ error });
    }
  })
  .post(async (req, res) => {
    try {
      const dataCreate = await User.create({ username: req.body.username });
      res.json({ username: dataCreate.username, _id: dataCreate._id });
    } catch (error) {
      res.json({ error });
    }
  });

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const data = await User.findById(req.params._id);
    if (data) {
      try {
        const dataCreate = await Exercise.create({
          description: req.body.description,
          duration: Number(req.body.duration),
          date: new Date(req.body.date || Date.now()).toDateString(),
          user_id: data._id,
        });
        res.json({
          username: data.username,
          description: dataCreate.description,
          duration: dataCreate.duration,
          date: dataCreate.date,
          _id: dataCreate.user_id,
        });
      } catch (error) {
        res.json({ error });
      }
    } else {
      res.json({ error: 'User not found' });
    }
  } catch (error) {
    res.json({ error });
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const data = await User.findById(req.params._id);
  const response = { _id: data._id, username: data.username };
  let exerciseData = await Exercise.find({ user_id: req.params._id }, 'description duration date -_id');

  if (req.query.from) {
    if (!new Date(req.query.from).getTime()) {
      exerciseData;
    } else {
      exerciseData = exerciseData.filter(
        (data) =>
          new Date(data.date).getTime() >= new Date(req.query.from).getTime()
      );
      response.from = new Date(req.query.from).toDateString();
    }
  }
  if (req.query.to) {
    if (!new Date(req.query.to).getTime()) {
      exerciseData;
    } else {
      exerciseData = exerciseData.filter(
        (data) =>
          new Date(data.date).getTime() <= new Date(req.query.to).getTime()
      );
      response.to = new Date(req.query.to).toDateString();
    }
  }
  if (req.query.limit) {
    exerciseData = exerciseData.splice(0, req.query.limit);
  }
  res.json({ ...response, count: exerciseData.length, log: exerciseData });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
