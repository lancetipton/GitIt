
require('dotenv').config()
const express = require('express')
const app = express()
const session = require('express-session')
const randomString = require('randomstring')
const path = require('path')
const config = require('./config')
const port = process.env.PORT || 8081

app.APP_CONFIG = {
  ...config,
  paths: {
    public: path.resolve(__dirname, '../public'),
    lib: path.resolve(__dirname, './lib'),
    root: path.resolve(__dirname, '../'),
  },
}

app.use((req, res, next) => {
  req.APP_CONFIG = app.APP_CONFIG
  next()
})


// initializes session
app.use(
  session({
    secret: randomString.generate(),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
)

// load all the routes
require('./routes')(app)

app.use(express.static(app.APP_CONFIG.paths.public))
app.listen(port, () => {
  console.log('Server listening at port ' + port)
})