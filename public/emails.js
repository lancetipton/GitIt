
setTimeout(() => {
  let token
  const params = window.location.search
    .replace(/\?/g, '')
    .split('&')
    .map(param => {
      const split = param.split('=')
      if(split[0] === 'token')
      token = split[1]
    })
  
  console.log(`---------- token ----------`)
  console.log(token)
  console.log(`---------- Send token to parent Frame ----------`)
})