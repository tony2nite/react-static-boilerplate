// var cache_manager = require('cache-manager');
var fs = require('fs');
var url = require('url');
var mkdirp = require('mkdirp');

module.exports = {
    setOutputPath: function(outputPath) {
      this.outputPath = outputPath;
    },
    afterPhantomRequest: function(req, res, next) {
        if(req.prerender.statusCode !== 200) {
            return next();
        }

        var path = this.outputPath + url.parse(req.prerender.url).pathname;
        mkdirp(path, function (err) {
            if (err) {
              console.log('Error creating output folder', err);
            } else {
              var file
              if (path.substr(-1) === '/') {
                file = path + 'index.html';
              } else {
                file = path + '/index.html';
              }
              console.log('Writing file ' + file);
              fs.writeFileSync(file, req.prerender.documentHTML, 'utf8');

              return next();
            }
        });
    }
};
