"use strict"
/*
 *  By default, all path are relative path, except for those have special names
 */


const cheerio = require("cheerio");
const klaw = require("klaw");
var path = require('path');
var fs = require('hexo-fs');
// var less = require('less');
// node.js 
import {MarkdownEngine as BlogEngine} from './blog-engine';
// es6
// import * as mume from "@shd101wyy/mume"

export interface SiteConfig {
    title: string
}
interface HTMLTemplate {
    tempHtml: string
    stylesheet: string
}
interface FileData {
    name: string
    stats: any
    config?: any
    html?: string
}
interface DirData {
    path: string
    files: string[]
}
export class MumeBlog {

    private src: string
    private root: string
    private config: SiteConfig
    private files: {[key:string]: FileData;}
    private dirs: {[key:string]: DirData}

    constructor(srcDir:string, buildDir:string, siteConfig?: SiteConfig) {
        this.src = srcDir;
        this.root = buildDir;
        this.config = Object.assign({
            title: "My Blog"
        }, siteConfig);
        this.dirs = {}; //dirPath: dirInfo
        this.files = {}; //filePath: pageInfo
    }
    init(){
        fs.copyDir("needToCopy", this.root).then(()=>{
            console.log("Blog initialized!");
        })
    }
    async generateHtmls() {
        await this.getBlogData();
        this.processData();
    }
    async getBlogData() {
        const filterFunc = item => {
            const basename = path.basename(item)
            return basename[0] !== '.'  //ignore hidden files
        }
        return new Promise((resolve, reject) => {
            console.log("Reading data...");
            let asyncEvents = [];
            klaw(this.src, { filter: filterFunc }).on('data', item => {
                const filePath = this.getRelPath(item.path);
                if (item.stats.isDirectory()) {
                    // console.log(filePath);
                    this.dirs[filePath] = {
                        path: filePath,
                        files: []
                    };
                }
                // console.log(item.path);
                if (filePath !== '') {
                    const dirPath = this.getRelPath(path.dirname(item.path));
                    this.dirs[dirPath].files.push(filePath);
                }
                this.files[filePath] = { name: path.basename[filePath],stats: item.stats };
                if (path.extname(item.path) != ".md") return;
                const engine = new BlogEngine({
                    filePath: item.path,
                    config: {
                        previewTheme: "github-light.css",
                        // revealjsTheme: "white.css"
                        codeBlockTheme: "default.css",
                        printBackground: true
                    },
                    projectDirectoryPath: this.src
                })
                asyncEvents.push(engine.blogMDParse({ offline: false, runAllCodeChunks: true }).then(({ html, yamlConfig, filePath }) => {
                    this.files[this.getRelPath(filePath)].html = html;
                    this.files[this.getRelPath(filePath)].config = yamlConfig;
                    this.files[this.getRelPath(filePath)].name = path.basename(filePath).replace(path.extname(filePath), '');
                }));
            }).on('end', () => {
                Promise.all(asyncEvents).then(resolve, reject);
            });
        }).then(() => {
            Object.keys(this.dirs).forEach((dirPath) => {
                this.dirs[dirPath].files.sort((filePath1, filePath2) => {
                    let order = [];
                    [filePath1, filePath2].forEach((filePath, idx) => {
                        const file = this.files[filePath];
                        const configOrder = file.config && file.config.order || '';
                        const updateOrder = file.config && file.config.update && file.config.update.toLocaleDateString('zh-Hans-CN') || file.config && file.config.title || path.basename(filePath);
                        order[idx] = configOrder + '@' + updateOrder;
                        if (path.basename(filePath) == 'index.md') {
                            order[idx] = '!';
                        }
                    });
                    return ((order[0] == order[1]) ? 0 : ((order[0] > order[1]) ? 1 : -1));
                });
            })
            console.log("(^_^) Reading data finished!");
        });
    }
    async processData() {
        console.log("processing data...");
        let asyncWriteEvents = [];
        // console.dir(this.dirs,{depth:2,colors:true});
        Object.keys(this.dirs).forEach((dirPath) => {

            if (!this.files[path.join(dirPath, 'index.md')]) {
                let { dest, html } = this.createIndex(this.dirs[dirPath]);
                asyncWriteEvents.push(fs.writeFile(dest, html));
            }
        })

        Object.keys(this.files).forEach((filePath) => {
            let { dest, html } = this.exportHtml(filePath);
            if (dest && html) asyncWriteEvents.push(fs.writeFile(dest, html));
        })

        return Promise.all(asyncWriteEvents).then(() => console.log("(^_^) Writing data finished!"));
    }
    // compileCss() {
    //     let lessEvents = [];
    //     return new Promise((resolve, reject) => {
    //         klaw('assets', { filter: item => path.extname(item) != '.less' }).on('data', item => {
    //             if (item.path.extname != '.less') return;
    //             let event = fs.readFile(item.path).then((str) => this.lessify(str, { paths: ['.'] }))
    //                 .then((output) => fs.writeFile(item.path.replace('.less', '.css'), output.css));
    //             lessEvents.push(event);
    //         }).on('end', () => Promise.all(lessEvents).then(resolve, reject));
    //     });
    // }
    // async copyData() {
    //     let asyncEvents = [];
    //     await this.compileCss().then(() => console.log("(^_^) All less files in assets/ compiled."));
    //     asyncEvents.push(fs.copyDir('assets', path.resolve(this.root, 'assets'), { ignorePattern: new RegExp('.less$') }));
    //     if (this.config.copyFiles) {
    //         this.config.copyFiles.forEach(filePath =>
    //             asyncEvents.push(fs.copyFile(filePath, path.resolve(this.root, filePath))));
    //     }
    //     await Promise.all(asyncEvents).then(() => console.log('(^_^) Copy assets and other files succeed!'));
    // }
    exportHtml(filePath:string) {
        const file = this.files[filePath];
        let dest = '';
        let html = '';
        if (file.stats.isFile() && file.html) {
            dest = path.resolve(this.root, filePath.replace('.md', '.html'));
            const $ = cheerio.load(file.html, { xmlMode: true });
            $("head style").replaceWith(template.stylesheet);

            let menuHtml = this.generatePathBrowser(filePath);
            let metaHtml = '';
            let yamlConfig = file.config;
            if (yamlConfig.update) {
                let update = yamlConfig.update.toLocaleDateString('zh-Hans-CN');
                metaHtml += `<span style="margin-right:10px;"><i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;${update}</span>`;
            }

            if (yamlConfig.tags) {
                metaHtml += `<span style="margin-right:10px;"><i class="fa fa-tags" aria-hidden="true"></i>&nbsp;${yamlConfig.tags.join(', ')}</span>`;
            }
            if (metaHtml != "") {
                metaHtml = '<div style="margin-top: 20px;">' + metaHtml + '</div>';
            }
            if (yamlConfig.nav == false) { // top level htmls
                menuHtml = '';
            }
            if (yamlConfig.meta == false) {
                metaHtml = '';
            }
            $(".markdown-preview").first().prepend(menuHtml + metaHtml);
            if (yamlConfig.title) {
                $("head title").html(yamlConfig.title);
            }
            $(".md-sidebar-toc a").attr('onclick', 'toggleTocLink(event)');
            if (path.basename(dest) == 'index.html') {
                const type = file.config && file.config.assembleType || 'replace';
                if (type == 'append') {
                    $('.markdown-preview').first().append(this.generatePostList(this.dirs[path.dirname(filePath)]));
                } else if (type == 'prepend') {
                    $('.markdown-preview').first().prepend(this.generatePostList(this.dirs[path.dirname(filePath)]));
                }
            }
            if (path.dirname(filePath) != '.' && path.basename(dest) != 'index.html') {
                const filesArray = this.dirs[path.dirname(filePath)].files;
                const idx = filesArray.indexOf(filePath);
                let pagenatorHtml = '<div class="page-nav-wrap">';
                if (idx == 0 && path.basename(filePath) != 'index.md') {
                    const link = '.';
                    const fileName = 'Index';
                    pagenatorHtml += `<a href="${link}" title=${fileName} class="page-nav-item page-nav-pre">
                    <span class="page-nav-text"></span><span class="page-nav-text-alt">Pre</span></a>`
                } else if (idx > 0) {
                    const linkFilePath = this.dirs[path.dirname(filePath)].files[idx - 1];
                    const link = path.relative(path.dirname(filePath), linkFilePath).replace('.md', '.html');
                    const fileName = this.files[linkFilePath].name;
                    pagenatorHtml += `<a href="${link}" title=${fileName} class="page-nav-item page-nav-pre">
                    <span class="page-nav-text"></span><span class="page-nav-text-alt">Pre</span></a>`
                }
                if (idx < filesArray.length - 1) {
                    const linkFilePath = this.dirs[path.dirname(filePath)].files[idx + 1];
                    const link = path.relative(path.dirname(filePath), linkFilePath).replace('.md', '.html');
                    const fileName = this.files[linkFilePath].name;
                    pagenatorHtml += `<a href="${link}" title=${fileName} class="page-nav-item page-nav-next">
                    <span class="page-nav-text"></span><span class="page-nav-text-alt">Next</span></a>`
                }
                pagenatorHtml += '</div>';
                $('.markdown-preview').first().after(pagenatorHtml);
            }
            html = $.html();
        }
        return { dest, html }
    }

    private createIndex(dir:DirData) {
        const dest = path.resolve(this.root, dir.path, 'index.html');
        // console.log("creating:", dest);
        let $ = cheerio.load(template.tempHtml, { xmlMode: true });
        let listHtml = this.generatePostList(dir);
        let menu = this.generatePathBrowser(dir.path);
        $('.markdown-preview').first().html(menu + listHtml);
        $('head title').html(path.basename(dir.path));
        // console.log("created :", dest);
        return { dest, html: $.html() };
    }

    private generatePostList(dir:DirData) {
        let listHtml = '<div class="post-list" style="margin-top: 40px;"><ol>';
        dir.files.forEach((filePath) => {
            if (path.basename(filePath) == 'index.md') {
                return;
            }
            let extname = path.extname(filePath);
            let title = path.basename(filePath).replace(extname, "");
            // if(title == 'javascript'){
            //     console.log(path.relative(dir.path, filePath));
            //     console.log(path.relative(dir.path, filePath).replace(extname,'.html'));
            // }
            let link = path.relative(dir.path, filePath).replace('.md', '.html');
            let icon = '';
            const file = this.files[filePath];
            if (file.stats.isDirectory()) {
                link += '/';
                icon = '<i class="fa fa-folder-o" aria-hidden="true"></i>';
            } else {
                if (file.config && file.config.draft) return ;
                if (file.config && file.config.title) {
                    title = file.config.title;
                }
            }
            listHtml += `<li><a href="./${link}">${icon + title}</a></li>`;
        })
        listHtml += '</ol></div>';
        return listHtml;
    }

    generatePathBrowser(filePath:string) {
        // console.log("generating path browser:", filePath);
        let html = path.basename(filePath);
        let link = path.dirname(filePath);
        // console.log(html,link);
        const file = this.files[filePath];
        if (file.stats.isFile()) { //it's a file
            if (file.config && file.config.title) {
                html = file.config.title;
            } else {
                html = html.replace('.md', '.html');
            }
            filePath = link;
        }
        while (link != '.') {
            html = `<a href="./${path.relative(filePath, link)}">${path.basename(link)}</a> / ` + html;
            link = path.dirname(link);
        }
        html = `<a href="/">Home</a> / ` + html;
        html = `<div style="margin-bottom: 20px;">${html}</div>`;
        // console.log(html);
        return html;
    }

    getDestPath(srcPath) {
        srcPath = srcPath.replace(new RegExp('.md$'), '.html');
        return path.resolve(this.root, path.relative(this.src, srcPath));
    }
    getRelPath(absPath) {
        return path.relative(this.src, absPath); // || '.'; //the root dir results in '', force it to be '.'
    }

    // lessify(str, options) {
    //     return new Promise((resolve, reject) => {
    //         less.render(str, options, function (e, output) {
    //             if (e) reject(e);
    //             else resolve(output);
    //         })
    //     })
    // }
}

exports.MumeBlog = MumeBlog;


/*
  template html snippets
*/

let template: HTMLTemplate = {
    tempHtml: `<!DOCTYPE html>
<html>

<head>
    <title>index</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.8.2/katex.min.css">
    <link rel="stylesheet" href="/assets/libs/font-awesome-4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/custom.css">
    
</head>

<body for="html-export">
    <div class="mume markdown-preview   ">
    </div>
</body>
<script>
    (function bindTaskListEvent() {
        var taskListItemCheckboxes = document.body.getElementsByClassName('task-list-item-checkbox')
        for (var i = 0; i < taskListItemCheckboxes.length; i++) {
            var checkbox = taskListItemCheckboxes[i]
            var li = checkbox.parentElement
            if (li.tagName !== 'LI') li = li.parentElement
            if (li.tagName === 'LI') {
                li.classList.add('task-list-item')
            }
        }
    }())
</script>

</html>`,

    stylesheet: `<link rel="stylesheet" href="/assets/libs/font-awesome-4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="/assets/css/style.css">
<link rel="stylesheet" href="/assets/css/custom.css">`
}

