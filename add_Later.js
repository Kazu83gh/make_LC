//////////////////////////////////////////////////////////////////////////////////////////////////
//LCdataを作成

let test_LCdata = [111, 1, 222, 2, 333, 3, 444, 4, 555, 5, 666, 6];

let Tolist = function (test_LCdata) {
  let array = [];
  let array1 = [];

  for (let i = 1; i < test_LCdata.length + 1; i++) {
    if (i % 2 != 0) {
      array1.push(test_LCdata[i - 1]);
      array1.push(test_LCdata[i]);
      array1.push(Math.sqrt(test_LCdata[i]));
    } else {
      array.push(array1);
      array1 = [];
    }
  }
  return array;
};
console.log(Tolist(test_LCdata));

////////////////////////////////////////////////////////////////////////////////////////////////////
//GPStimeからJStime(UTC)に変換とか色々

//9時間分(ミリ秒)
let nine_Hours = 32400000;

//差5日分(ミリ秒)
let five_days = 432000000;

//10年分の時間差(GPSTimeからの経過時間にしたい場合これを足す)
let start = new Date(80, 0, 2).getTime();
let end = new Date(90, 0, 1).getTime();
let ten_years = Math.abs(start - end);

//日本標準時間
let JStime = new Date(0);
let GPStime = new Date(Date.UTC(80, 0, 6));
let MJD = new Date(Date.UTC(1858, 10, 17));

//UTC
let JStime_UTC = JStime.toUTCString();
let GPStime_UTC = GPStime.toUTCString();
let MJD_UTC = MJD.toUTCString();

//UTCのミリ秒時間
let JStime_ms = JStime.getTime() - nine_Hours;
let GPStime_ms = GPStime.getTime() - nine_Hours;
let MJD_ms = MJD.getTime() - nine_Hours;

//JStimeとGPStimeの差
let num = ten_years + five_days;

//GPStimeをにJStime(UTC)変換
let JStime_to_GPStime = function (data) {
  let time = data / 1000 + num - nine_Hours;

  return time;
};

let test = JStime_to_GPStime(nine_Hours * 1000); //GPStimeから9時間後の時間を想定(秒)、(1980年1月6日 9:00:00)
console.log(new Date(test)); // UTC表示

////////////////////////////////////////////////////////////////////////////////////////////////////
//データを分けるやつ

let data = [12345 + "i" + 6789, 5];
console.log(data);

let data1 = data[0].split("i").map(Number); //分けて配列に格納。格納されている物をすべて文字列から数字に変換。
data1.push(data[1]); //5を格納
console.log(data1);
