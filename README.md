# Bemy
[![Build Status][travis-image]][travis-url]  
Bemy is a CLI helper for auto-generation and renaming BEM structure. Especialy usefull with `Webstorm` (using external tools). It allows to generate folder and file structure using deps.js ([enb](http://enb-make.info) dependencies format) file with one command (or hotkey). For all file types taking templates with including BEM names into placeholders. You can tune it and you can add your own file types. Bemy can run three usable tasks: 'create', 'rename' and 'auto';

## Install
```bash
npm i -g bemy
```
## Usage
```bash
bemy -t [task] -f [path] [options]
```

When you call the task of creation on files it is like you call bemy on the folder contains this file. So this two variants are equal: `-f ~/testBlock/__elem c j` and `-f ~/testBlock/__elem/testBlock__elem.bh.js c j`.  

Starting with version 2.1 `-t` and `-p` and `-f` is no more required. Task seleced depend on call bemy. See details on tasks description below.  

### Shared CLI options
`-t [task name]` — name of the called task. default: 'auto';  
`-f [path]` — path to BEM node (folder or file);  
`-g` — adding into git for created or renamed files (calls `git add` for each file);  
`-c [config path]` — set path of your own config json file. Read about path working at `Configuring` section.
`--debug` — to output various information.

### The task of creation  
Takes arguments with file types and creates files using templates.

#### CLI for task of creation:  
`bemy -t create -f [path] -p "[file types]"`, where `file path` — is a path to BEM node (folder or file), `file types` — list of needed files separated by space.  
Example:  
Command: `bemy -t create -f ~/testBlock/__elem -p "css js"`  
Result: In the folder `~/testBlock/__elem` was added two files: `testBlock__elem.js` and `testBlock__elem.css`.  

```bash
cd some-block  
bemy c j
```
Result: called 'create' task and appear `some-block/some-block.css` and `some-block/some-block.js`.  

#### Options
`-o` — to open the file after creation. This command configured in `.bemy.json` in section `editor-open-command`. Default value is `wstorm {{file-path}}:{{line-number}}`. See more details at below in section `Configuring`.;
`-p [file list]` — file types list. Available following file types: `-p "css js deps priv bh"`. Also you can use short notation `p c j b d`. You can add you own file types and shortcuts into `.bemy.json`. Also you can set file types with just enumeration before single options keys, e.g. `bemy c j -o -g`.

Webstorm is required `-f [path]`. An example of using bemy with `external tools` of webstorm for the task of creation:  
![](https://cloud.githubusercontent.com/assets/769992/6725632/0232f4ee-ce2e-11e4-942e-7845381663ed.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + c`) at `keymap` section.

### The task of renaming  
Recursively renames current node and its children. `-d` turn on deep mode and the contents of the files will also be renamed. Deep rename used `rename` param from config file so you should to configure it for you own file types. `rename` renames only described files and valid directories (e.g. mod folder in mod folder isn't valid).

#### CLI for task of renaming:
`bemy -t rename -f [path] -p [new name] -d`

#### Options
`-d` — turn on deep mode with renaming of files content;  
`-p` — new BEM node name;

Webstorm is required `-f [path]`. An example of using bemy with `external tools` of webstorm for the task of renaming:  
![](https://cloud.githubusercontent.com/assets/769992/6766361/e3006d96-d025-11e4-948e-1f11a663f2ea.png)  

### The autotask  
Call default action depend on BEM node. Currently work following variants:
1. If target is deps-file, creates described elems\mods\elemMods folder structure. And depend on options of `.bemy.json` also creates elems\mods\elemMods files. By default it's css files. Se `Configuring` section for more details.
2. Otherwise call create task with default options (equal `-t create -f [path] -p "css"`). Default file types for autotask configurable at `.bemy.json`.

#### CLI for autotask
`bemy -f [path]`

or you can call just bemy:  
Run autotask:
```bash
cd some-block  
bemy
```
Called autotask and created the only css file `some-block.css`.  
You should set `-f` when you want set not current directory or call bemy on `deps.js` file.  

Webstorm is required `-f [path]`. An example of using bemy with `external tools` of webstorm for the autotask:  
![](https://cloud.githubusercontent.com/assets/769992/6725778/23a5188a-ce30-11e4-828d-0d590fb26e08.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + a`) at `keymap` section.

### Confguring
Bemy will try to find `.bemy.json` on the every previous level (like npm) until the root directory, so you can put `.bemy.json` into your home directory or project directory if you need different options depend on project. Otherwise bemy wil take `.bemy.json` from own directory.  

#### `file-types`
Description of the used file types.  
`suffix` used by 'create' when forming file and by 'rename' for files validation (`rename` renames only described files);  
`shortcuts` — list of short that you can use after `-p` key in Task of creation;  
`rename` – mask for deep renaming. {{bemNode}} will be replaced to new node name. You can also use an array of masks;  
`template` — path to template of file type. Teamplate used when any files are created.  
There are following placeholders: `{{blockName}}`, `{{elemName}}`, `{{modName}}`, `{{modVal}}` and `{{cursor}}`. When files are created this entries will be replaced with relevant part of BEM node name.  And `{{cursor}}` will be deleted and used for setting cursor line number (see more at `Configuring` section).  

For example, default css template contain:
```
.{{blockName}}{{elemName}}{{modName}}{{modVal}}
{
   {{cursor}}
}
```
, so resulted file will contain:
```css
.testBlock__elem {
/* curor will be here, when you use right configured -o key */
}
```
#### `deps_task`
Options for autotask when it called on deps file. `files` – list of file types to be created in addition to folders.  

#### `editor-open-command`
Command to be called after creating the file. There are two placeholders:  
1. `{{file-path}}` to be replaced with relevant file path.  
2. `{{line-number}}` will be taken from {{cursor}} position of relevant template.  Default command is `wstorm {{file-path}}:{{line-number}}`, so if you use webstorm you should to create CLI launcher at webstorm with same name (`Tools` / `Create Command-line Lanucher`).  
If you use old version of webstorm on Mac you can try to use `/Applications/WebStorm.app/Contents/MacOS/webide` for `editor-open-command`.  

#### `bem`
Your BEM options. If you use own `separators` you have to set right `allowed-name-symbols-regexp`.  

`debug` — to output various information.

### Windows
On Windows bemy is installed into `c:\Users\[user-name]\AppData\Roaming\npm\node_modules\bemy\bemy.js`, and webstorm cannot run bemy simply, using `bemy` command, so you have to set `node` into the field `Program`, and full absolute path to bemy into field `Parameters` before parametres. The path to bemy usually is `c:\Users\[user-name]]\AppData\Roaming\npm\node_modules\bemy\bemy.js`.  
So settings should be something like this:  
![2015-04-04 21-58-18 edit tool](https://cloud.githubusercontent.com/assets/769992/6993726/a5b19288-db17-11e4-898b-37d2820c18bc.png)  

Also on windows isn't working CLI intarface fully, e.g. you can't run just `bemy` without `-f` param. And `-f` have to be absolute path.

[travis-url]: http://travis-ci.org/f0rmat1k/bemy
[travis-image]: http://img.shields.io/travis/f0rmat1k/bemy.svg?branch=master&style=flat