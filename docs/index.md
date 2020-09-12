## Binaries

If you like to download the binary version, use this links

 - [Window x86-64](https://github.com/lbonomo/woo/releases/download/v0.0.5/woo.exe)
 - [Linux x86-64](https://github.com/lbonomo/woo/releases/download/v0.0.5/woo)

## Config
The config file is a json format similar this:

```json
{
  "version": 1,
  "woocommerce": {
    "url": "http://woocommerce.lndo.site/" ,
    "consumerKey": "ck_a6849f91fc021160c8fde2dadc9aa91aa733f46d",
    "consumerSecret": "cs_29abba0e6335270b904328494d908efa2937479b",
    "wpAPI": true,
    "version": "wc/v3"
  },
  "source": {
    "filename": "example.xlsx"
  }
}
```
You can download an example at this [link](https://github.com/lbonomo/woo/blob/master/config.json.example?raw=true)

## Input
The input file is a Excel format 2007-365 file. You can download a example at this [link](https://github.com/lbonomo/woo/blob/master/example.xlsx?raw=true)

## Runing
<!-- ffmpeg -i woo.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" woo.gif -->
![Watch the video](./woo.gif)
