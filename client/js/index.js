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
        chatClientEl = containsEl.querySelector('.chatClient'),
        emojiwrapperEl = containsEl.querySelector('#emojiWrapper')


    //初始化聊天
    let chat = new Chat(),
        notify = new Notify(true),
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
            dispayMessage(data)

            notify.pop('新消息', {
                body: `您有一条来自${data.from}的新消息，请注意查收`
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
            ev.preventDefault()
            let msg = inputContentEl.value
            if (msg) {
                dispayMessage({
                    from: 'me',
                    message: msg
                })
                chat.message(msg)
                inputContentEl.value = ''
            }
        }
    })
    btnSendEl.addEventListener('click', () => {
        let msg = inputContentEl.value
        if (msg) {
            dispayMessage({
                from: '[__me__]',
                message: msg
            })
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

    //清空
    btnClearEl.addEventListener('click', () => {
        msgContentEl.innerHTML = ''
    })

    //切换Tab
    containsEl.querySelector('.head-tab').addEventListener('click', function (ev) {
        let el = ev.target
        if (el.tagName == 'LABEL') {
            slideTo(el.getAttribute('data-tab'))
        }
    })


    function slideTo(tag) {
        //tab切换
        containsEl.querySelectorAll('.rooms-title').forEach((tab) => tab.classList.contains(`head-tab-${tag}`) ? tab.classList.add('selected') : tab.classList.remove('selected'))
        //slide切换
        slidesEl.forEach((slide) => slide.classList.contains(`slide-${tag}`) ? slide.style.display = 'block' : slide.style.display = 'none')
    }

    function initialEmoji() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment()
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img')
            emojiItem.src = '/img/emoji/' + i + '.gif'
            emojiItem.title = i
            docFragment.appendChild(emojiItem)
        }
        emojiContainer.appendChild(docFragment)
    }

    //显示emoji
    document.getElementById('btnEmoji').addEventListener('click', (ev) => {
        emojiwrapperEl.style.display = 'block'
        ev.stopPropagation()
    })

    //点击别处，隐藏emoji
    document.body.addEventListener('click', function (e) {
        if (e.target != emojiwrapperEl) {
            emojiwrapperEl.style.display = 'none'
        }
    })

    //选择emoji
    document.getElementById('emojiWrapper').addEventListener('click', function (ev) {
        var target = ev.target
        if (target.nodeName.toLowerCase() == 'img') {
            dispayMessage({
                from: '[__me__]',
                message: '[emoji:' + target.title + ']'
            })
            chat.message('[emoji:' + target.title + ']')
        }
    }, false)


    function dispayMessage(data) {
        let msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            fromC = data.from,msg

        //me替换    
        if (data.from == '[__me__]') {
            msgToDisplay.classList = fromC = 'me'
        }
        msg = showEmoji(data.message)
        msgToDisplay.innerHTML = `${fromC}(${date})：${msg}`
        msgContentEl.appendChild(msgToDisplay)
        msgContentEl.scrollTop = msgContentEl.scrollHeight
    }


    function showEmoji(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = emojiwrapperEl.children.length
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1)
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]')
            } else {
                result = result.replace(match[0], '<img class="emoji" src="/img/emoji/' + emojiIndex + '.gif" />')
            }
        }
        return result
    }


    initialEmoji()

})



