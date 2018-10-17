const path = require('path')
const gulp = require('gulp')
const gutil = require('gulp-util')
const print = require('gulp-print')
const sequence = require('gulp-sequence')
const ghPages = require('gulp-gh-pages')
const sitemap = require('gulp-sitemap')

const assets = require('niehues-assets')

const presets = {}

if (process.env.CANONICAL) {
  presets.buildPath = './canonical-build'
  presets.distPath = './canonical-dist'
}

const config = require('./lib/config')(presets)
config.load(assets.configs[config.get('env')])
config.loadFile(path.resolve(__dirname, 'lib', 'environments', `${config.get('env')}.json`))

const tasks = [
  require('./lib/tasks/template-tasks'),
  require('./lib/tasks/release-tasks'),
  require('./lib/tasks/development-tasks')
]

tasks.forEach(service => service.load(gulp, config))

gulp.task('run', sequence(['watch', 'server']))

gulp.task('sitemap', () => {
  return gulp.src([`${config.get('distPath')}/**/*.html`, path.resolve(__dirname, 'sitemap-dummies/**/*')])
  .pipe(sitemap({
    siteUrl: config.get('singlesHost')
  }))
  .pipe(gulp.dest(config.get('distPath')))
})

gulp.task('prod-build', sequence('dist', 'sitemap'))

gulp.task('deploy', ['prod-build'], () => {
  const files = [config.get('distGlob')]
  let options = {}

  if (config.get('canonical')) {
    options = {
      remoteUrl: 'git@github.com:anyhues-singles/anyhues-singles.github.io.git',
      branch: 'master'
    }

    files.push('CNAME')
    files.push(assets.favIcon)
  }

  gulp.src(files)
  .pipe(ghPages(options).on('error', gutil.log))
  .pipe(print())
})
