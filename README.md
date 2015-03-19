#Bemy
[![Build Status][travis-image]][travis-url]  
Bemy is a CLI helper for auto-generation BEM structure. Especialy usefull with webstorm (external tools). It allows to generate folder and file structure using deps.js file with one command (or hotkey). For all file types taking templates with including BEM names into placeholders. You can tune it and you can add your own file types.  

##Install
```bash
npm -g i bemy
```
##Usage
```bash
bemy [options]
```
###CLI options
`-t [task name]` — name of the called task. default: 'auto';  
`-f [path]` — path to BEM node (folder or file);  
`-p [file list]` — file types list for task of `creation`. Available following file types: `-p "css js deps priv bh"`. Also you can use short notation `p c j b d`. You can add you own file types and shortcuts at config.json.  
`-g` — adding into git for created files (calls `git add` for each file);  
`-c [config path]` — path of your own config json file. By default using config.json from bemy directory;  
`-o` — to open the file after creation. Creation command configured in config.json in section `editor-open-command`. Default value is `wstorm {{file-path}}:{{line-number}}`. See more details at below in section `Configuring`.

###The task of creation  
Takes arguments with file types and creates files using templates.

####CLI of task of creation:  
`bemy -t create -f [file path] -p "[file types]"`, where `file path` — is a path to BEM node (folder or file), `file types` — list of needed files separated by space.  
Example:  
Command: `bemy -t create -f ~/testBlock/__elem -p "css js"`  
Result: In the folder `~/testBlock/__elem` was added two files: `testBlock__elem.js` and `testBlock__elem.css`.  

When you use bemy on files supposed to use bemy on the folder containg this file. So this two variant are equal: `-f ~/testBlock/__elem` and `-f ~/testBlock/__elem/testBlock__elem.bh.js`.  

####Placeholders in templates
There are following placeholders: `{{blockName}}`, `{{elemName}}`, `{{modName}}`, `{{modVal}}` and {{cursor}}. When files creating entries gonna replace with relevant part of BEM node name.  And {{cursor}} will be deleted and used to set cursor line number (see more at Configuring section).
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

An example of using bemy with `external tools` of webstorm:  
![](https://cloud.githubusercontent.com/assets/769992/6725632/0232f4ee-ce2e-11e4-942e-7845381663ed.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + c`) at `keymap` section.

###Autotask  
Call default action depend on BEM node. Currently work following variants:
1. If target is deps-file, creates described elems\mods\elemMods folder structure. And depend on options of config.json also creates elems\mods\elemMods files. By default it's css files. Se `Configuring` section for more details.
2. Otherwise call create task with default options (equal `-t create -f [file path] -p "css"``). Default file types for autotask configurable at config.json.

####CLI of autotask:  
`bemy -f [file path]`, where `file path` — it's a path to BEM node.

An example of using bemy with `external tools` of webstorm:  
![](https://cloud.githubusercontent.com/assets/769992/6725778/23a5188a-ce30-11e4-828d-0d590fb26e08.png)  
Don't forget to configure hotkey for task running (e.g. `ctrl + a`) at `keymap` section.

###Confgiring
`config.json` is in bemy root folder.  
####Sections
`suffixes` — a list of shotrcuts and relevant file extensions. Shotrcuts using in `-p` key.  
`file-templates` — a list of shortcuts with relevant path to template.  
`deps_task` – options for autotask when it called on deps file. `files` – list of files to be created in addition to folders.  
`editor-open-command` — command to be called after creating the file. There are two placeholders: 1) {{file-path}} to be replaced with relevant file path. 2) {{line-number}} will be taken from {{cursor}} position of relevant template.  Default command is `wstorm {{file-path}}:{{line-number}}`, so if you use webstorm you need to create CLI launcher at webstorm with same name (Tools / Create Command-line Lanucher). If u use old wersion of webstorm you can try to use `/Applications/WebStorm.app/Contents/MacOS/webide` for `editor-open-command`.
`bem` — your BEM options. If you using own `separators` you must set right `allowed-name-symbols-regexp`.

[travis-url]: http://travis-ci.org/f0rmat1k/bemy
[travis-image]: http://img.shields.io/travis/f0rmat1k/bemy.svg?branch=master&style=flat