#Bemy
[![Build Status][travis-image]][travis-url]  
Bemy is a CLI helper for auto-generation BEM structure. Specialy usefull with webstorm (external tools).  
It allows to generate folders and files structure using deps.js file with one command (or hotkey).  
For all file types taking templates with including BEM names into placegolders. You can tune it. You can add your own file types.

##Install

```bash
npm -g i bemy
```
##Using
###Command line options
`-t [task name]` — name of the called task. default: 'auto';  
`-f [path]` — required. Path to BEM node (folder or file);  
`-p [file list]` — file types list for task of `creation`. Available following file types: `-p "css js deps priv bh"`. Also you can use short notation `p c j b d`. You can add you own file types and shortcuts at config.json.  
`-g` — adding into git for created files (invokes git add for each file);  
`-c [config path]` — path of your own config json file. By default using config.json from bemy directory;  
`-o` — to open the file after creation. Creation command configured in config.json in section `editor-open-command`. Default value is `wstorm {{file-path}}:{{line-number}}`. See more details at below in section `Configuring`.

###The task of creation  
Takes arguments with file types and creates files using templates.

####CLI:  
`node bemy.js -t create -f [file path] -p "[file types]"`, where `file path` — is a path to BEM node (folder or file), `file types` — list of needed files separated by space.  
Example:  
Command: `node bemy.js -t create -f ~/testBlock/__elem -p "css js"`  
Result: At folder `~/testBlock/__elem` appear two files: `testBlock__elem.js` and `testBlock__elem.css`.  

When you use bemy on files supposed to use bemy on the folder containg this file. So this two variant are equal: `-f ~/testBlock/__elem` and `-f ~/testBlock/__elem/testBlock__elem.bh.js`.  

####Placeholders in templates
There are following placeholders: `{{blockName}}`, `{{elemName}}`, `{{modName}}`, `{{modVal}}`.  
When files creating entries gonna replace with relative part of BEM node name.  
For example, default css template contain:
```
.{{blockName}}{{elemName}}{{modName}}{{modVal}}
{
   
}
```
, so resulted file will contain:
```css
.testBlock__elem {
   
}
```

Пример настройки задачи создания для `webstorm` через `external tools`:  
![](https://cloud.githubusercontent.com/assets/769992/6200667/69699e40-b4a4-11e4-88bb-904ee8f1d99a.png)  
Для большего удобства можно настроить hotkey для запуска задачи. Рекомендуемое сочетание `ctrl + c` ('c' в контексте create). Настраивается в keymap.

###Автозадача  
Вызывает действите по умолчанию относительно BEM-сущности. В данный момент работают следующие вещи следующим образом:  
1. Если целью является каталог блока, элемента или модификатора, то запускается задача создания с единственным типов файла — css.
2. Если целью является deps-файл, то создается набор каталогов всех элементов, модификаторов, а также модификаторов элементов. По умолчанию также создаются css-файлы сущностей.

####Интерфейс командной строки:  
`node bemy.js -f [file path]`, где `file path` — это путь к бем-сущности  

Пример настройки автозадачи для `webstorm` через `external tools`:  
![](https://cloud.githubusercontent.com/assets/769992/6200662/3af8147e-b4a4-11e4-8589-63a607849c32.png)  
Для большего удобства можно настроить hotkey для запуска задачи. Рекомендуемое сочетание `ctrl + a` ('a' в контексте automatic). Настраивается в keymap.

###Конфигурирование
Конфигурационный файл config.json располагается в корне тулзы. В нем хранятся сокращения, расширения создаваемых файлов и пути к шаблонам.  
`suffixes` — перечень расширений файлов, соответствующих сокращениям. Сокращения — это список, полученный из опции `-p`.  
`file-templates` — список путей к шаблонам, соответствующим сокращениям.  
`deps_task` — конфигурирование автотаски по депсам. `files` — массив списка типов файлов, которые будут добавлены при создании структуры элементов и модификаторов.  
`editor-open-command` — Команда вызова редактора. С ней конкатенироватся путь к файлу при вызове bemy с ключом `-o`, и команда будет выполнена после создания файла.

[travis-url]: http://travis-ci.org/f0rmat1k/bemy
[travis-image]: http://img.shields.io/travis/f0rmat1k/bemy.svg?branch=master&style=flat