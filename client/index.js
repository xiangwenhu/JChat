if (localStorage.getItem('_JCHAT_USER_NAME_') == null) {
    location.href = '/login.html'
}

sessionStorage.setItem('_JCHAT_STATUS_',1) 


let userName = localStorage.getItem('_JCHAT_USER_NAME_'),
    allClientsEl = document.querySelector('#allClients'),   
    inputContentEl = document.querySelector('#inputContent'),
    btnSendEl = document.querySelector('#btnSend'),
    msgContentEl = document.querySelector('#msgContent'),
    membersEl = document.querySelector('#members'),
    btnVideoEl = document.querySelector('#btnVideo'),
    videoContentEl = document.querySelector('#videoContent'),
    btnClearEl = document.querySelector('#btnClear')


//初始化聊天
let chat = new Chat();
chat.init({
    allClients(data){        
        allClientsEl.innerHTML = Object.keys(data).map((p)=>`<li data-id='${p}'>${data[p]}</li>`).join('')
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


let isMobile = false
if ((navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i))) {
    isMobile = true
}
//加入房间
<<<<<<< HEAD
/*
roomsEl.addEventListener(isMobile ? 'click' : 'dblclick', ev => {
=======
roomsEl.addEventListener('click', ev => {    
>>>>>>> 4ebdb1da36f11cfbfd11792f0fe24f2392f65255
    let el = ev.target
    if (el.tagName == 'LI' && !el.classList.contains('selected')) {
        Array.from(el.parentElement.children).forEach(el => el.classList.remove('selected'))
        el.classList.add('selected')
        chat.enterRoom(userName, el.text || el.textContent)
    }
}) */



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

let videoChat = false,rtc = new WebRTC({
    socket: chat.getSocket()
})
btnVideoEl.addEventListener('click', () => {
    if (!videoChat) {
        btnVideoEl.value = '关闭视频'
        videoContentEl.style.display = 'block'
        msgContentEl.style.height = '120px'
        rtc.init()
    } else {
        btnVideoEl.value = '视频聊天'
        //msgContentEl.style.height = '300px'
        //videoContentEl.style.display = 'none'
        rtc.stop(null,true)
    }
    videoChat = !videoChat
})

btnClearEl.addEventListener('click', () => {
    msgContentEl.innerHTML = ''
})






