gulp-bem-structure
==================

Helper for auto-creation BEM dir and file structure

Installation:
npm i -g git+https://github.yandex-team.ru/f0rmat1k/BEMe.git

Webstorm:
Add external tool:
program: node
parameters: /usr/local/lib/node_modules/BEMe/BEMe.js $FilePath$
working directory: $ProjectFileDir$

And hotkey, e.g. ctrl + A.

Default behavior:
select dir __elem + [ctrl + A] => [file] block__elem.css
select file *.deps.js + [ctrl + A] => [dir] __elem, [dir] __elem, .. 
