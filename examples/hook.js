//An example of hook
var fs = require('fs');

var filePath = process.argv.slice(2)[0];
console.log('PATH');
console.log(filePath);
fs.writeFileSync(filePath, 'test-content');
