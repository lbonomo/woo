// process.exit(0)
// WooCommerce update product //
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default

const WooCommerce = class {
  Config (config) {
    const connect = new WooCommerceRestApi({
      url: config.url,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: config.version
    })
    return connect
  }
}

module.exports = { WooCommerce }
