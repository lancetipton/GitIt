const path = require('path')
const publicDir = path.resolve(__dirname, '../../public')
const randomString = require('randomstring')
const axios = require('axios')
const qs = require('querystring')

const home = (req, res, next) => {  
  res.sendFile(path.join(publicDir, '/index.html'))
}

const login = (req, res, next) => {
    // generate that csrf_string for your "state" parameter
  req.session.csrf_string = randomString.generate()

  const githubAuthUrl =
    'https://github.com/login/oauth/authorize?' +
    qs.stringify({
      client_id: process.env.CLIENT_ID,
      redirect_uri: req.APP_CONFIG.github.callback,
      state: req.session.csrf_string,
      scope: process.env.SCOPES || 'user:email'
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

    if (req.session.csrf_string !== returnedState)
      return res.redirect('/')

    const response = await axios({
      method: 'POST',
      url: 'https://github.com/login/oauth/access_token',
      data: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
        redirect_uri: req.APP_CONFIG.github.callback,
        state: req.session.csrf_string
        
      }
    })
    // Get the access token from the response
    req.session.access_token = qs.parse(response.data).access_token

    res.redirect('/user')
  }
  catch(e){
    console.error(e.message)
    console.dir(e.stack)

    res.send(`
      <p>Could not log into github. Please try again later</p>
      <p>Go back to <a href="/">log in page</a>.</p>
    `)
  }

}

const user = async (req, res, next) => {
  try {
    // GET request to get emails
    // this time the token is in header instead of a query string
    const response = await axios({
      method: 'GET',
      url: 'https://api.github.com/user/public_emails',
      headers: {
        Authorization: 'token ' + req.session.access_token,
      }
    })
    
    res.send(`
      <p>You're logged in! Here's all your emails on GitHub: </p>
      <p>${JSON.stringify(response.data)}</p>
      <p>Go back to <a href="/">log in page</a>.</p>
    `)
  }
  catch(e){
    console.error(e.message)
    console.dir(e.stack)

    res.send(`
      <p>Could not log into github. Please try again later</p>
      <p>Go back to <a href="/">log in page</a>.</p>
    `)
  }

}

const ghHook = (req, res, next) => {
  res.sendFile(path.join(publicDir, '/index.html'))
}

module.exports = (app, next) => {
  app.get('/', home)

  app.get('/login', login)
  
  app.all('/redirect', redirect)
  
  app.all('/ghhook', ghHook)

  app.get('/user', user)
}