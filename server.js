const app = require('koa')(),
  router = require('koa-router'),
  serve = require('koa-static'),
  fs = require('fs'),
  https = require('https'),
  privateKey = fs.readFileSync('./cert/private.pem', 'utf8'),
  certificate = fs.readFileSync('./cert/file.crt', 'utf8'),
  credentials = { key: privateKey, cert: certificate };



// Send static files
app.use(serve('./public'));


// Router
app.use(router(app));

// This must come after last app.use()
var server = require('http').Server(app.callback()),
  io = require('socket.io')(server);

/**
 * Routes can go both before and after but
 * app.use(router(app)); must be before
 */
app.get('/', function* (next) {
  yield this.render('index', { my: 'data' });
});

// Socket.io
io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

// Start the server
server.listen(1337);
console.info('Now running on localhost:1337');