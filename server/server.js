let Koa = require('koa'),
  app = new Koa(),
  router = require('koa-router'),
  serve = require('koa-static'),
  fs = require('fs'),
  https = require('https'),
  privateKey = fs.readFileSync('./cert/private.pem', 'utf8'),
  certificate = fs.readFileSync('./cert/file.crt', 'utf8'),
  credentials = { key: privateKey, cert: certificate };



// Send static files
app.use(serve('./client'));


// 这一行代码一定要在最后一个app.use后面使用
var server = https.createServer(credentials,app.callback()),
    io = require('socket.io')(server);

// Socket.io
io.on('connection', function (socket) {
  console.log('done done done')
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

// Start the server
server.listen(8081);
console.info('Now running on localhost:8081'); 