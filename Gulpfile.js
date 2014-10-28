//
// Build
//
var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    gulp  = require('gulp'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),
    rimraf = require('rimraf'),
    source = require('vinyl-source-stream'),
    uglify = require('gulp-uglify');

var watch = [
    './app/js/*.js',
    './app/js/**/*.js',
    './app/*.html',
    './app/**/*.html'
];

// lighthouse and lighthouse-client live at the same filesystem level
var staticRoot = '../lighthouse/static/';
var appRoot = './app/js/app.js';
var isProd = false;

// TL;DR Default task
gulp.task('default', ['prod', 'build']);

//
// Tasks
//
// sets up development build context
gulp.task('dev', function () {
    isProd = false;
});

// sets up production build context
gulp.task('prod', function () {
    isProd = true;
});

// Build app and assets
gulp.task('build', ['jshint', 'browserify', 'views']);

// JSHint
gulp.task('jshint', function () {
    gulp.src('./app/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// Browserify task for js assets
// -- This will package our app into a single file for distribution
gulp.task('browserify', function() {
    // do magic
    browserify(appRoot, {
        debug: isProd
    })
    .bundle()
    // Bundle to a single file
    .pipe(source('app.js'))
    // convert to buffer for use by uglify (doesn't like streams)
    .pipe(buffer())
    // minify source, skip on dev build
    .pipe(isProd ? uglify() : gutil.noop())
    // Output it to our dist folder
    .pipe(gulp.dest(staticRoot + 'js/'));
});

// View task for html assets
gulp.task('views', function () {
    gulp.src('./app/*.html')
    .pipe(gulp.dest(staticRoot))
})

// Watch for source updates, will use dev build
gulp.task('watch', ['dev'], function() {
    gulp.watch(watch, ['browserify', 'views']);
});

// Clean build artifacts
gulp.task('clean', function () {
    rimraf(staticRoot, function (er) {
        if (er) {
            console.log(er);
        }
    });

    rimraf(staticRoot, function (er) {
        if (er) {
            console.log(er);
        }
    });
});
