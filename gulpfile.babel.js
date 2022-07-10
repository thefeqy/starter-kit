'use strict';

import gulp from 'gulp';
import sassLib from 'sass';
import yargs from 'yargs';
import gulpSass from 'gulp-sass';
import gulpIf from 'gulp-if';
import sourceMaps from 'gulp-sourcemaps';
import cleanCss from 'gulp-clean-css';
import imagemin from 'gulp-imagemin';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import autoprefixer from 'gulp-autoprefixer';
import rename from 'gulp-rename';

const sass = gulpSass(sassLib);
const sync = browserSync.create();

const PRODUCTION = yargs(process.argv.slice(2)).argv.prod;

const paths = {
	html: {
		src: 'src/**/*.html',
		dest: 'build/',
	},
	styles: {
		src: 'src/assets/scss/*.scss',
		dest: 'build/assets/css',
	},
	scripts: {
		src: 'src/assets/js/**/*.js',
		dest: 'build/assets/js',
	},
	images: {
		src: 'src/assets/images/**/*.{jpg,jpeg,png,gif,svg}',
		dest: 'build/assets/images',
	},
};

// Copy HTML files
gulp.task('copyHTML', () => {
	return gulp.src(paths.html.src).pipe(gulp.dest(paths.html.dest));
});

// Building and minifying styles
gulp.task('buildStyles', () => {
	return gulp
		.src(paths.styles.src)
		.pipe(gulpIf(!PRODUCTION, sourceMaps.init()))
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(gulpIf(PRODUCTION, cleanCss({ compatibility: 'ie8' })))
		.pipe(gulpIf(!PRODUCTION, sourceMaps.write('./')))
		.pipe(gulpIf(!PRODUCTION, gulp.dest(paths.styles.dest)))
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(sync.stream());
});

// Concatenate and minify scripts
gulp.task('concatScripts', () => {
	return gulp
		.src(paths.scripts.src)
		.pipe(concat('main.js'))
		.pipe(gulpIf(PRODUCTION, uglify()))
		.pipe(gulp.dest(paths.scripts.dest))
		.pipe(sync.stream());
});

// Optimizing Images
gulp.task('optimizeImages', () => {
	return gulp
		.src(paths.images.src)
		.pipe(gulpIf(PRODUCTION, imagemin()))
		.pipe(gulp.dest(paths.images.dest))
		.pipe(sync.stream());
});

// Dev
gulp.task('dev', () => {
	sync.init({
		server: {
			baseDir: './build/',
		},
	});

	gulp.watch('src/**/*.html', gulp.series('copyHTML')).on(
		'change',
		sync.reload
	);
	gulp.watch('src/assets/scss/**/*.scss', gulp.series('buildStyles'));
	gulp.watch('src/assets/js/**/*.js', gulp.series('concatScripts'));
	gulp.watch('src/assets/images/*', gulp.series('optimizeImages')).on(
		'change',
		sync.reload
	);
});

// Build Script - "npm run build"
gulp.task(
	'default',
	gulp.series('copyHTML', 'buildStyles', 'concatScripts', 'optimizeImages')
);
