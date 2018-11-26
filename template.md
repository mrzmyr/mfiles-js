# <%= name %>

> <%= description %>

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i <%= name %> --save-dev
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
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](<%= bugs.url %>)

## Author

**<%= author.name %>**

+ [github/<%= username %>](https://github.com/<%= username %>)
+ [twitter/<%= username %>](http://twitter.com/<%= username %>)

## License
Copyright © <%= year() %> [<%= author.name %>](<%= author.url %>)
Licensed under the <%= license || licenses.join(', ') %> license.

