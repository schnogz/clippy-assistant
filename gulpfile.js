const gulp = require("gulp");
const babel = require('gulp-babel');
const uglify = require("gulp-uglify");
const minify = require("gulp-minify-css");
const concat = require("gulp-concat");
const pngquant = require("imagemin-pngquant");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");

gulp.task('babel', () => {
  return gulp.src('src/**/*.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('es2015'));
});

gulp.task("build-mapfile-image", function () {
    return gulp.src("agents/**/*.png")
        .pipe(imagemin({progressive: true, use: [pngquant()]}))
        .pipe(gulp.dest("build/agents"));
});

gulp.task("build-mapfile", function () {
    return gulp.src(["agents/**/*", "!agents/**/*.png", "!agents/**/*.js"])
        .pipe(gulp.dest("build/agents"));
});

gulp.task("build-agents", function () {
    return gulp.src("agents/**/*.js")
        .pipe(uglify())
        .pipe(gulp.dest("build/agents"));
});

gulp.task("build-css", function () {
    return gulp.src("src/clippy.css")
        .pipe(gulp.dest("build"))
        .pipe(minify())
        .pipe(gulp.dest("build"))
        .pipe(rename("clippy.min.css"))
        .pipe(gulp.dest("build"))
});

gulp.task("build-js", function () {
    return gulp.src("src/**/*.js")
        .pipe(concat("clippy.js"))
        .pipe(gulp.dest("build"))
        .pipe(uglify())
        .pipe(rename("clippy.min.js"))
        .pipe(gulp.dest("build"));
});

gulp.task("default", ["build-js", "babel", "build-css", "build-agents", "build-mapfile", "build-mapfile-image"]);
