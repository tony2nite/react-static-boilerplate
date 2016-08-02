const request = require('request');
const queue = require('async/queue');
const http = require('http');
const _ = require('lodash');


const prerenderServer = require('prerender/lib/server');
const prerenderFileWriter = require('./prerender-file-writer');
module.exports = {
  close: () => {
    prerenderServer.exit();
  },
  render: (outputPath, targetHost, paths) => new Promise((resolve) => {
    console.log('Waiting for Static Render Server...');
    const PRERENDER_PORT = 3000;

    const options = {};
    options.isMaster = false;
    options.port = PRERENDER_PORT;
    options.worker = { iteration: 0 };

    prerenderServer.init(options);
    prerenderFileWriter.setOutputPath(outputPath);
    prerenderServer.use(prerenderFileWriter);

    const httpServer = http.createServer(_.bind(prerenderServer.onRequest, prerenderServer));
    httpServer.listen(PRERENDER_PORT, undefined, () => {
      console.log(`Render server running on port ${PRERENDER_PORT}`);
    });
    prerenderServer.start();

    // Wait for prerender to initialise
    const startupWait = setInterval(() => {
      if (prerenderServer.phantom) {
        clearInterval(startupWait);

        console.log('Static Render Server started');

        // For the moment doing rendering one page at a time - was getting prerender errors
        // though in theory could run multiple threads.
        const q = queue((path, callback) => {
          const url = `http://localhost:${PRERENDER_PORT}/${targetHost}${path}`;
          console.log(`Rendering ${url}`);
          request.get({
            url,
          }, (error) => {
            callback(error);
          });
        }, 1);
        q.drain = () => {
          console.log('All items have been rendered');
          resolve();
        };
        q.push(paths);
      }
    }, 500);
  }),
};
