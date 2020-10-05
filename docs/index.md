## Binaries

If you like to download the binary version, use this links

 - [Window x86-64](https://github.com/lbonomo/woo/releases/download/v0.1.2/woo.exe)
 - [Linux x86-64](https://github.com/lbonomo/woo/releases/download/v0.1.2/woo)

## Config
The config file is a json format similar this:


```json
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

- `woocommerce.cache.ttl` is time to live of cache in seconds
- `woocommerce.retry.wait` is time between retry in seconds

You can download an example at this [link](https://github.com/lbonomo/woo/blob/master/config.json.example?raw=true)

## Input
The input file is a Excel format 2007-365 file. You can download a example at this [link](https://github.com/lbonomo/woo/blob/master/example.xlsx?raw=true)

## Runing
<!-- ffmpeg -i woo.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" woo.gif -->
![Watch the video](./woo.gif)
