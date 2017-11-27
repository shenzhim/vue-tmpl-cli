var path = require('path')
var async = require('async')
var chalk = require('chalk')
var inquirer = require('inquirer')
var Metalsmith = require('metalsmith')
var render = require('consolidate').handlebars.render
var exists = require('fs').existsSync
var metadata = require('read-metadata')
var promptMapping = {
  string: 'input',
  boolean: 'confirm'
}
/**
 * Generate a template given a `src` and `dest`.
 *
 * @param {String} name
 * @param {String} src
 * @param {String} dest
 * @param {Function} done
 */

module.exports = function generate (name, src, dest, done) {
  var metalsmith = Metalsmith(path.join(src, 'template'))
  var data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  })

  var opts = getMetadata(src);

  metalsmith.use(askQuestions(opts.prompts))
    .use(renderTemplateFiles())

  metalsmith.clean(false)
    .source('.') // start from template root instead of `./src` which is Metalsmith's default for `source`
    .destination(dest)
    .build(function (err, files) {
      done(err)
        logMessage(opts.completeMessage, data)
    })

  return data
}

function getMetadata (dir) {
  var json = path.join(dir, 'meta.json')
  var opts = {}

  if (exists(json)) {
    opts = metadata.sync(json)
  } 
  return opts
}

/**
 * Create a middleware for asking questions.
 *
 * @param {Object} prompts
 * @return {Function}
 */

function askQuestions (prompts) {
  return function (files, metalsmith, done) {
    var data = metalsmith.metadata();
    
    async.eachSeries(Object.keys(prompts), function (key, next) {
      var prompt = prompts[key];
      var promptDefault = prompt.default
      if (typeof prompt.default === 'function') {
        promptDefault = function () {
          return prompt.default.bind(this)(data)
        }
      }

      inquirer.prompt([{
        type: promptMapping[prompt.type] || prompt.type,
        name: key,
        message: prompt.message || prompt.label || key,
        default: promptDefault,
        choices: prompt.choices || [],
        validate: prompt.validate || function () { return true }
      }]).then(function(answers){
        if (Array.isArray(answers[key])) {
          data[key] = {}
          answers[key].forEach(function (multiChoiceAnswer) {
            data[key][multiChoiceAnswer] = true
          })
        } else if (typeof answers[key] === 'string') {
          data[key] = answers[key].replace(/"/g, '\\"')
        } else {
          data[key] = answers[key]
        }

        next()
      })
    }, done)

  }
}

/**
 * Template in place plugin.
 *
 * @param {Object} files
 * @param {Metalsmith} metalsmith
 * @param {Function} done
 */

function renderTemplateFiles () {
  return function (files, metalsmith, done) {
    var keys = Object.keys(files)
    var metalsmithMetadata = metalsmith.metadata()
    async.each(keys, function (file, next) {
      var str = files[file].contents.toString()
      if (!/{{([^{}]+)}}/g.test(str)) {
        return next()
      }
      render(str, metalsmithMetadata, function (err, res) {
        if (err) {
          err.message = `[${file}] ${err.message}`
          return next(err)
        }
        files[file].contents = new Buffer(res)
        next()
      })
    }, done)
  }
}

/**
 * Display template complete message.
 *
 * @param {String} message
 * @param {Object} data
 */

function logMessage (message, data) {
  if (!message) return
  render(message, data, function (err, res) {
    if (err) {
      console.error('\n   Error when rendering template complete message: ' + err.message.trim())
    } else {
      console.log('\n' + res.split(/\r?\n/g).map(function (line) {
        return '   ' + line
      }).join('\n'))
    }
  })
}
