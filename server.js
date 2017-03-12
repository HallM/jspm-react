'use strict';

const babelutil = require('babel-core').util;

const onlyReloadRegex = /public/;
const onlyReloadThese = babelutil.arrayify(onlyReloadRegex, babelutil.regexify);
const babelExtensions = ['.js', '.jsx'];

require("babel-register")({
  cache: false,
  only: onlyReloadRegex,
  extensions: babelExtensions
});

babelExtensions.forEach(function(ext) {
  const oldHandler = require.extensions[ext];

  require.extensions[ext] = function(m, filename) {
    oldHandler(m, filename);

    if (!babelutil.shouldIgnore(filename, [], onlyReloadThese)) {
      console.log(filename);
      delete require.cache[filename];
    }
  };
});

const http = require('http');
const express = require('express');
const port = process.env.PORT || 9080;

const app = express();
const httpServer = http.createServer(app);

require('chokidar-socket-emitter')({app: httpServer});

app.use('/', express.static('public'));

const React = require('react');
const ReactDom = require('react-dom/server');
const ReactRouter = require('react-router');
const mobx = require('mobx-react');

const e = React.createElement
const renderToString = ReactDom.renderToString;
const match = ReactRouter.match;
const RouterContext = ReactRouter.RouterContext;
const Provider = mobx.Provider;

function renderPage(renderProps, appstate) {
  const componentHTML = renderToString(
    e(
      Provider,
      {},
      e(
        RouterContext,
        renderProps
        // {...renderProps}
      )
    )
  );

  const initialState = {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">
  <title>App</title>
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <script>
    window.__INITIAL_STATE__ = ${ JSON.stringify(initialState) };
  </script>
</head>
<body>
  <div id="app">${componentHTML}</div>
  <script src="jspm_packages/system.js"></script>
  <script src="config.js"></script>
  <script src="https://cdn.polyfill.io/v1/polyfill.min.js?features=Intl.~locale.en"></script>
  <script>
    var readyForMainLoad
    if (location.origin.match(/localhost/)) {
     System.trace = true
     readyForMainLoad = System.import('capaj/systemjs-hot-reloader').then(function(HotReloader){
       hr = new HotReloader.default('http://localhost:9080')  // chokidar-socket-emitter port
     })
    }
    Promise.resolve(readyForMainLoad).then(() => {
     System.import('app').then(function () {
       console.log('ran at ', new Date())
     })
    })
  </script>
</body>
</html>
`;
}

app.use((req, res) => {
  const routes = require('./public/routes').default;

  // Note that req.url here should be the full URL path from
  // the original request, including the query string.
  match({ routes, location: req.url }, (error, redirectLocation, renderProps) => {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      res.status(200).send(renderPage(renderProps, null));
    } else {
      res.status(404).send('Not found');
    }
  })
});

httpServer.listen(port, () => {
  console.log('Listening on port ', port);
});
