This is a forked repo adapted to bloging 
1. added index.ts, changed the main entry in package.json to it.
1. added mume-blog.ts
2. added blog-engine.ts, which is a modification copy of markdown-engine.ts
3. added to changed: needToCopy/, bin/, package.json

The forked repo is [mume](https://github.com/shd101wyy/mume)

## Install
`npm install -g git+https://github.com/keenguy/wret.git#blog`

## Usage
There are mainly 3 steps:
1. `wret init`   initialize a _config.yml file
2. `wret build`  build the whole site into ./docs
3. `wret deploy` git deploy to the repository configured in _config.yml

Other commands:
* `wret help`
* `wret copy`   Copy two things to buildDir: 1. built-in assets  2. files specified in the 'copyFiles' field of _config.yml
* `wrep less`   Compile less files in 'assets/css/'
* `wret note`   Generate htmls in buildDir using md files in srcDir





