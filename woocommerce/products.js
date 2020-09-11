const Product = class {
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

  async GetProducts (connect) {
    const params = {
      page: 1,
      per_page: 100
    }

    const response = await connect.get('products', params)
      .then((result) => { return result })
      .catch((error) => { return error })

    // successful - failure
    if (response.status === 200) {
      return {
        status: 'successful',
        data: response.data
      }
    } else {
      return {
        status: 'failure',
        data: { message: response.statusText }
      }
    }
  }

  /**
   * This function get alls products and return ID and SKU
   * @param  {object} connect WooCommerce connection config
   * @return {json}           Json white status and data/message
   */
  async GetAllProducts (connect) {
    // https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/.
    // per_page=: specify the number of records to return in one request, specified as an integer from 1 to 100.
    const params = {
      page: 1,
      per_page: 100 // 100 is the max permit value.
    }

    // Directory with alls products (id: sku.)
    const products = {}

    // Loop
    let response = {}
    let next = true
    do {
      // Query API.
      response = await connect.get('products', params)
        .then((result) => {
          result.data.forEach((product) => {
            products[product.sku] = product.id
          })
          return result
        })
        .catch((error) => { return error.response })

      // If the variable "data" has less than 100 records, exit the loop.
      if (Object.keys(response.data).length !== params.per_page) {
        next = false
      } else {
        // If not, next page.
        params.page = params.page + 1
      }
    } while (next)

    // Return
    if (response.status === 200) {
      return {
        status: 'successful',
        data: products
      }
    } else {
      let message
      switch (response.status) {
        case 404:
          message = 'Server not found. Please verify your config file'
          break
        case 401:
          message = 'Unauthorized. Please verify "consumerKey" and "consumerSecret" in your config file'
          break
        default:
          message = `(${response.status}) ${response.statusText}`
      }
      return {
        status: 'failure',
        data: { message: message }
      }
    }
  }

  /**
   * This function get alls products and return ID and SKU
   * @param  {object} connect  WooCommerce connection config
   * @param  {array}  products Array of productos Ej: { id: 52, regular_price: 1, sale_price: 0.76, stock_quantity: 2 }
   * @return {json}           Json white status and data/message
   */
  async UpdateProducts (connect, products) {
    // Loop
    const params = {
      update: products
    }

    const response = await connect.post('products/batch', params)
      .then((result) => { return result })
      .catch((error) => { return error.response })

    // successful - failure
    if (response.status === 200) {
      return {
        status: 'successful',
        data: response.data
      }
    } else {
      return {
        status: 'failure',
        data: { message: response.data.message }
      }
    }
  }
}

module.exports = { Product }
