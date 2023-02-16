const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const User = require('./models/user')
const Exercise = require('./models/exercise')
require('dotenv').config()

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log('connected to Database'))

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))

const testPattern = (date) => {
  const pattern =
    /^(0?[1-9]|1[0-2])[\/](0?[1-9]|[12]\d|3[01])[\/](19|20)\d{2}$/g

  if (!pattern.test(date.trim())) {
    throw new Error('Wrong date format')
  }
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('id username')
  res.json(users)
})

app.post('/api/users', async (req, res) => {
  const foundUser = await User.findOne({ username: req.body.username })
  if (foundUser) {
    return res.json(foundUser)
  }
  const user = await User.create({ username: req.body.username })
  return res.json(user)
})

app.post('/api/users/:username/exercise', async (req, res) => {
  try {
    if (
      !req.params.username ||
      !req.body.description ||
      !req.body.duration ||
      !req.body.date
    ) {
      throw new Error('You must fill all the fields!')
    }

    const user = await User.findOne({ username: req.params.username.trim() })
    if (!user) {
      throw new Error('Username does not exist')
    }

    testPattern(req.body.date)

    const exercise = new Exercise({
      user: user._id,
      description: req.body.description,
      duration: Number(req.body.duration),
      date: req.body.date
        ? new Date(req.body.date).toDateString()
        : new Date().toDateString(),
    })

    const ex = await exercise.save()

    const savedExercise = await Exercise.findOne({ _id: ex._id })
      .populate({
        path: 'user',
        select: 'username',
      })
      .exec()

    res.json({
      username: savedExercise.user.username,
      description: savedExercise.description,
      duration: savedExercise.duration,
      date: new Date(savedExercise.date).toDateString(),
      _id: savedExercise.user._id,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
    console.log('error', error)
  }
})

app.get('/api/users/:username/logs', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.trim() })
    if (!user) {
      throw new Error('User does not exist')
    }

    const limit = Number(req.query.limit) || 0
    const from = req.query.from || new Date(0)
    const to = req.query.to || new Date(Date.now())

    let exerciseData = await Exercise.find({
      user: user._id,
      date: { $gte: from, $lte: to },
    })
      .select('-_id -userid -__v')
      .limit(limit)

    exerciseData = exerciseData.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString(),
    }))

    res.json({
      username: user.username,
      count: exerciseData.length,
      _id: user._id,
      log: exerciseData,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`App is listening on port ${process.env.PORT}`)
})
