const path = require('path')
const fs = require('fs')
const { mapObj } = require('jsUtils')
const config = require('../../config.js')
const publicDir = path.resolve(__dirname, '../../../public')

const fillTemplate = (template, data) => {
  var func = new Function(...Object.keys(data),  "return `"+ template +"`;")
  return func(...Object.values(data));
}

const buildHeadObj = attrs => {
  let attrStr = ''
  mapObj(attrs, (key, value) => attrStr += ` ${key}="${value}"`)

  return attrStr
}

const buildHead = (data={}) => {
  let headText = ''
  const headContent = {
    ...config.views.head.content,
    ...data.head
  }
  mapObj(headContent, (type, data) => {
    const { close, children, ...attrs } =  data
    let addStr = `<${type}${buildHeadObj(attrs)}>`
    if(children) addStr += `${children}`
    if(close || type === 'script') addStr += `</${type}>`
    headText += addStr + `\n`
  })

  return headText
}

const buildPage = (page, data={}) => {
  let pageText = ''
  const pageContent = {
    ...(config.views.pages[page] || {}),
    ...data.page
  }
  
  mapObj(pageContent, (type, data) => {
    const { close, children, ...attrs } =  data
    let addStr = `<${type}${buildHeadObj(attrs)}>`
    if(children) addStr += `${children}`
    if(close || type === 'script') addStr += `</${type}>`
    pageText += addStr + `\n`
  })

  return pageText
}


const getFile = (path) => {
  return new Promise((res, rej) => {
    fs.readFile(
      path, 
      'utf8',
      (err, data) => err && rej(err) || res(data)
    )
  })
}

const getIndex = async () => (
  await getFile(path.join(publicDir, '/index.html'))
)

const getTemplate = async template => (
  await getFile(path.join(publicDir, '/templates', `/${template}.html` ))
)

const getView = async (template, data) => {
  const index = await getIndex()
  const indexWithHead = index.replace(config.views.head.replace, buildHead(data))
  const tempHtml = await getTemplate(template)
  const indexWithTemp = indexWithHead.replace(config.views.body.replace, tempHtml)  
  const fullIndex = indexWithTemp.replace(config.views.pages.replace, buildPage(template, data))

  return fillTemplate(
    fullIndex,
    data || {}
  )
}

module.exports = {
  getIndex,
  getTemplate,
  getView,
}