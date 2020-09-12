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

  /**
   * This function get alls products and return ID and SKU
   * @param  {object} connect WooCommerce connection config
   * @param  {number} page    Page
   * @return {json}           Json white status and data/message
   */
  async GetProducts (connect, page) {
    // https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/.
    // per_page=: specify the number of records to return in one request, specified as an integer from 1 to 100.
    const params = {
      page: page,
      per_page: 100 // 100 is the max permit value.
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
