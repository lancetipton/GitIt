const axios = require('axios')
const config = require('../config.js')
const { getView } = require('../lib/injector')

const renderView = async (res, view, data) => {
  const html = await getView(view, data)
  res.set('Content-Type', 'text/html')
  res.send(Buffer.from(html))
}

const home = (req, res, next) => (
  renderView(res, 'home')
)

const user = async (req, res, next) => {
  try {
    const { endpoints } = config.github
    // GET request to get emails
    // this time the token is in header instead of a query string
    const response = await axios({
      method: 'GET',
      url: endpoints.emails,
      headers: {
        Authorization: 'token ' + req.session.access_token,
      }
    })

    return renderView(res, 'emails', { emails: response.data })
  }
  catch(e){
    console.error(e.message)
    console.dir(e.stack)
    renderView(res, 'git_error')
  }

}


module.exports = (app) => {
  app.get('/', home)
  app.get('/user', user)
}