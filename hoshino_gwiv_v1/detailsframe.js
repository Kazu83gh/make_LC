function full() {
  document.getElementById("img1").style.width = orgWidth;
  document.getElementById("img1").style.height = orgHeight;

  //reDispMarker();
}

function full2() {
  document.getElementById("img1").style.width = 2 * orgWidth;
  document.getElementById("img1").style.height = 2 * orgHeight;

  //reDispMarker();
}

function harf() {
  scale = 2;
  sizeChange();
  //reDispMarker();
}

function fit() {
  scale = 1;
  sizeChange();
  //reDispMarker();
}

function widthSet() {
  // widthに合わせてリサイズする
  if (scale == 1) {
    document.getElementById("img1").style.width = winWidth;
    document.getElementById("img1").style.height = Math.floor(
      imgHeight / widthRate
    );
  } else if (scale == 2) {
    heightSet();
    /*
	document.getElementById("img1").style.width = 2 * winWidth;
	document.getElementById("img1").style.height = 2 * Math.floor(imgHeight / widthRate);
	*/
  }
}

function heightSet() {
  // heightに合わせてリサイズする
  if (scale == 1) {
    document.getElementById("img1").style.width = Math.floor(
      imgWidth / heightRate
    );
    document.getElementById("img1").style.height = winHeight;
  } else if (scale == 2) {
    document.getElementById("img1").style.width =
      2 * Math.floor(imgWidth / heightRate);
    document.getElementById("img1").style.height = 2 * winHeight;
  }
}

function sizeChange() {
  resizeRate = 1.0; //画面サイズに対する画像サイズの比率
  margin = 7; //画像の周りの余白

  //変数の定義
  imgWidth = document.getElementById("img1").width; //現在の画像の幅
  imgHeight = document.getElementById("img1").height; //現在の画像の高さ
  //console.log("imageWidth/Height="+ imgWidth + "/" + imgHeight);

  winWidth = Math.floor(window.innerWidth * resizeRate - margin * 2); //画像表示領域の幅
  winHeight = Math.floor(window.innerHeight * resizeRate - margin * 2); //画像表示領域の高さ
  widthRate = imgWidth / winWidth; //現在の画像サイズと画像表示領域サイズの比率（幅）
  heightRate = imgHeight / winHeight; //現在の画像サイズと画像表示領域サイズの比率（高さ）
  if (widthRate >= 1 && heightRate >= 1) {
    // 画像の幅、高さが共に画面に収まらない場合
    if (widthRate > heightRate) {
      // 画像の幅の比率の方が大きい場合
      // widthに合わせて縮小
      resize = widthSet();
    } else {
      // 画像の高さの比率の方が大きい場合
      // heightに合わせて縮小
      resize = heightSet();
    }
  } else if (widthRate >= 1 && heightRate < 1) {
    // 画像の幅だけが画面に収まらない場合
    resize = widthSet();
  } else if (widthRate < 1 && heightRate >= 1) {
    // 画像の高さだけが画面に収まらない場合
    resize = heightSet();
  } else if (widthRate < 1 && heightRate < 1) {
    // 画像の幅と高さが共に画面より小さい場合
    if (widthRate > heightRate) {
      // 画像の幅の比率の方が大きい場合
      // widthに合わせて拡大
      resize = widthSet();
    } else {
      // 画像の高さの比率の方が大きい場合
      // heightに合わせて拡大
      resize = heightSet();
    }
  }

  //reDispMarker();

  // for image 2
  // sizeChange_2();
  imgWidth = document.getElementById("img1").width; //現在の画像の幅
  imgHeight = document.getElementById("img1").height; //現在の画像の高さ
}
