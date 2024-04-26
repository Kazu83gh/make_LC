/****************************************
 *                                      *
 *      左フレームJavaScriptファイル     *
 *          （画像選択・表示機能）       *
 *                                      *
 ****************************************/

/*　変数の定義 */

/* ディレクトリの指定 */
var slash = "/";
//20191214追加
var gw = 'gw';
var eventTest = 'event/kafka';
var dirDef = gw + slash + eventTest + slash; 
//ここまで
var t_dirUrl = "/gw/test/kafka/"
var teamDef = "team_only/";
var dirUrl = slash+dirDef;
var teamUrl =slash+dirDef+teamDef;
var htm = ".html";


var skyimage = "image0";
/* var errorimage = "image1"; */


/* 画像タイプ識別と初期設定 */
var datatype = "cln"; /* 画像の種類 cln,col,rawの3種類 */
var energy = "all"; /* エネルギーバンドの表示種類　rgb,all,high,med,lowの5種類 */
var areatype = "pre"; /* エラー領域の表示種類 pre,ini,updの3種類 */

var imagePlain = new Array();
var imagePre = new Array();
var imageIni = new Array();
var imageUpd = new Array();
var pre1 = "";  //追加
var pre2 = "";  //追加
var ini = "";  //追加
var upd = "";  //追加 H.N.
var iea = 0 ;  //追加 H.N.
var errArea = new Array(); //H.N. 20/02/18
var useArea = "";  //追加
var skymap = new Array();

var asNS1_1o = "";
var asNS1_4o = "";
var asNS1_1d = "";
var asNS2_1o = "";
var asNS2_4o = "";
var asNS2_1d = "";
var mailNS1_1o = "";
var mailNS1_4o = "";
var mailNS1_1d = "";
var mailNS2_1o = "";
var mailNS2_4o = "";
var mailNS2_1d = "";

/* 他使用する変数 */
var dirName = new Array();
var dirlist = new Array(); //dirlist.txtの中身を入れるもの。
var t_dirlist = new Array();  //追加
var dirArray = new Array(); //dirlistを配列で保存するもの。
var e_dirArray = new Array();  //追加
var t_dirArray = new Array();  //追加
var dirNumber = new Array(); //表示する日付の配列番号を指定する。
var imageList ; //imglist.txtの中身を入れるもの。
var imageArray = new Array(); //imageListを配列で保存するもの。
var imageNumber = 0; //uselistの配列番号を指定する。
var time = new Array();



var dirAjax = new Array();
var t_dirAjax = new Array();
var listAjax = new Array();

var detailsAjax = new Array();
var details = new Array();
var detailsArray = new Array();
var event = new Array();
var text = new Array();
var div = new Array()
var dresult = new Array();

var selectdir = new Array();
var opt = new Array();
var str = new Array();

var i;
var nowlist = new Array();
var uselist = new Array();
var numReduction = new Array();
var numReduction2 = new Array();

var scale = 1;
var orgWidth = 1920; //全天画像の横幅(ここで設定するのではなく、自動で取得できるようになるとベスト)
var orgHeight = 1033;
var imagesize = "fit";


//20191214追加
//var gwDirectory = 'gw';
//var eventTest = 'event';
var dirNameJudge = 'S';
var sLength = 10;

//var dirDef = gwDirectory + slash + eventTest + slash;

//gwiv_0.9
var asNS1_1o_csv, asNS1_4o_csv, asNS1_1d_csv;
var asNS2_1o_csv, asNS2_4o_csv, asNS2_1d_csv;
var mailNS1_1o_csv, mailNS1_4o_csv, mailNS1_1d_csv;
var mailNS2_1o_csv, mailNS2_4o_csv, mailNS2_1d_csv;



/*****************************************************/
/* 関数の定義 */

function firstLoad(){ //サイトが開かれた際の処理

    dirListGet();

    timer1 = setTimeout("listGet('i')",1000); //各日付の画像名リストを取得する関数を呼び出す
    timer2 = setTimeout("splitList('i')",1000); //取得したリストを検索しやすいように分割する関数を呼び出す
    setTimeout("getArea('')",1000);
    setTimeout("getTrigger('i')",1000);
    setTimeout("get_csvfile('i')",1200);
    // timer4 = setTimeout("loadFinish('i')",2500); //準備が完了したことを画面に反映する関数を呼び出す
    timer5 = setTimeout("get_details('')",2000);
    timer6 = setTimeout("create_listbox('')",1000);
    timer11 = setTimeout("create_areabox('')",1200);
    setTimeout("create_errorbox('')",1200);
    setTimeout("create_triggerbox('')",1200);
    timer4 = setTimeout("loadFinish('i')",2500); //準備が完了したことを画面に反映する関数を呼び出す

    setTimeout(detailsmap, 2500);
}

function secondLoad(){ //画像タイプ、エネルギー、エラー領域を変更したときに、それぞれの関数から呼び出される

    splitList();
    loadFinish();
    detailsmap();

}

function thirdLoad(){  //追加,event/test切替時呼び出し
    var eTJudge = document.getElementById('eventTest');
    if(eTJudge.value == 'event'){
        dirListGet();
    }else{
        t_dirListGet();
    }
    setTimeout("listGet('i')",1000);
    setTimeout("splitList('i')",1000);
    setTimeout("getArea('i')",1000);
    setTimeout("getTrigger('i')",1000);
    setTimeout("get_csvfile('i')",1200);
    // setTimeout("loadFinish('i')",2500);
    setTimeout("detailsmap('')",2500);
    setTimeout("get_details('')",2000);
    setTimeout("create_listbox('')",1200);
    setTimeout("create_areabox('i')",1200);
    setTimeout("create_errorbox('i')",1200);
    setTimeout("create_triggerbox('i')",1200);
    setTimeout("loadFinish('i')",2500);

}

function dirListGet(){ //ajaxでディレクトリ名のテキストファイルを取得する

    dirAjax = new XMLHttpRequest();
    dirAjax.onreadystatechange = function(){ sortOut() }; 
    console.log("*********** dirUrl = "+dirUrl)
    dirAjax.open("GET", dirUrl + "list.txt","false");
    dirAjax.send(null);

}

function t_dirListGet(){
    t_dirAjax = new XMLHttpRequest();
    t_dirAjax.onreadystatechange = function(){ t_sortOut() }; 
    t_dirAjax.open("GET", t_dirUrl + "list.txt","false");
    t_dirAjax.send(null);
}

function sortOut(){ //取得したディレクトリ名の整理をする.

    if((dirAjax.readyState == 4) && (dirAjax.status == 200)){
        
        dirList = dirAjax.responseText; /* テキストファイルの中身をdirListに代入 */

        /* 以下テキストデータを整理する */
        e_dirArray = dirList.split("\n"); //変数dirListを改行で区切り、配列dirArrayに代入
        console.log(e_dirArray);

        for(s = e_dirArray.length-1; s >= 0; s--){
            if(e_dirArray[s].indexOf("S") != 0){ //dirArry内の関係ない配列を消去
                e_dirArray.splice(s,1);
            }
        }
       
    }else if ((dirAjax.readyState == 4) && (dirAjax.status != 200)) { //取得に失敗した場合
        parent.messageframe.document.getElementById("mess").innerHTML = "DirList : NG";
        mes();
    }

}

function t_sortOut(){  //取得したテストディレクトリ名の整理をする

    if((dirAjax.readyState == 4) && (dirAjax.status == 200)){
        
        t_dirList = t_dirAjax.responseText; /* テキストファイルの中身をdirListに代入 */

        /* 以下テキストデータを整理する */
        t_dirArray = t_dirList.split("\n"); //変数dirListを改行で区切り、配列dirArrayに代入
        console.log(t_dirArray);

        for(s = t_dirArray.length-1; s >= 0; s--){
            if(t_dirArray[s].indexOf("M") != 0){ //dirArry内の関係ない配列を消去
                t_dirArray.splice(s,1);
            }
        }
       
    }else if ((t_dirAjax.readyState == 4) && (t_dirAjax.status != 200)) { //取得に失敗した場合
        parent.messageframe.document.getElementById("mess").innerHTML = "TestDirList : NG";
        mes();
    }

}

function listGet(init){ //ディレクトリ内の画像名を取得する

    if(document.getElementById("eventTest").value == "event"){
        dirArray = e_dirArray;
    }else{
        dirArray = t_dirArray;
    }
    console.log(dirArray);

    if(init == "i"){ //初期読み込み時、dirArrayの最後の要素を指定
        dirNumber = dirArray.length - 1;
        dirName = dirArray[dirNumber]
        console.log(dirName);
    }
    console.log(init);
    listAjax = new XMLHttpRequest();
    listAjax.open("GET",dirUrl + dirName + slash + "imglist.txt",false);
    //listAjax.open("GET",testdirURL + dirArray[dirNumber] + slash + "list.txt",false);
    listAjax.onreadystatechange = function() { // listAjaxの状態が変化すると呼び出される

    if ((listAjax.readyState == 4) && (listAjax.status == 200)) {
        imageList = listAjax.responseText; //リストの内容を変数imglistに入れる
        //console.log(imageList);    
    } else if((listAjax.readyState == 4) && (listAjax.status != 200)){
        document.getElementById("message").innerHTML = "imgList : NG";
        mes();
    }

    }
    listAjax.send(null);

    console.log(imageList);
    imageArray = imageList.split(/\n|\r\n|\r/); //受け取ったimglistを改行ごとに区切り配列imageArrayに代入
    console.log(imageArray);

}

function splitList(init){ //画像名をエラー領域ごとに配列へと代入する

    if(init == "i"){
      if(imageList.match(/rgb/)){
        energy = "rgb";
      }else{
        energy = "all";
      }
    }
    console.log(energy);

    type = new RegExp(datatype);
    eg = new RegExp(energy);

    for(s=0, i=0, j=0, k=0, n=0; s<imageArray.length; s++){
        if(imageArray[s].match(type)){
            if(imageArray[s].match(eg)){
                if(imageArray[s].match(/pre/)){
                    imagePre[i] = imageArray[s];
                    i++;
                }else if(imageArray[s].match(/prj_ini/)){
                    imageIni[j] = imageArray[s];
                    j++;
                // }else if(imageArray[s].match(/upd/)){
                }else if(imageArray[s].match(/upd\.png/)){
                    imageUpd[k] = imageArray[s];
                    k++;
                }else if(imageArray[s].match(/prj\.png/)){
                    imagePlain[n] = imageArray[s];
                    n++;
                }
            }
        }
    }


    console.log(imagePre);
    console.log(imageIni);
    console.log(imageUpd);
    console.log(imagePlain);
    if(init =="i"){ //初期読み込み時、ディレクトリ変更時
        time_sort("i");
    }else{  //secondLoad時
        time_sort();
    }

}

function time_sort(init){  //使う画像種類を時系列順に並べ替える。

    if(init == "i"){
        if(imageList.match(/prj\.png/)){
            nowlist = imagePlain;
            areatype = "plain";
        }else if(imageList.match(/upd\.png/)){
            nowlist = imageUpd;
            areatype = "upd";
        }else if(imageList.match(/prj_ini/)){
            nowlist = imageIni;
            areatype = "ini";
        }else{
            nowlist = imagePre;
            areatype = "pre";
        }
    }else{
        if(areatype == "upd"){
            nowlist = imageUpd;
        }else if(areatype == "ini"){
            nowlist = imageIni;
        }else if(areatype == "pre"){
            nowlist = imagePre;
        }else{
            nowlist = imagePlain;
        }
    }

    console.log(nowlist);

    for(s=0; s<nowlist.length; s++){
        var start = nowlist[s].indexOf("+")
        var stop = nowlist[s].lastIndexOf("m_")
        numReduction[s] = nowlist[s].slice(start+1, stop);
        numReduction2[s] = nowlist[s].slice(start+1, stop);
    }

    numReduction2.sort(compareNum);
    console.log(numReduction)
    console.log(numReduction2);

    for(s=0, n=0; s<numReduction2.length; s++){
        for(i=0; i<numReduction.length; i++){
            if(numReduction2[s] == numReduction[i]){
                uselist[n] = nowlist[i];
                n++;
            }
        }
        time[s] = numReduction2[s]+"m";
    }
    time.unshift("First");
    if(time[time.length-1] !== "1440m"){
        if(uselist[0].match(/ini/) || uselist[0].match(/upd/)){
            time.push("to pre");
        }else{
            time.push("last");
        }
    }else{
        time.push("last");
    }
    console.log(uselist);
    console.log(time);
    

}

function compareNum(a, b) { //時系列順に並び変える為の大小関係比較の関数
    return a - b;
}

function getArea(init){ //エラー領域のみの画像名を取得する

    if(init == "i"){
	/* H.N. 20/02/18
        pre1 = "";
        pre2 = "";
        ini = "";
        upd = "";
	*/
	errArea = [];
	iea=0;
    }

    for(s=0; s<imageArray.length-1; s++){
	/* H.N. 20/02/18
        if(imageArray[s].match(/1_pre_ctr/)){
            pre1 = imageArray[s];
        }else if(imageArray[s].match(/2_pre_ctr/)){
            pre2 = imageArray[s];
        }else if(imageArray[s].match(/_ini_ctr/)){
            ini = imageArray[s];
        }else if(imageArray[s].match(/_upd_ctr/)){
            upd = imageArray[s];
        }
	*/
        if(imageArray[s].match(/_ctr.png/)){ // H.N. 20/02/18
            errArea[iea] = imageArray[s];
	    iea++;
	}
    }

    /* H.N. 20/02/18
    console.log(pre1);
    console.log(pre2);
    console.log(ini);
    console.log(upd);
    */
    for(s=0; s<iea; s++){
      console.log("errArea(" + s + "): " + errArea[s]);
    }
    /*  H.N. 20/02/18
    if(upd !== ""){
        useArea = upd;
    }else if(ini !== ""){
        useArea = ini;
    }else if(pre2 !== ""){
        useArea = pre2;
    }else{
        useArea = pre1;
    }

    console.log(useArea);
    */

    // H.N. 20/02/18
    useArea=errArea[iea-1];
    console.log(useArea);
}

function getTrigger(init){ //トリガーマップ画像名をを取得する。

    if(init == "i"){
        asNS1_1d ="";
        asNS1_4o ="";
        asNS1_1o ="";
        asNS2_1d ="";
        asNS2_4o ="";
        asNS2_1o ="";
        mailNS1_1d ="";
        mailNS1_4o ="";
        mailNS1_1o ="";
        mailNS2_1d ="";
        mailNS2_4o ="";
        mailNS2_1o ="";
    }

    for(s=0; s<imageArray.length-1; s++){
        if(imageArray[s].match(/aslogNS1_1o\.png/)){
            asNS1_1o = imageArray[s];
        }else if(imageArray[s].match(/aslogNS1_4o\.png/)){
            asNS1_4o = imageArray[s];
        }else if(imageArray[s].match(/aslogNS1_1d\.png/)){
            asNS1_1d = imageArray[s];
        }else if(imageArray[s].match(/aslogNS2_1o\.png/)){
            asNS2_1o = imageArray[s];
        }else if(imageArray[s].match(/aslogNS2_4o\.png/)){
            asNS2_4o = imageArray[s];
        }else if(imageArray[s].match(/aslogNS2_1d\.png/)){
            asNS2_1d = imageArray[s];
        }else if(imageArray[s].match(/maillogNS1_1o.\png/)){
            mailNS1_1o = imageArray[s];
        }else if(imageArray[s].match(/maillogNS1_4o\.png/)){
            mailNS1_4o = imageArray[s];
        }else if(imageArray[s].match(/maillogNS1_1d\.png/)){
            mailNS1_1d = imageArray[s];
        }else if(imageArray[s].match(/maillogNS2_1o\.png/)){
            mailNS2_1o = imageArray[s];
        }else if(imageArray[s].match(/maillogNS2_4o\.png/)){
            mailNS2_4o = imageArray[s];
        }else if(imageArray[s].match(/maillogNS2_1d\.png/)){
            mailNS2_1d = imageArray[s];
        }
    }

    console.log(asNS1_1o);
    console.log(asNS1_4o);
    console.log(asNS1_1d);
    console.log(asNS2_1o);
    console.log(asNS2_4o);
    console.log(asNS2_1d);
    console.log(mailNS1_1o);
    console.log(mailNS1_4o);
    console.log(mailNS1_1d);
    console.log(mailNS2_1o);
    console.log(mailNS2_4o);
    console.log(mailNS2_1d);

}

function loadFinish(init){ //初期読込最後に呼び出される。初めに表示する画像をメインフレームに埋め込む。

    var dir_team =  dirName + htm;
    var dirSite = dirUrl + dirName +slash ;
    //console.log(areatype)
    console.log(uselist[imageNumber]);

    document.getElementById("area").value = areatype;
    document.getElementById("energy").value = energy;

    if(uselist[imageNumber] !== undefined){
        parent.mainframe.document.getElementById("image1").src= dirUrl + dirName + "/" + uselist[imageNumber];
    }else{
        parent.mainframe.document.getElementById("image1").src = "No_Data.png";
    }
    parent.mainframe.document.getElementById("errorImage").src = dirUrl + dirName + "/" + useArea;
    parent.messageframe.document.getElementById("dataname").innerHTML = uselist[imageNumber];
    //timer6 = setTimeout("fit('')",200);
    document.getElementById("prev").value = time[imageNumber];
    document.getElementById("next").value = time[imageNumber +2];
    document.getElementById("nowTime").innerHTML = time[imageNumber +1];
    document.getElementById("team").innerHTML = "<a href='" + teamUrl + dir_team + "' target='_blank'>team only</a>";
    document.getElementById("datasite").innerHTML = "<a href='" + dirSite + "' target='_blank'>List site</a>";

    //detailsmap();
    errorDisplay();
    if(init == "i"){
        triggerDisplay();
    }

    if(imagesize == "fit"){
        timer6_1 = setTimeout("fit('')",200);
    }else if(imagesize == "full"){
        timer6_2 = setTimeout("full('')",200);
    }else if(imagesize == "full2"){
        timer6_3 = setTimeout("full2('')",200);
    }else if(imagesize == "harf"){
        timer6_4 = setTimeout("harf('')",200);
    }

}

function errorDisplay(){ //初期読込の最終段階でエラー領域を表示するかを決める

    if(useArea == ""){
        parent.mainframe.document.getElementById("errorImage").style.visibility="hidden"
        document.getElementById("error").value = "None";
    }else{
        parent.mainframe.document.getElementById("errorImage").style.visibility="visible"
        document.getElementById("error").value = useArea;
    }
}

function triggerDisplay(){ //errorDisplayのトリガーマップバージョン

    parent.mainframe.document.getElementById("asNS1").style.visibility = "hidden";
    document.getElementById("an1").value = "None";

    parent.mainframe.document.getElementById("asNS2").style.visibility = "hidden";
    document.getElementById("an2").value = "None";

    console.log('------' + mailNS1_1d + '--------' + mailNS2_1d ); 
    console.log('======' + mailNS1_1d_csv + '========' + mailNS2_1d_csv ); 
    console.log('======' + mailNS1_4o_csv + '========' + mailNS2_4o_csv ); 
    console.log('dirUrl='+ dirUrl + 'dirName=' + dirName);

    if(mailNS1_1d_csv !== ""){ // debugged by negoro 20/03/24
	console.log('now mailNS1_1d_csv');
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_1d;
	// debugged by negoro 20/03/24 (changed to setTimeout function)
        // parent.mainframe.changeCList('mail1', dirUrl + dirName + "/" + mailNS1_1d_csv);
	var timerNS1_1d = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_1d_csv)", 1500);
        document.getElementById("mn1").value = "1d";
    }else if(mailNS1_4o_csv !== ""){
	console.log('now mailNS1_4o_csv');
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_4o;
        // parent.mainframe.changeCList('mail1', dirUrl + dirName + "/" + mailNS1_4o_csv);
        console.log('===> '+ dirUrl + dirName + "/" + mailNS1_4o_csv + ' <====');
        var timerNS1_4o = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_4o_csv)", 1500);
        document.getElementById("mn1").value = "4o";
    }else if(mailNS1_1o_csv !== ""){
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_1o;
        var timerNS1_1o = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_1o_csv)", 1500);
        document.getElementById("mn1").value = "1o";
    }else{
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "hidden";
        candidateData2 = '';
        document.getElementById("mn1").value = "None";
    }
    
    // NOTE by negoro 20/03/24, alert system 1.5.2 does not write down URL. Thus, the following codes do not mean.
    if(mailNS2_1d_csv !== ""){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_1d;
	// I do not know why this does not work. Negoro 20/03/24 (no Timer is necessary)
        // var timerNS2_1d = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1d_csv)", 1500);
        parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1d_csv);
        document.getElementById("mn2").value = "1d";
    }else if(mailNS2_4o_csv !== ""){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_4o;
        // var timerNS2_4o = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_4o_csv)", 1500);
        parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_4o_csv);
        document.getElementById("mn2").value = "4o";
    }else if(mailNS2_1o_csv !== ""){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_1o;
        // var timerNS2_1o = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1o_csv)", 1500);
        parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1o_csv);
        document.getElementById("mn2").value = "1o";
    }else{
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "hidden";
        candidateData4 = '';
        document.getElementById("mn2").value = "None";
    }

}

function detailsmap(){ //エクスポージャーマップの取得および配置

    for(s=0; s<imageArray.length; s++){
        if(imageArray[s].match(/obstime/)){
            skymap = imageArray[s];
            break;
        }
    }
    console.log(skymap);

    parent.mainframe.document.getElementById('skymap').src = dirUrl + dirName + slash + skymap;
    parent.exposureframe.document.getElementById("exposure").src = dirUrl + dirName + slash + skymap;
}

function get_details(){ //上段フレームの詳細情報取得.

    detailsAjax = new XMLHttpRequest();
    detailsAjax.onreadystatechange = function(){ sort_details() }; 
    detailsAjax.open("GET", dirUrl + dirName + "/" + "index.html","false");
    detailsAjax.send(null);

    timer5 = setTimeout("display_details('')",200);
}

function sort_details(){

    details = detailsAjax.responseText;
    detailsArray = details.split("\n");
//    console.log(detailsArray);

}

function display_details(){ //表示する情報の選別及び配置

    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/NOTICE_DATE/)){
            event[0] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/NOTICE_TYPE/)){
            event[1] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/TRIGGER_DATE/)){
            event[2] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/TRIGGER_TIME/)){
            event[3] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/GROUP_TYPE/)){
            event[4] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/FAR/)){
            event[5] = detailsArray[s];
            break;
        }
    }
    for(s=0; s<detailsArray.length; s++){
        if(detailsArray[s].match(/EVENTPAGE_URL/)){
            event[6] = detailsArray[s];
            break;
        }
    }

    var str = event[6].indexOf("https");
    var URL = event[6].substr(str);
    dresult = "<table border='0'>";

    var trDate = event[2].match(/\d{4}\/\d{2}\/\d{2}/);
    var trTime = event[3].match(/\d{2}:\d{2}:\d{2}/);

    dresult +="<tr><td> TRIGGER TIME: &nbsp;"+ trDate + "&ensp;" + trTime + "&ensp; <a href='" + URL + "'target=_blank>"+URL+"</a></td></tr>";
    dresult +="<tr><td>" +event[0]+ "&ensp;" +event[4]+ "</td></tr></table>"

    parent.detailsframe.document.getElementById("div1").innerHTML = dresult;

}

function get_csvfile(init){

    if(init = "i"){
        asNS1_1o_csv = "";
        asNS1_4o_csv = "";
        asNS2_1o_csv = "";
        asNS2_4o_csv = "";
        mailNS1_1o_csv = "";
        mailNS1_4o_csv = "";
        mailNS2_1o_csv = "";
        mailNS2_4o_csv = "";
        //以下、池尻君の作った関数に追加したもの
        asNS1_1d_csv = '';
        asNS2_1d_csv = '';
        mailNS1_1d_csv = '';
        mailNS2_1d_csv = '';

    }
    console.log(imageArray);
    for(s=0; s<imageArray.length-1; s++){
        // console.log(imageArray[s]);
        if(imageArray[s].match(/aslogNS1_1o\.csv/)){
            asNS1_1o_csv = imageArray[s];
            console.log('NS11o');
        }else if(imageArray[s].match(/aslogNS1_4o\.csv/)){
            asNS1_4o_csv = imageArray[s];
            console.log('NS14o');
        }else if(imageArray[s].match(/aslogNS2_1o\.csv/)){
            asNS2_1o_csv = imageArray[s];
            console.log('NS21o');
        }else if(imageArray[s].match(/aslogNS2_4o\.csv/)){
            asNS2_4o_csv = imageArray[s];
            console.log('NS24o');
        }else if(imageArray[s].match(/maillogNS1_1o\.csv/)){
            mailNS1_1o_csv = imageArray[s];
            console.log('mail11o' + mailNS1_1o_csv);
        }else if(imageArray[s].match(/maillogNS1_4o\.csv/)){
            mailNS1_4o_csv = imageArray[s];
            console.log('mail14o');
        }else if(imageArray[s].match(/maillogNS2_1o\.csv/)){
            mailNS2_1o_csv = imageArray[s];
            console.log('mail21o');
        }else if(imageArray[s].match(/maillogNS2_4o\.csv/)){
            mailNS2_4o_csv = imageArray[s];
            console.log('mail24o');
        }else if(imageArray[s].match(/aslogNS1_1d\.csv/)){
            asNS1_1d_csv = imageArray[s];
            console.log('NS11d');
        }else if(imageArray[s].match(/aslogNS2_1d\.csv/)){
            asNS2_1d_csv = imageArray[s];
            console.log('NS21d');
        }else if(imageArray[s].match(/maillogNS1_1d\.csv/)){
            mailNS1_1d_csv = imageArray[s];
            console.log('mail11d' + mailNS1_1d_csv);
        }else if(imageArray[s].match(/maillogNS2_1d\.csv/)){
            mailNS2_1d_csv = imageArray[s];
            console.log('mail21d');
        }
    }

    console.log(asNS1_1o_csv);
    console.log(asNS1_4o_csv);
    console.log(asNS2_1o_csv);
    console.log(asNS2_4o_csv);
    console.log(mailNS1_1o_csv);
    console.log(mailNS1_4o_csv);
    console.log(mailNS2_1o_csv);
    console.log(mailNS2_4o_csv);
    console.log(asNS1_1d_csv);
    console.log(asNS2_1d_csv);
    console.log(mailNS1_1d_csv);
    console.log(mailNS2_1d_csv);
}

function create_listbox(){ //GWeventのリストボックスの生成

    selectdir.length = 0; //12月19日追加。報告忘れず。

    //for(s = dirArray.length -1, i=0; s > dirArray.length -11; s--){
    for(s = dirArray.length -1, i=0; s >= 0; s--){
        selectdir [i] = dirArray[s];
        i++;
    }

//    console.log(selectdir);
    
    for(s=0; s < sLength; s++){
        opt[s] = document.createElement("option");
        opt[s].value = selectdir[s];
        str[s] = document.createTextNode(selectdir[s]);
        opt[s].appendChild(str[s]);
        document.getElementById("dlist").appendChild(opt[s]);
    }
}

function changeBox(value){ //GWeventに表示するセレクトボックス数の選択

    if(value == "more"){
        for(s=sLength; s<selectdir.length; s++){
            opt[s] = document.createElement("option");
            opt[s].value = selectdir[s];
            str[s] = document.createTextNode(selectdir[s]);
            opt[s].appendChild(str[s]);
            document.getElementById("dlist").appendChild(opt[s]);
        }
        document.getElementById("change_list").value = "recent";
    }else if(value == "recent"){
        var dlist = document.list.dlist;

        for(s = dlist.length-1; s > (sLength-1); s--){
            dlist.remove(s)
        }
        document.getElementById("change_list").value = "more"

    }
}

function create_areabox(init){ //全天画像のセレクトボックス生成

    if(init == "i"){
        var areaBox = document.area.area;
        for(s=areaBox.length-1; s>=0; s--){
            areaBox.remove(s);
        }    
    }

    var num =0;
    var areaOpt = new Array();
    var areaStr = new Array();

    if(imageList.match(/prj\.png/)){
        areaOpt[num] = document.createElement("option");
        areaOpt[num].value = "plain";
        areaStr[num] = document.createTextNode("None");
        areaOpt[num].appendChild(areaStr[num]);
        document.getElementById("area").appendChild(areaOpt[num]);
        num++;    
    }
    
    if(imageList.match(/upd\.png/)){
        areaOpt[num] = document.createElement("option");
        areaOpt[num].value = "upd";
        areaStr[num] = document.createTextNode("3_Update");
        areaOpt[num].appendChild(areaStr[num]);
        document.getElementById("area").appendChild(areaOpt[num]);
        num++;    
    }
    if(imageList.match(/prj_ini/)){
        areaOpt[num] = document.createElement("option");
        areaOpt[num].value = "ini";
        areaStr[num] = document.createTextNode("2_Initial");
        areaOpt[num].appendChild(areaStr[num]);
        document.getElementById("area").appendChild(areaOpt[num]);
        num++;  
    }
    if(imageList.match(/pre/)){
        areaOpt[num] = document.createElement("option");
        areaOpt[num].value = "pre";
        areaStr[num] = document.createTextNode("1_Preliminary");
        areaOpt[num].appendChild(areaStr[num]);
        document.getElementById("area").appendChild(areaOpt[num]);
        num++;  
    }

    document.getElementById("area").value = areatype;
}

function create_errorbox(init){ //エラー領域画像のセレクトボックス生成

    if(init == "i"){
        var errorBox = document.error.error;
        for(s=errorBox.length-1; s>0; s--){
            errorBox.remove(s);
        }    
    }

    var num =1;
    var errorOpt = new Array();
    var errorStr = new Array();
    var bartitle;
    
    // H.N. 20/02/18
    /*
    if(upd !== ""){
        errorOpt[num] = document.createElement("option");
        errorOpt[num].value = upd;
        errorStr[num] = document.createTextNode(upd);
        errorOpt[num].appendChild(errorStr[num]);
        document.getElementById("error").appendChild(errorOpt[num]);
        num++;    
    }
    if(ini !== ""){
        errorOpt[num] = document.createElement("option");
        errorOpt[num].value = ini;
        errorStr[num] = document.createTextNode(ini);
        errorOpt[num].appendChild(errorStr[num]);
        document.getElementById("error").appendChild(errorOpt[num]);
        num++;    
    }
    if(pre2 !== ""){
        errorOpt[num] = document.createElement("option");
        errorOpt[num].value = pre2;
        errorStr[num] = document.createTextNode(pre2);
        errorOpt[num].appendChild(errorStr[num]);
        document.getElementById("error").appendChild(errorOpt[num]);
        num++;  
    }
    if(pre1 !== ""){
        errorOpt[num] = document.createElement("option");
        errorOpt[num].value = pre1;
        errorStr[num] = document.createTextNode(pre1);
        errorOpt[num].appendChild(errorStr[num]);
        document.getElementById("error").appendChild(errorOpt[num]);
        num++;  
    }
    */
    for(i=errArea.length-1; i>=0; i--){
        errorOpt[i] = document.createElement("option");
        errorOpt[i].value = errArea[i];
        bartitle = errArea[i].match(/(^.+)_ctr\.png$/);
        errorStr[i] = document.createTextNode(bartitle[1]);
        errorOpt[i].appendChild(errorStr[i]);
        document.getElementById("error").appendChild(errorOpt[i]);
    }

    document.getElementById("error").value = useArea;
}

function create_triggerbox(init){ //トリガーマップのセレクトボックス生成

    if(init == "i"){
        var asNS1Box = document.an1.an1;
        for(s=asNS1Box.length-1; s>0; s--){
            asNS1Box.remove(s);
        }
        var asNS2Box = document.an2.an2;
        for(s=asNS2Box.length-1; s>0; s--){
            asNS2Box.remove(s);
        }
        var mailNS1Box = document.mn1.mn1;
        for(s=mailNS1Box.length-1; s>0; s--){
            mailNS1Box.remove(s);
        }
        var mailNS2Box = document.mn2.mn2;
        for(s=mailNS2Box.length-1; s>0; s--){
            mailNS2Box.remove(s);
        }
        
    }

    var an1num =1;
    var an1Opt = new Array();
    var an1Str = new Array();
    
    if(asNS1_1d !== ""){
        an1Opt[an1num] = document.createElement("option");
        an1Opt[an1num].value = "1d";
        an1Str[an1num] = document.createTextNode("1d");
        an1Opt[an1num].appendChild(an1Str[an1num]);
        document.getElementById("an1").appendChild(an1Opt[an1num]);
        an1num++;    
    }
    if(asNS1_4o !== ""){
        an1Opt[an1num] = document.createElement("option");
        an1Opt[an1num].value = "4o";
        an1Str[an1num] = document.createTextNode("4o");
        an1Opt[an1num].appendChild(an1Str[an1num]);
        document.getElementById("an1").appendChild(an1Opt[an1num]);
        an1num++;    
    }
    if(asNS1_1o !== ""){
        an1Opt[an1num] = document.createElement("option");
        an1Opt[an1num].value = "1o";
        an1Str[an1num] = document.createTextNode("1o");
        an1Opt[an1num].appendChild(an1Str[an1num]);
        document.getElementById("an1").appendChild(an1Opt[an1num]);
        an1num++; 
    }

    var an2num =1;
    var an2Opt = new Array();
    var an2Str = new Array();
    
    if(asNS2_1d !== ""){
        an2Opt[an2num] = document.createElement("option");
        an2Opt[an2num].value = "1d";
        an2Str[an2num] = document.createTextNode("1d");
        an2Opt[an2num].appendChild(an2Str[an2num]);
        document.getElementById("an2").appendChild(an2Opt[an2num]);
        an2num++;    
    }
    if(asNS2_4o !== ""){
        an2Opt[an2num] = document.createElement("option");
        an2Opt[an2num].value = "4o";
        an2Str[an2num] = document.createTextNode("4o");
        an2Opt[an2num].appendChild(an2Str[an2num]);
        document.getElementById("an2").appendChild(an2Opt[an2num]);
        an2num++;    
    }
    if(asNS2_1o !== ""){
        an2Opt[an2num] = document.createElement("option");
        an2Opt[an2num].value = "1o";
        an2Str[an2num] = document.createTextNode("1o");
        an2Opt[an2num].appendChild(an2Str[an2num]);
        document.getElementById("an2").appendChild(an2Opt[an2num]);
        an2num++; 
    }
    
    var mn1num =1;
    var mn1Opt = new Array();
    var mn1Str = new Array();
    
    if(mailNS1_1d !== ""){
        mn1Opt[mn1num] = document.createElement("option");
        mn1Opt[mn1num].value = "1d";
        mn1Str[mn1num] = document.createTextNode("1d");
        mn1Opt[mn1num].appendChild(mn1Str[mn1num]);
        document.getElementById("mn1").appendChild(mn1Opt[mn1num]);
        mn1num++;    
    }
    if(mailNS1_4o !== ""){
        mn1Opt[mn1num] = document.createElement("option");
        mn1Opt[mn1num].value = "4o";
        mn1Str[mn1num] = document.createTextNode("4o");
        mn1Opt[mn1num].appendChild(mn1Str[mn1num]);
        document.getElementById("mn1").appendChild(mn1Opt[mn1num]);
        mn1num++;    
    }
    if(mailNS1_1o !== ""){
        mn1Opt[mn1num] = document.createElement("option");
        mn1Opt[mn1num].value = "1o";
        mn1Str[mn1num] = document.createTextNode("1o");
        mn1Opt[mn1num].appendChild(mn1Str[mn1num]);
        document.getElementById("mn1").appendChild(mn1Opt[mn1num]);
        mn1num++; 
    }

    var mn2num =1;
    var mn2Opt = new Array();
    var mn2Str = new Array();
    
    if(mailNS2_1d !== ""){
        mn2Opt[mn2num] = document.createElement("option");
        mn2Opt[mn2num].value = "1d";
        mn2Str[mn2num] = document.createTextNode("1d");
        mn2Opt[mn2num].appendChild(mn2Str[mn2num]);
        document.getElementById("mn2").appendChild(mn2Opt[mn2num]);
        mn2num++;    
    }
    if(mailNS2_4o !== ""){
        mn2Opt[mn2num] = document.createElement("option");
        mn2Opt[mn2num].value = "4o";
        mn2Str[mn2num] = document.createTextNode("4o");
        mn2Opt[mn2num].appendChild(mn2Str[mn2num]);
        document.getElementById("mn2").appendChild(mn2Opt[mn2num]);
        mn2num++;    
    }
    if(mailNS2_1o !== ""){
        mn2Opt[mn2num] = document.createElement("option");
        mn2Opt[mn2num].value = "1o";
        mn2Str[mn2num] = document.createTextNode("1o");
        mn2Opt[mn2num].appendChild(mn2Str[mn2num]);
        document.getElementById("mn2").appendChild(mn2Opt[mn2num]);
        mn2num++; 
    }


    document.getElementById("error").value = useArea;
}


function change_dir(value){ //イベントが切り替えられた際の処理

    delArray();
    details = ""
    detailsArray.length = 0;
    event.length = 0;
    dresult = "";
    imageList = "";

    console.log(details);
    console.log(dresult);
    console.log(detailsArray);
    console.log(event);

    dirName = value;
    console.log(dirName);  //change_dirのみ関数secondLoadに繋げて処理を行っても上手く動作しないため、ここで次の関数を呼び出す
    imageNumber = 0;
    imagesize = "fit";

    listGet("o");
    timer7 = setTimeout("splitList('i')",500);
    setTimeout("getArea('i')",500);
    setTimeout("getTrigger('i')",500);
    timer12 = setTimeout("create_areabox('i')",800);
    setTimeout("create_errorbox('i')",800);
    setTimeout("create_triggerbox('i')",800);
    timer8 = setTimeout("loadFinish('i')",1000);
    timer9 = setTimeout("get_details('')",1000);
    setTimeout(detailsmap, 1500);
    setTimeout(parent.detailsframe.fit, 1600);
    setTimeout("get_csvfile('i')",500);

}

function change_energy(value){ //エネルギーバンドが切り替えられた際の処理

    delArray();
    energy = value;
    console.log(energy);
    secondLoad();
}

function change_area(value){ //全天画像が切り替えられた際の処理

    /*var val = value;
    area = new RegExp(value);
    console.log(area);
    if(imageList.match(area)){*/
        console.log(value);
        numReduction.length = 0;
        numReduction2.length = 0;
        time.length = 0;
        nowlist.length = 0;
        uselist.length = 0;
        if(value == "upd"){
            nowlist = imageUpd;
            areatype = "upd";
        }else if(value == "ini"){
            nowlist = imageIni
            areatype = "ini";
        }else if(value == "pre"){
            nowlist = imagePre
            areatype = "pre";
        }else{
            nowlist = imagePlain;
            areatype = "plain"
        }
        console.log(areatype);
        secondLoad();
    /*}else{

        parent.messageframe.document.getElementById("mess").innerHTML = value + " type is No image.";
        mes();
        document.getElementById("area").value = areatype;
    }*/
}

function change_error(value){ //エラー領域画像が切り替えられた際の処理

    var val = value;
    useArea = val;
    console.log(useArea);
    if(val == "None"){
        parent.mainframe.document.getElementById("errorImage").style.visibility="hidden"
    }else{
        parent.mainframe.document.getElementById("errorImage").style.visibility="visible"
    }

    if(imagesize == "fit"){
        fit();
    }else if(imagesize == "full"){
        full();
    }else if(imagesize == "full2"){
        full2();
    }else if(imagesize == "harf"){
        harf();
    }

    secondLoad();
}

function change_type(value){ //画像ノイズが切り替えられた際の処理

    delArray();
    datatype = value;
    console.log(datatype);
    secondLoad();    
}

function change_asNS1(value){ //トリガーマップが切り替えられた際の処理
    var val = value;
    console.log(val);
    if(val == "1d"){
        parent.mainframe.document.getElementById("asNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS1").src = dirUrl + dirName + "/" + asNS1_1d;
        //parent.mainframe.changeCList('trigger1', dirUrl + dirName + "/" + asNS1_1d_csv);
        var timer1d = setTimeout("parent.mainframe.changeCList('trigger1', dirUrl + dirName + '/' + asNS1_1d_csv)", 1500);
    }else if(val == "4o"){
        parent.mainframe.document.getElementById("asNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS1").src = dirUrl + dirName + "/" + asNS1_4o;
        //parent.mainframe.changeCList('trigger1', dirUrl + dirName + "/" + asNS1_4o_csv);
        var timer4o = setTimeout("parent.mainframe.changeCList('trigger1', dirUrl + dirName + '/' + asNS1_4o_csv)", 1500);
    }else if(val == "1o"){
        parent.mainframe.document.getElementById("asNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS1").src = dirUrl + dirName + "/" + asNS1_1o;
        //parent.mainframe.changeCList('trigger1', dirUrl + dirName + "/" + asNS1_1o_csv);
        var timer1o = setTimeout("parent.mainframe.changeCList('trigger1', dirUrl + dirName + '/' + asNS1_1o_csv)", 1500);
    }else{
        parent.mainframe.document.getElementById("asNS1").style.visibility = "hidden";
        parent.mainframe.candidateData.length = 0;
        parent.mainframe.nCandidate.length = 0;
        parent.mainframe.nCandidate2.length = 0;
    }

    if(imagesize == "fit"){
        fit();
    }else if(imagesize == "full"){
        full();
    }else if(imagesize == "full2"){
        full2();
    }else if(imagesize == "harf"){
        harf();
    }
}

function change_mailNS1(value){ //同上
    var val = value;
    if(val == "1d"){
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_1d;
        //parent.mainframe.changeCList('mail1', dirUrl + dirName + "/" + mailNS1_1d_csv);
        var timer1d = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_1d_csv)", 1500);
    }else if(val == "4o"){
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_4o;
        //parent.mainframe.changeCList('mail1', dirUrl + dirName + "/" + mailNS1_4o_csv);
        var timer4o = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_4o_csv)", 1500);
    }else if(val == "1o"){
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS1").src = dirUrl + dirName + "/" + mailNS1_1o;
        console.log(dirUrl + dirName + "/" + mailNS1_1o_csv);
        //parent.mainframe.changeCList('mail1', dirUrl + dirName + "/" + mailNS1_1o_csv);
        var timer1o = setTimeout("parent.mainframe.changeCList('mail1', dirUrl + dirName + '/' + mailNS1_1o_csv)", 1500);
    }else{
        console.log('a');
        parent.mainframe.document.getElementById("mailNS1").style.visibility = "hidden";
        console.log('b');
        parent.mainframe.candidateData2.length = 0;
        console.log('c');
        parent.mainframe.nCandidate.length = 0;
        console.log('d');
        parent.mainframe.nCandidate2.length = 0;
        console.log(nCandidate);
    }

    if(imagesize == "fit"){
        fit();
    }else if(imagesize == "full"){
        full();
    }else if(imagesize == "full2"){
        full2();
    }else if(imagesize == "harf"){
        harf();
    }
}

function change_asNS2(value){ //同上
    var val = value;
    if(val == "1d"){
        parent.mainframe.document.getElementById("asNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS2").src = dirUrl + dirName + "/" + asNS2_1d;
        //parent.mainframe.changeCList('trigger2', dirUrl + dirName + "/" + asNS2_1d_csv);
        var timer1d = setTimeout("parent.mainframe.changeCList('trigger2', dirUrl + dirName + '/' + asNS2_1d_csv)", 1500);
    }else if(val == "4o"){
        parent.mainframe.document.getElementById("asNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS2").src = dirUrl + dirName + "/" + asNS2_4o;
        //parent.mainframe.changeCList('trigger2', dirUrl + dirName + "/" + asNS2_4o_csv);
        var timer4o = setTimeout("parent.mainframe.changeCList('trigger2', dirUrl + dirName + '/' + asNS2_4o_csv)", 1500);
    }else if(val == "1o"){
        parent.mainframe.document.getElementById("asNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("asNS2").src = dirUrl + dirName + "/" + asNS2_1o
        //parent.mainframe.changeCList('trigger2', dirUrl + dirName + "/" + asNS2_1o_csv);
        var timer1o = setTimeout("parent.mainframe.changeCList('trigger2', dirUrl + dirName + '/' + asNS2_1o_csv)", 1500);
    }else{
        parent.mainframe.document.getElementById("asNS2").style.visibility = "hidden";
        parent.mainframe.candidateData3.length = 0;
        parent.mainframe.nCandidate.length = 0;
        parent.mainframe.nCandidate2.length = 0;
    }

    if(imagesize == "fit"){
        fit();
    }else if(imagesize == "full"){
        full();
    }else if(imagesize == "full2"){
        full2();
    }else if(imagesize == "harf"){
        harf();
    }
}

function change_mailNS2(value){ //同上
    var val = value;
    if(val == "1d"){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_1d;
        //parent.mainframe.changeCList('mail2', dirUrl + dirName + "/" + mailNS2_1d_csv);
        var timer1d = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1d_csv)", 1500);
    }else if(val == "4o"){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_4o;
        console.log(dirUrl + dirName + "/" + mailNS2_4o);
        //parent.mainframe.changeCList('mail2', dirUrl + dirName + "/" + mailNS2_4o_csv);
        var timer4o = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_4o_csv)", 1500);
    }else if(val == "1o"){
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "visible";
        parent.mainframe.document.getElementById("mailNS2").src = dirUrl + dirName + "/" + mailNS2_1o;
        //parent.mainframe.changeCList('mail2', dirUrl + dirName + "/" + mailNS2_1o_csv);
        var timer1o = setTimeout("parent.mainframe.changeCList('mail2', dirUrl + dirName + '/' + mailNS2_1o_csv)", 1500);
    }else{
        parent.mainframe.document.getElementById("mailNS2").style.visibility = "hidden";
        parent.mainframe.candidateData4.length = 0;
        parent.mainframe.nCandidate.length = 0;
        parent.mainframe.nCandidate2.length = 0;
    }

    if(imagesize == "fit"){
        fit();
    }else if(imagesize == "full"){
        full();
    }else if(imagesize == "full2"){
        full2();
    }else if(imagesize == "harf"){
        harf();
    }
}

function delArray(){ //配列の要素削除関数。これをしないと切り替えが上手くいかない。
    nowlist.length = 0;
    uselist.length = 0;
    numReduction.length = 0;
    numReduction2.length = 0;
    time.length = 0;
    imagePre.length = 0;
    imageIni.length = 0;
    imageUpd.length = 0;
    imagePlain.length = 0;

}
function before(){ //前時間が押された際の処理

    if(imageNumber == 0){
        parent.messageframe.document.getElementById("mess").innerHTML = "Image is the oldest";
        mes();
    }else{
        imageNumber = imageNumber -1;
        loadFinish();
    }
}

function next(){ //次時間が押された際の処理
    
    if(imageNumber == uselist.length - 1){
        if(areatype == "pre"){
            parent.messageframe.document.getElementById("mess").innerHTML = "Image is the last";
            mes();
        }else if(areatype == "plain"){
            parent.messageframe.document.getElementById("mess").innerHTML = "Image is the last";
            mes();
        }else if(time[imageNumber+1] == "1440m"){
            parent.messageframe.document.getElementById("mess").innerHTML = "Image is the last";
            mes();
        }else{
            numReduction.length = 0;
            numReduction2.length = 0;
            time.length = 0;
            nowlist.length = 0;
            uselist.length = 0;
            nowlist = imagePre;
            areatype = "pre";
            parent.messageframe.document.getElementById("mess").innerHTML = "Change image type.";
            mes();
            secondLoad();

        }
    }else{
        imageNumber = imageNumber +1;
        loadFinish();
    }
}

function mes(){ //エラーメッセージの自動削除の為の関数
    timer10 = setTimeout("del('')",5000);
}

function del(){
    parent.messageframe.document.getElementById("mess").innerHTML = "message";
}

function Exposure(value){ //exposureボタンが押された際の処理
    
    if(value == "Exposure-off"){
        document.getElementById("b_exposure").value = "Exposure-on";
        changeScreen();
    }
    else{
        document.getElementById("b_exposure").value = "Exposure-off";
        changeScreen();
    }
}

function Range(value){ //ラジオボタンのON/OFFが押された際の処理

    if(value == "on"){
        document.getElementById("bar").style.display = "block";
        document.getElementById("b_exposure").style.display = "block";
        parent.mainframe.document.getElementById("skymap").style.visibility = "visible";
    }else{
        document.getElementById("bar").style.display ="none";
        document.getElementById("b_exposure").style.display = "none";
        parent.mainframe.document.getElementById("skymap").style.visibility = "hidden";
    }
}

//ここから画像サイズを合わせる全ての関数
function full(){
    parent.mainframe.beforeChange(); //変更前の画像の大きさを記録する
    parent.mainframe.document.getElementById("image1").style.width = orgWidth;
    parent.mainframe.document.getElementById("image1").style.height = orgHeight;
    parent.mainframe.afterChange(); //画像の大きさが変わった分だけマーカーの位置を適切にずらす

    parent.mainframe.document.getElementById("skymap").style.width = orgWidth;
    parent.mainframe.document.getElementById("skymap").style.height = orgHeight;
    parent.mainframe.document.getElementById("errorImage").style.width = orgWidth;
    parent.mainframe.document.getElementById("errorImage").style.height = orgHeight;
    parent.mainframe.document.getElementById("asNS1").style.width = orgWidth;
    parent.mainframe.document.getElementById("asNS1").style.height = orgHeight;
    parent.mainframe.document.getElementById("asNS2").style.width = orgWidth;
    parent.mainframe.document.getElementById("asNS2").style.height = orgHeight;
    parent.mainframe.document.getElementById("mailNS1").style.width = orgWidth;
    parent.mainframe.document.getElementById("mailNS1").style.height = orgHeight;
    parent.mainframe.document.getElementById("mailNS2").style.width = orgWidth;
    parent.mainframe.document.getElementById("mailNS2").style.height = orgHeight;
    //parent.mainframe.reDispMarker();

    imagesize = "full";
}

function full2(){
    parent.mainframe.beforeChange(); //変更前の画像の大きさを記録する
	parent.mainframe.document.getElementById("image1").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("image1").style.height = 2 * orgHeight;
    parent.mainframe.afterChange(); //画像の大きさが変わった分だけマーカーの位置を適切にずらす

    parent.mainframe.document.getElementById("skymap").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("skymap").style.height = 2 * orgHeight;
    parent.mainframe.document.getElementById("errorImage").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("errorImage").style.height = 2 * orgHeight;
    parent.mainframe.document.getElementById("asNS1").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("asNS1").style.height = 2 * orgHeight;
    parent.mainframe.document.getElementById("asNS2").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("asNS2").style.height = 2 * orgHeight;
    parent.mainframe.document.getElementById("mailNS1").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("mailNS1").style.height = 2 * orgHeight;
    parent.mainframe.document.getElementById("mailNS2").style.width = 2 * orgWidth;
    parent.mainframe.document.getElementById("mailNS2").style.height = 2 * orgHeight;
    //parent.mainframe.reDispMarker();
    
    imagesize = "full2";
}

function harf(){
    parent.mainframe.beforeChange(); //変更前の画像の大きさを記録する
    scale = 2;
    sizeChange();
    parent.mainframe.afterChange(); //画像の大きさが変わった分だけマーカーの位置を適切にずらす
    //parent.mainframe.reDispMarker();
    
    imagesize = "harf";
}

function fit(){
    parent.mainframe.beforeChange(); //変更前の画像の大きさを記録する
    scale = 1;
    sizeChange();
    parent.mainframe.afterChange(); //画像の大きさが変わった分だけマーカーの位置を適切にずらす
    //parent.mainframe.reDispMarker();
    
    imagesize = "fit";
}

function widthSet(){
    // widthに合わせてリサイズする
    if(scale == 1){
	parent.mainframe.document.getElementById("image1").style.width = winWidth;
	parent.mainframe.document.getElementById("image1").style.height = Math.floor(imgHeight / widthRate);
    } else if(scale == 2){
	heightSet();
	/*
	parent.mainframe.document.getElementById("image1").style.width = 2 * winWidth;
	parent.mainframe.document.getElementById("image1").style.height = 2 * Math.floor(imgHeight / widthRate);
	*/    
    }
}

function heightSet(){
    // heightに合わせてリサイズする
    if(scale == 1){
	parent.mainframe.document.getElementById("image1").style.width = Math.floor(imgWidth / heightRate);
	parent.mainframe.document.getElementById("image1").style.height = winHeight;
  
    } else if(scale == 2){
	parent.mainframe.document.getElementById("image1").style.width = 2 * Math.floor(imgWidth / heightRate);
	parent.mainframe.document.getElementById("image1").style.height = 2 * winHeight;
    }
  
}


function sizeChange(){
    resizeRate = 1.0; //画面サイズに対する画像サイズの比率
    margin = 7; //画像の周りの余白

    //変数の定義
    imgWidth = parent.mainframe.document.getElementById("image1").width; //現在の画像の幅
    imgHeight = parent.mainframe.document.getElementById("image1").height; //現在の画像の高さ
    //console.log("imageWidth/Height="+ imgWidth + "/" + imgHeight);
           
    winWidth = Math.floor(parent.mainframe.window.innerWidth * resizeRate - margin * 2); //画像表示領域の幅
    winHeight = Math.floor(parent.mainframe.window.innerHeight * resizeRate - margin * 2); //画像表示領域の高さ
    widthRate = imgWidth / winWidth; //現在の画像サイズと画像表示領域サイズの比率（幅）
    heightRate = imgHeight / winHeight; //現在の画像サイズと画像表示領域サイズの比率（高さ）
    if (widthRate >= 1 && heightRate >= 1 ){
	// 画像の幅、高さが共に画面に収まらない場合
	if (widthRate > heightRate){
	    // 画像の幅の比率の方が大きい場合
	    // widthに合わせて縮小
	    resize = widthSet();
	} else {
	    // 画像の高さの比率の方が大きい場合
	    // heightに合わせて縮小
	    resize = heightSet();
	}
    } else if (widthRate >=1 && heightRate < 1){
	// 画像の幅だけが画面に収まらない場合
	resize = widthSet();
    } else if (widthRate < 1 && heightRate >= 1){
	// 画像の高さだけが画面に収まらない場合
	resize = heightSet();
    } else if (widthRate < 1 && heightRate < 1){
	// 画像の幅と高さが共に画面より小さい場合
	if (widthRate > heightRate){
	    // 画像の幅の比率の方が大きい場合
	    // widthに合わせて拡大
	    resize = widthSet();
	} else {
	    // 画像の高さの比率の方が大きい場合
	    // heightに合わせて拡大
	    resize = heightSet();
	}
    }

    //parent.mainframe.reDispMarker();

    // for image 2
    // sizeChange_2(); 
    imgWidth = parent.mainframe.document.getElementById("image1").width; //現在の画像の幅
    imgHeight = parent.mainframe.document.getElementById("image1").height; //現在の画像の高さ

    parent.mainframe.document.getElementById("skymap").style.width = imgWidth;
    parent.mainframe.document.getElementById("skymap").style.height = imgHeight;
    parent.mainframe.document.getElementById("errorImage").style.width = imgWidth;
    parent.mainframe.document.getElementById("errorImage").style.height = imgHeight;
    parent.mainframe.document.getElementById("asNS1").style.width = imgWidth;
    parent.mainframe.document.getElementById("asNS1").style.height = imgHeight;
    parent.mainframe.document.getElementById("asNS2").style.width = imgWidth;
    parent.mainframe.document.getElementById("asNS2").style.height = imgHeight;
    parent.mainframe.document.getElementById("mailNS1").style.width = imgWidth;
    parent.mainframe.document.getElementById("mailNS1").style.height = imgHeight;
    parent.mainframe.document.getElementById("mailNS2").style.width = imgWidth;
    parent.mainframe.document.getElementById("mailNS2").style.height = imgHeight;
 
}
//ここまで画像サイズ合わせ

//11月26日、稲木が追加したもの

function marker(){ // マーカーが押された際の処理
	curButton = document.getElementById("marker");
    if(curButton.value == "Marker-on"){
		curButton.value = "Marker-off";
		curButton.style.backgroundColor = "gainsboro";
		parent.mainframe.document.getElementById("myMarker").style.visibility="hidden";
	} else {
		curButton.value = "Marker-on";
		curButton.style.backgroundColor = "gray";
	}
}

function cursor(){ // cursorが押された際の処理
	curButton = document.getElementById("cursor");
    if(curButton.value == "Cursor-on"){
		curButton.value = "Cursor-off";
		curButton.style.backgroundColor = "gainsboro";
		parent.mainframe.document.getElementById("myCursor").style.visibility="hidden";
	} else {
		curButton.value = "Cursor-on";
		curButton.style.backgroundColor = "gray";
	}
}

//2019年12月３日追加
/*function changeCursorMode(){
	var cursorMode = document.getElementById('cursorMode');
	if(cursorMode.value == 'mousemove'){
		cursorMode.value = 'click';
	}else{
		cursorMode.value = 'mousemove';
	}
}*/


//元rightframe
function sarchPointE()
{
	Phi = parent.leftframe.document.getElementById("resultAlpha").value; 
	Theta = parent.leftframe.document.getElementById("resultDelta").value;	
	
	if(Phi >= 0 && Phi <360 && Theta >= -90 && Theta <= 90){
		parent.mainframe.sarchPoint(0);
	}else{
		parent.mainframe.alert("InputError\nα : 0.0 ~ 359.9\nδ : -90.0 ~ 90.0");
	}
}

function sarchPointG()
{
	Phi = parent.leftframe.document.getElementById("resultgk").value; 
	Theta = parent.leftframe.document.getElementById("resultgi").value;
	if(Phi >= 0 && Phi <360 && Theta >= -90 && Theta <= 90){
		parent.mainframe.sarchPoint(1);
	}else{
		parent.mainframe.alert("InputError\nl : 0.0 ~ 359.9\nb : -90.0 ~ 90.0");
	}
}

function jnamesearch()
{
	var name = String(parent.leftframe.document.getElementById("jnamesearch").value);
	parent.mainframe.jnSearch(name,"j");
}

function reWrite()
{
	//console.log('ok_1');
	parent.mainframe.searchstar(parent.mainframe.CataData,document.getElementById("SelectFlux").value);
	parent.mainframe.resultWrite();
	//console.log('ok_2');
}

//2019/12/05追加
function FF() { //mainframe.jsの関数FF()とほぼ同じ
	var widethFrames;
    var framesetCols;
    var exposureChange = document.getElementById("b_exposure");

	widethFrames = parent.document.getElementById('widthFrames');

	if(exposureChange.value == "Exposure-on"){
		framesetCols = '122,1*, 1*';
		widethFrames.cols = framesetCols;
	}else{
		framesetCols = '122,*, 0';
		widethFrames.cols = framesetCols;
	}
}

function changeScreen() {//mainframe.jsの関数fullScreen()とほぼ同じ
	FF(); //画面サイズの切り替え
    fit(); //画面のサイズが変わってもうまくリサイズされないことがあるので呼び出している。
    setTimeout("parent.exposureframe.fit('')",10);
}

//20191214追加
function eventTestJudge() {//testディレクトリとeventディレクトリの入れ替え
    var eTJudge = document.getElementById('eventTest');
    var dlist = document.list.dlist;

    delArray();
    imageNumber = 0;
    details = ""
    detailsArray.length = 0;
    event.length = 0;
    dresult = "";

    for(s = dlist.length; s >= 0; s--){ //dirlist欄の選択肢を全て消す
        dlist.remove(s)
    }

    if(eTJudge.value == 'event'){//testディレクトリを使う
        eTJudge.value = 'test';
        sLength = 24;
        eventTest = 'test/kafka';
        dirDef = gw + slash + eventTest + slash;
        dirUrl = slash+dirDef;
        teamUrl =slash+dirDef+teamDef;
        console.log(dirDef, dirUrl, teamUrl);
        thirdLoad();
    }else{//eventディレクトリを使う
        dirNameJudge = 'S';
        eTJudge.value = 'event';
        sLength = 10;
        eventTest = 'event/kafka';
        dirDef = gw + slash + eventTest + slash;
        dirUrl = slash+dirDef;
        teamUrl =slash+dirDef+teamDef;
        thirdLoad();
    }
    document.getElementById("change_list").value = "more";
}

// 'popupを表示するまでのdelay time' を変更するHTMLタグ（popupDelay）の設定
function popupDelayConfig() {
    delayRange = document.getElementById("popupDelay-range");
    delayDisplay = document.getElementById("popupDelay-display");

    // 規定値を表示させる
    delayDisplay.innerText = delayRange.value;
    console.log(delayDisplay.innerText);
    // 'delay time が変更された時, 表示されている値を書き換える' という設定を追加する
    delayRange.addEventListener("input", (e) => {
        delayDisplay.innerText = e.target.value;
        console.log(delayDisplay.innerText);
    })
}
window.addEventListener("load", popupDelayConfig); // 設定を即座に反映させる

window.onload = firstLoad(); //サイトが開かれた際に関数firstLoadを呼び出す
window.onresize = fit(); // ウィンドウの大きさが変更されるとfitを呼び出す,20191203追加

