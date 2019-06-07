const port = process.env.PORT || 8081

module.exports = {
  port,
  github: {
    endpoints: {
      oauth: 'https://github.com/login/oauth/authorize?',
      callback: `http://localhost:${port}/redirect`,
      accessToken: 'https://github.com/login/oauth/access_token',
      emails: 'https://api.github.com/user/public_emails',
    }
  },
  views: {
    head: {
      content: {
        link: { rel: "stylesheet", href: "./index.css", type: "text/css" },
        meta: { charset: "utf-8" },
        meta: { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0" },
        title: { close: true, children: 'GitIt' },
      },
      replace: '{{ HEAD_CONTENT_REPLACE }}'
    },
    body: {
      replace: '{{ BODY_CONTENT_REPLACE }}'
    },
    pages: {
      replace: '{{ PAGE_CONTENT_REPLACE }}',
      emails: {
        script: { src: './emails.js' }
      }
    }
  },
}