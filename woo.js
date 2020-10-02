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
var { cfgWC, cfgInput } = {}

/**
 * This function get alls products (single and variable) and return ID and SKU
 * @param  {object} connect WooCommerce connection config
 * @return {json}           Json with status and data (all products or error message)
 */
const GetProducts = async (connect) => {
  let next = false
  let status = 'failure'
  const data = {}

  // Main loop GetAllProducts
  var page = 1
  do {
    // Query API, return object {status: 'successful', data: [...]}.
    logger.log(`Getting products from page ${page}`)
    const r = await wcProducts.GetProducts(connect, page)

    if (r.status === 'successful') {
      r.data.forEach((item, i) => {
        data[String(item.sku)] = { id: item.id, type: item.type }
      })
      if (r.data.length < 100) {
        next = false
        // status = 'successful'
      } else {
        // Mas de 100 registros
        // status = 'failure'
        next = true
        page += 1
      }
    } else {
      logger.log(`Getting variations from product ID:${r.data}`, 'ERROR')
      process.exit()
    }
  } while (next)

  return data
}

/**
 * Return variations of parent
 * @param  {number} parent  WooCommerce product ID
 * @return {json}           Json with status and data (all products or error message)
 */
const GetVariations = async (connect, parentID) => {
  var variations = {}
  const response = await wcProducts.GetVariationsByParent(connect, parentID)

  if ( response.status === 'successful' ) {
    logger.log(`Getting variations from product ID:${parentID}`)
    response.data.forEach((product, i) => {
      variations[product.sku] = { id: product.id, type: 'variation', parent: parentID }
    })
    return variations
  } else {
    logger.log(`Getting variations from product ID:${response.data}`, 'ERROR')
    process.exit()
  }

}

/**
 * This function get alls products (single, variable and variations) and return ID and SKU (and parent)
 * @param  {object} connect WooCommerce connection config
 * @return {json}           Json with status and data (all products or error message)
 */
const GetAllProducts = async (connect) => {
  const allProducts = {}
  const parentIDs = []

  // Get all products (simple and variable)
  const products = await GetProducts(connect)

  Object.keys(products).forEach( (sku, i) => {
    const product = products[sku]
    // Make products object
    allProducts[sku] = { id: product.id, type:product.type }
    // Make parents list
    if ( product.type === 'variable' ) {
      parentIDs.push(product.id)
    }
  })

  // Get all variations
  do {
    const parent = parentIDs.pop()
    const x = await GetVariations(connect, parent)
    // Concateneta allProducts + x
    Object.assign(allProducts, x);
  } while (parentIDs.length > 0);

  return allProducts
}

/**
 * This function updates (regular_price, sale_price and stock_quantity) single and variable products
 * @param  {object} connect WooCommerce connection config
 * @param {json}    data    Json white status and data/message
 */
const UpdateProducts = async (connect, data) => {
  var responseUpdate = {}
  do {
    var productsLot = []
    var next = true
    // TODO - Esto no queda lindo.
    var max = (data.length <= 100) ? data.length : 100
    // Make lot of 100 products
    for (var i = 1; i <= max; i++) {
      productsLot.push(data.shift())
    }

    // Query API - Update 100 records
    responseUpdate = await wcProducts.UpdateProducts(connect, productsLot)

    if (responseUpdate.status === 'successful') {
      logger.log(`Update products (primary and variable) ${productsLot.length} records (${data.length} are pending)`, 'SUCCESSFUL')
    } else {
      // Can't update all products
      next = false
      logger.log(`${responseUpdate.data.message}`, 'ERROR')
    }
  } while (data.length > 0 && next)
}

/**
 * This function updates (regular_price, sale_price and stock_quantity)
 * of variation into variable producto (limit 100 variations by product)
 * @param  {object} connect WooCommerce connection config
 * @param {json}    data    Json white status and data/message
 */
const UpdateVariations = async (connect, data) => {
  // Group by parent
  const parents = {} // Object of products group by parentID
  data.forEach( (product, i) => {
    let parent = product.parent
    delete product.parent
    if ( parents.hasOwnProperty(parent) ) {
      parents[parent].push(product)
    } else {
      parents[parent] = []
      parents[parent].push(product)
    }
  })

  var next = true
  do {

    let [parent] = Object.keys(parents)
    let variations = parents[parent]
    delete parents[parent]
    // Query API - Update 100 records
    responseUpdate = await wcProducts.UpdateVariations(connect, parent, variations)

    if (responseUpdate.status === 'successful') {
      logger.log(`Update variations of product id:${parent} records (${variations.length} are pending)`, 'SUCCESSFUL')
    } else {
      // Can't update all products
      next = false
      logger.log(`${responseUpdate.data.message}`, 'ERROR')
    }

  } while ( Object.keys(parents).length > 0 && next )
}

/**
 * This function updates (regular_price, sale_price and stock_quantity) of the
 * all products on input file
 * @param  {object} wcConnect WooCommerce connection config
 * @param {json}    inputData Json white status and data/message
 */
const UpdateWooCommerce = async (connect, data) => {
  const products = [] // products (simple/variable)
  const variations = [] // products variation (variable's children)

  Object.keys(data).forEach( (sku, i) => {
    switch (data[sku].type) {
      case 'simple':
        products.push(data[sku])
        break
      case 'variable':
        products.push(data[sku])
        break
      case 'variation':
        variations.push(data[sku])
        break
    }
  })
  await UpdateProducts(connect, products)
  await UpdateVariations(connect, variations)

  return 'successful'
}

/**
 * Main BatchUpdateProcess
 * @param  {object} wcConnect WooCommerce connection config
 * @param {json}    inputData Json white status and data/message
 */
const BatchProcess = async (connect, data) => {
  const dataInput = data
  const batchData = []
  const productsWoo = await GetAllProducts(connect) // Todos los productos de WooComerce
  const toUpdate = {} // Products objects, only if exist in Excel file

  // Add price and stock to productsWoo
  dataInput.forEach((item, i) => {
    // Find SKU ()
    if (Object.keys(productsWoo).includes(item.sku.toString())) {
      toUpdate[item.sku] = {
        ...productsWoo[item.sku],
        regular_price: item.regular_price,
        sale_price: item.sale_price,
        stock_quantity: item.stock_quantity
      }
    } else {
      logger.log(`This product is not present in WooCommerce. SKU: ${item.sku}`, 'ERROR')
    }
  })

  // Send Batch
  logger.log(`Will try to update ${Object.keys(toUpdate).length} products`)

  const update = await UpdateWooCommerce(connect, toUpdate)
  if ( update === 'successful' ) {
    return 'successful'
  } else {
    return 'failure'
  }
}

/**
 * Main process
 */
const main = async () => {
  logger.log('Init the process')

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
  let batch = 'failure'
  if (inputData.status === 'successful') {
    batch = await BatchProcess(wcConnect, inputData.data)
  }

  // Salida
  if ( batch === 'successful' ) {
    logger.log('Apparently everything is fine, check your data', 'SUCCESSFUL')
  } else {
    logger.log('Algo salio mal', 'ERROR')
  }
}

main()
