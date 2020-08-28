const { Command } = require('commander')

const { Logger } = require('./libs/logfile')
const { LoadConfig } = require('./libs/config')
const { LoadExcel } = require('./input/excel')
const { Product } = require('./woocommerce/products')

// Command line args
const args = new Command()
args
  .option('-c, --config <config-file>', 'Path to the config file', 'config.json')
  .option('-n, --no-logs', 'Put this argument if you want that the process do not write the logs file', false)
  .option('-s, --silent', 'Put this argument to hidden the standard output', false)
args.parse(process.argv)
// --help execute args.help() by default.
// --no-logs is equal to !logs.

// Init logger.
const logger = new Logger(args.logs, args.silent)
logger.log('Iniciando proceso')

// Load config.
const cfg = LoadConfig(args.config)
var { woocommerce, source } = {}

if (cfg.status === 'successful') {
  woocommerce = cfg.data.woocommerce
  source = cfg.data.source.filename

  // Source.
  logger.log(`Load file ${source}`)
  const excelResult = LoadExcel(source)
  if (excelResult.status === 'successful') {
    const product = new Product(woocommerce)
    excelResult.data.forEach(async (item, i) => {
      // product.UpdateProduct(item)
      logger.log(`Find id of ${item.sku}`)
      const wooProduct = await product.GetProductIDbySKU(item.sku)
      if (wooProduct.status === 200 && wooProduct.data.length) {
        // TODO
        try {
          logger.log(`Produck sku: ${item.sku} => id: ${wooProduct.data[0].id}`)
        } catch (error) {
          // si no existe el SKU responde bien (200) pero data es []
          // console.log(error)
          console.log(wooProduct.data.length)
        }
        const newData = {
          id: wooProduct.data[0].id,
          stock_quantity: item.stock_quantity,
          regular_price: item.regular_price.toString(),
          sale_price: item.sale_price.toString()
        }
        const wooUpdate = await product.UpdateProduct(newData)
        // Si se actualiza correctamente.
        if (wooUpdate.status === 200) {
          logger.log(`Product (${wooUpdate.data.id}) ${wooUpdate.data.sku} update \x1b[32m✓\x1b[0m`)
        } else {
          logger.log(wooUpdate)
          logger.log(`Data: ${JSON.stringify(newData, null, 2)}`)
        }
      } else {
        // No se puedo obtener el SKU.
        // logger.error(item)
        logger.log(`Can not find ID form this SKU:${item.sku} \x1b[31m✖\x1b[0m`, 'ERROR')
        // logger.log(`Data: ${JSON.stringify(item, null, 2)}`)
      }
    })
  } else {
    // Can't read excel or format incorrect
    logger.log(excelResult.data.message)
  }
} else {
  // Can't read config or format incorrect
  logger.log(cfg.data.message)
}
