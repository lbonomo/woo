const fs = require('fs')
const { Command } = require('commander')
const { Logger } = require('./libs/logfile')
const { LoadConfig } = require('./libs/config')
const { Excel } = require('./input/excel')
const { Product } = require('./woocommerce/products')
const { WooCommerce } = require('./woocommerce')
const { sleep } = require('./libs/times')

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
 * @return {object}         Json with status and data (all products or error message)
 */
const GetProducts = async (connect) => {
  // TODO - Review
  let next = false
  const data = {}
  var status = ''

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
        status = 'successful'
      } else {
        // Mas de 100 registros
        next = true
        page += 1
      }
    } else {
      logger.log(`${r.data.message}`, 'ERROR')
      await sleep(1) // TODO - Await to logger.
      process.exit(1)
    }
  } while (next)

  return {
    status: status,
    data: data
  }
}

/**
 * Return variations of parent
 * @param  {object} connect   WooCommerce connection config
 * @param  {number} parentID  WooCommerce product ID
 * @return {object}           Json with status and data (all products or error message)
 */
const GetVariations = async (connect, parentID) => {
  var variations = {}
  const response = await wcProducts.GetVariationsByParent(connect, parentID)

  if (response.status === 'successful') {
    logger.log(`Getting variations from product ID:${parentID}`)
    response.data.forEach((product, i) => {
      variations[product.sku] = { id: product.id, type: 'variation', parent: parentID }
    })
    return {
      status: 'successful',
      data: variations
    }
  } else {
    logger.log(`${response.data}`, 'ERROR')
    await sleep(1) // TODO - Await to logger.
    process.exit(1)
  }
}

/**
 * This function get alls products (single, variable and variations) and return ID and SKU (and parent)
 * @param  {object} connect WooCommerce connection config
 * @return {object}           Json with status and data (all products or error message)
 */
const GetAllProducts = async (connect) => {
  const allProducts = {}
  const parentIDs = []

  // Get all products (simple and variable)
  const rProducts = await GetProducts(connect)
  const products = rProducts.data

  // if GetProducts has an error, process exit

  Object.keys(products).forEach((sku, i) => {
    const product = products[sku]
    // Make products object
    allProducts[sku] = { id: product.id, type: product.type }
    // Make parents list
    if (product.type === 'variable') {
      parentIDs.push(product.id)
    }
  })

  // Get all variations
  do {
    const parent = parentIDs.pop()
    const variation = await GetVariations(connect, parent)
    // if GetProducts has an error, process exit
    // Concateneta allProducts + x
    Object.assign(allProducts, variation.data)
  } while (parentIDs.length > 0)

  if (cfgWC.cache) {
    await SaveProductsCache(allProducts)
  }

  // Return only products
  return allProducts
}

/**
 * This function updates (regular_price, sale_price and stock_quantity) single and variable products
 * @param  {object} connect WooCommerce connection config
 * @param  {object} data    Json white status and data/message
 * @return {object}         Json with status
 */
const UpdateProducts = async (connect, data) => {
  var responseUpdate = {}
  var status = ''
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
      status = 'successful'
    } else {
      // Can't update all products
      next = false
      logger.log(`${responseUpdate.data.message}`, 'ERROR')
      status = 'failure'
    }
  } while (data.length > 0 && next)
  return { status }
}

/**
 * This function update all variations into all variable products
 * @param  {object} connect WooCommerce connection config
 * @param  {object} data    List of variable products
 * @return {object}         Json with status
 */
const UpdateVariations = async (connect, data) => {
  // Group product by parent
  const parents = {} // Object of products group by parentID
  data.forEach((product, i) => {
    const parent = product.parent
    delete product.parent
    if (parent in parents) {
      parents[parent].push(product)
    } else {
      parents[parent] = []
      parents[parent].push(product)
    }
  })

  var retryTimes = cfgWC.retry.times
  var retryAwait = cfgWC.retry.await
  var next = true
  var status = ''
  do {
    const [parent] = Object.keys(parents)
    const variations = parents[parent]
    // If variations.length is greater than 100, it is broken.
    const responseUpdate = await wcProducts.UpdateVariations(connect, parent, variations)

    if (responseUpdate.status === 'successful') {
      delete parents[parent]
      status = 'successful'
      logger.log(`Update variations of product id:${parent} records (${variations.length})`, 'SUCCESSFUL')
    } else {
      // Can't update variation
      if (retryTimes > 0) {
        next = true
        retryTimes -= 1
        logger.log(`${responseUpdate} ... await and retry(${retryTimes})`, 'ERROR')
        await sleep(retryAwait)
      } else {
        next = false
        status = 'failure'
        logger.log(`${responseUpdate}`, 'ERROR')
      }
    }
  } while (Object.keys(parents).length > 0 && next)
  return { status }
}

/**
 * This function updates (regular_price, sale_price and stock_quantity) of the
 * all products on input file
 * @param  {object} connect  WooCommerce connection
 * @param  {object} data     List of all products
 */
const UpdateWooCommerce = async (connect, data) => {
  const products = [] // products (simple/variable)
  const variations = [] // products variation (variable's children)

  Object.keys(data).forEach((sku, i) => {
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
  const rProducts = await UpdateProducts(connect, products)
  if (rProducts.status !== 'successful') {
    return rProducts // if something went wrong
  }

  const rVariations = await UpdateVariations(connect, variations)
  return rVariations
}

/**
 * This function save a product file
 * @param  {object} products Products list
 */
const SaveProductsCache = async (products) => {
  const expires = Date.now() + cfgWC.cache.ttl * 1000
  const dirCache = cfgWC.cache.dir
  const cacheFile = `${cfgWC.cache.dir}/${(new URL(cfgWC.url)).hostname}.json`
  const data = { expires, products }
  // if cache dir not exist create
  if (!fs.existsSync(dirCache)) {
    fs.mkdirSync(dirCache)
  }
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, ' '))
}

/**
 * This function load file cache
 */
const LoadProductsCache = async () => {
  const cacheFile = `${cfgWC.cache.dir}/${(new URL(cfgWC.url)).hostname}.json`
  let status = ''
  let data = {}
  let products
  let cacheExpire
  // Try to read cache file.
  try {
    const rowData = fs.readFileSync(`${cacheFile}`)
    const cacheJSON = JSON.parse(rowData)
    products = cacheJSON.products
    cacheExpire = cacheJSON.expires // Date when the cache expire
    if (cacheExpire > Date.now()) {
      const date = new Date(cacheExpire).toLocaleString()
      logger.log(`The cache file is valid until ${date}`)
      status = 'successful'
      data = products
    } else {
      // Reload products
      const date = new Date(cacheExpire).toLocaleString()
      status = 'failure'
      data = { message: `Cache has expired at ${date}, need to reload all products` }
    }
  } catch (error) {
    status = 'failure'
    data = { message: `No such file or directory, open ${cacheFile}` }
  }
  return { status, data }
}

/**
 * Main BatchUpdateProcess
 * @param  {object}  connect WooCommerce connection
 * @param  {object}  data    Excel file content
 */
const BatchProcess = async (connect, data) => {
  const dataInput = data

  let productsWoo = {}
  // if cache is avaliable
  if (cfgWC.cache.enabled) {
    const loadCahe = await LoadProductsCache()
    if (loadCahe.status === 'successful') {
      logger.log('Will use the product cache')
      productsWoo = loadCahe.data
    } else {
      logger.log(loadCahe.data.message, 'ERROR')
      productsWoo = await GetAllProducts(connect) // Todos los productos de WooComerce
    }
  } else {
    productsWoo = await GetAllProducts(connect) // Todos los productos de WooComerce
  }

  const toUpdate = {} // Products objects, only if exist in Excel file

  // Add price and stock to productsWoo from Excel.
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
  return update
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
  var batch = {}
  if (inputData.status === 'successful') {
    batch = await BatchProcess(wcConnect, inputData.data)
  }

  // Salida
  if (batch.status === 'successful') {
    logger.log('Apparently everything is fine, check your data', 'SUCCESSFUL')
  } else {
    logger.log('Something went wrong', 'ERROR')
  }
}

main()
