// ==UserScript==
// @name         简单翻译
// @namespace    ingXII
// @version      1.21
// @description  简单翻译
// @author       ingXII
// @license      MIT
// @match        http://*/*
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

var mouse_target = null; // 鼠标捕捉的目标
var is_ctrldown = false; //鼠标移动扫描专用
var timer_request = null; //延迟发送专用

var frame = document.createElement("div");
var css = document.createElement("style");

css.innerHTML = `
#ingpx {position:fixed;z-index: 2147483647 !important;right: 4px; bottom: 4px;max-width: 480px; background: #FFF; border: 1px solid #888;padding: 0px 10px;opacity: 0.9; box-shadow: 2px 2px 2px #888;max-height: 320px;overflow-y: scroll;}
#ingpx p{padding:0px !important;margin:8px 0px !important;font-size:12px !important;line-height:18px !important;color:#000 !important;text-align:left !important;width: 100%;}
#ingpx p.head{color:gray !important;font-style: italic;}
#ingpx::-webkit-scrollbar{background-color: #efefef;border: 1px solid #efefef;width: 16px;}
#ingpx::-webkit-scrollbar-thumb{background-color: #ddd;border: 1px solid #efefef;}
#ingpx::-webkit-scrollbar-track{border: 1px solid #efefef;}
#ingpx::-webkit-scrollbar-button{display: none;}
.animation1 {animation: animation1 0.5s linear 0s forwards 1;}
@keyframes animation1 {
0% {
//transform: translate(0px, 0px) rotate(0) scale(1);
}
30% {
//transform: translate(2px, 0px) rotate(90deg) scale(1.25);
opacity: 0.30;
}
50% {
//transform: translate(2px, 0px) rotate(270deg) scale(1.25);
opacity: 0.70;
}
70% {
//transform: translate(2px, 0px) rotate(270deg) scale(1.25);
opacity: 0.30;
}
100% {
//transform: translate(0px, 0px) rotate(360deg) scale(1);
}
}
`;

frame.setAttribute("id", "ingpx");


document.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("mouseover", onMouseOver, false);
document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);


// 点击自己时不做任何处理(注释掉下面代码将允许点击框体本身)
frame.addEventListener("mouseup", function(e) { e.stopPropagation(); }, true);
frame.addEventListener("dblclick", onMouseUp, false);


(function() {
    'use strict';
    console.log('简单翻译加载中');

})();


function onMouseOver(e) {
    if (e.target === document) {
        return;
    }

    mouse_target = e.target;

    if (window.event.shiftKey) {
        //暴力模式
        onEnum(mouse_target);
    }

}

//鼠标抬起后翻译文字
function onMouseUp(e) {
    //放在最上面是为了点击自身的时候也能获取选中的文字

    // setTimeout 为了修复抬起后还有选中的bug
    setTimeout(() => {

        var text = document.getSelection().toString();
        transeText(text);
    }, 1);
}


function onKeyDown(e) {
    if (e.keyCode != 16) {
        return
    }

    // 因为按住会连续触发
    if (!is_ctrldown) {
        onEnum(mouse_target);
    }

    is_ctrldown = true;
    //console.log('你按下了ctrl');
}

function onKeyUp(e) {
    if (e.keyCode != 16) {}

    //console.log('你抬起了ctrl');
    is_ctrldown = false;
}


// 关闭翻译框
function closeFrame() {
    if (frame.parentNode === document.body) {
        document.body.removeChild(frame);
    }
}


// 添加翻译框
function openFrame(text) {
    if (frame.parentNode !== document.body) {
        document.body.appendChild(css);
        document.body.appendChild(frame);
    }

    frame.innerHTML = "<p>Loading...</p>";
}



//鼠标移动或者键盘按下时候翻译文字
function onEnum(t) {
    if (!t) {
        return;
    }

    for (var item of document.querySelectorAll(".animation1")) {
        item.classList.remove('animation1');
    }

    var text = t.innerText;
    if (text.length == 0 || text.length > 4096) {
        return true;
    };

    t.classList.add('animation1');

    transeText(text);
}



//延迟调用
function transeText(text) {
    closeFrame();

    if (timer_request) {
        clearTimeout(timer_request);
        timer_request = null;
    }

    //前后空格
    text = text.replace(/(^\s*)|(\s*$)/g, "").trim();
    if (text.length == 0 || text.length > 1024) {
        return;
    };


    openFrame();

    // 避免频繁调用
    timer_request = setTimeout(() => {
        requestText(text);

    }, 550);
}

//翻译文字
function requestText(text) {


    if (!text) {
        return;
    };



    var url = 'http://fanyi.baidu.com/transapi';
    url = "https://aidemo.youdao.com/trans";
    GM_xmlhttpRequest({
        method: "POST",
        url: url,
        //data:'source=txt&query=' + encodeURIComponent(text),
        data: "from=Auto&to=Auto&q=" + encodeURIComponent(text),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function(response) {
            if (!response || !response.response) {
                console.info(response);
                frame.innerHTML = "<p>error!</p>";
                return;
            };

            response = JSON.parse(response.response)
            if (!response || response.errorCode != 0) {
                console.info(text);
                frame.innerHTML = "<p>" + response.errorCode + "</p>";
                return;
            };

            displayResult(response);

        }
    });
}

function displayResult(response) {
    console.info(1);
    var content = "<p class='head'>" + response.query + "</p>";
    var trans = null;

    if (response.basic) {
        if (response.basic.phonetic) {
            var voice = response.basic.phonetic;
            content += "<p>[" + voice + "]</p>";
        }

        for (var key in response.basic.explains) {
            trans = response.basic.explains[key];
            if (trans) {
                content += "<p>" + trans + "</p>";
            }
        }
    } else if (response.translation) {
        trans = response.translation[0];
        content += "<p>" + trans + "</p>";
    }


    frame.innerHTML = content.replace(/\n/g, '</br>');

}