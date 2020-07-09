/* eslint-disable */
'use strict';

import plugins from 'gulp-load-plugins';
import yargs from 'yargs';
import browser from 'browser-sync';
import gulp from 'gulp';
import panini from 'panini';
import rimraf from 'rimraf';
import sherpa from 'style-sherpa';
import yaml from 'js-yaml';
import fs from 'fs';
import webpackStream from 'webpack-stream';
import webpack from 'webpack';
import named from 'vinyl-named';
import pa11y from 'pa11y';
import reporter from 'eslint-html-reporter';

const timeStamp = `/* Created: ${new Date().toLocaleString()} Starbucks */\n`;

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

// Load settings from settings.yml
const { COMPATIBILITY, PORT, UNCSS_OPTIONS, PATHS } = loadConfig();

function loadConfig() {
    let ymlFile = fs.readFileSync('config.yml', 'utf8');
    return yaml.load(ymlFile);
}

// Build the "dist" folder by running all of the below tasks
gulp.task('build',
    gulp.series(clean, gulp.parallel(pages, sass, images, copy)));

// Build the site, run the server, and watch for file changes
gulp.task('default',
    gulp.series('build', server, watch));





// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
    rimraf(PATHS.dist, done);
}

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
function copy() {
    return gulp.src(PATHS.assets)
        .pipe(gulp.dest(PATHS.dist + '/assets'));
}


// Copy page templates into finished HTML files
function pages() {
    return gulp.src('src/templates/pages/**/*.{html,hbs,handlebars}')
        .pipe(panini({
            root: 'src/templates/',
            layouts: 'src/templates/layouts/',
            partials: 'src/templates/components/',
            data: 'src/templates/data/',
            helpers: 'src/templates/helpers/'
        }))
        .pipe(gulp.dest(PATHS.dist));
}

// Load updated HTML templates and partials into Panini
function resetPages(done) {
    panini.refresh();
    done();
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
    return gulp.src(PATHS.appSass)
        .pipe($.sourcemaps.init())
        .pipe($.sass({
                includePaths: PATHS.sass
            })
            .on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: COMPATIBILITY
        }))
        // Comment in the pipe below to run UnCSS in production
        .pipe($.cleanCss())
        .pipe($.injectString.prepend(timeStamp))
        .pipe(gulp.dest(PATHS.dist + '/assets/css'))
        .pipe(browser.reload({ stream: true }));
}

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
    return gulp.src('src/assets/images/**/*')
        .pipe($.if(PRODUCTION, $.imagemin({
            progressive: true
        })))
        .pipe(gulp.dest(PATHS.dist + '/assets/img'));
}


// Start a server with BrowserSync to preview the site in
function server(done) {
    browser.init({
        server: PATHS.dist,
        port: PORT,
        https: true,
    });
    done();
}

// Reload the browser with BrowserSync
function reload(done) {
    browser.reload();
    done();
}

//sass lint
function sassLint() {
    return gulp.src(['src/assets/scss/**/*.scss',
            'src/templates/components/**/*.scss',
        ])
        .pipe($.sassLint())
        .pipe($.sassLint.format(fs.createWriteStream(PATHS.sasslint)))
        .pipe($.sassLint.failOnError())
}


// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
    gulp.watch(PATHS.assets, copy);
    gulp.watch('src/templates/**/*.{html,hbs}').on('all', gulp.series(resetPages, pages, browser.reload));
    gulp.watch(['src/templates/components/**/*.scss', 'src/assets/scss/**/*.scss']).on('all', gulp.series(sass));
    gulp.watch('src/assets/images/**/*').on('all', gulp.series(images, browser.reload));
}