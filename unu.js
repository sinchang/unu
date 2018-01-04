#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const ncp = require('copy-paste')
const request = require('request')
const cliSpinners = require('cli-spinners')
const logUpdate = require('log-update')
const updateNotifier = require('update-notifier')
const pkg = require('./package.json')

const chalkError = chalk.bold.red

updateNotifier({
  pkg
}).notify()

const questions = [{
    type: 'input',
    name: 'url',
    message: 'What\'s the url you want to shorten?',
    validate(value) {
      const expression = /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?/gi
      const regex = new RegExp(expression)
      const pass = value.match(regex)
      if (pass) {
        return true
      }
      return 'Please enter corrent url'
    }
  },
  {
    type: 'input',
    name: 'keyword',
    message: 'What\'s the custom keyword you want? (optional)'
  }
]

inquirer.prompt(questions).then(answers => {
  const api = `https://u.nu/api.php?action=shorturl&format=json&url=${answers.url}&keyword=${answers.keyword || ''}`

  const spinner = cliSpinners.dots
  let i = 0

  const timer = setInterval(() => {
    const frames = spinner.frames
    logUpdate(frames[i = ++i % frames.length])
  }, spinner.interval)

  request(api, (error, response, body) => {
    clearInterval(timer)

    if (!error && response.statusCode === 200) {
      const res = JSON.parse(body)
      if (res.code === 'error:keyword') {
        return logUpdate(chalkError(`The keyword ${answers.keyword} is taken 😞`))
      }
      ncp.copy(res.shorturl)
      return logUpdate(chalk.green(res.shorturl) + '  copied successfully ✔️')
    }

    const errorMsg = JSON.parse(body).message
    return logUpdate(chalkError(errorMsg || 'Something error, Please try again 😞'))
  })
})
