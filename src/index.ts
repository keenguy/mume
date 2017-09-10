'use strict'
import * as path from 'path'
import { MumeBlog } from './mume-blog'
import * as klaw from 'klaw'
import * as fs from 'fs-extra'
// const Promise = require('promise');
import * as less from 'less';
import * as del from 'del';
import * as utility from './utility'

const cwd = process.cwd();
const srcDir = path.resolve(cwd, 'src');
const buildDir = path.resolve(cwd, 'docs');
let siteConfig:any = {
    title: "Yong's Blog",
    url: "blog.yonggu.me",
    gitRepo: "https://github.com/keenguy/blogit"
}

async function entry(arg) {

    arg = arg || process.argv[2] || '';

    
    await fs.readFile(path.resolve(cwd,'_config.yml'),'utf-8').then((yamlStr) => {
        let config = utility.parseYAML(yamlStr);
        siteConfig = Object.assign(siteConfig,config);
    })
    .catch((err)=>console.log("_config.yml does not exist! Default configurations are used."));

    const site = new MumeBlog(srcDir, buildDir, siteConfig);

    if (arg == 'help' || arg == '') {
        console.log(`
        init(i) --- Add the default _config.yml
        build(b) --- Execute two commands:1. note  2. less & copy
        copy(c) --- Copy two things to buildDir: 1. built-in assets  2. files specified in the 'copyFiles' field of _config.yml\n
        note(n) --- Generate htmls in buildDir using md files in srcDir\n
        less(l) --- Compile less files in 'assets/css/'
        deploy(d) --- Push buildDir to git repo configured in the deploy field of _config.yml
        `)
    } else if(arg == 'init' || arg=='i'){
        init();
    }
    else if (arg == 'copy' || arg == 'c') {
        copyData();
    } else if (arg == 'note' || arg == 'n') {
        site.generateHtmls();
    } else if (arg == 'deploy' || arg == 'd') {
        deploy();
    } else if (arg == 'less' || arg == 'l'){
        await compileCss().then(() => console.log("(^_^) All less files in assets/ compiled."));
    }
    else if(arg == 'build' || arg == 'b'){
        site.generateHtmls();  // generate htmls based on 'srcDir', writing to 'buildDir'
        await compileCss().then(() => console.log("(^_^) All less files in assets/ compiled."));
        copyData();
    }
}

function init(){
    fs.copy(path.resolve(__dirname, "../../needToCopy/_config.yml"), path.resolve(cwd,'_config.yml')).then(()=>{
        console.log("_config.yml are initialized.");
    })
}

/* Two things need to be copied
 * 1. needToCopy/ in this module
 * 2. files specified in the 'copyFiles' field of _config.yml 
 */
async function copyData() {

    let asyncEvents = [];
    asyncEvents.push(fs.copy(path.resolve(__dirname, "../../needToCopy/assets"), path.resolve(buildDir,'assets')));
    if (siteConfig.copyFiles) {
        siteConfig.copyFiles.forEach(filePath =>
            asyncEvents.push(fs.copy(path.resolve(cwd, filePath), path.resolve(buildDir, filePath))));
    }
    await Promise.all(asyncEvents).then(() => console.log('(^_^) Copy assets and other files succeed!'));
}

async function compileCss() {
    let lessEvents = [];
    return new Promise((resolve, reject) => {
        klaw(path.resolve(cwd, 'assets/css')).on('data', item => {
            if (path.extname(item.path) != '.less')
                return;
            // console.log(item.path);
            let event = fs.readFile(item.path, 'utf-8').then((str) => lessify(str, { paths: ['.'] }))
                .then((output) => fs.outputFile(item.path.replace('.less', '.css'), output.css));
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

function deploy() {
    const repo = siteConfig.deploy && siteConfig.deploy.repo || '';
    if (!repo){
        console.log("Deploy failed: no git repository.");
    }
    const branch = siteConfig.deploy.branch || 'master';
    del([
        // 这里我们使用一个通配模式来匹配 `mobile` 文件夹中的所有东西
        'docs/.git',
        'docs/.gitignore'
    ]).then(() => {
        // starting a new repo
        require('simple-git')(__dirname + '/docs')
            .outputHandler(function (command, stdout, stderr) {
                stderr.pipe(process.stderr);
            })
            .init()
            .add('./*')
            .commit("commit by auto deployment!")
            .addRemote('origin', repo)
            .push(['-f', 'origin', branch]);
    });
}

export = entry