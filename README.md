#Bemy
Хэлпер для автогенерации файловой структуры BEM с помощью командной строки.
Позволяет генерировать структуру папок и файлов элементов по deps-файлу, одной командой (можно сделать хоткей) создавать различные типы файлов любой бем-сущности.
Для всех типов файлов используются шаблоны с подстановкой бем-имен, таким образом вы можете настроить их, как вам удобно.
Можно добавлять свои типы файлов.

##Установка

```bash
npm i bemy
```
##Использование
###Опции командной строки
`-t [task name]` — имя вызываемой задачи. При отсутствии опции вызывается автозадача;  
`-f [path]` — обязательная опция. Путь к БЕМ-сущности, относительно которой вызывается задача;  
`-p [file list]`  — перечень типов создаваемых файлов, используемых в задаче создания. Доступны следующие типы файлов: `-p "css js deps priv bh"`. При этом можно использовать сокращенную записать `p c j b d`. Добавить свои типы и сокращения к ним можно с помощью config.json.  
`-g` — ключ, при наличии которого созданные файлы добавляются в git (иными словами просиходит git add над каждым создаваемым файлом);  
`-c [config path]` — путь к файлу конфигурации. По умолчанию `config.json`;  
`-o` — ключ, при наличии которого файл будет открыт сразу после создания в редакторе. Команда вызова редактора конфигурируется в config.json.

###Задача создания  
Принимает набор аргументов в виде типов файлов (или их сокращений) и создает файлы, используя шаблоны в поставке тулзы.

####Интерфейс командной строки:  
`node bemy.js -t create -f [file path] -p "[file types]"`, где `file path` — это путь к БЕМ-сущности, `file types` — строка, содержащая типы файлов для создания в виде сокращений с разделением через пробел.  
Пример: `node bemy.js -t create -f ~/testBlock/__elem -p "css js"` приведет к тому, что в `~/testBlock/__elem` появятся 2 файла: `testBlock__elem.js` и `testBlock__elem.css`.

####Реплейсы шаблонов  
При создании файлов БЕМ-сущностей в шаблонах вхождения `{{blockName}}`, `{{elemName}}`, `{{modName}}`, `{{modVal}}` будут заменены на соответствующие сущности имена. Дефолтный шаблон css-файла содержит
```
.{{blockName}}{{elemName}}{{modName}}{{modVal}}
{
   
}
```
, таким образом результирующий css-файл из примера выше будет содержать:
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
