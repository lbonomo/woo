// process.exit(0)
// WooCommerce update product //
const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default

const Product = class {
  constructor (config) {
    this.WooCommerce = new WooCommerceRestApi({
      url: config.url,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      version: config.version
    })
  }

  async UpdateProduct (product) {
    const data = {
      stock_quantity: product.stock_quantity,
      regular_price: product.regular_price,
      sale_price: product.sale_price
    }

    const request = await this.WooCommerce.put(`products/${product.id}`, data)
      .then((result) => { return result })
      .catch((e) => { return e })

    return request
  }

  async GetProductIDbySKU (sku) {
    // Return status and ID
    const params = {
      per_page: 1,
      sku: sku
    }

    const productID = await this.WooCommerce.get('products', params)
      .then((result) => { return result })
      .catch((error) => { return error })

    return productID
  }
}

module.exports = { Product }
