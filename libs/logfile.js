const fs = require('fs')

const YYYYMMDD = () => {
  const date = new Date()
  const day = date.getDate().toString().padStart(2, '0')
  const mount = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${year}${mount}${day}`
}

const failure = '\x1b[31m✖\x1b[0m'
const successful = '\x1b[32m✓\x1b[0m'
const SimpleNodeLogger = require('simple-node-logger')

// CLASS - Logger.
const Logger = class {
  constructor (logs, silent) {
    this.logs = logs
    this.silent = silent
  }

  Logfile (message, level = 'INFO') {
    // Logs dir ./logs
    const logDirectory = './logs'
    !fs.existsSync(logDirectory) && fs.mkdirSync(logDirectory)

    const opts = {
      level: 'info',
      logFilePath: `./${logDirectory}/woo-${YYYYMMDD()}.log`,
      timestampFormat: 'YYYY-MM-DD HH:mm:ss'
    }

    const log = SimpleNodeLogger.createSimpleLogger(opts)
    switch (level) {
      case 'INFO':
        log.info(message)
        break
      case 'SUCCESSFUL':
        log.info(`${message} ${successful}`)
        break
      case 'ERROR':
        log.error(`${message} ${failure}`)

        break
      default:
        log.info(message)
    }
  }

  log (message, level) {
    if (this.logs) {
      this.Logfile(message.toString(), level)
    } else {
      if (!this.silent) {
        console.log(message)
      }
    }
  }
}

module.exports = { Logger }
