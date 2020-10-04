# Woo - WooCommerce CLI

## Config
By default, woo will be try to read `./config.json` file, but do you can to modified this with the config param (ej: `--config=my-site.json`)

```
{
  "version": 1,
  "woocommerce": {
    "url": "http://woocommerce.lndo.site/",
    "consumerKey": "ck_11caec96c27db305e36cdb5b0b485fd7ffea633b",
    "consumerSecret": "cs_119a3d4f3f2b92dc3d72e4b986a1662038960785",
    "wpAPI": true,
    "version": "wc/v3",
    "cache": {
      "enabled": true,
      "dir": "./cache",
      "ttl": 3600
    },
    "retry": {
      "times": 5,
      "wait": 1
    }
  },
  "source": {
    "filename": "./example.xlsx"
  }
}
```

To get the `consumerKey` and `consumerSecret` got to WooCommerce > Settings > Advanced > REST API > press "Create an API key" and complete
description (ej: woo), user and permissions (read/write) > Generate API key. Use the generated data to make the config file.

For more info about WooCommerce REST API read this [link](https://docs.woocommerce.com/document/woocommerce-rest-api/)

## Logs
All the processes register in log file into the `logs` directory with the next format `woo-YYYYMMDD.log` if you like to remove this action, you need to add `--no-logs or -n` argument when execute the command
