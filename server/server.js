let Koa = require('koa'),
  app = new Koa(),
  serve = require('koa-static'),
  fs = require('fs'),
  https = require('https'),
  privateKey = fs.readFileSync('./cert/private.pem', 'utf8'),
  certificate = fs.readFileSync('./cert/file.crt', 'utf8'),
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
        clients[socket.id] = data
        io.sockets.emit('chat','allClients',clients)
        break
      case 'rooms':
        break
      case 'createRoom':
        rooms.set(socket.id, rooms.get(socket.id) || [])
        socket.emit('createRoom', { status: true })
        break
      case 'enterRoom':
        var roomName = socket.id,
          userName = data.userName,
          room = rooms.get(data.roomName), index
        if (room) {
          //先删除用户
          (index = room.findIndex(n => n == socket.uname)) >= 0 && room.splice(index, 1)

          socket.rname = roomName
          socket.uname = userName
          //房间用户名
          room.push(userName)
          //加入房间
          socket.join(roomName)
          //广播大家新人加入房间
          socket.emit('sysmessage', `进入房间 ${roomName}`)
          io.sockets.in(roomName).emit('sysmessage', `${userName} 进入了房间`)
          io.sockets.in(roomName).emit('enterRoom', room)
          console.log(`${userName} 进入房间 ${roomName}`)
        } else {
          socket.emit('sysmessage', `房间 ${roomName} 不存在`)
        }
        break
      case 'message':
        io.sockets.to(socket.rname).emit('message', socket.uname + ':' + data)
        break
      default:
        break
    }
  })

  socket.on('webrtc', (type, data) => {
    let rm = io.sockets.adapter.rooms[socket.rname]

    switch (type) {
      case 'start':
        if (rm && Object.keys(rm.sockets).length >= 2) {
          socket.emit('webrtc', type, { guest: true })
        }
        break
      case 'candidate':
      case 'offer':
      case 'answer':
      case 'close':
        for (var clientId in rm.sockets) {
          var client = io.sockets.connected[clientId]
          if (client != socket) {
            client.emit('webrtc', type, data)
          }
        }
        break
    }
  })

  socket.on('disconnect', () => {
    console.log('当前房间数量:' + rooms.size)
    console.log(`${socket.uname} 离开了`)

    //删除client
    delete clients[socket.id]

    //从所有加入的房间移除,这一步如果房间没有连接，会自动删除房间本身
    io.sockets.adapter.delAll(socket.id)

    //删除用户名
    let room = rooms.get(socket.rname), index = -1
    room && (index = room.findIndex(n => n == socket.uname)) >= 0 && room.splice(index, 1)
   
    io.sockets.emit('chat','allClients',clients)
    console.log('当前房间数量:' + rooms.size)
  })

})

// Start the server
server.listen(8081)
console.info('Now running on localhost:8081')