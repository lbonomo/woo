const { Command } = require('commander')

const { Logger } = require('./libs/logfile')
const { LoadConfig } = require('./libs/config')
const { Excel } = require('./input/excel')
const { Product } = require('./woocommerce/products')
const { WooCommerce } = require('./woocommerce')

// Command line args
const args = new Command()
args
  .option('-c, --config <config-file>', 'Path to the config file', 'config.json')
  .option('-n, --no-logs', 'Put this argument if you want that the process do not write the logs file', false)
args.parse(process.argv)
// --help execute args.help() by default.
// --no-logs is equal to !logs.

// Init logger.
const excel = new Excel()
const woocommerce = new WooCommerce()
const wcProducts = new Product()
const logger = new Logger(args.logs, args.silent)

logger.log('Iniciando proceso')
var { cfgWC, cfgInput } = {}

/**
 * This function get alls products and return ID and SKU
 * @param  {object} connect WooCommerce connection config
 * @return {json}           Json with status and data (all products or error message)
 */
const GetAllProducts = async (connect) => {
  // Directory with alls products (id: sku.)
  const products = {}
  let status = 'failure'
  let data = {}
  // Loop
  let response = {}
  let next = true
  let page = 1

  do {
    // TODO - Query the Rest API (GetAllProducts).
    response = await wcProducts.GetProducts(connect, page)

    if (response.status === 'successful') {
      logger.log(`Download ${Object.keys(response.data).length} products from page ${page}`, 'SUCCESSFUL')

      // Make products object {sku:id}
      response.data.forEach((product) => {
        products[String(product.sku)] = product.id
      })

      if (Object.keys(response.data).length < 100) {
        // There are no more pages
        next = false
        status = 'successful'
        data = products
      } else {
        // There are more pages
        page = page + 1
      }
    } else {
      // Something went wrong
      status = 'failure'
      data = response.data.message
      next = false
    }
  } while (next)

  return {
    status: status,
    data: data
  }
}

/**
 * This function updates (regular_price, sale_price and stock_quantity) of the
 * all products on input file
 * @param  {object} wcConnect WooCommerce connection config
 * @param {json}    inputData Json white status and data/message
 */
const BatchUpdate = async (connect, data) => {
  logger.log('Try to get all products')

  const response = await GetAllProducts(connect)

  if (response.status === 'successful') {
    logger.log(`Download ${Object.keys(response.data).length} products`, 'SUCCESSFUL')
    const products = response.data // { id:sku.... }
    // update: [ { id: 799, regular_price:'' ,sale_price:'' ,stock_quantity:'' ]
    const batchData = []

    // Merge data
    // For data in input add id field and make batchData
    data.forEach((item, i) => {
      // Find SKU ()
      if (Object.keys(products).includes(item.sku.toString())) {
        batchData.push({
          // if SKU do not existe in WooCommerce Alert
          id: products[item.sku],
          regular_price: item.regular_price,
          sale_price: item.sale_price,
          stock_quantity: item.stock_quantity
        })
      } else {
        logger.log(`This product is not present in WooCommerce. SKU: ${item.sku}`, 'ERROR')
      }
    })

    // Send Batch
    logger.log(`Will try to update ${batchData.length} products`)
    // Loop
    var responseUpdate = {}
    do {
      var productsLot = []
      var next = true
      // TODO - Esto no queda lindo.
      var max = (batchData.length <= 100) ? batchData.length : 100
      for (var i = 1; i <= max; i++) {
        productsLot.push(batchData.shift())
      }

      // Query API - Update 100 records
      responseUpdate = await wcProducts.UpdateProducts(connect, productsLot)

      if (responseUpdate.status === 'successful') {
        logger.log(`Update ${productsLot.length} records (${batchData.length} are pending)`, 'SUCCESSFUL')
      } else {
        // Can't update all products
        next = false
        logger.log(`${responseUpdate.data.message}`, 'ERROR')
      }
    } while (batchData.length > 0 && next)
  } else {
    // Can't get all products
    logger.log(`${response.data.message}`, 'ERROR')
  }
}

const main = async () => {
  const cfg = await LoadConfig(args.config)

  var inputData = {}
  var wcConnect = {}

  // Load config.
  if (cfg.status === 'successful') {
    cfgWC = cfg.data.woocommerce
    cfgInput = cfg.data.source.filename
    inputData = await excel.Load(cfgInput)
    wcConnect = await woocommerce.Config(cfgWC)
  } else {
    // Can't read config or format incorrect
    logger.log(cfg.data.message)
  }

  // Load input data
  if (inputData.status === 'successful') {
    logger.log(`Just ${Object.keys(inputData.data).length} products in ${cfgInput}`, 'SUCCESSFUL')
  } else {
    // Can't read excel or format incorrect
    logger.log(inputData.data.message, 'ERROR')
  }

  // Batch process
  if (inputData.status === 'successful') {
    BatchUpdate(wcConnect, inputData.data)
  }
}

main()
