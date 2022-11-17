const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/user');
const Exercise = require('./models/exercise');
require('dotenv').config();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('connected to DB'));

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('username id');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const foundUser = await User.findOne({ username: req.body.username });
  if (foundUser) {
    return res.json(foundUser);
  }
  const user = await User.create({ username: req.body.username });
  return res.json(user);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = mongoose.Types.ObjectId(req.params._id.trim());
  console.log('body', req.body);

  const exercise = new Exercise({
    user: id,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
  });

  const ex = await exercise.save();

  const savedExercise = await Exercise.findOne({ _id: ex._id })
    .populate({
      path: 'user',
      select: 'username',
    })
    .exec();

  res.json({
    username: savedExercise.user.username,
    description: savedExercise.description,
    duration: savedExercise.duration,
    date: new Date(savedExercise.date).toDateString(),
    _id: savedExercise.user._id,
  });
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const user = await User.findById(req.params._id);
  const limit = Number(req.query.limit) || 0;
  const from = req.query.from || new Date(0);
  const to = req.query.to || new Date(Date.now());

  let exerciseData = await Exercise.find({
    user: req.params._id,
    date: { $gte: from, $lte: to },
  })
    .select('-_id -userid -__v')
    .limit(limit);

  // let exerciseData = await Exercise.where("user", user._id)
  //   .where("date")
  //   .gte(from)
  //   .lte(to)
  //   .limit(limit)
  //   .exec();

  //convert date to string
  exerciseData = exerciseData.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: new Date(ex.date).toDateString(),
  }));

  res.json({
    username: user.username,
    count: exerciseData.length,
    _id: user._id,
    log: exerciseData,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
