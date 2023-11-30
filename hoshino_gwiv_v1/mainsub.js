/********************************************
 *											*
 *		中央フレームのJavascriptファイル		*
 *											*
 *			右クリックポップメニュー			*
 *											*
 *******************************************/
function hidariClick() {
  document.onclick = unshowPopup;
}

function unshowPopup() {
  var popup = document.getElementById("mainPop");
  popup.style.visibility = "hidden";
  showPopStates = 1;
  //window.onmousedown = getMouseXY;
  //window.onmousemove = getMouseMoveXY;

  window.onmousedown = function (evt) {
    clickCount++;
    if (clickCount >= 2) {
      clickCount = 0;
      //evt.preventDefault();
      //ダブルクリックした時に呼び出す関数
      fullScreen();

      //clickCount = 0; //ダブルクリックしたのでカウントを初期化
    }
    setTimeout(function () {
      if (clickCount == 1) {
        clickCount = 0;
        //クリックした時に呼び出す関数
        //onmousedownFunctions(evt);
        //getMouseXY(evt);
        clickFunction(evt);

        //clickCount = 0; //クリックしたのでカウントを初期化
      }
    }, 250);
  };

  window.onmousemove = mousemoveFunction;
}

function migiClick() {
  document.oncontextmenu = showPopup;
}

function showPopup(evt) {
  var popup = document.getElementById("mainPop");
  if (document.all) {
    popup.style.top = document.body.scrollTop + window.event.clientY;
    popup.style.left = document.body.scrollLeft + window.event.clientX;
  } else if (document.getElementById) {
    popup.style.top = evt.pageY;
    popup.style.left = evt.pageX;
  }
  popup.style.visibility = "visible";

  showPopStates = 0; //カーソル表示を出さないようにしたいので、右クリックしたことを記録しておく。deleteDisplay();だけではなせかうまく動かなかった
  deleteDisplay();

  window.onmousedown = function () {
    return false;
  };
  window.onmousemove = function () {
    return false;
  };

  return false;
}

function setColor(obj, flg) {
  if (flg) {
    obj.style.backgroundColor = "silver";
    obj.style.color = "black";
  } else {
    obj.style.backgroundColor = "gray";
    obj.style.color = "white";
  }
}

function makeFlashReport(url, windowname, width, height) {
  var features =
    "location=no, menubar=no, status=yes, scrollbars=yes, resizable=yes, toolbar=no";

  if (width) {
    if (window.screen.width > width)
      features += ", left=" + (window.screen.width - width) / 2;
    else width = window.screen.width;

    features += ", width=" + width;
  }
  if (height) {
    if (window.screen.height > height)
      features += ", top=" + (window.screen.height - height) / 2;
    else height = window.screen.height;

    features += ", height=" + height;
  }
  console.log(url);
  window.open(url, windowname, features);
}

function menuPopup(evt) {
  var popup = document.getElementById("fluxPop");
  if (document.all) {
    popup.style.top = document.body.scrollTop + window.event.clientY;
    popup.style.left = document.body.scrollLeft + window.event.clientX;
  } else if (document.getElementById) {
    popup.style.top = evt.pageY;
    popup.style.left = evt.pageX;
  }
  popup.style.visibility = "visible";
  return false;
}

function flux() {
  var result =
    '<TABLE border=1 cellspacing=0 cellpadding=3 valign="center" bordercolor="red" bgcolor="orange" width=120>';
  result +=
    '<TR><TD onClick="" onMouseOver="setColor(this, true)" onMouseOut="setColor(this, false)">';
  result += '<FONT size="-1" >test1</FONT></TD></TR>';
  result +=
    '<TR><TD onClick="" onMouseOver="setColor(this, true)" onMouseOut="setColor(this, false)">';
  result += '<FONT size="-1" >test1</FONT></TD></TR>';
  result +=
    '<TR><TD onClick="" onMouseOver="setColor(this, true)" onMouseOut="setColor(this, false)">';
  result += '<FONT size="-1" >test1</FONT></TD></TR>';
  result +=
    '<TR><TD onClick="" onMouseOver="setColor(this, true)" onMouseOut="setColor(this, false)">';
  result += '<FONT size="-1" >test1</FONT></TD></TR>';
  result +=
    '<TR><TD onClick="hidariClick()" onMouseOver="setColor(this, true)" onMouseOut="setColor(this, false)">';
  result += '<FONT size="-1" >Close</FONT></TD></TR>';
  result += "</TABLE>";

  //document.getElementById("check").innerHTML = result;
  /*if(document.all){
         document.getElementById("fluxPop").style.top = document.body.scrollTop + window.event.clientY;
         document.getElementById("fluxPop").style.left = document.body.scrollLeft + window.event.clientX;
     }else if(document.getElementById){
         document.getElementById("fluxPop").style.top = evt.pageY;
         document.getElementById("fluxPop").style.left = evt.pageX;
     }
     document.getElementById("fluxPop").style.visibility="visible";
     return false;
     */
  //menuPopup();
}

function menuTable() {
  flux();
}

window.onload = hidariClick;
window.onload = migiClick;
//window.onload = menuTable;
