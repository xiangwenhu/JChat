let Koa = require('koa'),
  app = new Koa(),
  serve = require('koa-static'),
  fs = require('fs'),
  path = require('path'),
  https = require('https'),
  privateKey = fs.readFileSync(path.join(__dirname, '/cert/private.pem'), 'utf8'),
  certificate = fs.readFileSync(path.join(__dirname, './cert/file.crt'), 'utf8'),
  credentials = { key: privateKey, cert: certificate }

//const MAX_ROOM = 10

// Send static files
app.use(serve('./client'))


// 这一行代码一定要在最后一个app.use后面使用
var server = https.createServer(credentials, app.callback()),
  io = require('socket.io')(server)

const rooms = new Map()
const clients = {}
// Socket.io
io.on('connection', function (socket) {

  socket.on('chat', (type, data) => {
    switch (type) {
      case 'userName':
        socket.uname = data
        clients[socket.id] = data
        io.sockets.emit('chat', 'allClients', clients)
        break
      case 'rooms':
        break
      case 'enterRoom':
        //发起方的id作为房间名        
        if (data.roomId && data.targetId) {
          socket.join(data.roomId)
          var ts = io.sockets.sockets[data.targetId]
          if (ts) {
            ts.join(data.roomId)
            //通知被加入方,
            //TODO::多人聊天应该是向其他所有客户端
            ts.emit('chat', 'enterRoom', { roomId: data.roomId, targetName: socket.uname })
          }
        }
        break
      case 'message':
        //发给除自己外的客户端
        data.roomId && socket.broadcast.to(data.roomId).emit('chat', 'message', {
          from: socket.uname,
          message: data.message
        })
        break
      default:
        break
    }
  })

  socket.on('webrtc', (type, roomId, data) => {
    let rm = io.sockets.adapter.rooms[roomId]
    switch (type) {
      case 'start':
        if (rm && Object.keys(rm.sockets).length >= 2) {
          for (let clientId in rm.sockets) {
            let client = io.sockets.connected[clientId]
            client != socket ? client.emit('webrtc', type, { guest: false, roomId }) : socket.emit('webrtc', type, { guest: true })
          }
        }
        break
      case 'candidate':
      case 'offer':
      case 'answer':
      case 'close':
        if (rm) {
          for (let clientId in rm.sockets) {
            let client = io.sockets.connected[clientId]
            if (client != socket) {
              client.emit('webrtc', type, data)
            }
          }
        }
        break
    }
  })

  socket.on('disconnect', () => {
    let rms = io.sockets.adapter.rooms
    console.log('当前房间数量:' + Object.keys(rms).length)
    console.log(`${socket.uname} 离开了`)

    //删除client
    delete clients[socket.id]

    //从所有加入的房间移除,这一步如果房间没有连接，会自动删除房间本身
    io.sockets.adapter.delAll(socket.id)

    //删除用户名
    let room = rooms.get(socket.rname), index = -1
    room && (index = room.findIndex(n => n == socket.uname)) >= 0 && room.splice(index, 1)

    io.sockets.emit('chat', 'allClients', clients)
    console.log('当前房间数量:' + Object.keys(rms).length)
  })

})

// Start the server
server.listen(8081)
console.info('Now running on localhost:8081')