// var cache_manager = require('cache-manager');
const fs = require('fs');
const url = require('url');
const mkdirp = require('mkdirp');

module.exports = {
  setOutputPath(outputPath) {
    this.outputPath = outputPath;
  },

  afterPhantomRequest(req, res, next) {
    if (req.prerender.statusCode === 200) {
      const path = this.outputPath + url.parse(req.prerender.url).pathname;
      mkdirp(path, (err) => {
        if (err) {
          console.log('Error creating output folder', err);
        } else {
          let file;
          if (path.substr(-1) === '/') {
            file = `${path}index.html`;
          } else {
            file = `${path}/index.html`;
          }
          console.log(`Writing file ${file}`);
          fs.writeFileSync(file, req.prerender.documentHTML, 'utf8');
        }
      });
    }
    return next();
  },
};
