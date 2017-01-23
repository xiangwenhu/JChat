if (localStorage.getItem('_JCHAT_USER_NAME_') == null) {
    location.href = '/login.html'
}


let userName = localStorage.getItem('_JCHAT_USER_NAME_'),
    roomsEl = document.querySelector('#rooms'),
    newRoomNameEl = document.querySelector('#newRoomName'),
    inputContentEl = document.querySelector('#inputContent'),
    btnSendEl = document.querySelector('#btnSend'),
    msgContentEl = document.querySelector('#msgContent'),
    membersEl = document.querySelector('#members'),
    btnVideoEl = document.querySelector('#btnVideo')


//初始化聊天
let chat = new Chat();
chat.init({
    rooms(rooms) {
        roomsEl.innerHTML = rooms.map(r => '<li>' + r + '</li>').join('')
    },
    enterRoom(users) {
        membersEl.innerHTML = users.map(r => '<li>' + r + '</li>').join('')
        document.querySelector('.rooms-title span').textContent = users.length
    },
    message(data) {
        msgContentEl.innerHTML += '<br/>' + data
    },
    sysmessage(data) {
        msgContentEl.innerHTML += '<br/>' + data
    }
})

//创建房间
newRoomNameEl.addEventListener('keydown', (ev) => {
    if (ev.keyCode == 13) {
        let rn = newRoomNameEl.value || newRoomNameEl.nodeValue
        if (chat.rooms.includes(rn)) {
            alert('房间已经存在')
        } else if (chat.rooms.length >= 10) {
            alert('已达最大房间数量')
        } else {
            chat.createRoom(rn)
        }
    }
})


let isMobile = false
if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
    isMobile = true
}
//加入房间
roomsEl.addEventListener(isMobile ? 'click' : 'dblclick', ev => {
    let el = ev.target
    if (el.tagName == 'LI' && !el.classList.contains('selected')) {
        [...el.parentElement.children].forEach(el => el.classList.remove('selected'))
        el.classList.add('selected')
        chat.enterRoom(userName, el.text || el.textContent)
    }
})



//发送消息
inputContentEl.addEventListener('keydown', (ev) => {
    if (ev.keyCode == 13) {
        let msg = inputContentEl.value
        if (msg) {
            chat.message(msg)
        }
    }
})
btnSendEl.addEventListener('click', () => {
    let msg = inputContentEl.value
    if (msg) {
        chat.message(msg)
    }
})

let rtc
btnVideoEl.addEventListener('click', () => {
    rtc = new WebRTC({
        socket: chat.getSocket()
    })
    rtc.init()
})





