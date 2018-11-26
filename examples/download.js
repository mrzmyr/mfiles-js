const fs = require('fs');
const rp = require('request-promise');

const config = require('./config.json')

const Mfiles = require('../index.js')
const mfiles = new Mfiles({
  vault_guid: config.vault_guid,
  vault_url: config.vault_url
});

(async () => {
  await mfiles.auth({ username: config.username, password: config.password })

  let object = await mfiles.getObject('0', '359102');
  let file = object.Files[0];
  let data = await mfiles.downloadFile('0', '359102', file.ID)
  fs.writeFileSync(`./dist/${file.EscapedName}`, data);
})();
