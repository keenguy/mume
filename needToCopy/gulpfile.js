'use strict';

var gulp = require('gulp');
var del = require('del');
// var newer = require('gulp-newer');
// var {mark, generateIndex} = require('./blog-site');

// var tap = require('gulp-tap');
// var fs = require('fs');
// var path = require('path');
// var merge = require('merge-stream');

// var sass = require('gulp-sass');
// var exec = require('child_process').exec;
// var git = require('gulp-git');
// var runSequence = require('run-sequence');
var webserver = require('gulp-webserver');

var exec = require('child_process').exec;

gulp.task('default',['rebuild']);


gulp.task('rebuild', ['clean'], function(cb) {
    exec('node index.js', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})

//compile less; copy assets/, CNAME;
gulp.task('copy', function(cb) {
    exec('node index.js copy', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})
//generate html files
gulp.task('build', function(cb) {
    exec('node index.js build', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
})

gulp.task('clean', function(cb) {
    del([
        // 这里我们使用一个通配模式来匹配 `mobile` 文件夹中的所有东西
        'docs',
        // 我们不希望删掉这个文件，所以我们取反这个匹配模式
        '!package.json'
    ]).then(function(res, err) { cb(err); });
});

gulp.task('ws', function() {
    gulp.src('docs/')
        .pipe(webserver({
            livereload: true,
            directoryListing: false,
            open: true,
            fallback: '404.html'
        }));
});