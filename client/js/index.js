define(function (require) {

    require('/js/adapter.js')
    const WebRTC = require('/js/webrtc.js')
    const Chat = require('/js/chat.js')
    const Notify = require('/js/notify.js')

    let containsEl = document.querySelector('#container'),
        allClientsEl = containsEl.querySelector('#allClients'),
        slidesEl = containsEl.querySelectorAll('.slide'),
        inputContentEl = containsEl.querySelector('#inputContent'),
        btnSendEl = containsEl.querySelector('#btnSend'),
        msgContentEl = containsEl.querySelector('#msgContent'),
        membersEl = containsEl.querySelector('#members'),
        btnVideoEl = containsEl.querySelector('#btnVideo'),
        videoContentEl = containsEl.querySelector('#videoContent'),
        btnClearEl = containsEl.querySelector('#btnClear'),
        chatClientEl = containsEl.querySelector('.chatClient')


    //初始化聊天
    let chat = new Chat(),
        notify = new Notify(),
        videoChat = false, rtc

    chat.init({
        allClients(data) {
            allClientsEl.innerHTML = Object.keys(data).map((p) => {
                let cls = p == chat.id ? 'me' : ''
                return `<li data-id='${p}' class=${cls}>${data[p]}</li>`
            }
            ).join('')
        },
        enterRoom(data) {
            slideTo('chat')
            chatClientEl.innerHTML = data.targetName
        },
        message(data) {
            msgContentEl.innerHTML += '<br/>' + data
            msgContentEl.scrollTop = msgContentEl.scrollHeight

            notify.pop('新消息',{
                body: data
            })
        },
        sysmessage(data) {
            msgContentEl.innerHTML += '<br/>' + data
            msgContentEl.scrollTop = msgContentEl.scrollHeight
        },
        initCallback(socket) {
            rtc = new WebRTC({
                socket: socket
            })
            rtc.init()
        }
    })

    //选择client
    allClientsEl.addEventListener('click', ev => {
        let el = ev.target
        if (el.tagName == 'LI' && !el.classList.contains('me') && !el.classList.contains('selected')) {
            Array.from(el.parentElement.children).forEach(el => el.classList.remove('selected'))
            el.classList.add('selected')
            chatClientEl.innerHTML = el.textContent
            slideTo('chat')
            chat.enterRoom(el.getAttribute('data-id'))
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
            inputContentEl.value = ''
        }
    })


    btnVideoEl.addEventListener('click', () => {
        if (!videoChat) {
            btnVideoEl.value = '关闭视频'
            videoContentEl.style.display = 'block'
            rtc.init()
            rtc.start(chat.roomId)
        } else {
            btnVideoEl.value = '视频聊天'
            //msgContentEl.style.height = '300px'
            //videoContentEl.style.display = 'none'
            rtc.stop(null, true)
        }
        videoChat = !videoChat
    })

    btnClearEl.addEventListener('click', () => {
        msgContentEl.innerHTML = ''
    })

    containsEl.querySelector('.head-tab').addEventListener('click',function(ev){
        let  el = ev.target
        if(el.tagName == 'LABEL'){
            slideTo(el.getAttribute('data-tab'))            
        }
    })


    function slideTo(tag) {
        //tab切换
        containsEl.querySelectorAll('.rooms-title').forEach((tab) => tab.classList.contains(`head-tab-${tag}`) ? tab.classList.add('selected') : tab.classList.remove('selected'))
        //slide切换
        slidesEl.forEach((slide) => slide.classList.contains(`slide-${tag}`) ? slide.style.display = 'block' : slide.style.display = 'none')
    }

})



