# mfiles-js

> An unoffical M-Files JavaScript Wrapper with promise support

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i mfilesjs --save
```

## Usage

```js
const Mfiles = require('./mfiles-api.js')
const mfiles = new Mfiles({
  vault_guid: "MY_VALUT_GUID", // something like {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXX}
  vault_url: "https://…"
});

(async () => {
  await mfiles.auth({ username: "MY_USERNAME", password: "MY_PASSWORD" })

  let results = await mfiles.search('My document example title');
  console.log(results)
});
```

## Documentation

Check the detailed documentation here: [docs.md](docs.md)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/mrzmyr/mfiles-js/issues)

## Author

**mrzmyr**

* [github/mrzmyr](https://github.com/mrzmyr)
* [twitter/mrzmyr](http://twitter.com/mrzmyr)

## License

Copyright © 2018 [mrzmyr](https://github.com/mrzmyr)
Licensed under the MIT license.
