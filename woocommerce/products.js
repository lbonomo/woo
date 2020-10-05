/**
* Object Product.
*/
const Product = class {
  /**
  * This function get alls products and return ID and SKU
  * @param  {number} status  Status code
  * @return {string}         String
  */
  GetMessage (status) {
    let message = ''
    switch (status) {
      case 401:
        message = 'Consumer key is invalid'
        break
      case 404:
        message = 'Not Found'
        break
      case 500:
        message = 'Internal Server Error'
        break
      case 502:
        message = 'Bad Gateway'
        break
      default:
        message = status
    }
    return message
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

    const products = await connect.get('products', params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })
    return products
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
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })

    return response
  }

  /**
  * This function get alls products and return ID and SKU
  * @param  {object} connect  WooCommerce connection config
  * @param  {array}  products Array of productos Ej: { id: 52, regular_price: 1, sale_price: 0.76, stock_quantity: 2 }
  * @return {json}           Json white status and data/message
  */
  async UpdateVariations (connect, parent, variations) {
    // Loop
    const params = {
      update: variations
    }

    const response = await connect.post(`products/${parent}/variations/batch`, params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })

    return response
  }

  /**
  * This function get alls products and return ID and SKU
  * @param  {object} connect WooCommerce connection config
  * @param  {number} page    Page
  * @return {json}           Json white status and data/message
  */
  async GetVariations (connect, page) {
    // https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/.
    // per_page=: specify the number of records to return in one request, specified as an integer from 1 to 100.
    const params = {
      page: page,
      type: 'variable',
      per_page: 100 // 100 is the max permit value.
    }

    const response = await connect.get('products', params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })
    return response
  }

  /**
  * Get ID by SKU
  * @param  {string} sku SKU of product.
  * @return {number}     Product ID.
  * request .
  */
  async GetProductIDbySKU (connect, sku) {
    // Return status and ID
    const params = {
      per_page: 1,
      sku: sku
    }

    const response = await connect.get('products', params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })
    return response
  }

  /**
   * This function get alls products and return ID and SKU
   * @param  {object} connect WooCommerce connection config
   * @param  {number} father  Product father
   * @return {json}           Json white status and data/message
   */
  async GetVariationsByParent (connect, parent) {
    const params = {
      page: 1,
      per_page: 100 // 100 is the max permit value.
    }
    const response = await connect.get(`products/${parent}/variations`, params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })
    return response
  }

  /**
   * This function get alls products and return ID and SKU
   * @param  {object} connect WooCommerce connection config
   * @param  {object} Product Product data
   * @return {json}           Json white status and data/message
   */
  async UpdateProduct (connect, product) {
    const data = {
      stock_quantity: product.stock_quantity,
      regular_price: product.regular_price,
      sale_price: product.sale_price
    }
    const request = await connect.put(`products/${product.id}`, data)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        const message = this.GetMessage(error.response.status)
        return {
          status: 'failure',
          data: { message: message }
        }
      })
    return request
  }
}

module.exports = { Product }
