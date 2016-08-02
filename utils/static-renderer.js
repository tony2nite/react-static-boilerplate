const request = require('request');
const queue = require('async/queue');
const http = require('http');
const cluster = require('cluster');
const _ = require('lodash');


const prerenderServer = require('prerender/lib/server');
const prerenderFileWriter = require('./prerender-file-writer');
module.exports = {
  close: () => {
    prerenderServer.exit();
  },
  render: (outputPath, targetHost, paths) => {
    return new Promise((resolve, reject) => {
      console.log('Waiting for Static Render Server...');
      const PRERENDER_PORT = 3000;

      const options = {};
      options.isMaster = false;
      options.port = PRERENDER_PORT;
      options.worker = {iteration: 0};

      prerenderServer.init(options);
      prerenderFileWriter.setOutputPath(outputPath);
      prerenderServer.use(prerenderFileWriter);

      const hostname = process.env.NODE_HOSTNAME || undefined;
      const httpServer = http.createServer(_.bind(prerenderServer.onRequest, prerenderServer));
      httpServer.listen(PRERENDER_PORT, undefined, function () {
        console.log(`Render server running on port ${PRERENDER_PORT}`);
      });
      prerenderServer.start();

      // Wait for prerender to initialise
      const startupWait = setInterval(()=> {
        if (prerenderServer.phantom) {
          clearInterval(startupWait);

          console.log('Static Render Server started');

          // For the moment doing rendering one page at a time - was getting prerender errors
          // though in theory could run multiple threads.
          var q = queue(function(path, callback) {
            const url = `http://localhost:${PRERENDER_PORT}/${targetHost}${path}`;
            console.log(`Rendering ${url}`);
            request.get({
              url: url,
            }, (error, response, body) => {
              callback();
            });
          }, 1);
          q.drain = function() {
            console.log('All items have been rendered');
            resolve();
          }
          q.push(paths);
        }
      }, 500);
    });
  }
};
