const site = require('./site')
const github = require('./github')

module.exports = app => {
  site(app)
  github(app)
}