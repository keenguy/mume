This repo is forked from [mume](https://github.com/shd101wyy/mume), adapted to bloging 
1. added index.ts, changed the main entry in package.json to it.
1. added mume-blog.ts
2. added blog-engine.ts, which is a modification copy of markdown-engine.ts
3. added to changed: needToCopy/, bin/, package.json

## Install
`npm install -g git+https://github.com/keenguy/wret.git#blog`

## How to use
1. Prepare files
* src/: md source directory
* assets/: css files, images
* CNAME
* _config.yml
    * Use `wret i` to initialize _config.yml if needed
    * Three fields: title, copyFiles, deploy are needed. (May be empty)
    * srcDir, buildDir are defaulted to be 'src' and 'docs' respectively.

2. Build the blog: `wret b`

3. Push to github `wret d`

4. Other commands:
* `wret help`
* `wret copy`   Copy two things to buildDir: 1. built-in assets  2. files specified in the 'copyFiles' field of _config.yml
* `wrep less`   Compile less files in 'assets/css/'
* `wret note`   Generate htmls in buildDir using md files in srcDir

## Dev log
>2017-10-10
Changed module name mume-blog to wret, implemented _config.yml

>2017-09-09
Integrated all notes-independent functions to mume-blog

>2017-09-05
Integrated main code into [@keenguy/mume-blog](https://github.com/keenguy/mume-blog)

>2017-09-04
added pagenator; optimized index assembly, listing items in order; rewrite index.js and gulpfile.js;

>2017-08-24
added font-awesome, ribbon, made some js opt, took some notes

>2017-08-23

Added some icons (e.g. folder, tag). Implemented gulp automation. Solved puml doesn't exit problem. Added some metadata. Changed some css (e.g. toc).

>2017-08-22

Added file-brower-like navigation. Auto generate index files for sub folders. 
Changed mume module: 
1. move toc-btn to top (change css)   
2. add callback to htmlExport function in markdown-engine.js.
>2017-08-21

Implemented html exporting in batch using mume. Set up blog on github.

## Some notes

1. font-awesome icons doesn't work in vscode preview .


## To-do
- [ ] project layout
- [ ] search functionality
- [ ] comment module
- [ ] footer with flexible templating
- [ ] improve the layout of index page.
- [ ] optimize for mobile
- [ ] travis CI deployment
- [x] improve UI (e.g. index of sub folders).
- [x] generate subfolder index automatically
- [x] add header or back links on each page automatically.
- [x] metadata
- [x] implement auto flow using gulp
- [x] font-awesome icons (only for blog export)

