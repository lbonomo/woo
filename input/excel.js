const xlsx = require('node-xlsx')
const fs = require('fs')

// console.log(workSheetsFromFile[0].data)
// [ 'SKU', 'Precio normal', 'Precio promo', 'Inventario' ]
const LoadExcel = (file) => {
  if (fs.existsSync(file)) {
    const workSheetsFromFile = xlsx.parse(file)
    const data = []
    for (const row in workSheetsFromFile[0].data) {
      if (workSheetsFromFile[0].data[row].length >= 1 && row >= 1) {
        const product = workSheetsFromFile[0].data[row]
        data.push({
          sku: product[0],
          regular_price: product[1],
          sale_price: product[2],
          stock_quantity: product[3]
        })
      }
    }
    return {
      status: 'successful',
      data: data
    }
  } else {
    return {
      status: 'failure',
      data: { message: 'Can not read the excel file' }
    }
  }
}

module.exports = { LoadExcel }
