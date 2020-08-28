function DateShort () {
  let date = new Date().toISOString().substring(0, 10)
  return date
}


module.export = DateShort
