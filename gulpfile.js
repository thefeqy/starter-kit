var gulp = require('gulp');
var sassLib = require('sass');
var yargs = require('yargs');
var gulpSass = require('gulp-sass');
var gulpIf = require('gulp-if');
var sourceMaps = require('gulp-sourcemaps');
var cleanCss = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');

var sass = gulpSass(sassLib);
var sync = browserSync.create();

var PRODUCTION = yargs(process.argv.slice(2)).argv.prod;

var paths = {
	html: {
		src: 'src/**/*.html',
		dest: 'assets/',
	},
	styles: {
		src: 'src/scss/*.scss',
		dest: 'assets/css',
	},
	scripts: {
		dir: 'src/js/',
		dest: 'assets/js',
		files: [
			{
				src: 'index.js',
			},
		],
	},
	images: {
		src: 'src/images/**/*.{jpg,jpeg,png,gif,svg}',
		dest: 'assets/images',
	},
};

// Building and minifying styles
gulp.task('buildStyles', function () {
	return gulp
		.src(paths.styles.src)
		.pipe(gulpIf(!PRODUCTION, sourceMaps.init()))
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(gulpIf(PRODUCTION, cleanCss({ compatibility: 'ie8' })))
		.pipe(gulpIf(!PRODUCTION, sourceMaps.write('./')))
		.pipe(gulpIf(PRODUCTION, rename({ suffix: '.min' })))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(sync.stream());
});

// Concatenate and minify scripts
gulp.task('scripts', function (done) {
	paths.scripts.files.map(function (entry) {
		return browserify({
			entries: [paths.scripts.dir + entry.src],
		})
			.transform(babelify, { presets: ['@babel/preset-env'] })
			.bundle()
			.pipe(source(entry.src))
			.pipe(rename({ extname: '.min.js', basename: 'main' }))
			.pipe(buffer())
			.pipe(gulpIf(!PRODUCTION, sourceMaps.init({ loadMaps: true })))
			.pipe(gulpIf(PRODUCTION, uglify()))
			.pipe(gulpIf(!PRODUCTION, sourceMaps.write('./')))
			.pipe(gulp.dest('assets/js'))
			.pipe(sync.stream());
	});

	done();
});

// Optimizing Images
gulp.task('optimizeImages', function () {
	return gulp
		.src(paths.images.src)
		.pipe(gulpIf(PRODUCTION, imagemin()))
		.pipe(gulp.dest(paths.images.dest))
		.pipe(sync.stream());
});

// Delete build directory
gulp.task('devClean', function() {
	console.log(
		'\n\t',
		'Cleaning build folder for fresh start.\n'
	);
	return del(['./assets']);
});

// Build Script - "npm run build"
gulp.task(
	'default',
	gulp.series('devClean', 'buildStyles', 'scripts', 'optimizeImages')
);

// Development Mode
gulp.task(
	'dev',
	gulp.series('default', function () {
		sync.init({
			server: {
				baseDir: './',
			},
		});

		gulp.watch('src/scss/**/*.scss', gulp.series('buildStyles'));
		gulp.watch('src/js/**/*.js', gulp.series('scripts'));
		gulp.watch('src/images/*', gulp.series('optimizeImages')).on(
			'change',
			sync.reload
		);
	})
);
