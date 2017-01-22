let Koa = require('koa'),
  app = new Koa(),
  serve = require('koa-static'),
  fs = require('fs'),
  https = require('https'),
  privateKey = fs.readFileSync('./cert/private.pem', 'utf8'),
  certificate = fs.readFileSync('./cert/file.crt', 'utf8'),
  credentials = { key: privateKey, cert: certificate }

const MAX_ROOM = 10





// Send static files
app.use(serve('./client'))


// 这一行代码一定要在最后一个app.use后面使用
var server = https.createServer(credentials, app.callback()),
  io = require('socket.io')(server)

const rooms = new Map()
// Socket.io
io.on('connection', function (socket) {
  let room
  //连接后发送rooms
  io.sockets.emit('rooms', Array.from(rooms.keys()))

  //创建房间,最大房间数10
  socket.on('createRoom', (name) => {
    if (rooms.size <= MAX_ROOM) {
      rooms.set(name, rooms.get(name) || [])
      socket.emit('rooms', Array.from(rooms.keys()))
    }
  })
  //进入房间
  socket.on('enterRoom', (userName, roomName) => {
    let room = rooms.get(roomName)
    if (room) {
      socket.rname = roomName
      socket.uname = userName
      //房间用户名
      room.push(userName)
      //加入房间
      socket.join(roomName)
      //广播大家新人加入房间
      socket.emit('sysmessage', `进入房间 ${roomName}`)
      io.sockets.in(roomName).emit('sysmessage', `${userName} 进入了房间`)
      io.sockets.in(roomName).emit('enterRoom',room)
      console.log(`${userName} 进入房间 ${roomName}`)
    } else {
      socket.emit('sysmessage', `房间 ${roomName} 不存在`)
    }
  })
  //离开房间
  socket.on('leaveRoom', (userName, roomName) => {
    let room = rooms.get(roomName)
    if (room) {
      socket.name = null
      let index = room.findIndex(s => {
        s == userName
      })
      //把用户从房间中移除
      if (index > 0) {
        room.splice(index, 1)
        socket.leave(roomName)
        io.sockets.in(roomName).emit('leaveRoom', { status: true })
        console.log(`${userName} 离开房间 ${roomName}`)
      } else {
        socket.emit('sysmessage', `房间 ${roomName} 不存在`)
      }

    } else {
      socket.emit('sysmessage', `房间 ${roomName} 不存在`)
    }
  })

  socket.on('message', (data) => {
    io.sockets.to(socket.rname).emit('message', socket.uname + ':' + data)    
  })

  socket.on('disconnect',()=>{
    let room = rooms.get(socket.rname),
        index = 0 
      room && (index = room.findIndex(n=> n == socket.uname)) >= 0 &&  room.splice(index, 1)   
  })

})

// Start the server
server.listen(8081)
console.info('Now running on localhost:8081')