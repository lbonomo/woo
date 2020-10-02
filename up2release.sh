#!/usr/bin/env bash

release="$(jq --raw-output '.version' < package.json)"
echo "Subiendo a Release v$release"

## Datos Github
source github.vars

echo "Create new release v$release"
upload_url=$(curl -s -H "Authorization: token $github_api_token"  \
     -d '{"tag_name": "v'$release'", "name":"v'$release'","body":"New release"}'  \
     "https://api.github.com/repos/$owner/$repo/releases" | jq -r '.upload_url')

upload_url="${upload_url%\{*}"

echo "Uploading asset to release to url : $upload_url"

for file in 'woo.exe' 'woo'
do
  echo "Upload $file"
  curl -s -H "Authorization: token $github_api_token" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @build/$file "$upload_url?name=$file&label=$file"
done
