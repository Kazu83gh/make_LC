/********************************************
 *											*
 *		中央フレームのJavascriptファイル		*
 *											*
 *			（座標取得・座標変換）			    *
 *		（カタログ読込・直近天体検索）		     *
 *											*
 *******************************************/


//このソースコードはmasivから流用している関数がたくさんある
//そのため、つづりを間違えたまま使っている変数、関数もある。直す時は一箇所だけでなく全て直すこと。
var EG = 1; //masivでは0だと変換前が赤道座標であることを記録、1だと銀河座標、いらない変数なので余裕があれば消しておきたい
var margin = 0; //画像の周りの余白
var orgWidth; //画像の横幅（原寸大）
var orgHeight; //画像の縦幅（原寸大）
var imgWidth;//画像の横幅
var imgHeight; //画像の縦幅
var preImgWidth;
var preImgHeight;
var recordX;
var recordY;
var x,y; //画像の縦、横
var eTheta,gTheta; //赤道座標・銀河座標でのθ(緯度)
var ePhi,gPhi; //赤道座標・銀河座標でのφ(経度)
var ex,ey,ez; //元が赤道座標のデカルト座標
var gx,gy,gz; //元が銀河座標のデカルト座標
var NX,NY; //逆変換後のXY座標(規格化済み)
var IX,IY; //逆変換後のXY座標(画像サイズ依存)
var inPhi,inTheta; //入力された座標[度]
var sStar = Array(); //名前検索した天体を格納する配列
var nStar = Array(); //直近天体を近い順で格納する配列
var nStar2 = Array(); //直近天体を近い順で格納する配列(カーソル用)

var topMargin = 53; //画像の中に描かれている余白（上にある余白、単位はpx）、MAGECS用に62から53に変更
var leftMargin = 96; //画像の中に描かれている余白（左にある余白、単位はpx）
var rightMargin = 96; //画像の中に描かれている余白（右にある余白、単位はpx）
var bottomMargin = 98; //画像の中に描かれている余白（下にある余白、単位はpx）、MAGECS用に107から98に変更
var figureWidth = 1728; //図の横幅
var figureHeight = 864; //図の縦幅
var mollwidePhi; //モルワイデ図の緯度、ラジアン
var mollwideLambda; //モルワイデ図法の経度、ラジアン
var alpha, delta; //赤経、赤緯 [度]
var Limt; //指定されたfluxの条件を記憶
var mouseMove; //1:マウスを動かした時に呼び出された場合、0:マウスをクリックした時
var fSFunction = 0; //1:全画面表示機能をONにしている時、0:OFF（通常時）にしている時
var clickCount = 0; //クリックした回数
var NS = "n";
var pointSta = 0;//天球の内側なら１、外側なら０、判断できるように作っていないが仮に宣言しておく、余裕があれば直した方がいい
var marginSta = 0; //マウスポインタの位置が画像の余白なら0, 地図上なら1,ただし1だからと言って必ず地図の内側ではない。
				   //pointSta == 1 && marginSta == 1で地図の内側
var showPopStates = 1; //0:右クリックでpopを出している時  1:出していない時
//gwiv_0.9
var alpha2,delta2;
var candidateType;
var candidateData,candidateData2, candidateData3, candidateData4;
var nCandidate,nCandidate2;
var nCandidate2_tri, nCandidate2_mail;

const priorities = { // timescale の優先順位を定義
    "1day": 8,
    "4orb": 7,
    "1orb": 6,
    "1scan": 5,
    "30s": 4,
    "10s": 3,
    "3s": 2,
    "1s": 1
};

//leftframeからTRIGGER　TIMEを受け取るための関数
function processDresult(data) {
	gwTriUnix = data;  
}

//MARK:getMouseXY
//以下、座標変換
function getMouseXY(evt) //クリック地点の座標を取得する
{
	mouseMove = 0; //クリックしたことを記憶する
	getImgStatus();
    figureXY(evt);
    /* 取得した座標を画像の拡大縮小率に合わせて変換 */
/*   x = ((evt.pageX - margin) / imgHeight * orgHeight); // xの値（四捨五入）
    y = ((evt.pageY - margin) / imgWidth * orgWidth); // yの値（四捨五入）

    console.log(x, y);

    if((x >leftMargin && x < orgWidth - rightMargin) && (y < topMargin && y > orgHeight - bottomMargin)){ //くり

    }
	NX = x / orgWidth; //画像の大きさに合わせてxyを規格化
    NY = y / orgHeight; //(画像左上が(0,0)で右下が(1,1))
    
    console.log(NX);
    console.log(NY);
*/
    /* XY座標を赤道座標・銀河座標に変換 */

		/* 座標変換 */
        mollwide2polar(); // ハンメルアイトフ座標を極座標に変換
		polar2cart("e"); // 極座標をXY座標に変換
		equ2gal(); // 赤道座標のXY座標を銀河座標のXY座標に変換
		cart2polar("e"); // 変換されたXY座標を極座標に変換
		FluxOp();
		searchstar(CataData,Limt);
		searchCandidate(conbineFourArrays(candidateData, candidateData2, candidateData3, candidateData4), Limt);
		resultWrite(); // 結果を右フレームに反映
		markerDisp(evt.pageX,evt.pageY,"n");
}

async function printLightCurve(x, y)
{
	getImgStatus();
	styleSvg = document.getElementById("svg0nLightCurve").style;
	styleSvg.top = imgHeight + 10;
	styleSvg.width = imgWidth;

	console.log(x, y);
	var lcPath = "";
	// Mx,-100 V1000 M-100,y H1000
	var pathArray = ["M" + String(Math.round(x)) + ",-100", "V1000", "M-100," + String(Math.round(y)), "H1000"];
	lcPath += pathArray.join(" ");

	// pathのタグのdに反映
	document.getElementById("path0nLightCurve").setAttribute("d", lcPath);
}

function getImgStatus()
{
	//変更点
    orgWidth = document.getElementById("image1").naturalWidth; // オリジナルの幅
	orgHeight = document.getElementById("image1").naturalHeight; // オリジナルの高さ
	imgWidth = document.getElementById("image1").width; // 幅
	imgHeight = document.getElementById("image1").height; // 高さ
	
}

function figureXY(evt) { //クリックされた場所の座標を取得する
    /* 取得した座標を画像の拡大縮小率に合わせて変換 */
    x = ((evt.pageX - margin) / imgWidth * orgWidth); // xの値（四捨五入）px
    y = ((evt.pageY - margin) / imgHeight * orgHeight); // yの値（四捨五入）px
	//console.log('y'+y);
	

    if((x >leftMargin) && (x < orgWidth - rightMargin) && (y > topMargin) && (y < orgHeight - bottomMargin)){ //余白をクリックしていない時
        x -= orgWidth/2; //図の中心を原点にする
        y -= (topMargin + figureHeight / 2); //x:地図平面の横軸　y:地図平面の縦軸
        NX = x / ((orgWidth - leftMargin - rightMargin) / 2); //座標を１に規格化
		NY = -y / (figureHeight / 2); //座標を1に規格化
		marginSta = 1;
        //y = y - (leftMargin +  (orgHeight - topMargin - bottomMargin) / 2); //図の中心を原点にする
        //NY = -y / ((orgHeight - topMargin - bottomMargin) / 2); //　図の中心が(0,0)
        //NX = x / ((orgHeight - topMargin - bottomMargin) / 2);
        //NY = y / ((orgWidth - leftMargin - rightMargin) / 2);
        //console.log('NX'+NX);
        //console.log('NY'+NY);
    }else{
		marginSta = 0;
	}
}

function mollwide2polar() {
    var figureTheta; //モルワイデ図法で使われるパラメータθ、緯度ではない。ラジアン
    NY = NY / 2; // 縦の長さは横の長さの半分なのでYを1/2に規格化
    //console.log(NY);
//    if(NY == 1/2 || NY == -1/2){
//        mollwideLambda = 0;
//    }

	if( (NX*NX + 4 * NY*NY - 1) <= 0){
    	figureTheta = Math.asin(2 * NY);
    	mollwideLambda = Math.PI * NX / Math.cos(figureTheta);
    	if(NY == 1/2 || NY == -1/2){
        mollwideLambda = 0;
    	}
    	mollwideLambda = Math.PI - mollwideLambda; //経度を図に合わせる (範囲を0からπにする)


    	mollwidePhi = Math.asin(2 * figureTheta / Math.PI + Math.sin(2 * figureTheta) / Math.PI);
    //console.log(figureTheta);
    //console.log('赤経' + mollwideLambda + 'rad');
    //console.log('赤緯' + mollwidePhi + 'rad');
    
		ePhi = mollwideLambda * 180/Math.PI; //経度、単位は度
		eTheta = mollwidePhi * 180/Math.PI; //緯度、単位は度
		pointSta = 1;
		//console.log(NX);
		if(mouseMove == 0){
			alpha = ePhi;
			delta = eTheta;
		}else{
			alpha2 = ePhi;
			delta2 = eTheta;
		}
	}else{
		pointSta = 0;
	}
}

function polar2cart(eg){ //極座標をデカルト座標に変換

    /* 入力値(θとφ)の範囲と単位を変換 */
    eTheta = ((eTheta - 90) * Math.PI / (-180));
    ePhi = (ePhi * Math.PI / 180);
    gTheta = ((gTheta - 90) * Math.PI / (-180));
    gPhi = (gPhi * Math.PI / 180);

    /* オイラー角による変換 */
    if(eg == "e"){ //画像が赤道座標の場合

		ex = Math.sin(eTheta) * Math.cos(ePhi);
		ey = Math.sin(eTheta) * Math.sin(ePhi);
		ez = Math.cos(eTheta);
        //console.log(ex,ey,ez);
    } else { //画像が銀河座標の場合

		gx = Math.sin(gTheta) * Math.cos(gPhi);
		gy = Math.sin(gTheta) * Math.sin(gPhi);
		gz = Math.cos(gTheta);

    } 
}

function equ2gal(){ // 赤道座標から銀河座標へのオイラー角による変換
    gx = ((-0.0548755) * ex) + ((-0.873437) * ey) + ((-0.483835) * ez);
    gy = ((0.49411)    * ex) + ((-0.44483)  * ey) + ((0.746982)  * ez);
    gz = ((-0.867666)  * ex) + ((-0.198076) * ey) + ((0.455984)  * ez);
}

function cart2polar(eg){ // XY座標を極座標に変換

    if(eg == "e"){ //画像が赤道座標の場合

		/* 緯度の変換 */
		gTheta = Math.atan(Math.sqrt((gx * gx) + (gy * gy)) / gz);
		b = (gTheta * 180 / Math.PI); 
		b += 90;
		if(b < 90){
	    	b = -b;
		} else if(b > 90){
	    	b = (b - 180) * (-1); 
		} else if(b == 90){
	    	if(delta < 0){
				b = -b;
	    	}
		}

		/* 経度の変換 */
		gPhi = Math.atan(gy / gx);

       	l = (gPhi * 180 / Math.PI);
		if(gx < 0){
	    	l += 180;
		} else if((gx > 0) && (l < 0)){
	    	l += 360;
        }
        //console.log('銀経l:'+l, '銀緯b:'+b);

	} else { //画像が銀河座標の場合

		/* 緯度の変換 */
		eTheta = Math.atan(Math.sqrt((ex * ex) + (ey * ey)) / ez);
		delta = (eTheta * 180 / Math.PI);
		if(delta > 0){
	    	delta = 90 - delta;
		} else if(delta < 0){
	    	delta = (-1) * (90 + delta);
		} else if(delta == 0){
	    	if(b < 0){
				delta = -90;
	    	} else {
				delta = 90;
	    	}
		}

		/* 経度の変換 */
		ePhi = Math.atan(ey / ex);
		alpha = (ePhi * 180 / Math.PI);

		if(ex < 0){
	    	alpha += 180; 
		} else if((ex > 0) && (alpha < 0)){
			alpha += 360;
		}
	}
}

function markerDisp(inputX,inputY,force)
{
	var marButton = parent.leftframe.document.getElementById("marker");
	var marObj = parent.mainframe.document.getElementById("myMarker").style;

	//submarkerDisp();

	//マーカーの位置を指定する
	marObj.left = -12 + inputX + "px";
	marObj.top  = -12 + inputY + "px";

	//マーカーの位置を記録する。（全画面表示をする時に使うため）
	recordX = inputX;
	recordY = inputY;

	if(force == "y"){
		marButton.value = "Marker-on";
		marButton.style.backgroundColor = "gray";
		marObj.visibility="visible";		
	}else{
		if(marButton.value == "Marker-on"){
			marObj.visibility="visible";	
		}else{
			marObj.visibility="hidden";
		}
	}					
}

//以下、赤道座標入力->地図平面にマーカー表示、星の検索（カタログ表示）

function sarchPoint(sekgin)
{
	inputPoint(sekgin);

	if(pointSta == 1){
		if(sekgin == 0){
			polar2cart("e");
			equ2gal(); 
			cart2polar("e");
		}else{
			polar2cart("g");
			gal2equ();
			cart2polar("g");
		}

		FluxOp();
		searchstar(CataData,Limt);
		searchCandidate(conbineFourArrays(candidateData, candidateData2, candidateData3, candidateData4), Limt);
		resultWrite();
		polar2mollwide();
		//polar2hammerXY();
		getImgStatus();
		setMarkscal();
		markerDisp(IX,IY,"y");
	
	}else if(pointSta = -1){
		alert("InputError\nα,l : 0.0 ~ 359.9 nδ,b : -90.0 ~ 90.0");
	}else{
		alert("InputError");
	}
}

function inputPoint(sekgin)
{
	if(sekgin == 0){	
		inPhi = parent.leftframe.document.getElementById("resultAlpha").value; 
		inTheta = parent.leftframe.document.getElementById("resultDelta").value;		
		ePhi = parseFloat(inPhi);
		eTheta = parseFloat(inTheta);
		alpha = parseFloat(inPhi);
		delta = parseFloat(inTheta);
	}else{
		inPhi = parent.leftframe.document.getElementById("resultgk").value; 
		inTheta = parent.leftframe.document.getElementById("resultgi").value;
		gPhi = parseFloat(inPhi);
		gTheta = parseFloat(inTheta);
		l = parseFloat(inPhi);
		b = parseFloat(inTheta);
	}
	if(inPhi >= 0 && inPhi <360 && inTheta >= -90 && inTheta <= 90){
		pointSta = 1;
	}else{
		pointSta = -1;
	}
}

function gal2equ(){ // 銀河座標から赤道座標へのオイラー角による変換
    ex = ((-0.054876) * gx) + ((0.494109)  * gy) + ((-0.867666) * gz);
    ey = ((-0.873437) * gx) + ((-0.444830) * gy) + ((-0.198077) * gz);
    ez = ((-0.483835) * gx) + ((0.746982)  * gy) + ((0.455984)  * gz);
}

function polar2mollwide() { //ニュートン法によりθを近似的に求める
	var theta0; //モルワイデ図法でのパラメータθの初期値
	var dfDtheta; // dx/dθ
	var i;
	var imax = 100; //100回繰り返す
	var fTheta; //f(θ)=2θ+sin2θ-πsinφ
	
	mollwideLambda = Math.PI - alpha * Math.PI / 180; //経度[rad] 中心を原点、範囲を-π ~ πに
	mollwidePhi = delta * Math.PI / 180; //緯度[rad]

	theta0 = mollwidePhi; //モルワイデ図法でのパラメータθの初期値をφとする

	for(i = 1; i <= imax; i++) {
		fTheta = 2 * theta0 + Math.sin(2 * theta0) - Math.PI * Math.sin(mollwidePhi);
		//console.log('mollwidePhi' + mollwidePhi);
		//console.log(theta0);
		dfDtheta = 2 + 2 * Math.cos(2 * theta0);
		if(dfDtheta != 0){
			theta0 -= fTheta / dfDtheta;
		}
	//console.log('theta0' + theta0);

		if(Math.abs(fTheta) < 0.0001){
			figureTheta = theta0;
			break;
		}
	}
	console.log('i'+i);
	//console.log('fTheta=' + fTheta);

	if(i > imax){
		window.alert('収束しませんでした')
	}

	NX = (1/Math.PI) * mollwideLambda * Math.cos(figureTheta); //-1 <= NX <= 1
	NY = (1/2) * Math.sin(figureTheta); //-0.5 <= NY <= 0.5
	//console.log(Math.abs(fTheta));
	//console.log('dfDtheta'+dfDtheta);
	//console.log(figureTheta);
	//console.log('NX = '+NX);
	//console.log('NY = '+NY);
}

function setMarkscal()
{
	//imgWidth = parent.mainframe.document.getElementById("image1").width; // 画像の幅
	//imgHeight = parent.mainframe.document.getElementById("image1").height; // 画像の高さ

	figureWidth = orgWidth - (leftMargin + rightMargin); //画像の余白を引く
	figureHeight = orgHeight - (topMargin + bottomMargin); //画像の余白を引く

	IX = (NX + 1) / 2 * figureWidth;
	IY = (-NY + 0.5) * figureHeight;

	IX += (margin + leftMargin);
	IY += (margin + topMargin);

	IX *= (imgWidth / orgWidth);
	IY *= (imgHeight / orgHeight);
}

//以下、カタログ表示

function loadCatalog(path)
{
	loadCSV(path);
	//parent.rightdownframe.document.getElementById("2Sname").innerHTML = path;
}

function loadCSV(path) {
	var httpObj = createXMLHttpRequest(handleResult);
	if (httpObj) {
		httpObj.open("GET", path, true);
		httpObj.send(null);
	}
}

function handleResult() {
	console.dir(this);
	if ((this.readyState == 4) && (this.status == 200)) {
		var text = getAjaxFilter()(this.responseText);
		CataData = parseCSV(text);
		parent.leftframe.document.getElementById("catalogSt").innerHTML = "Catalog : OK"+"("+CataData.length+")";
		
	} else if ((dirAjax.readyState == 4) && (dirAjax.status != 200)) {
	
		parent.leftframe.document.getElementById("catalogSt").innerHTML = "Catalog : NG";
	
	}
}

function parseCSV(str) {
	var CR = String.fromCharCode(13);
	var LF = String.fromCharCode(10);
	//ここはCSVの改行コードによってCR,LFを使い分ける必要がある。
	var lines = str.split(LF);
	var csvData = new Array();
	var sortcsvData = new Array();

	for (var i = 0; i < lines.length; i++) {
		var rep1 = lines[i].replace(/,\"/g,'"');
		var rep2 = rep1.replace(/\",/g,'"');    
		var cells = rep2.split('"');
	
		var Data1 = cells.pop();
		var Data2 = Data1.split(",");
		Data2.unshift(cells.pop());
		Data2.unshift(cells);
	
		/*if( Data.length != 1 )*/ csvData[i] = Data2;
	}
	for( i = 0; i < csvData.length; i++){ //銀経・銀緯を文字列から数値に変換
		for( j = 0; j < 2; j++){
			csvData[i][j+2] = parseFloat(csvData[i][j+2]);
			csvData[i][j+5] = parseFloat(csvData[i][j+5]);
		}
	}
	return csvData;
}

function searchstar(csvData,flux)
{ //20191206コメント、masivからほとんどそのまま持ってきた関数。計算を完璧には理解していないがおそらくangleが球面にある２点の中心角の差。
    //参考：https://qiita.com/port-development/items/eea3a0a225be47db0fd4　参考：www.sci.kumamoto-u.ac.jp/~hisinoue/pdfdoc/SSH.pdf
	var bnStar = new Array();
	var blnStar = new Array();
	var Delta = (delta + 90) * Math.PI / 180;
	var Alpha = alpha * Math.PI / 180;
			
	for(var i = 0; i < csvData.length; i++){
		if(Math.abs(csvData[i][3] - delta) < 2){
			bnStar.push(csvData[i]);
		}
	}
	for(i = 0; i < bnStar.length; i++){
		
		var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
		var AlphaP = bnStar[i][2] * Math.PI / 180;
		var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
		var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
		var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
		var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;
		
		if(bnStar[i].length == 8){
			var dust = bnStar[i].pop();
		}

		if(angle < 1){ //20191206書き換え angle<2をangle<1に変更
			angle = Math.round(angle * 100);
			angle = angle / 100;
			bnStar[i].push(angle);	
			bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
			bnStar[i][2] = bnStar[i][2] / 1000;
			bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
			bnStar[i][3] = bnStar[i][3] / 1000;
			if(flux == 0){
					blnStar.push(bnStar[i]);
			}
			else if(flux == -1){
				if(bnStar[i][6]>-1||bnStar[i][6]<-1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 1){
				if(bnStar[i][6]>=1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 10){
				if(bnStar[i][6]>=10){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 100){
				if(bnStar[i][6]>=100){
					blnStar.push(bnStar[i]);
				}
			}
			else{
				blnStar.push(bnStar[i]);
			}
		}
	}
	//parent.leftframe.document.getElementById("check").innerHTML = Limt;
	xsort(blnStar,7,1);
	//chArray(blnStar);
	nStar = blnStar;
		
}



function xsort(sqs,col,order){
    //二次元配列のソート
    //col:並べ替えの対象となる列
    //order:1=昇順、-1=降順
    sqs.sort(function(a,b){
        return((a[col]-b[col])*order);
    });
    return(sqs);
}

function createXMLHttpRequest(cbFunc) {
	var XMLhttpObject = null;
	try {
		XMLhttpObject = new XMLHttpRequest();
	} catch(e) {
		try {
			XMLhttpObject = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				XMLhttpObject = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				return null;
			}
		}
	}
	if (XMLhttpObject) XMLhttpObject.onreadystatechange = cbFunc;
	return XMLhttpObject;
}

function getAjaxFilter() {
	if (navigator.appVersion.indexOf("KHTML") > -1) {
		return function(t) {
			var esc = escape(t);
			return (esc.indexOf("%u") < 0 && esc.indexOf("%") > -1) ? decodeURIComponent(esc) : t
		}
	} else {
		return function(t) {
			return t
		}
	}
}

function FluxOp()
{
	Limt = parent.leftframe.document.getElementById("SelectFlux").value;
	//parent.leftframe.document.getElementById("check").innerHTML = Limt;
}


function resultWrite(){

    if((pointSta == 1) && (marginSta == 1)){ // XY座標が天球の内側にある場合

		delta = Math.round(delta * 10) / 10;
		alpha = Math.round(alpha * 10) / 10;
		b = Math.round(b * 10) / 10;
		l = Math.round(l * 10) / 10;

		/* 結果で左フレームの情報を書き換える */
		parent.leftframe.document.getElementById("resultDelta").value = delta;
		parent.leftframe.document.getElementById("resultAlpha").value = alpha;
		parent.leftframe.document.getElementById("resultgk").value = l;
		parent.leftframe.document.getElementById("resultgi").value = b;

		/*直近天体の表示 maxiriken.jp or 134.160.243.77 */
		var nresult = "<font>Nearby Stars</font><br><br>";
		for(i = 0; i < nStar.length; i++){
			nresult += '<a href="http://maxi.riken.jp/pubdata/v6l/'+nStar[i][0]+'/" target="_blank">P</a>,';
			nresult += '<a href="http://maxi.riken.jp/pubdata/v6l.rkn/'+nStar[i][0]+'/" target="_blank">R</a> ';
			nresult += '<font onClick="parent.mainframe.cataPointSarch('+i+')">'+nStar[i][1]+'<br>(' + nStar[i][2] +' , '+nStar[i][3] + ')</font><br>';
			nresult += 'distance : '+nStar[i][7]+'<br>';
			nresult += 'flux : '+nStar[i][6]+'<br><br>';
		}

		if(nCandidate != undefined){
			console.log("nCandidate is defined");
			console.log(nCandidate);
			nresult += '<font>Candidate Objects</font><br><br>'
			for(i = 0; i < nCandidate.length; i++){
				nresult += '<a href=' + nCandidate[i][4] + ' target="_blank">PR</a>,';
				nresult += '<font onClick="parent.mainframe.cataPointSarch('+i+')">'+nCandidate[i][1]+'<br>(' + nCandidate[i][2] +' , '+nCandidate[i][3] + ')</font><br>';
				nresult += 'distance : '+nCandidate[i][37]+'<br>';
				nresult += 'flux : '+nCandidate[i][6]+'<br><br>';
			}
		}

		parent.leftframe.document.getElementById("nresult").innerHTML = nresult;
		NS = "n";
		/*
		parent.leftframe.document.getElementById("result1").innerHTML = "gPhi(経) = " + gPhi + "°";
		parent.leftframe.document.getElementById("result2").innerHTML = "gTheta(緯) = " + gTheta + "°";
		parent.leftframe.document.getElementById("result3").innerHTML = "ePhi(経) = " + ePhi + "°";
		parent.leftframe.document.getElementById("result4").innerHTML = "eTheta(緯) = " + eTheta + "°";
		*/
	} else { // XY座標が天球の外側にある場合
		parent.leftframe.document.getElementById("resultgk").value = "×";
		parent.leftframe.document.getElementById("resultgi").value = "×";
		parent.leftframe.document.getElementById("resultDelta").value = "×";
		parent.leftframe.document.getElementById("resultAlpha").value = "×";
	}
	//parent.leftframe.document.getElementById("check1").innerHTML = EG;
	//parent.leftframe.document.getElementById("check2").innerHTML = orgHeight;
}

//2019/12/05追加
function cataPointSarch(i)
{
	if(NS=="n"){		
		ePhi = parseFloat(nStar[i][2]);
		eTheta = parseFloat(nStar[i][3]);
		alpha = parseFloat(nStar[i][2]);
		alpha2 = alpha;
		delta = parseFloat(nStar[i][3]);
		delta2 = delta;
	}else if(NS=="s"){
		ePhi = parseFloat(sStar[i][2]);
		eTheta = parseFloat(sStar[i][3]);
		alpha = parseFloat(sStar[i][2]);
		alpha2 = alpha;
		delta = parseFloat(sStar[i][3]);
		delta2 = delta;
	}
		getImgStatus();
		polar2cart("e");
		equ2gal(); 
		cart2polar("e");
		FluxOp();
		searchstar(CataData,Limt);
		resultWrite();
		polar2mollwide();
		//console.log('alpha='+alpha+', delta='+delta);
		//console.log(NX);
		setMarkscal();
		//console.log(IX);
		markerDisp(IX,IY,"y");
		
}

/*function reDispMarker()
{
	getImgStatus();
	setMarkscal();
	markerDisp(IX,IY,"n");
}*/
//2019/12/05ここまで+parent.mainframe.cataPointSarch


//以下、マウスを動かした時（座標とカタログ表示,両方の簡易版を画面に表示したい）

// MARK:getMouseMoveXY
function getMouseMoveXY(evt) //マウスポインタの地点の座標を取得する
{
	mouseMove = 1; //マウスを動かした時に呼び出されていることを記憶する
	var curButton = parent.leftframe.document.getElementById("cursor");
	var curObj = parent.mainframe.document.getElementById("myCursor").style;
	var resultCur;
	var starNames;
	var starName;

	// 現在の画像のサイズを取得 
	getImgStatus();
	figureXY(evt);

	//XY座標を赤道座標に変換 

	//座標変換 
	mollwide2polar(); // ハンメルアイトフ座標を極座標に変換			
	//polar2cart("e");
	//equ2gal();
	//cart2polar("e");

	FluxOp();
	searchstar2(CataData,Limt);
	// searchCandidate2(conbineFourArrays(candidateData, candidateData2, candidateData3, candidateData4), Limt);
	searchCandidate2_tri(conbineArray(candidateData, candidateData3), Limt);
	searchCandidate2_mail(conbineArray(candidateData2, candidateData4), Limt);
	nCandidate2 = conbineArray(nCandidate2_mail, nCandidate2_tri);

	delta2 = Math.round(delta2 * 10) / 10;
	alpha2 = Math.round(alpha2 * 10) / 10;
	//b = Math.round(b * 10) / 10;
	//l = Math.round(l * 10) / 10;
	resultCur ="(" + alpha2 +" , "+ delta2 + ")<br>";

	//検索した星をカーソルに表示したい(星の名前が複数ある場合は一つ目のみを表示する。邪魔なので)
	for(i = 0; i < nStar2.length; i++){
		starNames = nStar2[i][1];
		starName = starNames; //星の名前が１つのみ書かれている時
		if(starNames.indexOf(',') != -1){ //星の名前が複数ある時
		starName = starNames.substring(0, starNames.indexOf(','));
		}
		//resultCur += nStar2[i][1]+'&nbsp;&nbsp;&nbsp;';
		resultCur += starName + '&nbsp;&nbsp;&nbsp;';
		resultCur += 'distance : '+nStar2[i][7] + '<br>';
	}

	// if(nCandidate2 != undefined){
	// 	for(i = 0; i < nCandidate2.length; i++){
	// 		resultCur += nCandidate2[i][1] + '&nbsp;&nbsp;&nbsp;' + 'distance : '+nCandidate2[i][37] + '<br>';
	// 	}
	// }
	if(nCandidate2 != undefined){
		for(i = 0; i < nCandidate2.length; i++){
			if(nCandidate2[i][1].includes("+/-")){ //mailなら
				resultCur += nCandidate2[i][1] + '&nbsp;&nbsp;&nbsp;' + 'distance : '+nCandidate2[i][7] + '<br>';
			} else { //triggerなら
				// resultCur += nCandidate2[i][1] + '&nbsp;&nbsp;&nbsp;' + 'distance : '+nCandidate2[i][37] + '<br>';
				resultCur += '<span style="font-size: small">' + nCandidate2[i][1] + '&nbsp;&nbsp;&nbsp;' + 'distance : '+nCandidate2[i][37] + '<br>';
			}
		}
	}
	//console.log(resultCur);

	// let popupElement = document.getElementById("popupLC");
	curObj.left = 9 + evt.pageX + "px";
	//curObj.top  = 17 + evt.pageY + "px";
	curObj.top  = evt.pageY + "px";
	// curObj.top = (popupElement && popupElement.style.visibility === "visible") ? 
    // (evt.pageY + popupElement.clientHeight) + "px" : 
    // evt.pageY + "px";

	if((pointSta == 1) && (marginSta == 1)){
	document.getElementById("cursorPoint").innerHTML = resultCur;
	curObj.visibility="visible";
	}else{
		curObj.visibility = "hidden";
	}
}

function searchstar2(csvData,flux)
{
	//関数searchstarと中身は同じ、変数名が違う。星の名前を入れる配列をクリック、マウスを動かす時、で違うものを使わないと
	//カーソルにのせるカタログ表示とleftframeにのせるカタログ表示を独立させて動かすことができないため、
	//マウスを動かす時に使う関数、変数、配列の名前に２をつけて区別している
	//もっといい書き方があると思うので余裕があれば書き換えてください
	var bnStar = new Array();
	var blnStar = new Array();
	var Delta = (delta2 + 90) * Math.PI / 180;
	var Alpha = alpha2 * Math.PI / 180;
			
	for(var i = 0; i < csvData.length; i++){
		if(Math.abs(csvData[i][3] - delta2) < 2){
			bnStar.push(csvData[i]);
		}
	}
	for(i = 0; i < bnStar.length; i++){
		
		var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
		var AlphaP = bnStar[i][2] * Math.PI / 180;
		var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
		var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
		var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
		var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;
		
		if(bnStar[i].length == 8){
			var dust = bnStar[i].pop();
		}

		if(angle < 1){ //20191206書き換え　angle<2をangle<1に変更
			angle = Math.round(angle * 100);
			angle = angle / 100;
			bnStar[i].push(angle);	
			bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
			bnStar[i][2] = bnStar[i][2] / 1000;
			bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
			bnStar[i][3] = bnStar[i][3] / 1000;
			if(flux == 0){
					blnStar.push(bnStar[i]);
			}
			else if(flux == -1){
				if(bnStar[i][6]>-1||bnStar[i][6]<-1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 1){
				if(bnStar[i][6]>=1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 10){
				if(bnStar[i][6]>=10){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 100){
				if(bnStar[i][6]>=100){
					blnStar.push(bnStar[i]);
				}
			}
			else{
				blnStar.push(bnStar[i]);
			}
		}
	}
	//parent.leftframe.document.getElementById("check").innerHTML = Limt;
	xsort(blnStar,7,1);
	//chArray(blnStar);
	nStar2 = blnStar;
		
}


function deleteDisplay() { //マウスを動かした時、カーソル機能の表示を消す
	var curObj = parent.mainframe.document.getElementById("myCursor").style;
	curObj.visibility="hidden";
}

function onmousedownFunctions(evt) { //クリックした時に呼び出す関数たち
	getMouseXY(evt);
	getMouseMoveXY(evt);
}

function jnSearch(inputName,jn)
{
	var result = new Array();
	var jnames,names;		
	var name = inputName.toString().toLowerCase();// = inputName.split(" ");
	var catArr = new Array();
	catArr = CataData;
		
	//aa = (catArr[1][0].toString().indexOf(name,0) + 1);
	if(jn == "j"){
		for(i = 0; i < catArr.length; i++){
			//aa = 1;
			for(j = 0; j < 1; j++){
				names = catArr[i].toString().toLowerCase();
				jnames = names.indexOf(name,0);
			}
			if(jnames != -1){
				result.push(catArr[i]);
			}
		}
	}
	sStar = result;
	var resultWr = "<font>Search Result</font><br><br>";
	if(result.length!=0){
		for(i = 0; i < result.length; i++){
			resultWr += '<a href="http://maxi.riken.jp/pubdata/v6l/'+sStar[i][0]+'/" target="_blank">P</a>,';
			resultWr += '<a href="http://maxi.riken.jp/pubdata/v6l.rkn/'+sStar[i][0]+'/" target="_blank">R</a> ';
			resultWr += '<font onClick="parent.mainframe.cataPointSarch('+i+')">'+sStar[i][0]+'<br>' + sStar[i][1] +'<br>';
			resultWr += 'flux : '+sStar[i][6]+'</font><br><br>';
		}
		NS = "s";
		pointSta = 1;
	}else{
		resultWr +="Not Found";
	}
	//console.log('ns='+NS);
	parent.leftframe.document.getElementById("nresult").innerHTML = resultWr;// +aa+"<br>"+ CataData[1][0];
}

function fullScreen() {
	FF(); //画面サイズの切り替え
	parent.leftframe.fit(); //画面のサイズが変わってもうまくリサイズされないことがあるので呼び出している。
}

function FF() { //full frameの略。全画面表示機能。決して、Final Fantasyのことではない。
	var widthFrames;
	var heightFrames;
	var framesetCols;
	var framesetRows;
	var exposureChange = parent.leftframe.document.getElementById("b_exposure");

	widthFrames = parent.document.getElementById('widthFrames');
	heightFrames = parent.document.getElementById('heightFrames');
	console.log(widthFrames);
	console.log(heightFrames);

	if(fSFunction == 0){
		framesetCols = '0, *,0';
		framesetRows = '0, *';
		fSFunction = 1;
		widthFrames.cols = framesetCols;
		heightFrames.rows = framesetRows;
	}else{
		if(exposureChange.value == "Exposure-on"){
			framesetCols = '122, 1*, 1*';
			framesetRows = '60, *';
			fSFunction = 0;
			widthFrames.cols = framesetCols;
			heightFrames.rows = framesetRows;
		}else{
		framesetCols = '122, *, 0';
		framesetRows = '60, *';
		fSFunction = 0;
		widthFrames.cols = framesetCols;
		heightFrames.rows = framesetRows;
		}
	}
	//console.log(framesetRows+'framesetRows');
	//console.log(framesetCols+'framesetCols');
}

function preImgStatus() {
	preImgWidth = imgWidth;
	preImgHeight = imgHeight;
}

function rewriteMarker(inputX,inputY) {
	var marButton = parent.leftframe.document.getElementById("marker");
	var marObj = parent.mainframe.document.getElementById("myMarker").style;
	var curButton = parent.leftframe.document.getElementById("cursor");
	var curObj = parent.mainframe.document.getElementById("myCursor").style;

	if(marButton.value == "Marker-on"){
		marObj.left = -12 + inputX * imgWidth/preImgWidth + "px";
		marObj.top  = -12 + inputY * imgHeight/preImgHeight + "px";
	}

	if(curButton.value == "Cursor-on"){
		curObj.left = 9 + inputX * imgWidth/preImgWidth + "px";
		curObj.top  = inputY * imgHeight/preImgHeight + "px";
	}

	recordX *= imgWidth/preImgWidth;
	recordY *= imgHeight/preImgHeight;
}

function clickFunction(evt) {
	var cursorMode = parent.leftframe.document.getElementById('cursor');

	if(cursorMode.value == 'Cursor-on'){
		getMouseXY(evt);
	}else{
		getMouseXY(evt);
		if(showPopStates == 1){
		    getMouseMoveXY(evt);
		}
	}
	printLightCurve(evt);
}

function mousemoveFunction(evt){
	var cursorMode = parent.leftframe.document.getElementById('cursor');

	if(cursorMode.value == 'Cursor-on'){
		getMouseMoveXY(evt);
	}else{
		deleteDisplay();
	}
}


//20191208追加
function beforeChange() {
	//関数afterChange()とセットで使うことを想定している。mainframeの全天画像の大きさが変わった時にマーカーの位置を適切な位置にずらすことが目的。
	//beforeChange()で大きさが変わる前の画像の大きさを覚えておき、afterChange()でマーカーの位置をずらす。
	getImgStatus();
	preImgStatus(); //変更前の画面の大きさを記録する
}

function afterChange() {
	getImgStatus();
	rewriteMarker(recordX, recordY);
}

//20191213
function changeValue(value) { 
	console.log("changevalue="+value);
 
	document.getElementById("skymap").style.opacity = value;
	 
 }


//以下、各イベントとの紐付け（イベントリスナー）


//window.onload = loadCatalog("/catalog/maxi_all_cat.csv"); //ページが読み込まれたらloadCatalogを呼び出す


//クリックとダブルクリックを排他的に扱いたい場合は、以下のイベントリスナーを使うこと。普通、ダブルクリックをすると
//click => click => dblclickとイベントが発生してしまうため、ダブルクリックをするとクリックした時の関数まで余計に呼び出してしまう。
//なのでダブルクリックを使わずにクリックだけでダブルクリックを擬似的に表現する
window.onmousedown = function(evt){
    clickCount++;
    if(clickCount >= 2){
		clickCount = 0;
		//evt.preventDefault();
		//ダブルクリックした時に呼び出す関数
		fullScreen();
		
        //clickCount = 0; //ダブルクリックしたのでカウントを初期化
    }
    setTimeout(function() {
        if(clickCount == 1){
			clickCount = 0;
			//クリックした時に呼び出す関数
			//onmousedownFunctions(evt);
			//getMouseXY(evt);
			clickFunction(evt);
			
            //clickCount = 0; //クリックしたのでカウントを初期化
        }
    }, 250); //setTimeoutでクリックかダブルクリックかを判定する時間を設けている。setTimeoutの秒数を変えると判定にかける時間を変えることができる。
}
//クリック、ダブルクリックに使うイベントリスナーはここまで

window.onmousemove = function(evt){
	mousemoveFunction(evt);
}


//window.onload = loadCatalog("/catalog/maxi_all_cat.csv"); //ページが読み込まれたらloadCatalogを呼び出す
//gwiv_0.9 ここから下のプログラム+getMouseMoveXYに
//searchCandidate2(candidateData, Limt);
//を追加して、さらに
//window.onload = loadCatalog("/catalog/maxi_all_cat.csv"); //ページが読み込まれたらloadCatalogを呼び出す
//上のプログラムを全てコメントアウト
//var alpha2,delta2;などグローバル変数を宣言
window.addEventListener('load', function(){
	loadCatalog("/catalog/maxi_all_cat.csv"); //ページが読み込まれたらloadCatalogを呼び出す
	//candidateType = 'trigger1';
	//loadCandidateCSV('candidateList.csv');
	//candidateType = 'abc222';
	//loadCandidateCSV('candidateList2.csv');
}, false);

function changeCList(cType, cFile){
	candidateType = cType;
	console.log('changeCList');

	//テスト用(cTypeがtriggerの場合、ファイル名に"２"を追加する)
	if (cType.includes('trigger')) {
		cFile = cFile.replace(/\.csv$/, '2.csv');
		console.log('cType=' + cType + ' cFile2=' + cFile);
		loadCandidateCSV(cFile);
	}

	console.log('cType='+ cType + ' cFile=' + cFile);
	loadCandidateCSV(cFile);
}

function loadCandidateCSV(path) { //突発天体の候補ファイルをpathに指定します
	var httpObj = createXMLHttpRequest(handleCandidate);
	console.log('loadCandidateCSV');
	if (httpObj) {
		httpObj.open("GET", path, true);
		httpObj.send(null);
	}
}

//MARK:handleCandidate
function handleCandidate(){
	console.log('--- handleCandidate');
	console.log('--- candidateType='+candidateType);
	console.log('ready = ' + this.readyState + 'status =' + this.status);
	// console.dir(this);
	if ((this.readyState == 4) && (this.status == 200)) {
		var text = getAjaxFilter()(this.responseText);
		// console.log('text :' + text);
		console.log('handleCandidate');
		console.log('candidateType='+candidateType);
		if(candidateType == 'trigger1'){
			// console.log('seikou');
			candidateData = parseCandidateCSV(text);
			console.log("candidateData= " + candidateData);
		}else if(candidateType == 'mail1'){
			// console.log('handleCandidate/if/mail1');
			candidateData2 = parseCandidateCSV(text);
			console.log("candidateData2= " + candidateData2);
		}else if(candidateType == 'trigger2'){
			candidateData3 = parseCandidateCSV(text);
			console.log("candidateData3= " + candidateData3);
		}else{ // for mail2
			candidateData4 = parseCandidateCSV(text);
			console.log("candidateData4= " + candidateData4);
		}
	}
}

function parseCandidateCSV(str) { //γ線バースト？の候補の座標などが書かれたファイルを配列に収める関数
	// console.log(str);
	var lines = str.split(/\n|\r\n|\r/);
	// console.log(lines);
	var csvData = new Array();

	for (var i = 0; i < lines.length - 1; i++) {
		//console.log('parseCandidateCSV');
		var array1 = lines[i].split(/,\"/);
		var Data1 = Array();
		Data1.push(array1.shift());
		var text1 = array1.shift();
		//console.log(Data1);
		//console.log(text1);
		var array2 = text1.split(/\",/);
		//console.log(array2);
		Data1.push(array2.shift());
		//console.log(Data1);
		var text2 = array2.shift();
		//console.log(text2);
		var cells = text2.split(/,/);
		//console.log(cells);
	
		csvData[i] = Data1.concat(cells);
	}
	console.log('start');
	// console.log(csvData);
	for( i = 0; i < csvData.length; i++){ //銀経・銀緯を文字列から数値に変換
		for( j = 0; j < 2; j++){
			csvData[i][j+2] = parseFloat(csvData[i][j+2]);
			csvData[i][j+5] = parseFloat(csvData[i][j+5]);
		}
	}
	// console.log("csvData :" + csvData);
	return csvData;
}

//MARK:searchCandidate
function searchCandidate(csvData,flux)
{ //20191206コメント、masivからほとんどそのまま持ってきた関数。計算を完璧には理解していないがおそらくangleが球面にある２点の中心角の差。
    //参考：https://qiita.com/port-development/items/eea3a0a225be47db0fd4　参考：www.sci.kumamoto-u.ac.jp/~hisinoue/pdfdoc/SSH.pdf
	var bnStar = new Array();
	var blnStar = new Array();
	var Delta = (delta + 90) * Math.PI / 180;
	var Alpha = alpha * Math.PI / 180;
	//console.log(nCandidate);
	for(var i = 0; i < csvData.length; i++){
		if(Math.abs(csvData[i][3] - delta) < 2){
			bnStar.push(csvData[i]);
		}
	}
	for(i = 0; i < bnStar.length; i++){
		
		var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
		var AlphaP = bnStar[i][2] * Math.PI / 180;
		var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
		var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
		var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
		var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;
		
		if(bnStar[i].length == 8){
			var dust = bnStar[i].pop();
		}

		if(angle < 1 ){ //20191206書き換え angle<2をangle<1に変更
			angle = Math.round(angle * 100);
			angle = angle / 100;
			bnStar[i].push(angle);	
			bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
			bnStar[i][2] = bnStar[i][2] / 1000;
			bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
			bnStar[i][3] = bnStar[i][3] / 1000;
			if(flux == 0){
					blnStar.push(bnStar[i]);
			}
			else if(flux == -1){
				if(bnStar[i][5]>-1||bnStar[i][5]<-1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 1){
				if(bnStar[i][5]>=1){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 10){
				if(bnStar[i][5]>=10){
					blnStar.push(bnStar[i]);
				}
			}
			else if(flux == 100){
				if(bnStar[i][5]>=100){
					blnStar.push(bnStar[i]);
				}
			}
			else{
				blnStar.push(bnStar[i]);
			}
		}
	}
	//parent.leftframe.document.getElementById("check").innerHTML = Limt;
	xsort(blnStar,7,1);
	//chArray(blnStar);
	nCandidate = blnStar;
	// console.log(nCandidate);
		
}

//MARK:searchCandidate2
// function searchCandidate2(csvData,flux)
// {
// 	//マウスポインタに近い位置にある突発天体の候補を探すために、仮に作った関数です。
// 	//関数searchstar系と中身はほぼ同じです。ただし、変数名やインデックス番号が少し違います。
// 	//引数やグローバル変数などを使い、場合分けすることで一つの関数にまとめられると思いますが、まだやっていません。
// 	//この関数が残っているということは、おそらくまだまとめられていないという事なので余裕があれば書き換えてください。
// 	var bnStar = new Array();
// 	var blnStar = new Array();
// 	var Delta = (delta2 + 90) * Math.PI / 180;
// 	var Alpha = alpha2 * Math.PI / 180;
			
// 	if(csvData != undefined){
// 	//console.log(csvData);
// 	for(var i = 0; i < csvData.length; i++){
// 		if(Math.abs(csvData[i][3] - delta2) < 2){
// 			bnStar.push(csvData[i]);
// 		}
// 	}
// 	for(i = 0; i < bnStar.length; i++){
		
// 		var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
// 		var AlphaP = bnStar[i][2] * Math.PI / 180;
// 		var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
// 		var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
// 		var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
// 		var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;

				
// 		// if(bnStar[i].length == 8){
// 		// 	var dust = bnStar[i].pop();
// 		// }

// 		// "+/-"を含む場合のフラグ 20250623追加
//         var hasPlusMinus = false;
//         if(bnStar[i][1] && bnStar[i][1].includes("+/-")) {
//             // console.log("Found +/- in: " + bnStar[i][1]);
// 			if(bnStar[i].length >= 8){
// 				var dust = bnStar[i].pop();
// 			}
//         } else {
// 			if(bnStar[i].length >= 38){
// 				var dust = bnStar[i].pop();
// 			}
// 		}

// 		if(angle < 1.5){ //20191206書き換え　angle<2をangle<1に変更, // 20/03/24 changed to 1.5 for FR events negoro
// 			angle = Math.round(angle * 100);
// 			angle = angle / 100;
// 			bnStar[i].push(angle);
// 			bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
// 			bnStar[i][2] = bnStar[i][2] / 1000;
// 			bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
// 			bnStar[i][3] = bnStar[i][3] / 1000;
// 			if(flux == 0){
// 					blnStar.push(bnStar[i]);
// 			}
// 			else if(flux == -1){
// 				if(bnStar[i][5]>-1||bnStar[i][5]<-1){
// 					blnStar.push(bnStar[i]);
// 				}
// 			}
// 			else if(flux == 1){
// 				if(bnStar[i][5]>=1){
// 					blnStar.push(bnStar[i]);
// 				}
// 			}
// 			else if(flux == 10){
// 				if(bnStar[i][5]>=10){
// 					blnStar.push(bnStar[i]);
// 				}
// 			}
// 			else if(flux == 100){
// 				if(bnStar[i][5]>=100){
// 					blnStar.push(bnStar[i]);
// 				}
// 			}
// 			else{
// 				blnStar.push(bnStar[i]);
// 			}
// 		}
// 	}
// 	//parent.leftframe.document.getElementById("check").innerHTML = Limt;
// 	// xsort(blnStar,7,1);
// 	xsort(blnStar,37,1);
// 	//chArray(blnStar);
// 	nCandidate2 = blnStar; //期待通りに動いていれば、マウスポインタに一番近い候補のURLがnCandidate2[0][4]に入るはずです
// }
// }

//MARK:searchCandidate2_tri
function searchCandidate2_tri(csvData,flux){
	//20250627 K.Takagi
	//マウスポインタが動いた時に、呼び出される関数(triggerイベント用)
	var bnStar = new Array();
	var blnStar = new Array();
	var Delta = (delta2 + 90) * Math.PI / 180;
	var Alpha = alpha2 * Math.PI / 180;
			
	if(csvData != undefined){
		//console.log(csvData);
		for(var i = 0; i < csvData.length; i++){
			if(Math.abs(csvData[i][3] - delta2) < 2){
				bnStar.push(csvData[i]);
			}
		}
		for(i = 0; i < bnStar.length; i++){

			var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
			var AlphaP = bnStar[i][2] * Math.PI / 180;
			var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
			var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
			var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
			var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;

			//配列の長さが38の場合、最後の要素を削除
			if(bnStar[i].length >= 38){
				var dust = bnStar[i].pop();
			}

			if(angle < 1.5){ //20191206書き換え　angle<2をangle<1に変更, // 20/03/24 changed to 1.5 for FR events negoro
				angle = Math.round(angle * 100);
				angle = angle / 100;
				bnStar[i].push(angle);
				bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
				bnStar[i][2] = bnStar[i][2] / 1000;
				bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
				bnStar[i][3] = bnStar[i][3] / 1000;
				if(flux == 0){
						blnStar.push(bnStar[i]);
				}
				else if(flux == -1){
					if(bnStar[i][5]>-1||bnStar[i][5]<-1){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 1){
					if(bnStar[i][5]>=1){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 10){
					if(bnStar[i][5]>=10){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 100){
					if(bnStar[i][5]>=100){
						blnStar.push(bnStar[i]);
					}
				}
				else{
					blnStar.push(bnStar[i]);
				}
			}
		}
		xsort(blnStar,37,1);
		nCandidate2_tri = blnStar;
	}
}

//MARK:searchCandidate2_mail
function searchCandidate2_mail(csvData,flux){
	//20250627 K.Takagi
	//マウスポインタが動いた時に、呼び出される関数(mailイベント用)
	var bnStar = new Array();
	var blnStar = new Array();
	var Delta = (delta2 + 90) * Math.PI / 180;
	var Alpha = alpha2 * Math.PI / 180;
			
	if(csvData != undefined){
		//console.log(csvData);
		for(var i = 0; i < csvData.length; i++){
			if(Math.abs(csvData[i][3] - delta2) < 2){
				bnStar.push(csvData[i]);
			}
		}
		for(i = 0; i < bnStar.length; i++){

			var DeltaP = (bnStar[i][3] + 90) * Math.PI / 180;
			var AlphaP = bnStar[i][2] * Math.PI / 180;
			var tarm1 = Math.sin(Delta)*Math.cos(Alpha)*Math.sin(DeltaP)*Math.cos(AlphaP);
			var tarm2 = Math.sin(Delta)*Math.sin(Alpha)*Math.sin(DeltaP)*Math.sin(AlphaP);
			var tarm3 = Math.cos(Delta)*Math.cos(DeltaP);
			var angle = Math.acos(tarm1+tarm2+tarm3)*180/Math.PI;

			//配列の長さが8の場合、最後の要素を削除
			if(bnStar[i].length == 8){
				var dust = bnStar[i].pop();
			}

			if(angle < 1.5){ //20191206書き換え　angle<2をangle<1に変更, // 20/03/24 changed to 1.5 for FR events negoro
				angle = Math.round(angle * 100);
				angle = angle / 100;
				bnStar[i].push(angle);
				bnStar[i][2] = Math.round(bnStar[i][2] * 1000);
				bnStar[i][2] = bnStar[i][2] / 1000;
				bnStar[i][3] = Math.round(bnStar[i][3] * 1000);
				bnStar[i][3] = bnStar[i][3] / 1000;
				if(flux == 0){
						blnStar.push(bnStar[i]);
				}
				else if(flux == -1){
					if(bnStar[i][5]>-1||bnStar[i][5]<-1){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 1){
					if(bnStar[i][5]>=1){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 10){
					if(bnStar[i][5]>=10){
						blnStar.push(bnStar[i]);
					}
				}
				else if(flux == 100){
					if(bnStar[i][5]>=100){
						blnStar.push(bnStar[i]);
					}
				}
				else{
					blnStar.push(bnStar[i]);
				}
			}
		}
		xsort(blnStar,7,1);
		nCandidate2_mail = blnStar;
	}	
}

//MARK:conbineArray
function conbineArray(array1, array2){ //2つの配列を結合する
	if(array1 != undefined || array2 != undefined){
	var array3 = [];

	if(array1 != undefined){
		array3 = array1.slice(); //配列を複製（値渡し）
	}
	//console.log(array3);
	//console.log(array2);
	if(array2 != undefined){
		if(array2.length >= 1){
			for(var i = 0; i < array2.length; i++){
				array3.push(array2[i]);
			}
		}
	}

	//console.log(array3);
	return array3;
}
}

//MARK:conbineFourArrays
function conbineFourArrays(array1, array2, array3, array4){ //4つの配列を結合する
	var conArray1 = conbineArray(array1, array2);
	var conArray2 = conbineArray(conArray1, array3);
	var conArray3 = conbineArray(conArray2, array4);
	//console.log(conArray3);

	return conArray3;
}

/* ------------ light curve ------------- */
// light curve は click と 数秒待機 によって表示される
// click で呼び出されるのは printLightCurve
// 数秒待機 によって呼び出されるのは popupConfig 内 lightCurvePopup
// class LightCurve でまとめた方がいいかも

// light curveを表示する関数, clickFunction()で呼び出される
// mousePositionObject は class MouseEvent のobject
async function printLightCurve(mousePositionObject) {
	// mouseの座標から画像の極座標を取得
	mousePosition2polar(mousePositionObject);

	// mouseの座標が地図の内側ではない時return
	if (!(pointSta == 1 && marginSta == 1)) { return }

	// candidateの近くではない時return
	if (!nearCandidate(mousePositionObject)) { return }

	// 極座標を元にlight curveのpathを作成
	var x = alpha2, y = delta2;
	var promiseObject = polar2lightCurvePath(x, y, nCandidate2[0][1], nCandidate2[0][0]);
	var lcPath = "";

	// light curveの大きさを決めるため, 全天画像のサイズを取得, svgの大きさと位置に反映
	getImgStatus();
	styleSvg = document.getElementById("svg-LightCurve").style;
	styleSvg.top = imgHeight + 10;
	styleSvg.width = imgWidth;

	// pathタグのdに反映
	lcPath = await promiseObject;
	//document.getElementById("path-LightCurve").setAttribute("d", lcPath);
}

function popupConfig() {
	console.log("popupConfig is called");
	delayTimeString = parent.leftframe.document.getElementById("popupDelay-range").value;
	console.log("delayTimeString:", delayTimeString);
	delayTime = parseInt(delayTimeString, 10);
	console.log("delayTime:", delayTime);

	// micro secに直すため1000倍する, 0の時は100を返す, NaNの時は3000を返す
	delayTime = delayTime * 1000 || delayTime !== 0 && 3000 || 100;
	console.log("adjusted delayTime:", delayTime);
	timer = 0;

	// mouse event は一番上（zindexが最大）の画像にしか発生しない, 常に一番上の画像を選択する必要がある
	//highestTierImgId = "errorImage"
	highestTierImgId = "triggerMap"; //triggerMapが一番手前の画像
	skymapObject = document.getElementById(highestTierImgId);
	console.log("skymapObject:", skymapObject);

	// 上書きしたいのでaddEventListenerは使用しない
	skymapObject.onmouseout = () => {
		console.log("mouse is out of skymap");
		clearTimeout(timer);
		resetPopup();
	};
	skymapObject.onmousemove = (e) => {
		console.log("mouse is moving on skymap");
		//console.log(delayTime);
		clearTimeout(timer);
		resetPopup();
		timer = setTimeout(lightCurvePopup, delayTime, e);
	};
}
// mainframe.js の読み込み時に実行する関数の定義
window.addEventListener("load", popupConfig); // imgタグに対するconfigを即座に反映
parent.leftframe.document.getElementById("popupDelay-range")
	.addEventListener("input", popupConfig);

// MARK: LCPopup
// light curveをpopupさせる関数, 画像上でマウスを数秒止めると実行される
async function lightCurvePopup(mousePositionObject) {
	console.log("lightCurvePopup is called");
	// mouseの座標から画像の極座標を取得, そのデータを元にlight curveのpathを作成
	mousePosition2polar(mousePositionObject);

	// mouseの座標が地図の内側ではない時 return
	if (!(pointSta == 1 && marginSta == 1)) { return }

	// nCandidate2の長さが0のとき（周辺にイベントがないとき）return
	nearCandidate(mousePositionObject);
	// console.log("nCandidate2", nCandidate2);
	if (!nCandidate2.length) { return }

	// sigmaが最大の要素の番号を取得
	sigmaMax = findSigmaMax(nCandidate2);
	console.log("sigmaMax:", sigmaMax);
	// sigmaMaxが-1の時（mailイベントだけの時）はreturn
	if (sigmaMax === -1) { return }

	// 極座標を元にlight curveのpathを作成
	// var x = alpha2, y = delta2;
	//var promiseObject = polar2lightCurvePath(x, y, nCandidate2[0][1], nCandidate2[0][0]); //臨時
	// var lcPath = "";

	// popupの位置を決めるため, 全天画像のサイズを取得, svgの位置に反映
	getImgStatus();
	var popSvg = document.getElementById("popupLC");
	var styleSvg = popSvg.style;

	var popHeight = popSvg.clientHeight, popWidth = popSvg.clientWidth;
	var popPadding = 5;

	// popupが画面をはみ出さないように条件分岐
	styleSvg.left = mousePositionObject.pageX > imgWidth - popWidth - popPadding ?
		mousePositionObject.pageX - popWidth - popPadding :
		mousePositionObject.pageX + popPadding;

	styleSvg.top = mousePositionObject.pageY < popHeight + popPadding ?
		mousePositionObject.pageY + popPadding :
		mousePositionObject.pageY - popHeight - popPadding;

	// 画像と重ならないようにカーソル表示を移動
	if (mousePositionObject.pageX <= imgWidth - popWidth - popPadding && 
		mousePositionObject.pageY < popHeight + popPadding) {
	    var curObj = parent.mainframe.document.getElementById("myCursor").style;
	    curObj.top = (mousePositionObject.pageY + popHeight) + "px";
	}

	// 極座標を元にlight curveのpathを作成
	let eveInfo = nCandidate2[sigmaMax][1];
	let eveTimeScale = eveInfo.match(/\(([^,]+)/)[1]
	let dptcArr = nCandidate2[sigmaMax].slice(7, 17);
	let countArr = nCandidate2[sigmaMax].slice(17, 27);
	let expotmArr = nCandidate2[sigmaMax].slice(27, 37);
	let countAve = nCandidate2[sigmaMax][37];
	console.log("countAve(上書き前):", countAve);

	// 縦軸の単位を取得
	let popupY = parent.leftframe.document.getElementById("popupYaxis").value;
	console.log("popupのY軸:", popupY);

	// countAveをexpotmをもとに補正
	if (popupY === "mCrab") {
		let expotmAverage = 0;
		if (expotmArr && expotmArr.length > 0) {
		    // 有効な数値のみを対象にする
		    const validExpotms = expotmArr.filter(value => !isNaN(parseFloat(value)) && isFinite(value));

		    if (validExpotms.length > 0) {
		        // 合計を計算
		        const expotmSum = validExpotms.reduce((sum, value) => sum + parseFloat(value), 0);
		        // 平均を計算
		        expotmAverage = expotmSum / validExpotms.length;
				console.log("expotmAverage:", expotmAverage);
		    }
		}
		// 単位時間あたりのカウント数に変換し、countAveを上書き
		if (expotmAverage > 0) {
		    countAve = countAve / expotmAverage;
		}
	}

	promiseObject = crtLCPlot( dptcArr, 
							   eveTimeScale, 
							   countArr, 
							   expotmArr, 
							   countAve );

	//let lcPath = "";
	// console.log("lcPath2:", promiseObject);

	// loadingの画像を表示
	// loadImgObject = document.getElementById("image-Popup");
	// pathObject = document.getElementById("path-Popup");
	// loadImgObject.style.width = 400;
	//lcPathに正しいpathが格納されれば、光度曲線も表示されるはず
	// pathObject.setAttribute("d", lcPath); 
	// styleSvg.visibility = "visible";	

	// サーバーからの応答を待ちloadingを非表示にする, その後pathタグのdに反映
	//lcPath = await promiseObject;
	// loadImgObject.style.width = 0;
	// pathObject.setAttribute("d", lcPath);
}

// mouseが動いている間実行される関数
function resetPopup() {
	var styleSvg = document.getElementById("popupLC").style;
	styleSvg.visibility = "hidden";
	document.getElementById("popupLC").innerHTML = "";
	// テスト用
	nCandidate2 = undefined;
}

// [alpha2, delta2]が画像上の[x, y](クリックした時に出てくる数字)になる, 0 < x < 360, -45 < y < 45
function mousePosition2polar(mousePositionObject) {
	getImgStatus();
	figureXY(mousePositionObject);
	mollwide2polar(); // ハンメルアイトフ座標を極座標に変換			
	delta2 = Math.round(delta2 * 10) / 10;
	alpha2 = Math.round(alpha2 * 10) / 10;
}

// MARK: nearCand
// マウスの座標がcandidateの近くにある時trueを返す
// getImgStatus, figureXY, mollwide2polarの3つを実行するとグローバル変数にマウスの情報が記録される
// FluxOpは変数Limtを決めている
// これらが実行された状態でsearchCandidate2を実行するとnCandidate2にcandidateの情報が書き込まれる, 書き込まれなければマウスがcandidateの近くにない
// これらはコメントアウトしても動く時はあるが, nearCandidateが単体でも動作するために入れている
function nearCandidate(mousePositionObject) {
	getImgStatus();
	figureXY(mousePositionObject);
	mollwide2polar(); // ハンメルアイトフ座標を極座標に変換
	FluxOp();
	// searchCandidate2(conbineFourArrays(candidateData, candidateData2, candidateData3, candidateData4), Limt);
	searchCandidate2_tri(conbineArray(candidateData, candidateData3), Limt);
	searchCandidate2_mail(conbineArray(candidateData2, candidateData4), Limt);
	nCandidate2 = conbineArray(nCandidate2_mail, nCandidate2_tri);

	// テスト用, localにはcsvデータがないのでそれっぽいデータを作っている
	// dptc_zeroにcandidateData[0][0]は入るように変更
	// if (Math.abs(180 - alpha2) ** 2 + Math.abs(0 - delta2) ** 2 < 900) {
	// 	var td = ["", candidateData[0][0] + " (4orb, High, 20.84+/-9.36 mCrab)", 180, 0, "", "", "", 1113111] //1324935584
	// 	nCandidate2 = [td, td].map((value, index) => { td[7] = value[7] + index * 10; return td });
	// }

	console.log("nCandidate2:", nCandidate2);

	return nCandidate2;
}

//underframeを表示する関数
function showUnderFrame() {
	parent.document.getElementById("mainFrames").setAttribute("rows", "*,300");
  }

//underframeを非表示にする関数
function hideUnderFrame() {
	parent.document.getElementById("mainFrames").setAttribute("rows", "*, 0");
  }


// MARK: crtLCPlot
// Plotly で描画
async function crtLCPlot(dptcArr, timescale, countArr, expotmArr, countAve) {
    if (dptcArr.length !== countArr.length || dptcArr.length === 0) {
        console.error("Invalid input arrays");
        return;
    }

	//GW trigger位置のdptcを取得するための計算
	let intUNIX2DPTC = window.parent.underframe.intUNIX2DPTC // UNIXとDPTCの差を取得
	let gwTriGPS = window.parent.underframe.unix2gps(gwTriUnix); //gPStimeに変換
	let gwTriDPTC = gwTriGPS + intUNIX2DPTC; // DPTCに変換

	console.log("intUNIX2DPTC:", intUNIX2DPTC);
	console.log("gwTriUnix: " + gwTriUnix);
	console.log("gwTriGPS: " + gwTriGPS);
	console.log("gwTriDPTC: " + gwTriDPTC);

	// 縦軸の単位を取得
	let popupX = parent.leftframe.document.getElementById("popupXaxis").value;
	let popupY = parent.leftframe.document.getElementById("popupYaxis").value;

	// "auto"の場合、
	// 横軸を1s,3s,10s,30sでは"bin"、1scan,1orb,4orb,1dayでは"time"にする
	if ( popupX === "auto" ){
		if (priorities[timescale] < 5) {
			popupX = "bin";
		} else {
			popupX = "time";
		}
	}

	// triggertimeをグラフの基準とする
	// const trdptc = nCandidate2[sigmaMax][0];
	// const xArr = dptcArr.map(val => val - trdptc);
	let xArr;
	if ( popupX === "bin" ) {
		xlabel = "bin";
		xArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 
	} else {
		// xlabel = "dptc : " + gwTriDPTC + " + t ";
		xlabel = "time [s] (t=0: GW trigger)";
		xArr = dptcArr.map(val => val - gwTriDPTC);
	}

	let yArr;
	if (expotmArr.length === 10 && popupY === "mCrab") {
		yArr = countArr.map((count, index) => count / (expotmArr[index] || 1));
	} else {
		yArr = [...countArr];
	}
	
    // エラーバーの計算
	let errorArr; // 変数を条件分岐の前に宣言
	if (popupY === "mCrab") {
	    errorArr = countArr.map((count, index) => {
	        // カウント数の平方根を計算（負の値にならないよう保証）
	        const countError = Math.sqrt(Math.max(0, count));
	        // 対応する露光時間で割る（露光時間がゼロまたは無効な場合は1を使用）
	        const exposureTime = expotmArr && expotmArr[index] ? expotmArr[index] : 1;
	        // 単位時間あたりのエラー値を返す
	        return countError / exposureTime;
	    });
	} else {
	    errorArr = countArr.map(count => Math.sqrt(Math.max(0, count)));
	}

	// 確認用
	console.log("dptcArr:", dptcArr);
	console.log("countArr:", countArr);
	console.log("expotmArr:", expotmArr);
	console.log("countAve:", countAve);
	console.log("yArr:", yArr);
	console.log("errorArr:", errorArr);

    // エネルギーバンドに応じてマーカーの色を決定
    let markerColor = "black"; // デフォルトカラー
    const signalString = nCandidate2[sigmaMax][1];

    if (signalString.includes("L+M")) markerColor = "black";
    else if (signalString.includes("Low")) markerColor = "red";
    else if (signalString.includes("Med")) markerColor = "green";
    else if (signalString.includes("High")) markerColor = "blue";

    // Plotly のデータ設定
    let trace = {
		x : xArr,
		y: yArr,
        mode: "markers",
        marker: {
            color: markerColor,
            size: 4
        },
        error_y: {
            type: "data",
            array: errorArr,
            visible: true,
            thickness: 1,
            width: 2
        }
    };

    // **レイアウト設定**
    let layout = {
        title: "", // タイトルなし
        xaxis: { 
            title: {
				// text: "dptc : " + trdptc + " + t ", 
				text: xlabel,
				font: { size: 10 }
			},
            showticklabels: true, // X軸の目盛りテキストを表示
            tickfont: { size: 10 },
            ticks: "inside", // 目盛りを内側に表示して省スペース化
            type: 'linear',
            tickmode: 'array',
    		zeroline: false
        },
        yaxis: { 
            title: {
				text: popupY, 
				font: { size: 10 }
			},
            tickfont: { size: 10 },
            showticklabels: true,
            zeroline: true,
            zerolinewidth: 1.2, // Y軸の "0" の線を強調
            rangemode: "tozero", // Y軸の最小値を "0" に固定
            fixedrange: true // Y軸のズーム不可
        },
        showlegend: false,
        margin: { l: 38, r: 5, t: 5, b: 25 }, 
		autosize: true,
		width: document.getElementById("popupLC").clientWidth,
		height: document.getElementById("popupLC").clientHeight,
		shapes: [
            // 平均の位置に横線
            {
                type: 'line',
                x0: 0,
                x1: 1,
                xref: 'paper', // x0, x1をグラフの幅比率で指定
                y0: countAve,
                y1: countAve,
                line: {
                    color: 'yellow',
                    width: 1.5,
                    dash: 'solid'
                }
            }
        ],
		annotations: [
        {
            text: "bin size : " + timescale,
            x: 0.05,
            y: 0.9,
            xref: 'paper',  // x座標をグラフ全体の比率で指定
            yref: 'paper',  // y座標をグラフ全体の比率で指定
            showarrow: false,  // 矢印を表示しない
            font: {
                size: 10,
                color: 'black'
            },
            bgcolor: 'rgba(255, 255, 255, 0.5)'  // 背景色（半透明の白）
        }
    ]
    };

	// GW triggerの位置にオレンジ色の線
	// "bin"の時には無効
	if (popupX !== "bin") {
		layout.shapes.push({
    		type: 'line',
    		x0: 0,
    		x1: 0,
    		y0: 0,
    		y1: 1,
    		yref: 'paper',
    		line: {
    		    color: 'orange',
    		    width: 1.5,
    		    dash: 'solid'
    		}
    	});
	}

    let config = { 
        responsive: true,
        displayModeBar: false, // モードバーを非表示
        staticPlot: true // インタラクティブ機能を無効化してサイズを節約
    };

    Plotly.newPlot("popupLC", [trace], layout, config);

	let popSvg = document.getElementById("popupLC");
	let styleSvg = popSvg.style;
	styleSvg.visibility = "visible"; //表示
}

// MARK: findSigmaMax
// 複数イベントがあったときにsigmaが最大のものを選ぶ処理
function findSigmaMax(candidateData) {
    let maxValue = -Infinity;
    let maxIndex = -1;

    for (let i = 0; i < candidateData.length; i++) {
        // candidateData[i][5]の値を数値として取得
        const value = parseFloat(candidateData[i][5]);
        
        // 値が数値でない場合はスキップ
        if (isNaN(value)) continue;

		// "+/-"を含む（mailイベント）場合はスキップ
		if (candidateData[i][1].includes("+/-")) continue; 
        
        // 現在の最大値より大きい場合、最大値とインデックスを更新
        if (value > maxValue) {
            maxValue = value;
            maxIndex = i;
        }
    }

    return maxIndex;
}

// MARK: findLongestTimeScale
// 複数イベントがあったときにtimescaleが最大のものを選ぶ処理
function findLongestTimeScale(candidateData) {
	// 初期化
	let maxTimeScale = "";
	let maxPriority= 0;

	for (let n = 0; n < nCandidate2.length; n++) {
		let data = nCandidate2[n][1];
		// timescaleのデータ部分を抽出
		let match = data.match(/\((1day|4orb|1orb|1scan|30s|10s|3s|1s),/);
		if (match) {
			let currentData = match[1];
			let currentPriority = priorities[currentData];
			// 現在のデータが最大優先度かどうかを確認
			if (currentPriority > maxPriority) {
				maxPriority= currentPriority;
				maxTimeScale = currentData;
			}
		}
	}
	return maxTimeScale;
}

// MARK: underLC表示
// 画像上の[x, y](クリックした時に出てくる数字)を入力すると, svgタグで使うlight curveのpathが出力される
async function polar2lightCurvePath(x, y, detail, diff) {
	console.log("click : polar2lightCurvePath");
	let divs = window.parent.underframe.document.getElementsByTagName('div');
    while (divs.length > 0) {
        divs[0].remove();
    }

	var a = []; // aを初期化

	if (diff == "") {
		// 従来の処理
		var a = detail.split(/\(|\)|\s|,/g).filter(value => value);
	} else {
		// 新しく追加した処理
		// diffをaに追加
		a.push(diff);

		// detailの3要素以降をaに追加
		var detailElements = detail.split(/\(|\)|\s|,/g).filter(value => value);
		var detailElementsFromThird = detailElements.slice(2); 
		a = a.concat(detailElementsFromThird);
	};
	console.log(a);

	// nCandidate2[n][0]とnCandidate2[n][1]をすべて表示
	for (let n = 0; n < nCandidate2.length; n++) {
		console.log(nCandidate2[n][0] + " & " + nCandidate2[n][1]);
	}

	// sigmaが最大の要素の番号を取得
	sigmaMaxIndex = findSigmaMax(nCandidate2);
	// sigmaが最大の要素を配列の先頭に追加
	let maxiTriArray = [nCandidate2[sigmaMaxIndex][0]];
	// 残りの要素を追加（重複を避けるため、すでに追加した要素はフィルタリング）
	for (let n = 0; n < nCandidate2.length; n++) {
	  if (n !== sigmaMaxIndex) {
	    maxiTriArray.push(nCandidate2[n][0]);
	  }
	}

	let sigmaMaxEvent = nCandidate2[sigmaMaxIndex][1];
	let sigmaMaxTimeScale = sigmaMaxEvent.match(/\(([^,]+)/)[1]; // timescaleを取得

	//最大の timescale を取得
	let maxTimeScale = findLongestTimeScale(nCandidate2);

	console.log("Max sigma dptc: ", nCandidate2[sigmaMaxIndex][0]);
	console.log("Longest timescale: ", maxTimeScale);
	console.log("Max sigma timescale: ", sigmaMaxTimeScale);
	console.log("MaxiTriArray: ", maxiTriArray);

	// DBでの検索の基準を「TRIGGER TIME」にするため、gwTriUnixをGPStimeに変換
	var gwTriGPS = window.parent.underframe.unix2gps(gwTriUnix);
	//console.log(gwTriGPS);

	var send = {"dptc_zero" : gwTriGPS,
				// "timescale" : maxTimeScale,
				"timescale" : sigmaMaxTimeScale,
				"energy"    : a[2],
				"error" 	: a[3],
				"star"      : a[4],	
				"ra" 	   	: x,
				"dec" 	    : y
			   };
	console.log(send);

	// mousePosition2polar(mousePositionObject);

	console.log('Catadata ndptc:', send.dptc_zero,' timescale:', send.timescale,
				//'\nsearch dptc', send.dptc_zero - send.timescale, '~', send.dptc_zero + send.timescale, //文字と数字を足し引きしちゃいかんですよ
				'\nalpha2, delta2:', alpha2, ',', delta2,
				'\nra, dec:', send.ra, ',', send.dec, 'PI:', send.energy);
	
	// サーバーとのajax通信(非同期通信)
	$.ajax({
		url: '/cgi-bin/make_LCdata2.py', //どこへ
		type: 'post',				   //どのように
		data: send,					   //何を渡すのか
		}).done((LCdata) => {   //受信が成功した時の処理
			try {
				console.log("LCdata:", LCdata);
				let receive_LCdata = JSON.parse(LCdata);
				window.parent.underframe.underframe_pro(receive_LCdata, gwTriUnix, maxiTriArray);
				// document.getElementById("popupLC").style.visibility = "hidden"; //popupの画像を非表示に
			  } catch (error) {
				console.error("Failed to load data.", error);

				const underframe = window.parent.underframe.document.getElementById('undermessage'); 
				underframe.innerText =  'Failed to get data. Please click another event.';
			  }
		}).fail(() => {
			console.log('failed');
		});

		showUnderFrame();

		// underframeを取得
		let underframe = document.createElement('div');
		underframe.id = 'undermessage';
		window.parent.underframe.document.body.appendChild(underframe);

		// 光度曲線が作成されるまでの間に表示される文字の設定
		underframe.innerText = 'waiting...'; // テキストを設定
		underframe.style.color = 'white'; // 文字色を白に設定
		underframe.style.fontSize = '24px'; // フォントサイズを大きく設定
		underframe.style.display = 'flex'; // フレックスボックスを使用
		underframe.style.justifyContent = 'center'; // 水平方向に中央揃え
		underframe.style.alignItems = 'center'; // 垂直方向に中央揃え
		underframe.style.height = '100%'; // 高さを100%に設定
		underframe.style.width = '100%'; // 幅を100%に設定
}

//↑polar2~~を更に関数化させたい
//1.カタログをフィルターする　2.ajaxで渡し,受け取る　3.各PI域のデータを取り出してpathにする
async function makeLCpath()
{
	console.log(LC_array);
}

// var send_data 	={aaaa : a};

// send_data.aaaa
