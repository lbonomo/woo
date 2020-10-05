/**
* Object Product.
*/
const Product = class {
  /**
  * Update product.
  * @param  {object} product WooCommerce connection config
  * @return {}           Json white status and data/message.
  * request .
  */
  async UpdateProduct (product) {
    const data = {
      stock_quantity: product.stock_quantity,
      regular_price: product.regular_price,
      sale_price: product.sale_price
    }

    const request = await this.WooCommerce.put(`products/${product.id}`, data)

    return request
  }

  /**
  * Get ID by SKU
  * @param  {string} sku SKU of product.
  * @return {number}     Product ID.
  * request .
  */
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

    const products = await connect.get('products', params)
      .then((result) => {
        return {
          status: 'successful',
          data: result.data
        }
      })
      .catch((error) => {
        let message = ''
        switch (error.response.status) {
          case 404:
            message = 'Not Found'
            break
          case 401:
            message = 'Consumer key is invalid'
            break
          default:
        }
        return {
          status: 'failure',
          data: { message: message }
        }
      })

    return products
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
      // TODO - find data la respuesta puede venir en response o response.response.
      switch (response.status) {
        case 404:
          message = 'Server not found. Please verify your config file'
          break
        case 401:
          message = 'Unauthorized. Please verify "consumerKey" and "consumerSecret" in your config file'
          break
        default:
          message = `(${response.response.status}) ${response.response.data.message}`
      }
      return {
        status: 'failure',
        data: { message: message }
      }
    }
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

    // successful - failure
    if (response.status === 200) {
      return { status: 'successful', data: response.data }
    } else {
      return { status: 'failure', data: { message: message } }
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

    // WooCommerce.post("products/22/variations/batch", data)
    // .then((response) => { console.log(response.data); })
    // .catch((error) => { console.log(error.response.data); });

    const response = await connect.post(`products/${parent}/variations/batch`, params)
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
