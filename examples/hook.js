//An example of hook
var fs = require('fs');

var filePath = process.argv.slice(2)[0];
fs.writeFileSync(filePath, 'test-content');
