#Bemy
[![Build Status][travis-image]][travis-url]  
Bemy is a CLI helper for auto-generation and renaming BEM structure. Especialy usefull with webstorm (external tools). It allows to generate folder and file structure using deps.js file with one command (or hotkey). For all file types taking templates with including BEM names into placeholders. You can tune it and you can add your own file types.
Bemy can run three usable tasks: 'create', 'rename' and 'auto';

##Install
```bash
npm i -g bemy
```
##Usage
```bash
bemy -t [task] -f [path] [options]
```

When you call bemy on files it is like you call bemy on the folder contains this file. So this two variants are equal: `-f ~/testBlock/__elem` and `-f ~/testBlock/__elem/testBlock__elem.bh.js`.  

###Shared CLI options
`-t [task name]` — name of the called task. default: 'auto';  
`-f [path]` — path to BEM node (folder or file);  
`-g` — adding into git for created or renamed files (calls `git add` for each file);  
`-c [config path]` — path of your own config json file. By default used config.json from bemy directory;  

###The task of creation  
Takes arguments with file types and creates files using templates.

####CLI for task of creation:  
`bemy -t create -f [path] -p "[file types]"`, where `file path` — is a path to BEM node (folder or file), `file types` — list of needed files separated by space.  
Example:  
Command: `bemy -t create -f ~/testBlock/__elem -p "css js"`  
Result: In the folder `~/testBlock/__elem` was added two files: `testBlock__elem.js` and `testBlock__elem.css`.  

####Options
`-o` — to open the file after creation. This command configured in config.json in section `editor-open-command`. Default value is `wstorm {{file-path}}:{{line-number}}`. See more details at below in section `Configuring`.;
`-p [file list]` — file types list. Available following file types: `-p "css js deps priv bh"`. Also you can use short notation `p c j b d`. You can add you own file types and shortcuts at config.json.  

An example of using bemy with `external tools` of webstorm for the task of creation:  
![](https://cloud.githubusercontent.com/assets/769992/6725632/0232f4ee-ce2e-11e4-942e-7845381663ed.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + c`) at `keymap` section.

###Task of renaming
Recursively renames current node and its children. `-d` turn on deep mode and the contents of the files will also be renamed. Deep rename used `rename` param from config file so you should to configure it for you own file types. `rename` renames only described files and valid directories (e.g. mod folder in mod folder isn't valid).

####CLI for task of renaming:
`bemy -t rename -f [path] -p [new name] -d`

####Options
`-d` — turn on deep mode with renaming of files content;  
`-p` — new BEM node name;

An example of using bemy with `external tools` of webstorm for the task of renaming:  
![](https://cloud.githubusercontent.com/assets/769992/6766361/e3006d96-d025-11e4-948e-1f11a663f2ea.png)  

###Autotask  
Call default action depend on BEM node. Currently work following variants:
1. If target is deps-file, creates described elems\mods\elemMods folder structure. And depend on options of config.json also creates elems\mods\elemMods files. By default it's css files. Se `Configuring` section for more details.
2. Otherwise call create task with default options (equal `-t create -f [path] -p "css"`). Default file types for autotask configurable at config.json.

####CLI for autotask
`bemy -f [path]`

An example of using bemy with `external tools` of webstorm for the autotask:  
![](https://cloud.githubusercontent.com/assets/769992/6725778/23a5188a-ce30-11e4-828d-0d590fb26e08.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + a`) at `keymap` section.

###Confgiring
`config.json` is in bemy root folder.  

####Sections
#####`file-types`
Description of the used file types.  
`suffix` used by 'create' when forming file and by 'rename' for files validation (`rename` renames only described files);  
`shortcuts` — list of short that you can use after `-p` key in Task of creation;  
`rename` – mask for deep renaming. {{bemNode}} will be replaced to new node name. You can also use an array of masks;  
`template` — path to template of file type. Teamplate used when any files are created.  
There are following placeholders: `{{blockName}}`, `{{elemName}}`, `{{modName}}`, `{{modVal}}` and `{{cursor}}`. When files are created this entries will be replaced with relevant part of BEM node name.  And `{{cursor}}` will be deleted and used for setting cursor line number (see more at Configuring section).
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
/* curor will be here, if you use right configured -o key */
}
```
`deps_task` – options for autotask when it called on deps file. `files` – list of file types to be created in addition to folders.  
`editor-open-command` — command to be called after creating the file. There are two placeholders: 1) {{file-path}} to be replaced with relevant file path. 2) {{line-number}} will be taken from {{cursor}} position of relevant template.  Default command is `wstorm {{file-path}}:{{line-number}}`, so if you use webstorm you need to create CLI launcher at webstorm with same name (Tools / Create Command-line Lanucher). If u use old wersion of webstorm you can try to use `/Applications/WebStorm.app/Contents/MacOS/webide` for `editor-open-command`.  
`bem` — your BEM options. If you use own `separators` you must set right `allowed-name-symbols-regexp`.

[travis-url]: http://travis-ci.org/f0rmat1k/bemy
[travis-image]: http://img.shields.io/travis/f0rmat1k/bemy.svg?branch=master&style=flat