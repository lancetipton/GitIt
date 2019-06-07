const randomString = require('randomstring')
const axios = require('axios')
const qs = require('querystring')
const config = require('../config.js')

const renderView = async (res, view, data) => {
  const html = await getView(view, data)
  res.set('Content-Type', 'text/html')
  res.send(Buffer.from(html))
}


const login = (req, res, next) => {
    // generate that csrf_string for your "state" parameter
  req.session.csrf_string = randomString.generate()
  
  const { endpoints } = config.github
  
  const githubAuthUrl =
    endpoints.oauth +
    qs.stringify({
      client_id: process.env.CLIENT_ID,
      redirect_uri: endpoints.callback,
      state: req.session.csrf_string,
      scope: process.env.SCOPES || 'repo'
    })
  // redirect user with express
  res.redirect(githubAuthUrl)
}


const redirect = async (req, res, next) => {
  try {

    // Here, the req is request object sent by GitHub
    console.log('Request sent by GitHub: ')
    console.log(req.query)

    const code = req.query.code
    const returnedState = req.query.state
    const { endpoints } = config.github
    
    if (req.session.csrf_string !== returnedState)
      return res.redirect('/')

    const response = await axios({
      method: 'POST',
      url: endpoints.accessToken,
      data: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
        redirect_uri: endpoints.callback,
        state: req.session.csrf_string
        
      }
    })
    // Get the access token from the response
    req.session.access_token = qs.parse(response.data).access_token

    res.redirect(`/user?token=${req.session.access_token}`)
  }
  catch(e){
    console.error(e.message)
    console.dir(e.stack)
    renderView(res, 'git_error')
  }

}

const ghHook = (req, res, next) => (
  renderView(res, 'home')
)

module.exports = (app) => {
  app.get('/login', login)
  app.all('/redirect', redirect)
  app.all('/ghhook', ghHook)
}