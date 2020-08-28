const fs = require('fs')

const CheckConfig = (rawdata) => {
  // TODO - jsonschema to validate config.
  // let error = false
  // try {
  //   const { woocommerce, source, logs } = JSON.parse(rawdata)
  //   if (
  //     (!typeof(woocommerce) === 'object') ||
  //     (!typeof (source) === 'object') ||
  //     (!typeof (logs) === 'boolean')
  //   ) {
  //     error = true
  //   }
  // } catch (e) {
  //   console.log(e)
  //   error = true
  // }
  //
  // if (error) {
  //   return false
  // } else {
  //   return true
  // }
  return true
}

// Load config --config=filename.json or load ./config.json
const LoadConfig = (file = 'config.json') => {
  var rawdata = ''
  if (fs.existsSync(file)) {
    rawdata = fs.readFileSync(file)
  } else {
    return {
      status: 'failure',
      data: { message: 'Can not read the config file' }
    }
  }

  if (CheckConfig(rawdata)) {
    return {
      status: 'successful',
      data: JSON.parse(rawdata)
    }
  } else {
    return {
      status: 'failure',
      data: { message: 'Please check the format of the config file' }
    }
  }
}

module.exports = { LoadConfig }
