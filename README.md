BEMe
==================

Helper for auto-creation BEM dir and file structure

Installation
==
npm i beme  
Global gulp needs: npm i gulp -g

Usage
==
[default-action]: gulp -f ./test/test.deps.js  
[rename]: gulp rename -f ./test/__lol -p newElemName

Usage with Webstorm
==
Add external tool:

For default task:  
program: gulp  
parameters: -f $FilePath$  
working directory: [path to BEMe, e.g. /Users/f0rmat1k/node_modules/beme]

And hotkey, e.g. ctrl + A.

Default behavior:  
select dir __elem + [ctrl + A] => [new file] block__elem.css  
select file *.deps.js + [ctrl + A] => [new dir] __elem, [mkdir] __elem, ..

For create task:  
program: gulp  
parameters: create -f $FilePath$ -p "$Prompt$"  
working directory: [path to BEMe, e.g. /Users/f0rmat1k/node_modules/beme]

Deep block renaming coming soon..
