'use strict'
import * as path from 'path';
import { MumeBlog } from './mume-blog';
import * as klaw from 'klaw';
import * as fs from 'hexo-fs';
// const Promise = require('promise');
import * as less from 'less';
import * as del from 'del';

const srcDir = path.resolve(process.cwd(),'src');
const buildDir = path.resolve(process.cwd(),'docs');

const siteConfig = {
    title: "Yong's Blog",
    url: "blog.yonggu.me",
    gitRepo: "https://github.com/keenguy/blogit"
}

const site = new MumeBlog(srcDir,buildDir,siteConfig);

const arg = process.argv[2];

if (arg == 'init'){
    site.init();
}
else if (arg == 'copy'){
    copyData();
}else if(arg == 'build'){
    site.generateHtmls();
}else if(arg == 'deploy' || 'd'){
    deploy();
}
else{
    site.generateHtmls();  // generate htmls based on 'srcDir', writing to 'buildDir'
    copyData();
}

/* compile all .less files in 'assets/'; 
 *   copy 'assets/' and  site.copyFiles  to 'buildDir' (cwd: process.cwd())
 */
async function copyData() {
    const copyFiles = [      // files other than assets that need to be copied.
        'CNAME'
    ]
    let asyncEvents = [];
    await compileCss().then(() => console.log("(^_^) All less files in assets/ compiled."));
    asyncEvents.push(fs.copyDir('assets', path.resolve(buildDir, 'assets'), { ignorePattern: new RegExp('.less$') }));
    if (copyFiles) {
        copyFiles.forEach(filePath =>
            asyncEvents.push(fs.copyFile(filePath, path.resolve(buildDir, filePath))));
    }
    await Promise.all(asyncEvents).then(() => console.log('(^_^) Copy assets and other files succeed!'));
}

async function compileCss() {
    let lessEvents = [];
    return new Promise((resolve, reject) => {
        klaw('assets/css').on('data', item => {
            if (path.extname(item.path) != '.less')
                return;
            // console.log(item.path);
            let event = fs.readFile(item.path).then((str) => lessify(str, { paths: ['.'] }))
                .then((output) => fs.writeFile(item.path.replace('.less', '.css'), output.css));
            lessEvents.push(event);
        }).on('end', () => Promise.all(lessEvents).then(resolve, reject));
    });
}

function lessify(str, options) {
    return new Promise((resolve, reject) => {
        less.render(str, options, function (e, output) {
            if (e) reject(e);
            else resolve(output);
        })
    })
}

function deploy(){
    del([
        // 这里我们使用一个通配模式来匹配 `mobile` 文件夹中的所有东西
        'docs/.git',
        'docs/.gitignore'
    ]).then(()=>{
    // starting a new repo
    require('simple-git')(__dirname+'/docs')
    .outputHandler(function (command, stdout, stderr) {
        stderr.pipe(process.stderr);
     })
    .init()
    .add('./*')
    .commit("commit by auto deployment!")
    .addRemote('origin', 'https://github.com/keenguy/blog.git')
    .push(['-f', 'origin', 'master']);
    });
}