    // core Gulp
var gulp = require('gulp'),

    // Gulp plugins
    rimraf = require('rimraf'),
    jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    flatten = require('gulp-flatten'),
    minifyCss = require('gulp-minify-css'),
    inject = require('gulp-inject'),
    runSequence = require('run-sequence'),
    mocha = require('gulp-mocha'),
    series = require('stream-series'),
    mochaPhantomJS = require('gulp-mocha-phantomjs');

//select theme to use
//var themeFile = 'ogrid-theme-orig.css';
var themeFile = 'ogrid-theme-blue.css'
var themeSource = 'src/css/' + themeFile;

var themeStream = gulp.src(themeSource, {read: false});

//used in scripts-app task
var app_sources = [
    //must be sorted in dependency order
    'src/js/ogrid.js',
    'src/js/core/Class.js',
    'src/js/core/QSearchProcessor.js',

    'src/js/ux/Main.js',
    'src/js/ux/manage/SecuredFunctions.js',
    'src/js/util/service/BaseServiceErrorHandler.js',
    'src/js/custom/service/TemplateServiceErrorHandler.js',
    'src/js/data/ShapeMap.js',

    'src/js/custom/data/ChicagoZipShapeMap.js',
    'src/js/custom/data/ChicagoWardsShapeMap.js',
    'src/js/custom/data/ChicagoCityShapeMap.js',
    'src/js/custom/qsearch/LatLng.js',
    'src/js/custom/qsearch/Place.js',
    'src/js/custom/qsearch/Tweet.js',
    'src/js/custom/qsearch/Weather.js',

    'src/js/custom/Config.js',
    'src/js/session/Session.js',
    'src/js/**/*.js'
];

//used in scripts-lib task
var third_party_sources = [
    //must be sorted in dependency order
    'lib/jquery-1.11.2/jquery.min.js',
    'lib/jquery-1.11.2/jquery-ui.js',
    'lib/bootstrap-3.3.5/js/bootstrap.js',
    'lib/bootstrap-3.3.5/js/moment-with-locales.js',
    'lib/bootstrap-table-1.8.1/js/bootstrap-table.js',
    'lib/leaflet-0.7.3/js/leaflet-src.js',
    'lib/jspdf-1.1.135/js/jspdf.js',
    'lib/**/*.js'
];

//debug tasks start ******************
//clean our target folder
gulp.task('clean-debug', function (cb) {
    rimraf('./debug', cb);
});

//need to copy templates to debug directory as Config points to relative path
gulp.task('templates-debug', function () {
    return gulp.src('./src/templates/*')
        .pipe(gulp.dest('./debug/templates'));
});

gulp.task('html-debug', function(){
    return gulp.src('./src/index.html')
        .pipe(inject(
            gulp.src(third_party_sources.concat(['lib/**/*.css']), {read: false}),
            {starttag: '<!-- inject:head:{{ext}} -->', relative: true}
        ))
        .pipe(inject(series(
            gulp.src(app_sources.concat(['src/css/*.css', 'config/EnvSettings.js', '!./src/css/ogrid-theme*']), {read: false}), themeStream),
            { relative: false, addRootSlash: false, addPrefix: '..' }
        ))
        .pipe(gulp.dest('./debug'))
});

gulp.task('leaflet-images-debug', function () {
    return gulp.src([
        './lib/leaflet*/js/images/*.png'
        ])
        .pipe(flatten())
        .pipe(gulp.dest('debug/images'));
});

//debug tasks end ********************


//release tasks start ******************
//clean our target folder
gulp.task('clean', function (cb) {
    rimraf('./dist', cb);
});

//minify our application CSS files
gulp.task('css-app', function() {
    return gulp.src(['src/css/*.css', '!./src/css/ogrid-theme*'])
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(concat('app.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('css-theme', function() {
    return gulp.src(themeSource)
        .pipe(gulp.dest('dist/css'));
});

//minify our 3rd-party library CSS files
gulp.task('css-lib', function() {
    return gulp.src(['lib/**/*.css'])
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(concat('lib.css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('css', ['css-app', 'css-lib' ]);

//some leaflet components expect their images on a specific folder
gulp.task('images-leaflet1', function () {
    return gulp.src([
        './lib/leaflet*/css/images/*',
    ])
        .pipe(flatten())
        .pipe(gulp.dest('dist/css/images'));
});

gulp.task('images-leaflet2', function () {
    return gulp.src([
        './lib/leaflet*/css/fullscreen*.png',
    ])
        .pipe(flatten())
        .pipe(gulp.dest('dist/css'));
});

gulp.task('images-all', function () {
    return gulp.src([
        './lib/**/*.png'
    ])
        .pipe(flatten())
        .pipe(gulp.dest('dist/images'));
});

gulp.task('images', ['images-leaflet1', 'images-leaflet2', 'images-all' ]);

gulp.task('fonts', function () {
    return gulp.src([
        './lib/**/fonts/*'
    ])
        .pipe(flatten())
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('templates', function () {
    return gulp.src('./src/templates/*')
        .pipe(gulp.dest('dist/templates'));
});

// concat and minify our app JS files
gulp.task('scripts-app', function() {
    return gulp.src(app_sources)
        //.pipe(concat('app.js'))
        //.pipe(gulp.dest('dist/js'))
        //.pipe(rename('app.min.js'))

        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('env-settings', function () {
    return gulp.src([
        './config/**/*'
        ]).pipe(gulp.dest('dist/config'));
});

//concat and minify 3rd party libraries
gulp.task('scripts-lib', function() {
    return gulp.src(third_party_sources)
        //.pipe(concat('lib-bundle.js'))
        //.pipe(gulp.dest('dist/js'))
        //.pipe(rename('lib-bundle.min.js'))

        .pipe(concat('lib-bundle.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts', ['scripts-app', 'scripts-lib']);

gulp.task('html-release', function(){
    return gulp.src('./src/index.html')
        .pipe(inject(gulp.src(['./dist/**/lib*min.js', './dist/**/lib*.css'], {read: false}), {
            starttag: '<!-- inject:head:{{ext}} -->',
            ignorePath: '/dist/',
            addRootSlash: false
        }))

        //Note: do not use min version of app js as we still have minify issue with the hereDoc templates
        //use minified app js for release version
        .pipe(inject(gulp.src(
                ['./dist/**/app*', '!./dist/**/app.js', 'config/EnvSettings.js', './dist/css/ogrid-theme*'],
                {read: false}
                ),
                {ignorePath: '/dist/', addRootSlash: false}
            )
        )
        .pipe(gulp.dest('./dist'))
});
//release tasks end ******************

//general tasks
// lint our custom code
gulp.task('lint', function() {
    return gulp.src('src/js/**/*.js')
        .pipe(jshint({ laxcomma: true, laxbreak: true }))
        .pipe(jshint.reporter('default'));
});

// sass
//no sass files currently
gulp.task('sass', function() {
    return gulp.src('src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('dist/css'))
});


//watch files for changes
gulp.task('watch', function() {
    gulp.watch('src/js/*.js', ['lint', 'scripts-app']);
});


gulp.task('test', function () {
    return gulp.src('test/runner.html')
        .pipe(mochaPhantomJS({'reporter': 'spec'}));
});

gulp.task('debug',  function(cb) {
    runSequence('lint',
        'clean-debug',

        //can be async
        ['leaflet-images-debug', 'templates-debug', 'html-debug'],
        cb);
});

gulp.task('release',  function(cb) {
    runSequence(
        'clean',
        'lint',
        'test',

        //can be async
        ['sass', 'css', 'css-theme', 'images', 'fonts', 'templates'],
        'scripts',
        'env-settings',
        'html-release',
        cb
    );
});

// default task points to our release tasks
gulp.task('default', ['release']);