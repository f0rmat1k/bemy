gulp-bem-structure
==================

Helper for auto-creation BEM dir and file structure

Installation
==
npm i -g git+https://github.yandex-team.ru/f0rmat1k/BEMe.git

Webstorm
==
Add external tool:

For default task:
program: node  
parameters: /usr/local/lib/node_modules/BEMe/BEMe.js $FilePath$  
working directory: $ProjectFileDir$

And hotkey, e.g. ctrl + A.

Default behavior:  
select dir __elem + [ctrl + A] => [file] block__elem.css  
select file *.deps.js + [ctrl + A] => [dir] __elem, [dir] __elem, ..


For rename task:
program: node
parameters: /usr/local/lib/node_modules/BEMe/BEMe.js  $FileDir$ rename $Prompt$
working directory: $ProjectFileDir$

"Rename" renames your elem dir with files and css classes.
Mods and Blocks renaming soon..