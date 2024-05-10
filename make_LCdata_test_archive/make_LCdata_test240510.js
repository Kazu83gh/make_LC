function all_program() {
  //document.getElementById('e').innerHTML = '';
  var divs = document.getElementsByTagName('div');
  for(var i = 0; i < divs.length; i++){
    divs[i].innerHTML = '';
  };

  console.log('-----program start-----');

  var send = {
    // 低カウント
    // dptc_zero: 976454075, //a[0],
    // timescale: "1day", //a[1],
    // energy: "High", //a[2],
    // ra: 113.32613, //x,
    // dec: -26.190498, //y,

    // 高カウント
    // dptc_zero: 976516509,
    // timescale: "1day", 
    // energy: "High", 
    // ra: 245.19737,
    // dec: -16.29694,

    // timescale = 10s
    dptc_zero: 976516509,
    timescale: "10s", 
    energy: "High", 
    ra: 245.19737,
    dec: -16.29694,

  };
// サーバーとのajax通信(非同期通信)
  $.ajax({
      url: "/cgi-bin/make_LCdata.py", //どこへ
      type: "post", //どのように
      data: send, //何を渡すのか
    })
    .done((LCdata) => {
      console.log('timescale = ' + send.timescale);

        //受信が成功した時の処理
        console.log('--- LCDATA ---')
		    console.log(LCdata);	//受信したLCdataはjson(文字列)
		    console.log('----  rnd ----')
      
        var recive_LCdata = JSON.parse(LCdata); //jsonデータの受け取り・jsonを辞書型にする

        var all_LCdata = recive_LCdata.All;
        var high_LCdata = recive_LCdata.High;
        var med_LCdata = recive_LCdata.Med;
        var low_LCdata = recive_LCdata.Low;

        var pre_LCdata = all_LCdata;
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        //変数
        let num = [];
            graph_scale_change = [0, 0],
            choice_binsize = 1, //設定されているbinsizeを格納
            choice_PlotType = "point", //設定されているPlotTypeを格納
            initial_MJDRange = [], //初期の表示範囲を格納
            shift_event = false, //shiftが押されているか。
            width_error_anti = 0, //エラー防止処置
            time_over = 230, //制限時間
            timer = null,
            clickCount = 0, //クリックされた回数。
            delete_child = 0, //子要素を何個削除したかカウントする変数。
            Re_Reload = 0, //再リロードするか
            selectedEnergyBand = "All"; //デフォルトで表示されるエネルギーバンド

        
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
        let diff_num = ten_years + five_days;

        //GPStimeをJStime(UTC)変換
        let GPStime_to_JStime = function (data) {
          let time = data * 1000 + diff_num; 
        
          return time;
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        //[dptc, count, dptc, count, ...]の形から
        //[[dptc, count, √count], [dptc, count, √count], ...]の形に変換
        let Tolist = function (data) {
          let array = [];
          let array1 = [];

          console.log(data.length);

          for (let i = 1; i < data.length + 1; i++) {
            if (i % 2 != 0) {
              // array1.push(data[i - 1]);
              let convertedValue = GPStime_to_JStime(data[i - 1]) / 1000;
              array1.push(convertedValue);
              array1.push(data[i]);
              array1.push(Math.sqrt(data[i]));
            } else {
              array.push(array1);
              array1 = [];
            }
          }
          return array;
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        //基準となるdptc(赤線)を描画するのに使用
        let dptczero_to_GPStime = GPStime_to_JStime(send.dptc_zero) / 1000;

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        //各グラフを一つのまとまりとして再び配列に格納する。
        let graph_Summarize = function (data) {
          let i;
          let array = [];
          let graph_data = [];
        
          //92分間の時間の差がある一つ一つのグラフをそれぞれ配列にまとめる。
          for (i = 0; i < data.length - 1; i++) {
            if (Math.abs(data[i][0] - data[i + 1][0]) < 2000) {
              array.push(data[i]);
            } else {
              graph_data.push(array);
              array = [];
            }
          }
          graph_data.push(array); //最後のarrayを格納。
        
          return graph_data;
        };

        gragh_data = graph_Summarize(pre_LCdata);

        let Create_LightCurve = function () {
          setTimeout(function () {
            if (graph_scale_change[0] != 0) {
              console.log("来た");
              if (Re_Reload == 0) {
                Re_Reload += 1;
        
                createLC(pre_LCdata);
              }
              //初期化部分
              Re_Reload = 0;
              graph_scale_change[0] = 0;
              graph_scale_change[1] = 0;
            } else if (graph_scale_change[0] == 0 && shift_event) {
              console.log("シフト押されてる");
              shift_event = false;
              createLC(pre_LCdata);
            }
          }, 540);
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////
        // ここから光度曲線の描画
        createLC(pre_LCdata);

        function createLC(dptc_count_data) {
          //console.log('pre_LCdata = ' + dptc_count_data); 
          dict_LCdata = Tolist(dptc_count_data);
          //console.log(Tolist(dptc_count_data); 
          //console.log(dptc_count_data.length);
          graph_data = graph_Summarize(dict_LCdata);
          // console.log(graph_Summarize(dict_LCdata));
        //dict_LCdataをもとに光度曲線の描画
        ParcelRequire = (function (e, r, t, n) {
          var i,
            o = "function" == typeof parcelRequire && parcelRequire,
            u = "function" == typeof require && require;
          function f(t, n) {
            if (!r[t]) {
              if (!e[t]) {
                var i = "function" == typeof parcelRequire && parcelRequire;
                if (!n && i) return i(t, !0);
                if (o) return o(t, !0);
                if (u && "string" == typeof t) return u(t);
                var c = new Error("Cannot find module '" + t + "'");
                throw ((c.code = "MODULE_NOT_FOUND"), c);
              }
              (p.resolve = function (r) {
                return e[t][1][r] || r;
              }),
                (p.cache = {});
              var l = (r[t] = new f.Module(t));
              e[t][0].call(l.exports, p, l, l.exports, this);
            }
            return r[t].exports;
            function p(e) {
              return f(p.resolve(e));
            }
          }
          (f.isParcelRequire = !0),
            (f.Module = function (e) {
              (this.id = e), (this.bundle = f), (this.exports = {});
            }),
            (f.modules = e),
            (f.cache = r),
            (f.parent = o),
            (f.register = function (r, t) {
              e[r] = [
                function (e, r) {
                  r.exports = t;
                },
                {},
              ];
            });
          // for (var c = 0; c < t.length; c++)
          //   try {
          //     f(t[c]);
          //   } catch (e) {
          //     i || (i = e);
          //   }
          if (t.length) {
            var l = f(t[t.length - 1]);
            "object" == typeof exports && "undefined" != typeof module
              ? (module.exports = l)
              : "function" == typeof define && define.amd
              ? define(function () {
                  return l;
                })
              : n && (this[n] = l);
          }
          if (((parcelRequire = f), i)) throw i;
          return f;
        })(
          {
            "0tLx": [
              function (require, module, exports) {
                "use strict";
                var r = Object.getOwnPropertySymbols,
                  t = Object.prototype.hasOwnProperty,
                  e = Object.prototype.propertyIsEnumerable;
                function n(r) {
                  if (null == r)
                    throw new TypeError(
                      "Object.assign cannot be called with null or undefined"
                    );
                  return Object(r);
                }
                function o() {
                  try {
                    if (!Object.assign) return !1;
                    var r = new String("abc");
                    if (((r[5] = "de"), "5" === Object.getOwnPropertyNames(r)[0]))
                      return !1;
                    if (
                      "0123456789" !==
                      Object.getOwnPropertyNames(t)
                        .map(function (r) {
                          return t[r];
                        })
                        .join("")
                    )
                      return !1;
                    var n = {};
                    return (
                      "abcdefghijklmnopqrst".split("").forEach(function (r) {
                        n[r] = r;
                      }),
                      "abcdefghijklmnopqrst" ===
                        Object.keys(Object.assign({}, n)).join("")
                    );
                  } catch (o) {
                    return !1;
                  }
                }
                module.exports = o()
                  ? Object.assign
                  : function (o, c) {
                      for (var a, i, s = n(o), f = 1; f < arguments.length; f++) {
                        for (var u in (a = Object(arguments[f])))
                          t.call(a, u) && (s[u] = a[u]);
                        if (r) {
                          i = r(a);
                          // for (var b = 0; b < i.length; b++)
                          //   e.call(a, i[b]) && (s[i[b]] = a[i[b]]);
                        }
                      }
                      return s;
                    };
              },
              {},
            ],
            L8uO: [
              function (require, module, exports) {
                "use strict";
                var e = require("object-assign"),
                  t = "function" == typeof Symbol && Symbol.for,
                  r = t ? Symbol.for("react.element") : 60103,
                  n = t ? Symbol.for("react.portal") : 60106,
                  o = t ? Symbol.for("react.fragment") : 60107,
                  u = t ? Symbol.for("react.strict_mode") : 60108,
                  l = t ? Symbol.for("react.profiler") : 60114,
                  f = t ? Symbol.for("react.provider") : 60109,
                  c = t ? Symbol.for("react.context") : 60110,
                  i = t ? Symbol.for("react.concurrent_mode") : 60111,
                  a = t ? Symbol.for("react.forward_ref") : 60112,
                  s = t ? Symbol.for("react.suspense") : 60113,
                  p = t ? Symbol.for("react.memo") : 60115,
                  y = t ? Symbol.for("react.lazy") : 60116,
                  d = "function" == typeof Symbol && Symbol.iterator;
                function v(e, t, r, n, o, u, l, f) {
                  if (!e) {
                    if (((e = void 0), void 0 === t))
                      e = Error(
                        "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
                      );
                    else {
                      var c = [r, n, o, u, l, f],
                        i = 0;
                      (e = Error(
                        t.replace(/%s/g, function () {
                          return c[i++];
                        })
                      )).name = "Invariant Violation";
                    }
                    throw ((e.framesToPop = 1), e);
                  }
                }
                function m(e) {
                  for (
                    var t = arguments.length - 1,
                      r = "https://reactjs.org/docs/error-decoder.html?invariant=" + e,
                      n = 0;
                    n < t;
                    n++
                  )
                    r += "&args[]=" + encodeURIComponent(arguments[n + 1]);
                  v(
                    !1,
                    "Minified React error #" +
                      e +
                      "; visit %s for the full message or use the non-minified dev environment for full errors and additional helpful warnings. ",
                    r
                  );
                }
                var h = {
                    isMounted: function () {
                      return !1;
                    },
                    enqueueForceUpdate: function () {},
                    enqueueReplaceState: function () {},
                    enqueueSetState: function () {},
                  },
                  b = {};
                function _(e, t, r) {
                  (this.props = e),
                    (this.context = t),
                    (this.refs = b),
                    (this.updater = r || h);
                }
                function S() {}
                function k(e, t, r) {
                  (this.props = e),
                    (this.context = t),
                    (this.refs = b),
                    (this.updater = r || h);
                }
                (_.prototype.isReactComponent = {}),
                  (_.prototype.setState = function (e, t) {
                    "object" != typeof e &&
                      "function" != typeof e &&
                      null != e &&
                      m("85"),
                      this.updater.enqueueSetState(this, e, t, "setState");
                  }),
                  (_.prototype.forceUpdate = function (e) {
                    this.updater.enqueueForceUpdate(this, e, "forceUpdate");
                  }),
                  (S.prototype = _.prototype);
                var g = (k.prototype = new S());
                (g.constructor = k), e(g, _.prototype), (g.isPureReactComponent = !0);
                var $ = {
                    current: null,
                  },
                  x = {
                    current: null,
                  },
                  C = Object.prototype.hasOwnProperty,
                  w = {
                    key: !0,
                    ref: !0,
                    __self: !0,
                    __source: !0,
                  };
                function P(e, t, n) {
                  var o = void 0,
                    u = {},
                    l = null,
                    f = null;
                  if (null != t)
                    for (o in (void 0 !== t.ref && (f = t.ref),
                    void 0 !== t.key && (l = "" + t.key),
                    t))
                      C.call(t, o) && !w.hasOwnProperty(o) && (u[o] = t[o]);
                  var c = arguments.length - 2;
                  if (1 === c) u.children = n;
                  else if (1 < c) {
                    for (var i = Array(c), a = 0; a < c; a++) i[a] = arguments[a + 2];
                    u.children = i;
                  }
                  if (e && e.defaultProps)
                    for (o in (c = e.defaultProps)) void 0 === u[o] && (u[o] = c[o]);
                  return {
                    $$typeof: r,
                    type: e,
                    key: l,
                    ref: f,
                    props: u,
                    _owner: x.current,
                  };
                }
                function R(e, t) {
                  return {
                    $$typeof: r,
                    type: e.type,
                    key: t,
                    ref: e.ref,
                    props: e.props,
                    _owner: e._owner,
                  };
                }
                function E(e) {
                  return "object" == typeof e && null !== e && e.$$typeof === r;
                }
                function j(e) {
                  var t = {
                    "=": "=0",
                    ":": "=2",
                  };
                  return (
                    "$" +
                    ("" + e).replace(/[=:]/g, function (e) {
                      return t[e];
                    })
                  );
                }
                var O = /\/+/g,
                  A = [];
                function I(e, t, r, n) {
                  if (A.length) {
                    var o = A.pop();
                    return (
                      (o.result = e),
                      (o.keyPrefix = t),
                      (o.func = r),
                      (o.context = n),
                      (o.count = 0),
                      o
                    );
                  }
                  return {
                    result: e,
                    keyPrefix: t,
                    func: r,
                    context: n,
                    count: 0,
                  };
                }
                function M(e) {
                  (e.result = null),
                    (e.keyPrefix = null),
                    (e.func = null),
                    (e.context = null),
                    (e.count = 0),
                    10 > A.length && A.push(e);
                }
                function U(e, t, o, u) {
                  var l = typeof e;
                  ("undefined" !== l && "boolean" !== l) || (e = null);
                  var f = !1;
                  if (null === e) f = !0;
                  else
                    switch (l) {
                      case "string":
                      case "number":
                        f = !0;
                        break;
                      case "object":
                        switch (e.$$typeof) {
                          case r:
                          case n:
                            f = !0;
                        }
                    }
                  if (f) return o(u, e, "" === t ? "." + F(e, 0) : t), 1;
                  if (((f = 0), (t = "" === t ? "." : t + ":"), Array.isArray(e)))
                    for (var c = 0; c < e.length; c++) {
                      var i = t + F((l = e[c]), c);
                      f += U(l, i, o, u);
                    }
                  else if (
                    (null === e || "object" != typeof e
                      ? (i = null)
                      : (i =
                          "function" == typeof (i = (d && e[d]) || e["@@iterator"])
                            ? i
                            : null),
                    "function" == typeof i)
                  )
                    for (e = i.call(e), c = 0; !(l = e.next()).done; )
                      f += U((l = l.value), (i = t + F(l, c++)), o, u);
                  else
                    "object" === l &&
                      m(
                        "31",
                        "[object Object]" === (o = "" + e)
                          ? "object with keys {" + Object.keys(e).join(", ") + "}"
                          : o,
                        ""
                      );
                  return f;
                }
                function q(e, t, r) {
                  return null == e ? 0 : U(e, "", t, r);
                }
                function F(e, t) {
                  return "object" == typeof e && null !== e && null != e.key
                    ? j(e.key)
                    : t.toString(36);
                }
                function L(e, t) {
                  e.func.call(e.context, t, e.count++);
                }
                function V(e, t, r) {
                  var n = e.result,
                    o = e.keyPrefix;
                  (e = e.func.call(e.context, t, e.count++)),
                    Array.isArray(e)
                      ? D(e, n, r, function (e) {
                          return e;
                        })
                      : null != e &&
                        (E(e) &&
                          (e = R(
                            e,
                            o +
                              (!e.key || (t && t.key === e.key)
                                ? ""
                                : ("" + e.key).replace(O, "$&/") + "/") +
                              r
                          )),
                        n.push(e));
                }
                function D(e, t, r, n, o) {
                  var u = "";
                  null != r && (u = ("" + r).replace(O, "$&/") + "/"),
                    q(e, V, (t = I(t, u, n, o))),
                    M(t);
                }
                function T() {
                  var e = $.current;
                  return null === e && m("321"), e;
                }
                var N = {
                    Children: {
                      map: function (e, t, r) {
                        if (null == e) return e;
                        var n = [];
                        return D(e, n, null, t, r), n;
                      },
                      forEach: function (e, t, r) {
                        if (null == e) return e;
                        q(e, L, (t = I(null, null, t, r))), M(t);
                      },
                      count: function (e) {
                        return q(
                          e,
                          function () {
                            return null;
                          },
                          null
                        );
                      },
                      toArray: function (e) {
                        var t = [];
                        return (
                          D(e, t, null, function (e) {
                            return e;
                          }),
                          t
                        );
                      },
                      only: function (e) {
                        return E(e) || m("143"), e;
                      },
                    },
                    createRef: function () {
                      return {
                        current: null,
                      };
                    },
                    Component: _,
                    PureComponent: k,
                    createContext: function (e, t) {
                      return (
                        void 0 === t && (t = null),
                        ((e = {
                          $$typeof: c,
                          _calculateChangedBits: t,
                          _currentValue: e,
                          _currentValue2: e,
                          _threadCount: 0,
                          Provider: null,
                          Consumer: null,
                        }).Provider = {
                          $$typeof: f,
                          _context: e,
                        }),
                        (e.Consumer = e)
                      );
                    },
                    forwardRef: function (e) {
                      return {
                        $$typeof: a,
                        render: e,
                      };
                    },
                    lazy: function (e) {
                      return {
                        $$typeof: y,
                        _ctor: e,
                        _status: -1,
                        _result: null,
                      };
                    },
                    memo: function (e, t) {
                      return {
                        $$typeof: p,
                        type: e,
                        compare: void 0 === t ? null : t,
                      };
                    },
                    useCallback: function (e, t) {
                      return T().useCallback(e, t);
                    },
                    useContext: function (e, t) {
                      return T().useContext(e, t);
                    },
                    useEffect: function (e, t) {
                      return T().useEffect(e, t);
                    },
                    useImperativeHandle: function (e, t, r) {
                      return T().useImperativeHandle(e, t, r);
                    },
                    useDebugValue: function () {},
                    useLayoutEffect: function (e, t) {
                      return T().useLayoutEffect(e, t);
                    },
                    useMemo: function (e, t) {
                      return T().useMemo(e, t);
                    },
                    useReducer: function (e, t, r) {
                      return T().useReducer(e, t, r);
                    },
                    useRef: function (e) {
                      return T().useRef(e);
                    },
                    useState: function (e) {
                      return T().useState(e);
                    },
                    Fragment: o,
                    StrictMode: u,
                    Suspense: s,
                    createElement: P,
                    cloneElement: function (t, n, o) {
                      null == t && m("267", t);
                      var u = void 0,
                        l = e({}, t.props),
                        f = t.key,
                        c = t.ref,
                        i = t._owner;
                      if (null != n) {
                        void 0 !== n.ref && ((c = n.ref), (i = x.current)),
                          void 0 !== n.key && (f = "" + n.key);
                        var a = void 0;
                        for (u in (t.type &&
                          t.type.defaultProps &&
                          (a = t.type.defaultProps),
                        n))
                          C.call(n, u) &&
                            !w.hasOwnProperty(u) &&
                            (l[u] = void 0 === n[u] && void 0 !== a ? a[u] : n[u]);
                      }
                      if (1 === (u = arguments.length - 2)) l.children = o;
                      else if (1 < u) {
                        a = Array(u);
                        for (var s = 0; s < u; s++) a[s] = arguments[s + 2];
                        l.children = a;
                      }
                      return {
                        $$typeof: r,
                        type: t.type,
                        key: f,
                        ref: c,
                        props: l,
                        _owner: i,
                      };
                    },
                    createFactory: function (e) {
                      var t = P.bind(null, e);
                      return (t.type = e), t;
                    },
                    isValidElement: E,
                    version: "16.8.6",
                    unstable_ConcurrentMode: i,
                    unstable_Profiler: l,
                    __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
                      ReactCurrentDispatcher: $,
                      ReactCurrentOwner: x,
                      assign: e,
                    },
                  },
                  z = {
                    default: N,
                  },
                  B = (z && N) || z;
                module.exports = B.default || B;
              },
              {
                "object-assign": "0tLx",
              },
            ],
            //L8uOをモジュール化している。
            SAdv: [
              function (require, module, exports) {
                "use strict";
                module.exports = require("./cjs/react.production.min.js");
              },
              {
                "./cjs/react.production.min.js": "L8uO",
              },
            ],
            Nl9N: [
              function (require, module, exports) {
                var global = arguments[3];
                var e = arguments[3];
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                });
                var n = null,
                  t = !1,
                  o = 3,
                  r = -1,
                  i = -1,
                  l = !1,
                  u = !1;
                function a() {
                  if (!l) {
                    var e = n.expirationTime;
                    u ? k() : (u = !0), h(p, e);
                  }
                }
                function s() {
                  var e = n,
                    t = n.next;
                  if (n === t) n = null;
                  else {
                    var r = n.previous;
                    (n = r.next = t), (t.previous = r);
                  }
                  (e.next = e.previous = null),
                    (r = e.callback),
                    (t = e.expirationTime),
                    (e = e.priorityLevel);
                  var l = o,
                    u = i;
                  (o = e), (i = t);
                  try {
                    var s = r();
                  } finally {
                    (o = l), (i = u);
                  }
                  if ("function" == typeof s)
                    if (
                      ((s = {
                        callback: s,
                        priorityLevel: e,
                        expirationTime: t,
                        next: null,
                        previous: null,
                      }),
                      null === n)
                    )
                      n = s.next = s.previous = s;
                    else {
                      (r = null), (e = n);
                      do {
                        if (e.expirationTime >= t) {
                          r = e;
                          break;
                        }
                        e = e.next;
                      } while (e !== n);
                      null === r ? (r = n) : r === n && ((n = s), a()),
                        ((t = r.previous).next = r.previous = s),
                        (s.next = r),
                        (s.previous = t);
                    }
                }
                function f() {
                  if (-1 === r && null !== n && 1 === n.priorityLevel) {
                    l = !0;
                    try {
                      do {
                        s();
                      } while (null !== n && 1 === n.priorityLevel);
                    } finally {
                      (l = !1), null !== n ? a() : (u = !1);
                    }
                  }
                }
                function p(e) {
                  l = !0;
                  var o = t;
                  t = e;
                  try {
                    if (e)
                      for (; null !== n; ) {
                        var r = exports.unstable_now();
                        if (!(n.expirationTime <= r)) break;
                        do {
                          s();
                        } while (null !== n && n.expirationTime <= r);
                      }
                    else if (null !== n)
                      do {
                        s();
                      } while (null !== n && !T());
                  } finally {
                    (l = !1), (t = o), null !== n ? a() : (u = !1), f();
                  }
                }
                var c,
                  v,
                  x = Date,
                  b = "function" == typeof setTimeout ? setTimeout : void 0,
                  y = "function" == typeof clearTimeout ? clearTimeout : void 0,
                  d =
                    "function" == typeof requestAnimationFrame
                      ? requestAnimationFrame
                      : void 0,
                  m =
                    "function" == typeof cancelAnimationFrame
                      ? cancelAnimationFrame
                      : void 0;
                function w(e) {
                  (c = d(function (n) {
                    y(v), e(n);
                  })),
                    (v = b(function () {
                      m(c), e(exports.unstable_now());
                    }, 100));
                }
                if (
                  "object" == typeof performance &&
                  "function" == typeof performance.now
                ) {
                  var _ = performance;
                  exports.unstable_now = function () {
                    return _.now();
                  };
                } else
                  exports.unstable_now = function () {
                    return x.now();
                  };
                var h,
                  k,
                  T,
                  g = null;
                if (
                  ("undefined" != typeof window
                    ? (g = window)
                    : void 0 !== e && (g = e),
                  g && g._schedMock)
                ) {
                  var M = g._schedMock;
                  (h = M[0]), (k = M[1]), (T = M[2]), (exports.unstable_now = M[3]);
                } else if (
                  "undefined" == typeof window ||
                  "function" != typeof MessageChannel
                ) {
                  var P = null,
                    C = function (e) {
                      if (null !== P)
                        try {
                          P(e);
                        } finally {
                          P = null;
                        }
                    };
                  (h = function (e) {
                    null !== P ? setTimeout(h, 0, e) : ((P = e), setTimeout(C, 0, !1));
                  }),
                    (k = function () {
                      P = null;
                    }),
                    (T = function () {
                      return !1;
                    });
                } else {
                  "undefined" != typeof console &&
                    ("function" != typeof d &&
                      console.error(
                        "This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"
                      ),
                    "function" != typeof m &&
                      console.error(
                        "This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://fb.me/react-polyfills"
                      ));
                  var F = null,
                    L = !1,
                    A = -1,
                    j = !1,
                    q = !1,
                    E = 0,
                    I = 33,
                    N = 33;
                  T = function () {
                    return E <= exports.unstable_now();
                  };
                  var B = new MessageChannel(),
                    D = B.port2;
                  B.port1.onmessage = function () {
                    L = !1;
                    var e = F,
                      n = A;
                    (F = null), (A = -1);
                    var t = exports.unstable_now(),
                      o = !1;
                    if (0 >= E - t) {
                      if (!(-1 !== n && n <= t))
                        return j || ((j = !0), w(O)), (F = e), void (A = n);
                      o = !0;
                    }
                    if (null !== e) {
                      q = !0;
                      try {
                        e(o);
                      } finally {
                        q = !1;
                      }
                    }
                  };
                  var O = function (e) {
                    if (null !== F) {
                      w(O);
                      var n = e - E + N;
                      n < N && I < N
                        ? (8 > n && (n = 8), (N = n < I ? I : n))
                        : (I = n),
                        (E = e + N),
                        L || ((L = !0), D.postMessage(void 0));
                    } else j = !1;
                  };
                  (h = function (e, n) {
                    (F = e),
                      (A = n),
                      q || 0 > n ? D.postMessage(void 0) : j || ((j = !0), w(O));
                  }),
                    (k = function () {
                      (F = null), (L = !1), (A = -1);
                    });
                }
                (exports.unstable_ImmediatePriority = 1),
                  (exports.unstable_UserBlockingPriority = 2),
                  (exports.unstable_NormalPriority = 3),
                  (exports.unstable_IdlePriority = 5),
                  (exports.unstable_LowPriority = 4),
                  (exports.unstable_runWithPriority = function (e, n) {
                    switch (e) {
                      case 1:
                      case 2:
                      case 3:
                      case 4:
                      case 5:
                        break;
                      default:
                        e = 3;
                    }
                    var t = o,
                      i = r;
                    (o = e), (r = exports.unstable_now());
                    try {
                      return n();
                    } finally {
                      (o = t), (r = i), f();
                    }
                  }),
                  (exports.unstable_next = function (e) {
                    switch (o) {
                      case 1:
                      case 2:
                      case 3:
                        var n = 3;
                        break;
                      default:
                        n = o;
                    }
                    var t = o,
                      i = r;
                    (o = n), (r = exports.unstable_now());
                    try {
                      return e();
                    } finally {
                      (o = t), (r = i), f();
                    }
                  }),
                  (exports.unstable_scheduleCallback = function (e, t) {
                    var i = -1 !== r ? r : exports.unstable_now();
                    if (
                      "object" == typeof t &&
                      null !== t &&
                      "number" == typeof t.timeout
                    )
                      t = i + t.timeout;
                    else
                      switch (o) {
                        case 1:
                          t = i + -1;
                          break;
                        case 2:
                          t = i + 250;
                          break;
                        case 5:
                          t = i + 1073741823;
                          break;
                        case 4:
                          t = i + 1e4;
                          break;
                        default:
                          t = i + 5e3;
                      }
                    if (
                      ((e = {
                        callback: e,
                        priorityLevel: o,
                        expirationTime: t,
                        next: null,
                        previous: null,
                      }),
                      null === n)
                    )
                      (n = e.next = e.previous = e), a();
                    else {
                      i = null;
                      var l = n;
                      do {
                        if (l.expirationTime > t) {
                          i = l;
                          break;
                        }
                        l = l.next;
                      } while (l !== n);
                      null === i ? (i = n) : i === n && ((n = e), a()),
                        ((t = i.previous).next = i.previous = e),
                        (e.next = i),
                        (e.previous = t);
                    }
                    return e;
                  }),
                  (exports.unstable_cancelCallback = function (e) {
                    var t = e.next;
                    if (null !== t) {
                      if (t === e) n = null;
                      else {
                        e === n && (n = t);
                        var o = e.previous;
                        (o.next = t), (t.previous = o);
                      }
                      e.next = e.previous = null;
                    }
                  }),
                  (exports.unstable_wrapCallback = function (e) {
                    var n = o;
                    return function () {
                      var t = o,
                        i = r;
                      (o = n), (r = exports.unstable_now());
                      try {
                        return e.apply(this, arguments);
                      } finally {
                        (o = t), (r = i), f();
                      }
                    };
                  }),
                  (exports.unstable_getCurrentPriorityLevel = function () {
                    return o;
                  }),
                  (exports.unstable_shouldYield = function () {
                    return !t && ((null !== n && n.expirationTime < i) || T());
                  }),
                  (exports.unstable_continueExecution = function () {
                    null !== n && a();
                  }),
                  (exports.unstable_pauseExecution = function () {}),
                  (exports.unstable_getFirstCallbackNode = function () {
                    return n;
                  });
              },
              {},
            ],
            //Ml9Nの処理を呼び出せるようにモジュール化している
            JlZK: [
              function (require, module, exports) {
                "use strict";
                module.exports = require("./cjs/scheduler.production.min.js");
              },
              {
                "./cjs/scheduler.production.min.js": "Nl9N",
              },
            ],
            //長いから保留するがマウス操作時の処理が書いてあった
            "5i0G": [
              function (require, module, exports) {
                "use strict";
                var e = require("react"),
                  t = require("object-assign"),
                  n = require("scheduler");
                function r(e, t, n, r, l, a, i, o) {
                  if (!e) {
                    if (((e = void 0), void 0 === t))
                      e = Error(
                        "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
                      );
                    else {
                      var u = [n, r, l, a, i, o],
                        c = 0;
                      (e = Error(
                        t.replace(/%s/g, function () {
                          return u[c++];
                        })
                      )).name = "Invariant Violation";
                    }
                    throw ((e.framesToPop = 1), e);
                  }
                }
                function l(e) {
                  for (
                    var t = arguments.length - 1,
                      n = "https://reactjs.org/docs/error-decoder.html?invariant=" + e,
                      l = 0;
                    l < t;
                    l++
                  )
                    n += "&args[]=" + encodeURIComponent(arguments[l + 1]);
                  r(
                    !1,
                    "Minified React error #" +
                      e +
                      "; visit %s for the full message or use the non-minified dev environment for full errors and additional helpful warnings. ",
                    n
                  );
                }
                function a(e, t, n, r, l, a, i, o, u) {
                  var c = Array.prototype.slice.call(arguments, 3);
                  try {
                    t.apply(n, c);
                  } catch (s) {
                    this.onError(s);
                  }
                }
                e || l("227");
                var i = !1,
                  o = null,
                  u = !1,
                  c = null,
                  s = {
                    onError: function (e) {
                      (i = !0), (o = e);
                    },
                  };
                function f(e, t, n, r, l, u, c, f, d) {
                  (i = !1), (o = null), a.apply(s, arguments);
                }
                function d(e, t, n, r, a, s, d, p, m) {
                  if ((f.apply(this, arguments), i)) {
                    if (i) {
                      var h = o;
                      (i = !1), (o = null);
                    } else l("198"), (h = void 0);
                    u || ((u = !0), (c = h));
                  }
                }
                var p = null,
                  m = {};
                function h() {
                  if (p)
                    for (var e in m) {
                      var t = m[e],
                        n = p.indexOf(e);
                      if ((-1 < n || l("96", e), !g[n]))
                        for (var r in (t.extractEvents || l("97", e),
                        (g[n] = t),
                        (n = t.eventTypes))) {
                          var a = void 0,
                            i = n[r],
                            o = t,
                            u = r;
                          y.hasOwnProperty(u) && l("99", u), (y[u] = i);
                          var c = i.phasedRegistrationNames;
                          if (c) {
                            for (a in c) c.hasOwnProperty(a) && v(c[a], o, u);
                            a = !0;
                          } else
                            i.registrationName
                              ? (v(i.registrationName, o, u), (a = !0))
                              : (a = !1);
                          a || l("98", r, e);
                        }
                    }
                }
                function v(e, t, n) {
                  b[e] && l("100", e),
                    (b[e] = t),
                    (k[e] = t.eventTypes[n].dependencies);
                }
                var g = [],
                  y = {},
                  b = {},
                  k = {},
                  x = null,
                  T = null,
                  w = null;
                function S(e, t, n) {
                  var r = e.type || "unknown-event";
                  (e.currentTarget = w(n)),
                    d(r, t, void 0, e),
                    (e.currentTarget = null);
                }
                function E(e, t) {
                  return (
                    null == t && l("30"),
                    null == e
                      ? t
                      : Array.isArray(e)
                      ? Array.isArray(t)
                        ? (e.push.apply(e, t), e)
                        : (e.push(t), e)
                      : Array.isArray(t)
                      ? [e].concat(t)
                      : [e, t]
                  );
                }
                function C(e, t, n) {
                  Array.isArray(e) ? e.forEach(t, n) : e && t.call(n, e);
                }
                var _ = null;
                function P(e) {
                  if (e) {
                    var t = e._dispatchListeners,
                      n = e._dispatchInstances;
                    if (Array.isArray(t))
                      for (var r = 0; r < t.length && !e.isPropagationStopped(); r++)
                        S(e, t[r], n[r]);
                    else t && S(e, t, n);
                    (e._dispatchListeners = null),
                      (e._dispatchInstances = null),
                      e.isPersistent() || e.constructor.release(e);
                  }
                }
                var N = {
                  injectEventPluginOrder: function (e) {
                    p && l("101"), (p = Array.prototype.slice.call(e)), h();
                  },
                  injectEventPluginsByName: function (e) {
                    var t,
                      n = !1;
                    for (t in e)
                      if (e.hasOwnProperty(t)) {
                        var r = e[t];
                        (m.hasOwnProperty(t) && m[t] === r) ||
                          (m[t] && l("102", t), (m[t] = r), (n = !0));
                      }
                    n && h();
                  },
                };
                function z(e, t) {
                  var n = e.stateNode;
                  if (!n) return null;
                  var r = x(n);
                  if (!r) return null;
                  n = r[t];
                  e: switch (t) {
                    case "onClick":
                    case "onClickCapture":
                    case "onDoubleClick":
                    case "onDoubleClickCapture":
                    case "onMouseDown":
                    case "onMouseDownCapture":
                    case "onMouseMove":
                    case "onMouseMoveCapture":
                    case "onMouseUp":
                    case "onMouseUpCapture":
                      (r = !r.disabled) ||
                        (r = !(
                          "button" === (e = e.type) ||
                          "input" === e ||
                          "select" === e ||
                          "textarea" === e
                        )),
                        (e = !r);
                      break e;
                    default:
                      e = !1;
                  }
                  return e
                    ? null
                    : (n && "function" != typeof n && l("231", t, typeof n), n);
                }
                function R(e) {
                  if (
                    (null !== e && (_ = E(_, e)),
                    (e = _),
                    (_ = null),
                    e && (C(e, P), _ && l("95"), u))
                  )
                    throw ((e = c), (u = !1), (c = null), e);
                }
                var U = Math.random().toString(36).slice(2),
                  I = "__reactInternalInstance$" + U,
                  M = "__reactEventHandlers$" + U;
                function D(e) {
                  if (e[I]) return e[I];
                  for (; !e[I]; ) {
                    if (!e.parentNode) return null;
                    e = e.parentNode;
                  }
                  return 5 === (e = e[I]).tag || 6 === e.tag ? e : null;
                }
                function O(e) {
                  return !(e = e[I]) || (5 !== e.tag && 6 !== e.tag) ? null : e;
                }
                function F(e) {
                  if (5 === e.tag || 6 === e.tag) return e.stateNode;
                  l("33");
                }
                function W(e, t, n) {
                  (t = z(e, n.dispatchConfig.phasedRegistrationNames[t])) &&
                    ((n._dispatchListeners = E(n._dispatchListeners, t)),
                    (n._dispatchInstances = E(n._dispatchInstances, e)));
                }
                function L(e) {
                  return e[M] || null;
                }
                //------------------------------追加した部分------------------------------
                function A(e) {
                  do {
                    e = e.return;
                  } while (e && 5 !== e.tag);
                  return e || null;
                }
                function V(e) {
                  if (e && e.dispatchConfig.phasedRegistrationNames) {
                    for (var t = e._targetInst, n = []; t; ) n.push(t), (t = A(t));
                    for (t = n.length; 0 < t--; ) W(n[t], "captured", e);
                    for (t = 0; t < n.length; t++) W(n[t], "bubbled", e);
                  }
                }
                //------------------------------追加した部分------------------------------
                function j(e, t, n) {
                  e &&
                    n &&
                    n.dispatchConfig.registrationName &&
                    (t = z(e, n.dispatchConfig.registrationName)) &&
                    ((n._dispatchListeners = E(n._dispatchListeners, t)),
                    (n._dispatchInstances = E(n._dispatchInstances, e)));
                }
                function B(e) {
                  e && e.dispatchConfig.registrationName && j(e._targetInst, null, e);
                }
                //plottypeに必要？
                function H(e) {
                  C(e, V);
                }
                var Q = !(
                  "undefined" == typeof window ||
                  !window.document ||
                  !window.document.createElement
                );
                function K(e, t) {
                  var n = {};
                  return (
                    (n[e.toLowerCase()] = t.toLowerCase()),
                    (n["Webkit" + e] = "webkit" + t),
                    (n["Moz" + e] = "moz" + t),
                    n
                  );
                }
                var $ = {
                    animationend: K("Animation", "AnimationEnd"),
                    animationiteration: K("Animation", "AnimationIteration"),
                    animationstart: K("Animation", "AnimationStart"),
                    transitionend: K("Transition", "TransitionEnd"),
                  },
                  q = {},
                  Y = {};
                function X(e) {
                  if (q[e]) return q[e];
                  if (!$[e]) return e;
                  var t,
                    n = $[e];
                  for (t in n) if (n.hasOwnProperty(t) && t in Y) return (q[e] = n[t]);
                  return e;
                }
                Q &&
                  ((Y = document.createElement("div").style),
                  "AnimationEvent" in window ||
                    (delete $.animationend.animation,
                    delete $.animationiteration.animation,
                    delete $.animationstart.animation),
                  "TransitionEvent" in window || delete $.transitionend.transition);
                var G = X("animationend"),
                  Z = X("animationiteration"),
                  J = X("animationstart"),
                  ee = X("transitionend"),
                  te =
                    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting".split(
                      " "
                    ),
                  ne = null,
                  re = null,
                  le = null;
                function ae() {
                  if (le) return le;
                  var e,
                    t,
                    n = re,
                    r = n.length,
                    l = "value" in ne ? ne.value : ne.textContent,
                    a = l.length;
                  for (e = 0; e < r && n[e] === l[e]; e++);
                  var i = r - e;
                  for (t = 1; t <= i && n[r - t] === l[a - t]; t++);
                  return (le = l.slice(e, 1 < t ? 1 - t : void 0));
                }
                function ie() {
                  return !0;
                }
                function oe() {
                  return !1;
                }
                function ue(e, t, n, r) {
                  for (var l in ((this.dispatchConfig = e),
                  (this._targetInst = t),
                  (this.nativeEvent = n),
                  (e = this.constructor.Interface)))
                    e.hasOwnProperty(l) &&
                      ((t = e[l])
                        ? (this[l] = t(n))
                        : "target" === l
                        ? (this.target = r)
                        : (this[l] = n[l]));
                  return (
                    (this.isDefaultPrevented = (
                      null != n.defaultPrevented
                        ? n.defaultPrevented
                        : !1 === n.returnValue
                    )
                      ? ie
                      : oe),
                    (this.isPropagationStopped = oe),
                    this
                  );
                }
                function ce(e, t, n, r) {
                  if (this.eventPool.length) {
                    var l = this.eventPool.pop();
                    return this.call(l, e, t, n, r), l;
                  }
                  return new this(e, t, n, r);
                }
                function se(e) {
                  e instanceof this || l("279"),
                    e.destructor(),
                    10 > this.eventPool.length && this.eventPool.push(e);
                }
                function fe(e) {
                  (e.eventPool = []), (e.getPooled = ce), (e.release = se);
                }
                t(ue.prototype, {
                  preventDefault: function () {
                    this.defaultPrevented = !0;
                    var e = this.nativeEvent;
                    e &&
                      (e.preventDefault
                        ? e.preventDefault()
                        : "unknown" != typeof e.returnValue && (e.returnValue = !1),
                      (this.isDefaultPrevented = ie));
                  },
                  stopPropagation: function () {
                    var e = this.nativeEvent;
                    e &&
                      (e.stopPropagation
                        ? e.stopPropagation()
                        : "unknown" != typeof e.cancelBubble && (e.cancelBubble = !0),
                      (this.isPropagationStopped = ie));
                  },
                  persist: function () {
                    this.isPersistent = ie;
                  },
                  isPersistent: oe,
                  destructor: function () {
                    var e,
                      t = this.constructor.Interface;
                    for (e in t) this[e] = null;
                    (this.nativeEvent = this._targetInst = this.dispatchConfig = null),
                      (this.isPropagationStopped = this.isDefaultPrevented = oe),
                      (this._dispatchInstances = this._dispatchListeners = null);
                  },
                }),
                  (ue.Interface = {
                    type: null,
                    target: null,
                    currentTarget: function () {
                      return null;
                    },
                    eventPhase: null,
                    bubbles: null,
                    cancelable: null,
                    timeStamp: function (e) {
                      return e.timeStamp || Date.now();
                    },
                    defaultPrevented: null,
                    isTrusted: null,
                  }),
                  (ue.extend = function (e) {
                    function n() {}
                    function r() {
                      return l.apply(this, arguments);
                    }
                    var l = this;
                    n.prototype = l.prototype;
                    var a = new n();
                    return (
                      t(a, r.prototype),
                      (r.prototype = a),
                      (r.prototype.constructor = r),
                      (r.Interface = t({}, l.Interface, e)),
                      (r.extend = l.extend),
                      fe(r),
                      r
                    );
                  }),
                  fe(ue);
                var de = ue.extend({
                    data: null,
                  }),
                  pe = ue.extend({
                    data: null,
                  }),
                  me = [9, 13, 27, 32],
                  he = Q && "CompositionEvent" in window,
                  ve = null;
                Q && "documentMode" in document && (ve = document.documentMode);
                var ge = Q && "TextEvent" in window && !ve,
                  ye = Q && (!he || (ve && 8 < ve && 11 >= ve)),
                  be = String.fromCharCode(32),
                  ke = {
                    beforeInput: {
                      phasedRegistrationNames: {
                        bubbled: "onBeforeInput",
                        captured: "onBeforeInputCapture",
                      },
                      dependencies: [
                        "compositionend",
                        "keypress",
                        "textInput",
                        "paste",
                      ],
                    },
                    compositionEnd: {
                      phasedRegistrationNames: {
                        bubbled: "onCompositionEnd",
                        captured: "onCompositionEndCapture",
                      },
                      dependencies:
                        "blur compositionend keydown keypress keyup mousedown".split(
                          " "
                        ),
                    },
                    compositionStart: {
                      phasedRegistrationNames: {
                        bubbled: "onCompositionStart",
                        captured: "onCompositionStartCapture",
                      },
                      dependencies:
                        "blur compositionstart keydown keypress keyup mousedown".split(
                          " "
                        ),
                    },
                    compositionUpdate: {
                      phasedRegistrationNames: {
                        bubbled: "onCompositionUpdate",
                        captured: "onCompositionUpdateCapture",
                      },
                      dependencies:
                        "blur compositionupdate keydown keypress keyup mousedown".split(
                          " "
                        ),
                    },
                  },
                  xe = !1;
                function Te(e, t) {
                  switch (e) {
                    case "keyup":
                      return -1 !== me.indexOf(t.keyCode);
                    case "keydown":
                      return 229 !== t.keyCode;
                    case "keypress":
                    case "mousedown":
                    case "blur":
                      return !0;
                    default:
                      return !1;
                  }
                }
                function we(e) {
                  return "object" == typeof (e = e.detail) && "data" in e
                    ? e.data
                    : null;
                }
                var Se = !1;
                function Ee(e, t) {
                  switch (e) {
                    case "compositionend":
                      return we(t);
                    case "keypress":
                      return 32 !== t.which ? null : ((xe = !0), be);
                    case "textInput":
                      return (e = t.data) === be && xe ? null : e;
                    default:
                      return null;
                  }
                }
                function Ce(e, t) {
                  if (Se)
                    return "compositionend" === e || (!he && Te(e, t))
                      ? ((e = ae()), (le = re = ne = null), (Se = !1), e)
                      : null;
                  switch (e) {
                    case "paste":
                      return null;
                    case "keypress":
                      if (
                        !(t.ctrlKey || t.altKey || t.metaKey) ||
                        (t.ctrlKey && t.altKey)
                      ) {
                        if (t.char && 1 < t.char.length) return t.char;
                        if (t.which) return String.fromCharCode(t.which);
                      }
                      return null;
                    case "compositionend":
                      return ye && "ko" !== t.locale ? null : t.data;
                    default:
                      return null;
                  }
                }
                var _e = {
                    eventTypes: ke,
                    extractEvents: function (e, t, n, r) {
                      var l = void 0,
                        a = void 0;
                      if (he)
                        e: {
                          switch (e) {
                            case "compositionstart":
                              l = ke.compositionStart;
                              break e;
                            case "compositionend":
                              l = ke.compositionEnd;
                              break e;
                            case "compositionupdate":
                              l = ke.compositionUpdate;
                              break e;
                          }
                          l = void 0;
                        }
                      else
                        Se
                          ? Te(e, n) && (l = ke.compositionEnd)
                          : "keydown" === e &&
                            229 === n.keyCode &&
                            (l = ke.compositionStart);
                      return (
                        l
                          ? (ye &&
                              "ko" !== n.locale &&
                              (Se || l !== ke.compositionStart
                                ? l === ke.compositionEnd && Se && (a = ae())
                                : ((re =
                                    "value" in (ne = r) ? ne.value : ne.textContent),
                                  (Se = !0))),
                            (l = de.getPooled(l, t, n, r)),
                            a ? (l.data = a) : null !== (a = we(n)) && (l.data = a),
                            H(l),
                            (a = l))
                          : (a = null),
                        (e = ge ? Ee(e, n) : Ce(e, n))
                          ? (((t = pe.getPooled(ke.beforeInput, t, n, r)).data = e),
                            H(t))
                          : (t = null),
                        null === a ? t : null === t ? a : [a, t]
                      );
                    },
                  },
                  Pe = null,
                  Ne = null,
                  ze = null;
                function Re(e) {
                  if ((e = T(e))) {
                    "function" != typeof Pe && l("280");
                    var t = x(e.stateNode);
                    Pe(e.stateNode, e.type, t);
                  }
                }
                function Ue(e) {
                  Ne ? (ze ? ze.push(e) : (ze = [e])) : (Ne = e);
                }
                function Ie() {
                  if (Ne) {
                    var e = Ne,
                      t = ze;
                    if (((ze = Ne = null), Re(e), t))
                      for (e = 0; e < t.length; e++) Re(t[e]);
                  }
                }
                function Me(e, t) {
                  return e(t);
                }
                function De(e, t, n) {
                  return e(t, n);
                }
                function Oe() {}
                var Fe = !1;
                function Le(e, t) {
                  if (Fe) return e(t);
                  Fe = !0;
                  try {
                    return Me(e, t);
                  } finally {
                    (Fe = !1), (null !== Ne || null !== ze) && (Oe(), Ie());
                  }
                }
                var Ae = {
                  color: !0,
                  date: !0,
                  datetime: !0,
                  "datetime-local": !0,
                  email: !0,
                  month: !0,
                  number: !0,
                  password: !0,
                  range: !0,
                  search: !0,
                  tel: !0,
                  text: !0,
                  time: !0,
                  url: !0,
                  week: !0,
                };
                function We(e) {
                  var t = e && e.nodeName && e.nodeName.toLowerCase();
                  return "input" === t ? !!Ae[e.type] : "textarea" === t;
                }
                function Ve(e) {
                  return (
                    (e = e.target || e.srcElement || window).correspondingUseElement &&
                      (e = e.correspondingUseElement),
                    3 === e.nodeType ? e.parentNode : e
                  );
                }
                function je(e) {
                  if (!Q) return !1;
                  var t = (e = "on" + e) in document;
                  return (
                    t ||
                      ((t = document.createElement("div")).setAttribute(e, "return;"),
                      (t = "function" == typeof t[e])),
                    t
                  );
                }
                function Be(e) {
                  var t = e.type;
                  return (
                    (e = e.nodeName) &&
                    "input" === e.toLowerCase() &&
                    ("checkbox" === t || "radio" === t)
                  );
                }
                function He(e) {
                  var t = Be(e) ? "checked" : "value",
                    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
                    r = "" + e[t];
                  if (
                    !e.hasOwnProperty(t) &&
                    void 0 !== n &&
                    "function" == typeof n.get &&
                    "function" == typeof n.set
                  ) {
                    var l = n.get,
                      a = n.set;
                    return (
                      Object.defineProperty(e, t, {
                        configurable: !0,
                        get: function () {
                          return l.call(this);
                        },
                        set: function (e) {
                          (r = "" + e), a.call(this, e);
                        },
                      }),
                      Object.defineProperty(e, t, {
                        enumerable: n.enumerable,
                      }),
                      {
                        getValue: function () {
                          return r;
                        },
                        setValue: function (e) {
                          r = "" + e;
                        },
                        stopTracking: function () {
                          (e._valueTracker = null), delete e[t];
                        },
                      }
                    );
                  }
                }
                function Qe(e) {
                  e._valueTracker || (e._valueTracker = He(e));
                }
                function Ke(e) {
                  if (!e) return !1;
                  var t = e._valueTracker;
                  if (!t) return !0;
                  var n = t.getValue(),
                    r = "";
                  return (
                    e && (r = Be(e) ? (e.checked ? "true" : "false") : e.value),
                    (e = r) !== n && (t.setValue(e), !0)
                  );
                }
                var $e = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
                $e.hasOwnProperty("ReactCurrentDispatcher") ||
                  ($e.ReactCurrentDispatcher = {
                    current: null,
                  });
                var qe = /^(.*)[\\\/]/,
                  Ye = "function" == typeof Symbol && Symbol.for,
                  Xe = Ye ? Symbol.for("react.element") : 60103,
                  Ge = Ye ? Symbol.for("react.portal") : 60106,
                  Ze = Ye ? Symbol.for("react.fragment") : 60107,
                  Je = Ye ? Symbol.for("react.strict_mode") : 60108,
                  et = Ye ? Symbol.for("react.profiler") : 60114,
                  tt = Ye ? Symbol.for("react.provider") : 60109,
                  nt = Ye ? Symbol.for("react.context") : 60110,
                  rt = Ye ? Symbol.for("react.concurrent_mode") : 60111,
                  lt = Ye ? Symbol.for("react.forward_ref") : 60112,
                  at = Ye ? Symbol.for("react.suspense") : 60113,
                  it = Ye ? Symbol.for("react.memo") : 60115,
                  ot = Ye ? Symbol.for("react.lazy") : 60116,
                  ut = "function" == typeof Symbol && Symbol.iterator;
                function ct(e) {
                  return null === e || "object" != typeof e
                    ? null
                    : "function" == typeof (e = (ut && e[ut]) || e["@@iterator"])
                    ? e
                    : null;
                }
                function st(e) {
                  if (null == e) return null;
                  if ("function" == typeof e) return e.displayName || e.name || null;
                  if ("string" == typeof e) return e;
                  switch (e) {
                    case rt:
                      return "ConcurrentMode";
                    case Ze:
                      return "Fragment";
                    case Ge:
                      return "Portal";
                    case et:
                      return "Profiler";
                    case Je:
                      return "StrictMode";
                    case at:
                      return "Suspense";
                  }
                  if ("object" == typeof e)
                    switch (e.$$typeof) {
                      case nt:
                        return "Context.Consumer";
                      case tt:
                        return "Context.Provider";
                      case lt:
                        var t = e.render;
                        return (
                          (t = t.displayName || t.name || ""),
                          e.displayName ||
                            ("" !== t ? "ForwardRef(" + t + ")" : "ForwardRef")
                        );
                      case it:
                        return st(e.type);
                      case ot:
                        if ((e = 1 === e._status ? e._result : null)) return st(e);
                    }
                  return null;
                }
                function ft(e) {
                  var t = "";
                  do {
                    e: switch (e.tag) {
                      case 3:
                      case 4:
                      case 6:
                      case 7:
                      case 10:
                      case 9:
                        var n = "";
                        break e;
                      default:
                        var r = e._debugOwner,
                          l = e._debugSource,
                          a = st(e.type);
                        (n = null),
                          r && (n = st(r.type)),
                          (r = a),
                          (a = ""),
                          l
                            ? (a =
                                " (at " +
                                l.fileName.replace(qe, "") +
                                ":" +
                                l.lineNumber +
                                ")")
                            : n && (a = " (created by " + n + ")"),
                          (n = "\n    in " + (r || "Unknown") + a);
                    }
                    (t += n), (e = e.return);
                  } while (e);
                  return t;
                }
                var dt =
                    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
                  pt = Object.prototype.hasOwnProperty,
                  mt = {},
                  ht = {};
                function vt(e) {
                  return (
                    !!pt.call(ht, e) ||
                    (!pt.call(mt, e) &&
                      (dt.test(e) ? (ht[e] = !0) : ((mt[e] = !0), !1)))
                  );
                }
                function gt(e, t, n, r) {
                  if (null !== n && 0 === n.type) return !1;
                  switch (typeof t) {
                    case "function":
                    case "symbol":
                      return !0;
                    case "boolean":
                      return (
                        !r &&
                        (null !== n
                          ? !n.acceptsBooleans
                          : "data-" !== (e = e.toLowerCase().slice(0, 5)) &&
                            "aria-" !== e)
                      );
                    default:
                      return !1;
                  }
                }
                function yt(e, t, n, r) {
                  if (null == t || gt(e, t, n, r)) return !0;
                  if (r) return !1;
                  if (null !== n)
                    switch (n.type) {
                      case 3:
                        return !t;
                      case 4:
                        return !1 === t;
                      case 5:
                        return isNaN(t);
                      case 6:
                        return isNaN(t) || 1 > t;
                    }
                  return !1;
                }
                function bt(e, t, n, r, l) {
                  (this.acceptsBooleans = 2 === t || 3 === t || 4 === t),
                    (this.attributeName = r),
                    (this.attributeNamespace = l),
                    (this.mustUseProperty = n),
                    (this.propertyName = e),
                    (this.type = t);
                }
                var kt = {};
                "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
                  .split(" ")
                  .forEach(function (e) {
                    kt[e] = new bt(e, 0, !1, e, null);
                  }),
                  [
                    ["acceptCharset", "accept-charset"],
                    ["className", "class"],
                    ["htmlFor", "for"],
                    ["httpEquiv", "http-equiv"],
                  ].forEach(function (e) {
                    var t = e[0];
                    kt[t] = new bt(t, 1, !1, e[1], null);
                  }),
                  ["contentEditable", "draggable", "spellCheck", "value"].forEach(
                    function (e) {
                      kt[e] = new bt(e, 2, !1, e.toLowerCase(), null);
                    }
                  ),
                  [
                    "autoReverse",
                    "externalResourcesRequired",
                    "focusable",
                    "preserveAlpha",
                  ].forEach(function (e) {
                    kt[e] = new bt(e, 2, !1, e, null);
                  }),
                  "allowFullScreen async autoFocus autoPlay controls default defer disabled formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
                    .split(" ")
                    .forEach(function (e) {
                      kt[e] = new bt(e, 3, !1, e.toLowerCase(), null);
                    }),
                  ["checked", "multiple", "muted", "selected"].forEach(function (e) {
                    kt[e] = new bt(e, 3, !0, e, null);
                  }),
                  ["capture", "download"].forEach(function (e) {
                    kt[e] = new bt(e, 4, !1, e, null);
                  }),
                  ["cols", "rows", "size", "span"].forEach(function (e) {
                    kt[e] = new bt(e, 6, !1, e, null);
                  }),
                  ["rowSpan", "start"].forEach(function (e) {
                    kt[e] = new bt(e, 5, !1, e.toLowerCase(), null);
                  });
                var xt = /[\-:]([a-z])/g;
                function Tt(e) {
                  return e[1].toUpperCase();
                }
                function wt(e, t, n, r) {
                  var l = kt.hasOwnProperty(t) ? kt[t] : null;
                  (null !== l
                    ? 0 === l.type
                    : !r &&
                      2 < t.length &&
                      ("o" === t[0] || "O" === t[0]) &&
                      ("n" === t[1] || "N" === t[1])) ||
                    (yt(t, n, l, r) && (n = null),
                    r || null === l
                      ? vt(t) &&
                        (null === n ? e.removeAttribute(t) : e.setAttribute(t, "" + n))
                      : l.mustUseProperty
                      ? (e[l.propertyName] = null === n ? 3 !== l.type && "" : n)
                      : ((t = l.attributeName),
                        (r = l.attributeNamespace),
                        null === n
                          ? e.removeAttribute(t)
                          : ((n =
                              3 === (l = l.type) || (4 === l && !0 === n)
                                ? ""
                                : "" + n),
                            r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
                }
                function St(e) {
                  switch (typeof e) {
                    case "boolean":
                    case "number":
                    case "object":
                    case "string":
                    case "undefined":
                      return e;
                    default:
                      return "";
                  }
                }
                function Et(e, n) {
                  var r = n.checked;
                  return t({}, n, {
                    defaultChecked: void 0,
                    defaultValue: void 0,
                    value: void 0,
                    checked: null != r ? r : e._wrapperState.initialChecked,
                  });
                }
                function Ct(e, t) {
                  var n = null == t.defaultValue ? "" : t.defaultValue,
                    r = null != t.checked ? t.checked : t.defaultChecked;
                  (n = St(null != t.value ? t.value : n)),
                    (e._wrapperState = {
                      initialChecked: r,
                      initialValue: n,
                      controlled:
                        "checkbox" === t.type || "radio" === t.type
                          ? null != t.checked
                          : null != t.value,
                    });
                }
                function _t(e, t) {
                  null != (t = t.checked) && wt(e, "checked", t, !1);
                }
                function Pt(e, t) {
                  _t(e, t);
                  var n = St(t.value),
                    r = t.type;
                  if (null != n)
                    "number" === r
                      ? ((0 === n && "" === e.value) || e.value != n) &&
                        (e.value = "" + n)
                      : e.value !== "" + n && (e.value = "" + n);
                  else if ("submit" === r || "reset" === r)
                    return void e.removeAttribute("value");
                  t.hasOwnProperty("value")
                    ? zt(e, t.type, n)
                    : t.hasOwnProperty("defaultValue") &&
                      zt(e, t.type, St(t.defaultValue)),
                    null == t.checked &&
                      null != t.defaultChecked &&
                      (e.defaultChecked = !!t.defaultChecked);
                }
                function Nt(e, t, n) {
                  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
                    var r = t.type;
                    if (
                      !(
                        ("submit" !== r && "reset" !== r) ||
                        (void 0 !== t.value && null !== t.value)
                      )
                    )
                      return;
                    (t = "" + e._wrapperState.initialValue),
                      n || t === e.value || (e.value = t),
                      (e.defaultValue = t);
                  }
                  "" !== (n = e.name) && (e.name = ""),
                    (e.defaultChecked = !e.defaultChecked),
                    (e.defaultChecked = !!e._wrapperState.initialChecked),
                    "" !== n && (e.name = n);
                }
                function zt(e, t, n) {
                  ("number" === t && e.ownerDocument.activeElement === e) ||
                    (null == n
                      ? (e.defaultValue = "" + e._wrapperState.initialValue)
                      : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
                }
                "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
                  .split(" ")
                  .forEach(function (e) {
                    var t = e.replace(xt, Tt);
                    kt[t] = new bt(t, 1, !1, e, null);
                  }),
                  "xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type"
                    .split(" ")
                    .forEach(function (e) {
                      var t = e.replace(xt, Tt);
                      kt[t] = new bt(t, 1, !1, e, "http://www.w3.org/1999/xlink");
                    }),
                  ["xml:base", "xml:lang", "xml:space"].forEach(function (e) {
                    var t = e.replace(xt, Tt);
                    kt[t] = new bt(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace");
                  }),
                  ["tabIndex", "crossOrigin"].forEach(function (e) {
                    kt[e] = new bt(e, 1, !1, e.toLowerCase(), null);
                  });
                var Rt = {
                  change: {
                    phasedRegistrationNames: {
                      bubbled: "onChange",
                      captured: "onChangeCapture",
                    },
                    dependencies:
                      "blur change click focus input keydown keyup selectionchange".split(
                        " "
                      ),
                  },
                };
                function Ut(e, t, n) {
                  return (
                    ((e = ue.getPooled(Rt.change, e, t, n)).type = "change"),
                    Ue(n),
                    H(e),
                    e
                  );
                }
                var It = null,
                  Mt = null;
                function Dt(e) {
                  R(e);
                }
                function Ot(e) {
                  if (Ke(F(e))) return e;
                }
                function Ft(e, t) {
                  if ("change" === e) return t;
                }
                var Lt = !1;
                function At() {
                  It && (It.detachEvent("onpropertychange", Wt), (Mt = It = null));
                }
                function Wt(e) {
                  "value" === e.propertyName &&
                    Ot(Mt) &&
                    Le(Dt, (e = Ut(Mt, e, Ve(e))));
                }
                function Vt(e, t, n) {
                  "focus" === e
                    ? (At(), (Mt = n), (It = t).attachEvent("onpropertychange", Wt))
                    : "blur" === e && At();
                }
                function jt(e) {
                  if ("selectionchange" === e || "keyup" === e || "keydown" === e)
                    return Ot(Mt);
                }
                function Bt(e, t) {
                  if ("click" === e) return Ot(t);
                }
                function Ht(e, t) {
                  if ("input" === e || "change" === e) return Ot(t);
                }
                Q &&
                  (Lt =
                    je("input") &&
                    (!document.documentMode || 9 < document.documentMode));
                var Qt = {
                    eventTypes: Rt,
                    _isInputEventSupported: Lt,
                    extractEvents: function (e, t, n, r) {
                      var l = t ? F(t) : window,
                        a = void 0,
                        i = void 0,
                        o = l.nodeName && l.nodeName.toLowerCase();
                      if (
                        ("select" === o || ("input" === o && "file" === l.type)
                          ? (a = Ft)
                          : We(l)
                          ? Lt
                            ? (a = Ht)
                            : ((a = jt), (i = Vt))
                          : (o = l.nodeName) &&
                            "input" === o.toLowerCase() &&
                            ("checkbox" === l.type || "radio" === l.type) &&
                            (a = Bt),
                        a && (a = a(e, t)))
                      )
                        return Ut(a, n, r);
                      i && i(e, l, t),
                        "blur" === e &&
                          (e = l._wrapperState) &&
                          e.controlled &&
                          "number" === l.type &&
                          zt(l, "number", l.value);
                    },
                  },
                  Kt = ue.extend({
                    view: null,
                    detail: null,
                  }),
                  $t = {
                    Alt: "altKey",
                    Control: "ctrlKey",
                    Meta: "metaKey",
                    Shift: "shiftKey",
                  };
                function qt(e) {
                  var t = this.nativeEvent;
                  return t.getModifierState
                    ? t.getModifierState(e)
                    : !!(e = $t[e]) && !!t[e];
                }
                function Yt() {
                  return qt;
                }
                var Xt = 0,
                  Gt = 0,
                  Zt = !1,
                  Jt = !1,
                  en = Kt.extend({
                    screenX: null,
                    screenY: null,
                    clientX: null,
                    clientY: null,
                    pageX: null,
                    pageY: null,
                    ctrlKey: null,
                    shiftKey: null,
                    altKey: null,
                    metaKey: null,
                    getModifierState: Yt,
                    button: null,
                    buttons: null,
                    relatedTarget: function (e) {
                      return (
                        e.relatedTarget ||
                        (e.fromElement === e.srcElement ? e.toElement : e.fromElement)
                      );
                    },
                    movementX: function (e) {
                      if ("movementX" in e) return e.movementX;
                      var t = Xt;
                      return (
                        (Xt = e.screenX),
                        Zt
                          ? "mousemove" === e.type
                            ? e.screenX - t
                            : 0
                          : ((Zt = !0), 0)
                      );
                    },
                    movementY: function (e) {
                      if ("movementY" in e) return e.movementY;
                      var t = Gt;
                      return (
                        (Gt = e.screenY),
                        Jt
                          ? "mousemove" === e.type
                            ? e.screenY - t
                            : 0
                          : ((Jt = !0), 0)
                      );
                    },
                  }),
                  tn = en.extend({
                    pointerId: null,
                    width: null,
                    height: null,
                    pressure: null,
                    tangentialPressure: null,
                    tiltX: null,
                    tiltY: null,
                    twist: null,
                    pointerType: null,
                    isPrimary: null,
                  }),
                  nn = {
                    mouseEnter: {
                      registrationName: "onMouseEnter",
                      dependencies: ["mouseout", "mouseover"],
                    },
                    mouseLeave: {
                      registrationName: "onMouseLeave",
                      dependencies: ["mouseout", "mouseover"],
                    },
                    pointerEnter: {
                      registrationName: "onPointerEnter",
                      dependencies: ["pointerout", "pointerover"],
                    },
                    pointerLeave: {
                      registrationName: "onPointerLeave",
                      dependencies: ["pointerout", "pointerover"],
                    },
                  },
                  rn = {
                    eventTypes: nn,
                    extractEvents: function (e, t, n, r) {
                      var l = "mouseover" === e || "pointerover" === e,
                        a = "mouseout" === e || "pointerout" === e;
                      if ((l && (n.relatedTarget || n.fromElement)) || (!a && !l))
                        return null;
                      if (
                        ((l =
                          r.window === r
                            ? r
                            : (l = r.ownerDocument)
                            ? l.defaultView || l.parentWindow
                            : window),
                        a
                          ? ((a = t),
                            (t = (t = n.relatedTarget || n.toElement) ? D(t) : null))
                          : (a = null),
                        a === t)
                      )
                        return null;
                      var i = void 0,
                        o = void 0,
                        u = void 0,
                        c = void 0;
                      "mouseout" === e || "mouseover" === e
                        ? ((i = en),
                          (o = nn.mouseLeave),
                          (u = nn.mouseEnter),
                          (c = "mouse"))
                        : ("pointerout" !== e && "pointerover" !== e) ||
                          ((i = tn),
                          (o = nn.pointerLeave),
                          (u = nn.pointerEnter),
                          (c = "pointer"));
                      var s = null == a ? l : F(a);
                      if (
                        ((l = null == t ? l : F(t)),
                        ((e = i.getPooled(o, a, n, r)).type = c + "leave"),
                        (e.target = s),
                        (e.relatedTarget = l),
                        ((n = i.getPooled(u, t, n, r)).type = c + "enter"),
                        (n.target = l),
                        (n.relatedTarget = s),
                        (r = t),
                        a && r)
                      )
                        e: {
                          for (l = r, c = 0, i = t = a; i; i = A(i)) c++;
                          for (i = 0, u = l; u; u = A(u)) i++;
                          for (; 0 < c - i; ) (t = A(t)), c--;
                          for (; 0 < i - c; ) (l = A(l)), i--;
                          for (; c--; ) {
                            if (t === l || t === l.alternate) break e;
                            (t = A(t)), (l = A(l));
                          }
                          t = null;
                        }
                      else t = null;
                      for (
                        l = t, t = [];
                        a && a !== l && (null === (c = a.alternate) || c !== l);
        
                      )
                        t.push(a), (a = A(a));
                      for (
                        a = [];
                        r && r !== l && (null === (c = r.alternate) || c !== l);
        
                      )
                        a.push(r), (r = A(r));
                      for (r = 0; r < t.length; r++) j(t[r], "bubbled", e);
                      for (r = a.length; 0 < r--; ) j(a[r], "captured", n);
                      return [e, n];
                    },
                  };
                function ln(e, t) {
                  return (e === t && (0 !== e || 1 / e == 1 / t)) || (e != e && t != t);
                }
                var an = Object.prototype.hasOwnProperty;
                function on(e, t) {
                  if (ln(e, t)) return !0;
                  if (
                    "object" != typeof e ||
                    null === e ||
                    "object" != typeof t ||
                    null === t
                  )
                    return !1;
                  var n = Object.keys(e),
                    r = Object.keys(t);
                  if (n.length !== r.length) return !1;
                  for (r = 0; r < n.length; r++)
                    if (!an.call(t, n[r]) || !ln(e[n[r]], t[n[r]])) return !1;
                  return !0;
                }
                function un(e) {
                  var t = e;
                  if (e.alternate) for (; t.return; ) t = t.return;
                  else {
                    if (0 != (2 & t.effectTag)) return 1;
                    for (; t.return; )
                      if (0 != (2 & (t = t.return).effectTag)) return 1;
                  }
                  return 3 === t.tag ? 2 : 3;
                }
                function cn(e) {
                  2 !== un(e) && l("188");
                }
                function sn(e) {
                  var t = e.alternate;
                  if (!t) return 3 === (t = un(e)) && l("188"), 1 === t ? null : e;
                  for (var n = e, r = t; ; ) {
                    var a = n.return,
                      i = a ? a.alternate : null;
                    if (!a || !i) break;
                    if (a.child === i.child) {
                      for (var o = a.child; o; ) {
                        if (o === n) return cn(a), e;
                        if (o === r) return cn(a), t;
                        o = o.sibling;
                      }
                      l("188");
                    }
                    if (n.return !== r.return) (n = a), (r = i);
                    else {
                      o = !1;
                      for (var u = a.child; u; ) {
                        if (u === n) {
                          (o = !0), (n = a), (r = i);
                          break;
                        }
                        if (u === r) {
                          (o = !0), (r = a), (n = i);
                          break;
                        }
                        u = u.sibling;
                      }
                      if (!o) {
                        for (u = i.child; u; ) {
                          if (u === n) {
                            (o = !0), (n = i), (r = a);
                            break;
                          }
                          if (u === r) {
                            (o = !0), (r = i), (n = a);
                            break;
                          }
                          u = u.sibling;
                        }
                        o || l("189");
                      }
                    }
                    n.alternate !== r && l("190");
                  }
                  return 3 !== n.tag && l("188"), n.stateNode.current === n ? e : t;
                }
                function fn(e) {
                  if (!(e = sn(e))) return null;
                  for (var t = e; ; ) {
                    if (5 === t.tag || 6 === t.tag) return t;
                    if (t.child) (t.child.return = t), (t = t.child);
                    else {
                      if (t === e) break;
                      for (; !t.sibling; ) {
                        if (!t.return || t.return === e) return null;
                        t = t.return;
                      }
                      (t.sibling.return = t.return), (t = t.sibling);
                    }
                  }
                  return null;
                }
                var dn = ue.extend({
                    animationName: null,
                    elapsedTime: null,
                    pseudoElement: null,
                  }),
                  pn = ue.extend({
                    clipboardData: function (e) {
                      return "clipboardData" in e
                        ? e.clipboardData
                        : window.clipboardData;
                    },
                  }),
                  mn = Kt.extend({
                    relatedTarget: null,
                  });
                function hn(e) {
                  var t = e.keyCode;
                  return (
                    "charCode" in e
                      ? 0 === (e = e.charCode) && 13 === t && (e = 13)
                      : (e = t),
                    10 === e && (e = 13),
                    32 <= e || 13 === e ? e : 0
                  );
                }
                var vn = {
                    Esc: "Escape",
                    Spacebar: " ",
                    Left: "ArrowLeft",
                    Up: "ArrowUp",
                    Right: "ArrowRight",
                    Down: "ArrowDown",
                    Del: "Delete",
                    Win: "OS",
                    Menu: "ContextMenu",
                    Apps: "ContextMenu",
                    Scroll: "ScrollLock",
                    MozPrintableKey: "Unidentified",
                  },
                  gn = {
                    8: "Backspace",
                    9: "Tab",
                    12: "Clear",
                    13: "Enter",
                    16: "Shift",
                    17: "Control",
                    18: "Alt",
                    19: "Pause",
                    20: "CapsLock",
                    27: "Escape",
                    32: " ",
                    33: "PageUp",
                    34: "PageDown",
                    35: "End",
                    36: "Home",
                    37: "ArrowLeft",
                    38: "ArrowUp",
                    39: "ArrowRight",
                    40: "ArrowDown",
                    45: "Insert",
                    46: "Delete",
                    112: "F1",
                    113: "F2",
                    114: "F3",
                    115: "F4",
                    116: "F5",
                    117: "F6",
                    118: "F7",
                    119: "F8",
                    120: "F9",
                    121: "F10",
                    122: "F11",
                    123: "F12",
                    144: "NumLock",
                    145: "ScrollLock",
                    224: "Meta",
                  },
                  yn = Kt.extend({
                    key: function (e) {
                      if (e.key) {
                        var t = vn[e.key] || e.key;
                        if ("Unidentified" !== t) return t;
                      }
                      return "keypress" === e.type
                        ? 13 === (e = hn(e))
                          ? "Enter"
                          : String.fromCharCode(e)
                        : "keydown" === e.type || "keyup" === e.type
                        ? gn[e.keyCode] || "Unidentified"
                        : "";
                    },
                    location: null,
                    ctrlKey: null,
                    shiftKey: null,
                    altKey: null,
                    metaKey: null,
                    repeat: null,
                    locale: null,
                    getModifierState: Yt,
                    charCode: function (e) {
                      return "keypress" === e.type ? hn(e) : 0;
                    },
                    keyCode: function (e) {
                      return "keydown" === e.type || "keyup" === e.type ? e.keyCode : 0;
                    },
                    which: function (e) {
                      return "keypress" === e.type
                        ? hn(e)
                        : "keydown" === e.type || "keyup" === e.type
                        ? e.keyCode
                        : 0;
                    },
                  }),
                  bn = en.extend({
                    dataTransfer: null,
                  }),
                  kn = Kt.extend({
                    touches: null,
                    targetTouches: null,
                    changedTouches: null,
                    altKey: null,
                    metaKey: null,
                    ctrlKey: null,
                    shiftKey: null,
                    getModifierState: Yt,
                  }),
                  xn = ue.extend({
                    propertyName: null,
                    elapsedTime: null,
                    pseudoElement: null,
                  }),
                  Tn = en.extend({
                    deltaX: function (e) {
                      return "deltaX" in e
                        ? e.deltaX
                        : "wheelDeltaX" in e
                        ? -e.wheelDeltaX
                        : 0;
                    },
                    deltaY: function (e) {
                      return "deltaY" in e
                        ? e.deltaY
                        : "wheelDeltaY" in e
                        ? -e.wheelDeltaY
                        : "wheelDelta" in e
                        ? -e.wheelDelta
                        : 0;
                    },
                    deltaZ: null,
                    deltaMode: null,
                  }),
                  wn = [
                    ["abort", "abort"],
                    [G, "animationEnd"],
                    [Z, "animationIteration"],
                    [J, "animationStart"],
                    ["canplay", "canPlay"],
                    ["canplaythrough", "canPlayThrough"],
                    ["drag", "drag"],
                    ["dragenter", "dragEnter"],
                    ["dragexit", "dragExit"],
                    ["dragleave", "dragLeave"],
                    ["dragover", "dragOver"],
                    ["durationchange", "durationChange"],
                    ["emptied", "emptied"],
                    ["encrypted", "encrypted"],
                    ["ended", "ended"],
                    ["error", "error"],
                    ["gotpointercapture", "gotPointerCapture"],
                    ["load", "load"],
                    ["loadeddata", "loadedData"],
                    ["loadedmetadata", "loadedMetadata"],
                    ["loadstart", "loadStart"],
                    ["lostpointercapture", "lostPointerCapture"],
                    ["mousemove", "mouseMove"],
                    ["mouseout", "mouseOut"],
                    ["mouseover", "mouseOver"],
                    ["playing", "playing"],
                    ["pointermove", "pointerMove"],
                    ["pointerout", "pointerOut"],
                    ["pointerover", "pointerOver"],
                    ["progress", "progress"],
                    ["scroll", "scroll"],
                    ["seeking", "seeking"],
                    ["stalled", "stalled"],
                    ["suspend", "suspend"],
                    ["timeupdate", "timeUpdate"],
                    ["toggle", "toggle"],
                    ["touchmove", "touchMove"],
                    [ee, "transitionEnd"],
                    ["waiting", "waiting"],
                    ["wheel", "wheel"],
                  ],
                  Sn = {},
                  En = {};
                function Cn(e, t) {
                  var n = e[0],
                    r = "on" + ((e = e[1])[0].toUpperCase() + e.slice(1));
                  (t = {
                    phasedRegistrationNames: {
                      bubbled: r,
                      captured: r + "Capture",
                    },
                    dependencies: [n],
                    isInteractive: t,
                  }),
                    (Sn[e] = t),
                    (En[n] = t);
                }
                [
                  ["blur", "blur"],
                  ["cancel", "cancel"],
                  ["click", "click"],
                  ["close", "close"],
                  ["contextmenu", "contextMenu"],
                  ["copy", "copy"],
                  ["cut", "cut"],
                  ["auxclick", "auxClick"],
                  ["dblclick", "doubleClick"],
                  ["dragend", "dragEnd"],
                  ["dragstart", "dragStart"],
                  ["drop", "drop"],
                  ["focus", "focus"],
                  ["input", "input"],
                  ["invalid", "invalid"],
                  ["keydown", "keyDown"],
                  ["keypress", "keyPress"],
                  ["keyup", "keyUp"],
                  ["mousedown", "mouseDown"],
                  ["mouseup", "mouseUp"],
                  ["paste", "paste"],
                  ["pause", "pause"],
                  ["play", "play"],
                  ["pointercancel", "pointerCancel"],
                  ["pointerdown", "pointerDown"],
                  ["pointerup", "pointerUp"],
                  ["ratechange", "rateChange"],
                  ["reset", "reset"],
                  ["seeked", "seeked"],
                  ["submit", "submit"],
                  ["touchcancel", "touchCancel"],
                  ["touchend", "touchEnd"],
                  ["touchstart", "touchStart"],
                  ["volumechange", "volumeChange"],
                ].forEach(function (e) {
                  Cn(e, !0);
                }),
                  wn.forEach(function (e) {
                    Cn(e, !1);
                  });
                var _n = {
                    eventTypes: Sn,
                    isInteractiveTopLevelEventType: function (e) {
                      return void 0 !== (e = En[e]) && !0 === e.isInteractive;
                    },
                    extractEvents: function (e, t, n, r) {
                      var l = En[e];
                      if (!l) return null;
                      switch (e) {
                        case "keypress":
                          if (0 === hn(n)) return null;
                        case "keydown":
                        case "keyup":
                          e = yn;
                          break;
                        case "blur":
                        case "focus":
                          e = mn;
                          break;
                        case "click":
                          if (2 === n.button) return null;
                        case "auxclick":
                        case "dblclick":
                        case "mousedown":
                        case "mousemove":
                        case "mouseup":
                        case "mouseout":
                        case "mouseover":
                        case "contextmenu":
                          e = en;
                          break;
                        case "drag":
                        case "dragend":
                        case "dragenter":
                        case "dragexit":
                        case "dragleave":
                        case "dragover":
                        case "dragstart":
                        case "drop":
                          e = bn;
                          break;
                        case "touchcancel":
                        case "touchend":
                        case "touchmove":
                        case "touchstart":
                          e = kn;
                          break;
                        case G:
                        case Z:
                        case J:
                          e = dn;
                          break;
                        case ee:
                          e = xn;
                          break;
                        case "scroll":
                          e = Kt;
                          break;
                        case "wheel":
                          e = Tn;
                          break;
                        case "copy":
                        case "cut":
                        case "paste":
                          e = pn;
                          break;
                        case "gotpointercapture":
                        case "lostpointercapture":
                        case "pointercancel":
                        case "pointerdown":
                        case "pointermove":
                        case "pointerout":
                        case "pointerover":
                        case "pointerup":
                          e = tn;
                          break;
                        default:
                          e = ue;
                      }
                      return H((t = e.getPooled(l, t, n, r))), t;
                    },
                  },
                  Pn = _n.isInteractiveTopLevelEventType,
                  Nn = [];
                function zn(e) {
                  var t = e.targetInst,
                    n = t;
                  do {
                    if (!n) {
                      e.ancestors.push(n);
                      break;
                    }
                    var r;
                    for (r = n; r.return; ) r = r.return;
                    if (!(r = 3 !== r.tag ? null : r.stateNode.containerInfo)) break;
                    e.ancestors.push(n), (n = D(r));
                  } while (n);
                  for (n = 0; n < e.ancestors.length; n++) {
                    t = e.ancestors[n];
                    var l = Ve(e.nativeEvent);
                    r = e.topLevelType;
                    for (var a = e.nativeEvent, i = null, o = 0; o < g.length; o++) {
                      var u = g[o];
                      u && (u = u.extractEvents(r, t, a, l)) && (i = E(i, u));
                    }
                    R(i);
                  }
                }
                var Rn = !0;
                function Un(e, t) {
                  if (!t) return null;
                  var n = (Pn(e) ? Mn : Dn).bind(null, e);
                  t.addEventListener(e, n, !1);
                }
                function In(e, t) {
                  if (!t) return null;
                  var n = (Pn(e) ? Mn : Dn).bind(null, e);
                  t.addEventListener(e, n, !0);
                }
                function Mn(e, t) {
                  De(Dn, e, t);
                }
                function Dn(e, t) {
                  if (Rn) {
                    var n = Ve(t);
                    if (
                      (null === (n = D(n)) ||
                        "number" != typeof n.tag ||
                        2 === un(n) ||
                        (n = null),
                      Nn.length)
                    ) {
                      var r = Nn.pop();
                      (r.topLevelType = e),
                        (r.nativeEvent = t),
                        (r.targetInst = n),
                        (e = r);
                    } else
                      e = {
                        topLevelType: e,
                        nativeEvent: t,
                        targetInst: n,
                        ancestors: [],
                      };
                    try {
                      Le(zn, e);
                    } finally {
                      (e.topLevelType = null),
                        (e.nativeEvent = null),
                        (e.targetInst = null),
                        (e.ancestors.length = 0),
                        10 > Nn.length && Nn.push(e);
                    }
                  }
                }
                var On = {},
                  Fn = 0,
                  Ln = "_reactListenersID" + ("" + Math.random()).slice(2);
                function An(e) {
                  return (
                    Object.prototype.hasOwnProperty.call(e, Ln) ||
                      ((e[Ln] = Fn++), (On[e[Ln]] = {})),
                    On[e[Ln]]
                  );
                }
                function Wn(e) {
                  if (
                    void 0 ===
                    (e = e || ("undefined" != typeof document ? document : void 0))
                  )
                    return null;
                  try {
                    return e.activeElement || e.body;
                  } catch (t) {
                    return e.body;
                  }
                }
                function Vn(e) {
                  for (; e && e.firstChild; ) e = e.firstChild;
                  return e;
                }
                function jn(e, t) {
                  var n,
                    r = Vn(e);
                  for (e = 0; r; ) {
                    if (3 === r.nodeType) {
                      if (((n = e + r.textContent.length), e <= t && n >= t))
                        return {
                          node: r,
                          offset: t - e,
                        };
                      e = n;
                    }
                    e: {
                      for (; r; ) {
                        if (r.nextSibling) {
                          r = r.nextSibling;
                          break e;
                        }
                        r = r.parentNode;
                      }
                      r = void 0;
                    }
                    r = Vn(r);
                  }
                }
                function Bn(e, t) {
                  return (
                    !(!e || !t) &&
                    (e === t ||
                      ((!e || 3 !== e.nodeType) &&
                        (t && 3 === t.nodeType
                          ? Bn(e, t.parentNode)
                          : "contains" in e
                          ? e.contains(t)
                          : !!e.compareDocumentPosition &&
                            !!(16 & e.compareDocumentPosition(t)))))
                  );
                }
                function Hn() {
                  for (var e = window, t = Wn(); t instanceof e.HTMLIFrameElement; ) {
                    try {
                      var n = "string" == typeof t.contentWindow.location.href;
                    } catch (r) {
                      n = !1;
                    }
                    if (!n) break;
                    t = Wn((e = t.contentWindow).document);
                  }
                  return t;
                }
                function Qn(e) {
                  var t = e && e.nodeName && e.nodeName.toLowerCase();
                  return (
                    t &&
                    (("input" === t &&
                      ("text" === e.type ||
                        "search" === e.type ||
                        "tel" === e.type ||
                        "url" === e.type ||
                        "password" === e.type)) ||
                      "textarea" === t ||
                      "true" === e.contentEditable)
                  );
                }
                function Kn() {
                  var e = Hn();
                  if (Qn(e)) {
                    if ("selectionStart" in e)
                      var t = {
                        start: e.selectionStart,
                        end: e.selectionEnd,
                      };
                    else
                      e: {
                        var n =
                          (t = ((t = e.ownerDocument) && t.defaultView) || window)
                            .getSelection && t.getSelection();
                        if (n && 0 !== n.rangeCount) {
                          t = n.anchorNode;
                          var r = n.anchorOffset,
                            l = n.focusNode;
                          n = n.focusOffset;
                          try {
                            t.nodeType, l.nodeType;
                          } catch (p) {
                            t = null;
                            break e;
                          }
                          var a = 0,
                            i = -1,
                            o = -1,
                            u = 0,
                            c = 0,
                            s = e,
                            f = null;
                          t: for (;;) {
                            for (
                              var d;
                              s !== t || (0 !== r && 3 !== s.nodeType) || (i = a + r),
                                s !== l || (0 !== n && 3 !== s.nodeType) || (o = a + n),
                                3 === s.nodeType && (a += s.nodeValue.length),
                                null !== (d = s.firstChild);
        
                            )
                              (f = s), (s = d);
                            for (;;) {
                              if (s === e) break t;
                              if (
                                (f === t && ++u === r && (i = a),
                                f === l && ++c === n && (o = a),
                                null !== (d = s.nextSibling))
                              )
                                break;
                              f = (s = f).parentNode;
                            }
                            s = d;
                          }
                          t =
                            -1 === i || -1 === o
                              ? null
                              : {
                                  start: i,
                                  end: o,
                                };
                        } else t = null;
                      }
                    t = t || {
                      start: 0,
                      end: 0,
                    };
                  } else t = null;
                  return {
                    focusedElem: e,
                    selectionRange: t,
                  };
                }
                function $n(e) {
                  var t = Hn(),
                    n = e.focusedElem,
                    r = e.selectionRange;
                  if (
                    t !== n &&
                    n &&
                    n.ownerDocument &&
                    Bn(n.ownerDocument.documentElement, n)
                  ) {
                    if (null !== r && Qn(n))
                      if (
                        ((t = r.start),
                        void 0 === (e = r.end) && (e = t),
                        "selectionStart" in n)
                      )
                        (n.selectionStart = t),
                          (n.selectionEnd = Math.min(e, n.value.length));
                      else if (
                        (e =
                          ((t = n.ownerDocument || document) && t.defaultView) ||
                          window).getSelection
                      ) {
                        e = e.getSelection();
                        var l = n.textContent.length,
                          a = Math.min(r.start, l);
                        (r = void 0 === r.end ? a : Math.min(r.end, l)),
                          !e.extend && a > r && ((l = r), (r = a), (a = l)),
                          (l = jn(n, a));
                        var i = jn(n, r);
                        l &&
                          i &&
                          (1 !== e.rangeCount ||
                            e.anchorNode !== l.node ||
                            e.anchorOffset !== l.offset ||
                            e.focusNode !== i.node ||
                            e.focusOffset !== i.offset) &&
                          ((t = t.createRange()).setStart(l.node, l.offset),
                          e.removeAllRanges(),
                          a > r
                            ? (e.addRange(t), e.extend(i.node, i.offset))
                            : (t.setEnd(i.node, i.offset), e.addRange(t)));
                      }
                    for (t = [], e = n; (e = e.parentNode); )
                      1 === e.nodeType &&
                        t.push({
                          element: e,
                          left: e.scrollLeft,
                          top: e.scrollTop,
                        });
                    for (
                      "function" == typeof n.focus && n.focus(), n = 0;
                      n < t.length;
                      n++
                    )
                      ((e = t[n]).element.scrollLeft = e.left),
                        (e.element.scrollTop = e.top);
                  }
                }
                var qn = Q && "documentMode" in document && 11 >= document.documentMode,
                  Yn = {
                    select: {
                      phasedRegistrationNames: {
                        bubbled: "onSelect",
                        captured: "onSelectCapture",
                      },
                      dependencies:
                        "blur contextmenu dragend focus keydown keyup mousedown mouseup selectionchange".split(
                          " "
                        ),
                    },
                  },
                  Xn = null,
                  Gn = null,
                  Zn = null,
                  Jn = !1;
                function er(e, t) {
                  var n =
                    t.window === t
                      ? t.document
                      : 9 === t.nodeType
                      ? t
                      : t.ownerDocument;
                  return Jn || null == Xn || Xn !== Wn(n)
                    ? null
                    : ("selectionStart" in (n = Xn) && Qn(n)
                        ? (n = {
                            start: n.selectionStart,
                            end: n.selectionEnd,
                          })
                        : (n = {
                            anchorNode: (n = (
                              (n.ownerDocument && n.ownerDocument.defaultView) ||
                              window
                            ).getSelection()).anchorNode,
                            anchorOffset: n.anchorOffset,
                            focusNode: n.focusNode,
                            focusOffset: n.focusOffset,
                          }),
                      Zn && on(Zn, n)
                        ? null
                        : ((Zn = n),
                          ((e = ue.getPooled(Yn.select, Gn, e, t)).type = "select"),
                          (e.target = Xn),
                          H(e),
                          e));
                }
                var tr = {
                  eventTypes: Yn,
                  extractEvents: function (e, t, n, r) {
                    var l,
                      a =
                        r.window === r
                          ? r.document
                          : 9 === r.nodeType
                          ? r
                          : r.ownerDocument;
                    if (!(l = !a)) {
                      e: {
                        (a = An(a)), (l = k.onSelect);
                        for (var i = 0; i < l.length; i++) {
                          var o = l[i];
                          if (!a.hasOwnProperty(o) || !a[o]) {
                            a = !1;
                            break e;
                          }
                        }
                        a = !0;
                      }
                      l = !a;
                    }
                    if (l) return null;
                    switch (((a = t ? F(t) : window), e)) {
                      case "focus":
                        (We(a) || "true" === a.contentEditable) &&
                          ((Xn = a), (Gn = t), (Zn = null));
                        break;
                      case "blur":
                        Zn = Gn = Xn = null;
                        break;
                      case "mousedown":
                        Jn = !0;
                        break;
                      case "contextmenu":
                      case "mouseup":
                      case "dragend":
                        return (Jn = !1), er(n, r);
                      case "selectionchange":
                        if (qn) break;
                      case "keydown":
                      case "keyup":
                        return er(n, r);
                    }
                    return null;
                  },
                };
                function nr(t) {
                  var n = "";
                  return (
                    e.Children.forEach(t, function (e) {
                      null != e && (n += e);
                    }),
                    n
                  );
                }
                function rr(e, n) {
                  return (
                    (e = t(
                      {
                        children: void 0,
                      },
                      n
                    )),
                    (n = nr(n.children)) && (e.children = n),
                    e
                  );
                }
                function lr(e, t, n, r) {
                  if (((e = e.options), t)) {
                    t = {};
                    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
                    for (n = 0; n < e.length; n++)
                      (l = t.hasOwnProperty("$" + e[n].value)),
                        e[n].selected !== l && (e[n].selected = l),
                        l && r && (e[n].defaultSelected = !0);
                  } else {
                    for (n = "" + St(n), t = null, l = 0; l < e.length; l++) {
                      if (e[l].value === n)
                        return (
                          (e[l].selected = !0), void (r && (e[l].defaultSelected = !0))
                        );
                      null !== t || e[l].disabled || (t = e[l]);
                    }
                    null !== t && (t.selected = !0);
                  }
                }
                function ar(e, n) {
                  return (
                    null != n.dangerouslySetInnerHTML && l("91"),
                    t({}, n, {
                      value: void 0,
                      defaultValue: void 0,
                      children: "" + e._wrapperState.initialValue,
                    })
                  );
                }
                function ir(e, t) {
                  var n = t.value;
                  null == n &&
                    ((n = t.defaultValue),
                    null != (t = t.children) &&
                      (null != n && l("92"),
                      Array.isArray(t) && (1 >= t.length || l("93"), (t = t[0])),
                      (n = t)),
                    null == n && (n = "")),
                    (e._wrapperState = {
                      initialValue: St(n),
                    });
                }
                function or(e, t) {
                  var n = St(t.value),
                    r = St(t.defaultValue);
                  null != n &&
                    ((n = "" + n) !== e.value && (e.value = n),
                    null == t.defaultValue &&
                      e.defaultValue !== n &&
                      (e.defaultValue = n)),
                    null != r && (e.defaultValue = "" + r);
                }
                function ur(e) {
                  var t = e.textContent;
                  t === e._wrapperState.initialValue && (e.value = t);
                }
                N.injectEventPluginOrder(
                  "ResponderEventPlugin SimpleEventPlugin EnterLeaveEventPlugin ChangeEventPlugin SelectEventPlugin BeforeInputEventPlugin".split(
                    " "
                  )
                ),
                  (x = L),
                  (T = O),
                  (w = F),
                  N.injectEventPluginsByName({
                    SimpleEventPlugin: _n,
                    EnterLeaveEventPlugin: rn,
                    ChangeEventPlugin: Qt,
                    SelectEventPlugin: tr,
                    BeforeInputEventPlugin: _e,
                  });
                var cr = {
                  html: "http://www.w3.org/1999/xhtml",
                  mathml: "http://www.w3.org/1998/Math/MathML",
                  svg: "http://www.w3.org/2000/svg",
                };
                function sr(e) {
                  switch (e) {
                    case "svg":
                      return "http://www.w3.org/2000/svg";
                    case "math":
                      return "http://www.w3.org/1998/Math/MathML";
                    default:
                      return "http://www.w3.org/1999/xhtml";
                  }
                }
                function fr(e, t) {
                  return null == e || "http://www.w3.org/1999/xhtml" === e
                    ? sr(t)
                    : "http://www.w3.org/2000/svg" === e && "foreignObject" === t
                    ? "http://www.w3.org/1999/xhtml"
                    : e;
                }
                var dr = void 0,
                  pr = (function (e) {
                    return "undefined" != typeof MSApp && MSApp.execUnsafeLocalFunction
                      ? function (t, n, r, l) {
                          MSApp.execUnsafeLocalFunction(function () {
                            return e(t, n);
                          });
                        }
                      : e;
                  })(function (e, t) {
                    if (e.namespaceURI !== cr.svg || "innerHTML" in e) e.innerHTML = t;
                    else {
                      for (
                        (dr = dr || document.createElement("div")).innerHTML =
                          "<svg>" + t + "</svg>",
                          t = dr.firstChild;
                        e.firstChild;
        
                      )
                        e.removeChild(e.firstChild);
                      for (; t.firstChild; ) e.appendChild(t.firstChild);
                    }
                  });
                function mr(e, t) {
                  if (t) {
                    var n = e.firstChild;
                    if (n && n === e.lastChild && 3 === n.nodeType)
                      return void (n.nodeValue = t);
                  }
                  e.textContent = t;
                }
                var hr = {
                    animationIterationCount: !0,
                    borderImageOutset: !0,
                    borderImageSlice: !0,
                    borderImageWidth: !0,
                    boxFlex: !0,
                    boxFlexGroup: !0,
                    boxOrdinalGroup: !0,
                    columnCount: !0,
                    columns: !0,
                    flex: !0,
                    flexGrow: !0,
                    flexPositive: !0,
                    flexShrink: !0,
                    flexNegative: !0,
                    flexOrder: !0,
                    gridArea: !0,
                    gridRow: !0,
                    gridRowEnd: !0,
                    gridRowSpan: !0,
                    gridRowStart: !0,
                    gridColumn: !0,
                    gridColumnEnd: !0,
                    gridColumnSpan: !0,
                    gridColumnStart: !0,
                    fontWeight: !0,
                    lineClamp: !0,
                    lineHeight: !0,
                    opacity: !0,
                    order: !0,
                    orphans: !0,
                    tabSize: !0,
                    widows: !0,
                    zIndex: !0,
                    zoom: !0,
                    fillOpacity: !0,
                    floodOpacity: !0,
                    stopOpacity: !0,
                    strokeDasharray: !0,
                    strokeDashoffset: !0,
                    strokeMiterlimit: !0,
                    strokeOpacity: !0,
                    strokeWidth: !0,
                  },
                  vr = ["Webkit", "ms", "Moz", "O"];
                function gr(e, t, n) {
                  return null == t || "boolean" == typeof t || "" === t
                    ? ""
                    : n ||
                      "number" != typeof t ||
                      0 === t ||
                      (hr.hasOwnProperty(e) && hr[e])
                    ? ("" + t).trim()
                    : t + "px";
                }
                function yr(e, t) {
                  for (var n in ((e = e.style), t))
                    if (t.hasOwnProperty(n)) {
                      var r = 0 === n.indexOf("--"),
                        l = gr(n, t[n], r);
                      "float" === n && (n = "cssFloat"),
                        r ? e.setProperty(n, l) : (e[n] = l);
                    }
                }
                Object.keys(hr).forEach(function (e) {
                  vr.forEach(function (t) {
                    (t = t + e.charAt(0).toUpperCase() + e.substring(1)),
                      (hr[t] = hr[e]);
                  });
                });
                var br = t(
                  {
                    menuitem: !0,
                  },
                  {
                    area: !0,
                    base: !0,
                    br: !0,
                    col: !0,
                    embed: !0,
                    hr: !0,
                    img: !0,
                    input: !0,
                    keygen: !0,
                    link: !0,
                    meta: !0,
                    param: !0,
                    source: !0,
                    track: !0,
                    wbr: !0,
                  }
                );
                function kr(e, t) {
                  t &&
                    (br[e] &&
                      (null != t.children || null != t.dangerouslySetInnerHTML) &&
                      l("137", e, ""),
                    null != t.dangerouslySetInnerHTML &&
                      (null != t.children && l("60"),
                      ("object" == typeof t.dangerouslySetInnerHTML &&
                        "__html" in t.dangerouslySetInnerHTML) ||
                        l("61")),
                    null != t.style && "object" != typeof t.style && l("62", ""));
                }
                function xr(e, t) {
                  if (-1 === e.indexOf("-")) return "string" == typeof t.is;
                  switch (e) {
                    case "annotation-xml":
                    case "color-profile":
                    case "font-face":
                    case "font-face-src":
                    case "font-face-uri":
                    case "font-face-format":
                    case "font-face-name":
                    case "missing-glyph":
                      return !1;
                    default:
                      return !0;
                  }
                }
                function Tr(e, t) {
                  var n = An(
                    (e = 9 === e.nodeType || 11 === e.nodeType ? e : e.ownerDocument)
                  );
                  t = k[t];
                  for (var r = 0; r < t.length; r++) {
                    var l = t[r];
                    if (!n.hasOwnProperty(l) || !n[l]) {
                      switch (l) {
                        case "scroll":
                          In("scroll", e);
                          break;
                        case "focus":
                        case "blur":
                          In("focus", e), In("blur", e), (n.blur = !0), (n.focus = !0);
                          break;
                        case "cancel":
                        case "close":
                          je(l) && In(l, e);
                          break;
                        case "invalid":
                        case "submit":
                        case "reset":
                          break;
                        default:
                          -1 === te.indexOf(l) && Un(l, e);
                      }
                      n[l] = !0;
                    }
                  }
                }
                function wr() {}
                var Sr = null,
                  Er = null;
                function Cr(e, t) {
                  switch (e) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                      return !!t.autoFocus;
                  }
                  return !1;
                }
                function _r(e, t) {
                  return (
                    "textarea" === e ||
                    "option" === e ||
                    "noscript" === e ||
                    "string" == typeof t.children ||
                    "number" == typeof t.children ||
                    ("object" == typeof t.dangerouslySetInnerHTML &&
                      null !== t.dangerouslySetInnerHTML &&
                      null != t.dangerouslySetInnerHTML.__html)
                  );
                }
                var Pr = "function" == typeof setTimeout ? setTimeout : void 0,
                  Nr = "function" == typeof clearTimeout ? clearTimeout : void 0,
                  zr = n.unstable_scheduleCallback,
                  Rr = n.unstable_cancelCallback;
                function Ur(e, t, n, r, l) {
                  (e[M] = l),
                    "input" === n && "radio" === l.type && null != l.name && _t(e, l),
                    xr(n, r),
                    (r = xr(n, l));
                  for (var a = 0; a < t.length; a += 2) {
                    var i = t[a],
                      o = t[a + 1];
                    "style" === i
                      ? yr(e, o)
                      : "dangerouslySetInnerHTML" === i
                      ? pr(e, o)
                      : "children" === i
                      ? mr(e, o)
                      : wt(e, i, o, r);
                  }
                  switch (n) {
                    case "input":
                      Pt(e, l);
                      break;
                    case "textarea":
                      or(e, l);
                      break;
                    case "select":
                      (t = e._wrapperState.wasMultiple),
                        (e._wrapperState.wasMultiple = !!l.multiple),
                        null != (n = l.value)
                          ? lr(e, !!l.multiple, n, !1)
                          : t !== !!l.multiple &&
                            (null != l.defaultValue
                              ? lr(e, !!l.multiple, l.defaultValue, !0)
                              : lr(e, !!l.multiple, l.multiple ? [] : "", !1));
                  }
                }
                function Ir(e) {
                  for (e = e.nextSibling; e && 1 !== e.nodeType && 3 !== e.nodeType; )
                    e = e.nextSibling;
                  return e;
                }
                function Mr(e) {
                  for (e = e.firstChild; e && 1 !== e.nodeType && 3 !== e.nodeType; )
                    e = e.nextSibling;
                  return e;
                }
                new Set();
                var Dr = [],
                  Or = -1;
                function Fr(e) {
                  0 > Or || ((e.current = Dr[Or]), (Dr[Or] = null), Or--);
                }
                function Lr(e, t) {
                  (Dr[++Or] = e.current), (e.current = t);
                }
                var Ar = {},
                  Wr = {
                    current: Ar,
                  },
                  Vr = {
                    current: !1,
                  },
                  jr = Ar;
                function Br(e, t) {
                  var n = e.type.contextTypes;
                  if (!n) return Ar;
                  var r = e.stateNode;
                  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t)
                    return r.__reactInternalMemoizedMaskedChildContext;
                  var l,
                    a = {};
                  for (l in n) a[l] = t[l];
                  return (
                    r &&
                      (((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext =
                        t),
                      (e.__reactInternalMemoizedMaskedChildContext = a)),
                    a
                  );
                }
                function Hr(e) {
                  return null != (e = e.childContextTypes);
                }
                function Qr(e) {
                  Fr(Vr, e), Fr(Wr, e);
                }
                function Kr(e) {
                  Fr(Vr, e), Fr(Wr, e);
                }
                function $r(e, t, n) {
                  Wr.current !== Ar && l("168"), Lr(Wr, t, e), Lr(Vr, n, e);
                }
                function qr(e, n, r) {
                  var a = e.stateNode;
                  if (
                    ((e = n.childContextTypes), "function" != typeof a.getChildContext)
                  )
                    return r;
                  for (var i in (a = a.getChildContext()))
                    i in e || l("108", st(n) || "Unknown", i);
                  return t({}, r, a);
                }
                function Yr(e) {
                  var t = e.stateNode;
                  return (
                    (t = (t && t.__reactInternalMemoizedMergedChildContext) || Ar),
                    (jr = Wr.current),
                    Lr(Wr, t, e),
                    Lr(Vr, Vr.current, e),
                    !0
                  );
                }
                function Xr(e, t, n) {
                  var r = e.stateNode;
                  r || l("169"),
                    n
                      ? ((t = qr(e, t, jr)),
                        (r.__reactInternalMemoizedMergedChildContext = t),
                        Fr(Vr, e),
                        Fr(Wr, e),
                        Lr(Wr, t, e))
                      : Fr(Vr, e),
                    Lr(Vr, n, e);
                }
                var Gr = null,
                  Zr = null;
                function Jr(e) {
                  return function (t) {
                    try {
                      return e(t);
                    } catch (n) {}
                  };
                }
                function el(e) {
                  if ("undefined" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) return !1;
                  var t = __REACT_DEVTOOLS_GLOBAL_HOOK__;
                  if (t.isDisabled || !t.supportsFiber) return !0;
                  try {
                    var n = t.inject(e);
                    (Gr = Jr(function (e) {
                      return t.onCommitFiberRoot(n, e);
                    })),
                      (Zr = Jr(function (e) {
                        return t.onCommitFiberUnmount(n, e);
                      }));
                  } catch (r) {}
                  return !0;
                }
                function tl(e, t, n, r) {
                  (this.tag = e),
                    (this.key = n),
                    (this.sibling =
                      this.child =
                      this.return =
                      this.stateNode =
                      this.type =
                      this.elementType =
                        null),
                    (this.index = 0),
                    (this.ref = null),
                    (this.pendingProps = t),
                    (this.contextDependencies =
                      this.memoizedState =
                      this.updateQueue =
                      this.memoizedProps =
                        null),
                    (this.mode = r),
                    (this.effectTag = 0),
                    (this.lastEffect = this.firstEffect = this.nextEffect = null),
                    (this.childExpirationTime = this.expirationTime = 0),
                    (this.alternate = null);
                }
                function nl(e, t, n, r) {
                  return new tl(e, t, n, r);
                }
                function rl(e) {
                  return !(!(e = e.prototype) || !e.isReactComponent);
                }
                function ll(e) {
                  if ("function" == typeof e) return rl(e) ? 1 : 0;
                  if (null != e) {
                    if ((e = e.$$typeof) === lt) return 11;
                    if (e === it) return 14;
                  }
                  return 2;
                }
                function al(e, t) {
                  var n = e.alternate;
                  return (
                    null === n
                      ? (((n = nl(e.tag, t, e.key, e.mode)).elementType =
                          e.elementType),
                        (n.type = e.type),
                        (n.stateNode = e.stateNode),
                        (n.alternate = e),
                        (e.alternate = n))
                      : ((n.pendingProps = t),
                        (n.effectTag = 0),
                        (n.nextEffect = null),
                        (n.firstEffect = null),
                        (n.lastEffect = null)),
                    (n.childExpirationTime = e.childExpirationTime),
                    (n.expirationTime = e.expirationTime),
                    (n.child = e.child),
                    (n.memoizedProps = e.memoizedProps),
                    (n.memoizedState = e.memoizedState),
                    (n.updateQueue = e.updateQueue),
                    (n.contextDependencies = e.contextDependencies),
                    (n.sibling = e.sibling),
                    (n.index = e.index),
                    (n.ref = e.ref),
                    n
                  );
                }
                function il(e, t, n, r, a, i) {
                  var o = 2;
                  if (((r = e), "function" == typeof e)) rl(e) && (o = 1);
                  else if ("string" == typeof e) o = 5;
                  else
                    e: switch (e) {
                      case Ze:
                        return ol(n.children, a, i, t);
                      case rt:
                        return ul(n, 3 | a, i, t);
                      case Je:
                        return ul(n, 2 | a, i, t);
                      case et:
                        return (
                          ((e = nl(12, n, t, 4 | a)).elementType = et),
                          (e.type = et),
                          (e.expirationTime = i),
                          e
                        );
                      case at:
                        return (
                          ((e = nl(13, n, t, a)).elementType = at),
                          (e.type = at),
                          (e.expirationTime = i),
                          e
                        );
                      default:
                        if ("object" == typeof e && null !== e)
                          switch (e.$$typeof) {
                            case tt:
                              o = 10;
                              break e;
                            case nt:
                              o = 9;
                              break e;
                            case lt:
                              o = 11;
                              break e;
                            case it:
                              o = 14;
                              break e;
                            case ot:
                              (o = 16), (r = null);
                              break e;
                          }
                        l("130", null == e ? e : typeof e, "");
                    }
                  return (
                    ((t = nl(o, n, t, a)).elementType = e),
                    (t.type = r),
                    (t.expirationTime = i),
                    t
                  );
                }
                function ol(e, t, n, r) {
                  return ((e = nl(7, e, r, t)).expirationTime = n), e;
                }
                function ul(e, t, n, r) {
                  return (
                    (e = nl(8, e, r, t)),
                    (t = 0 == (1 & t) ? Je : rt),
                    (e.elementType = t),
                    (e.type = t),
                    (e.expirationTime = n),
                    e
                  );
                }
                function cl(e, t, n) {
                  return ((e = nl(6, e, null, t)).expirationTime = n), e;
                }
                // function sl(e, t, n) {
                //   return (
                //     ((t = nl(
                //       4,
                //       null !== e.children ? e.children : [],
                //       e.key,
                //       t
                //     )).expirationTime = n),
                //     (t.stateNode = {
                //       containerInfo: e.containerInfo,
                //       pendingChildren: null,
                //       implementation: e.implementation,
                //     }),
                //     t
                //   );
                // }
                function fl(e, t) {
                  e.didError = !1;
                  var n = e.earliestPendingTime;
                  0 === n
                    ? (e.earliestPendingTime = e.latestPendingTime = t)
                    : n < t
                    ? (e.earliestPendingTime = t)
                    : e.latestPendingTime > t && (e.latestPendingTime = t),
                    hl(t, e);
                }
                function dl(e, t) {
                  if (((e.didError = !1), 0 === t))
                    (e.earliestPendingTime = 0),
                      (e.latestPendingTime = 0),
                      (e.earliestSuspendedTime = 0),
                      (e.latestSuspendedTime = 0),
                      (e.latestPingedTime = 0);
                  else {
                    t < e.latestPingedTime && (e.latestPingedTime = 0);
                    var n = e.latestPendingTime;
                    0 !== n &&
                      (n > t
                        ? (e.earliestPendingTime = e.latestPendingTime = 0)
                        : e.earliestPendingTime > t &&
                          (e.earliestPendingTime = e.latestPendingTime)),
                      0 === (n = e.earliestSuspendedTime)
                        ? fl(e, t)
                        : t < e.latestSuspendedTime
                        ? ((e.earliestSuspendedTime = 0),
                          (e.latestSuspendedTime = 0),
                          (e.latestPingedTime = 0),
                          fl(e, t))
                        : t > n && fl(e, t);
                  }
                  hl(0, e);
                }
                function pl(e, t) {
                  (e.didError = !1),
                    e.latestPingedTime >= t && (e.latestPingedTime = 0);
                  var n = e.earliestPendingTime,
                    r = e.latestPendingTime;
                  n === t
                    ? (e.earliestPendingTime = r === t ? (e.latestPendingTime = 0) : r)
                    : r === t && (e.latestPendingTime = n),
                    (n = e.earliestSuspendedTime),
                    (r = e.latestSuspendedTime),
                    0 === n
                      ? (e.earliestSuspendedTime = e.latestSuspendedTime = t)
                      : n < t
                      ? (e.earliestSuspendedTime = t)
                      : r > t && (e.latestSuspendedTime = t),
                    hl(t, e);
                }
                function ml(e, t) {
                  var n = e.earliestPendingTime;
                  return (
                    n > t && (t = n), (e = e.earliestSuspendedTime) > t && (t = e), t
                  );
                }
                function hl(e, t) {
                  var n = t.earliestSuspendedTime,
                    r = t.latestSuspendedTime,
                    l = t.earliestPendingTime,
                    a = t.latestPingedTime;
                  0 === (l = 0 !== l ? l : a) && (0 === e || r < e) && (l = r),
                    0 !== (e = l) && n > e && (e = n),
                    (t.nextExpirationTimeToWorkOn = l),
                    (t.expirationTime = e);
                }
                function vl(e, n) {
                  // if (e && e.defaultProps)
                  //   for (var r in ((n = t({}, n)), (e = e.defaultProps)))
                  //     void 0 === n[r] && (n[r] = e[r]);
                  return n;
                }
                function gl(e) {
                  var t = e._result;
                  switch (e._status) {
                    case 1:
                      return t;
                    case 2:
                    case 0:
                      throw t;
                    default:
                      switch (
                        ((e._status = 0),
                        (t = (t = e._ctor)()).then(
                          function (t) {
                            0 === e._status &&
                              ((t = t.default), (e._status = 1), (e._result = t));
                          },
                          function (t) {
                            0 === e._status && ((e._status = 2), (e._result = t));
                          }
                        ),
                        e._status)
                      ) {
                        case 1:
                          return e._result;
                        case 2:
                          throw e._result;
                      }
                      throw ((e._result = t), t);
                  }
                }
                var yl = new e.Component().refs;
                function bl(e, n, r, l) {
                  (r = null == (r = r(l, (n = e.memoizedState))) ? n : t({}, n, r)),
                    (e.memoizedState = r),
                    null !== (l = e.updateQueue) &&
                      0 === e.expirationTime &&
                      (l.baseState = r);
                }
                var kl = {
                  isMounted: function (e) {
                    return !!(e = e._reactInternalFiber) && 2 === un(e);
                  },
                  enqueueSetState: function (e, t, n) {
                    e = e._reactInternalFiber;
                    var r = Vo(),
                      l = ci((r = so(r, e)));
                    (l.payload = t),
                      null != n && (l.callback = n),
                      lo(),
                      fi(e, l),
                      ho(e, r);
                  },
                  enqueueReplaceState: function (e, t, n) {
                    e = e._reactInternalFiber;
                    var r = Vo(),
                      l = ci((r = so(r, e)));
                    (l.tag = ri),
                      (l.payload = t),
                      null != n && (l.callback = n),
                      lo(),
                      fi(e, l),
                      ho(e, r);
                  },
                  enqueueForceUpdate: function (e, t) {
                    e = e._reactInternalFiber;
                    var n = Vo(),
                      r = ci((n = so(n, e)));
                    (r.tag = li),
                      null != t && (r.callback = t),
                      lo(),
                      fi(e, r),
                      ho(e, n);
                  },
                };
                function xl(e, t, n, r, l, a, i) {
                  return "function" == typeof (e = e.stateNode).shouldComponentUpdate
                    ? e.shouldComponentUpdate(r, a, i)
                    : !t.prototype ||
                        !t.prototype.isPureReactComponent ||
                        !on(n, r) ||
                        !on(l, a);
                }
                function Tl(e, t, n) {
                  var r = !1,
                    l = Ar,
                    a = t.contextType;
                  return (
                    "object" == typeof a && null !== a
                      ? (a = ti(a))
                      : ((l = Hr(t) ? jr : Wr.current),
                        (a = (r = null != (r = t.contextTypes)) ? Br(e, l) : Ar)),
                    (t = new t(n, a)),
                    (e.memoizedState =
                      null !== t.state && void 0 !== t.state ? t.state : null),
                    (t.updater = kl),
                    (e.stateNode = t),
                    (t._reactInternalFiber = e),
                    r &&
                      (((e = e.stateNode).__reactInternalMemoizedUnmaskedChildContext =
                        l),
                      (e.__reactInternalMemoizedMaskedChildContext = a)),
                    t
                  );
                }
                function wl(e, t, n, r) {
                  (e = t.state),
                    "function" == typeof t.componentWillReceiveProps &&
                      t.componentWillReceiveProps(n, r),
                    "function" == typeof t.UNSAFE_componentWillReceiveProps &&
                      t.UNSAFE_componentWillReceiveProps(n, r),
                    t.state !== e && kl.enqueueReplaceState(t, t.state, null);
                }
                function Sl(e, t, n, r) {
                  var l = e.stateNode;
                  (l.props = n), (l.state = e.memoizedState), (l.refs = yl);
                  var a = t.contextType;
                  "object" == typeof a && null !== a
                    ? (l.context = ti(a))
                    : ((a = Hr(t) ? jr : Wr.current), (l.context = Br(e, a))),
                    null !== (a = e.updateQueue) &&
                      (hi(e, a, n, l, r), (l.state = e.memoizedState)),
                    "function" == typeof (a = t.getDerivedStateFromProps) &&
                      (bl(e, t, a, n), (l.state = e.memoizedState)),
                    "function" == typeof t.getDerivedStateFromProps ||
                      "function" == typeof l.getSnapshotBeforeUpdate ||
                      ("function" != typeof l.UNSAFE_componentWillMount &&
                        "function" != typeof l.componentWillMount) ||
                      ((t = l.state),
                      "function" == typeof l.componentWillMount &&
                        l.componentWillMount(),
                      "function" == typeof l.UNSAFE_componentWillMount &&
                        l.UNSAFE_componentWillMount(),
                      t !== l.state && kl.enqueueReplaceState(l, l.state, null),
                      null !== (a = e.updateQueue) &&
                        (hi(e, a, n, l, r), (l.state = e.memoizedState))),
                    "function" == typeof l.componentDidMount && (e.effectTag |= 4);
                }
                var El = Array.isArray;
                function Cl(e, t, n) {
                  if (
                    null !== (e = n.ref) &&
                    "function" != typeof e &&
                    "object" != typeof e
                  ) {
                    if (n._owner) {
                      n = n._owner;
                      var r = void 0;
                      n && (1 !== n.tag && l("309"), (r = n.stateNode)),
                        r || l("147", e);
                      var a = "" + e;
                      return null !== t &&
                        null !== t.ref &&
                        "function" == typeof t.ref &&
                        t.ref._stringRef === a
                        ? t.ref
                        : (((t = function (e) {
                            var t = r.refs;
                            t === yl && (t = r.refs = {}),
                              null === e ? delete t[a] : (t[a] = e);
                          })._stringRef = a),
                          t);
                    }
                    "string" != typeof e && l("284"), n._owner || l("290", e);
                  }
                  return e;
                }
                function _l(e, t) {
                  "textarea" !== e.type &&
                    l(
                      "31",
                      "[object Object]" === Object.prototype.toString.call(t)
                        ? "object with keys {" + Object.keys(t).join(", ") + "}"
                        : t,
                      ""
                    );
                }
                function Pl(e) {
                  function t(t, n) {
                    if (e) {
                      var r = t.lastEffect;
                      null !== r
                        ? ((r.nextEffect = n), (t.lastEffect = n))
                        : (t.firstEffect = t.lastEffect = n),
                        (n.nextEffect = null),
                        (n.effectTag = 8);
                    }
                  }
                  function n(n, r) {
                    if (!e) return null;
                    for (; null !== r; ) t(n, r), (r = r.sibling);
                    return null;
                  }
                  function r(e, t) {
                    for (e = new Map(); null !== t; )
                      null !== t.key ? e.set(t.key, t) : e.set(t.index, t),
                        (t = t.sibling);
                    return e;
                  }
                  function a(e, t, n) {
                    return ((e = al(e, t, n)).index = 0), (e.sibling = null), e;
                  }
                  function i(t, n, r) {
                    return (
                      (t.index = r),
                      e
                        ? null !== (r = t.alternate)
                          ? (r = r.index) < n
                            ? ((t.effectTag = 2), n)
                            : r
                          : ((t.effectTag = 2), n)
                        : n
                    );
                  }
                  function o(t) {
                    return e && null === t.alternate && (t.effectTag = 2), t;
                  }
                  function u(e, t, n, r) {
                    return null === t || 6 !== t.tag
                      ? (((t = cl(n, e.mode, r)).return = e), t)
                      : (((t = a(t, n, r)).return = e), t);
                  }
                  function c(e, t, n, r) {
                    return null !== t && t.elementType === n.type
                      ? (((r = a(t, n.props, r)).ref = Cl(e, t, n)), (r.return = e), r)
                      : (((r = il(n.type, n.key, n.props, null, e.mode, r)).ref = Cl(
                          e,
                          t,
                          n
                        )),
                        (r.return = e),
                        r);
                  }
                  function s(e, t, n, r) {
                    return null === t ||
                      4 !== t.tag ||
                      t.stateNode.containerInfo !== n.containerInfo ||
                      t.stateNode.implementation !== n.implementation
                      ? (((t = sl(n, e.mode, r)).return = e), t)
                      : (((t = a(t, n.children || [], r)).return = e), t);
                  }
                  function f(e, t, n, r, l) {
                    return null === t || 7 !== t.tag
                      ? (((t = ol(n, e.mode, r, l)).return = e), t)
                      : (((t = a(t, n, r)).return = e), t);
                  }
                  function d(e, t, n) {
                    if ("string" == typeof t || "number" == typeof t)
                      return ((t = cl("" + t, e.mode, n)).return = e), t;
                    if ("object" == typeof t && null !== t) {
                      switch (t.$$typeof) {
                        case Xe:
                          return (
                            ((n = il(t.type, t.key, t.props, null, e.mode, n)).ref = Cl(
                              e,
                              null,
                              t
                            )),
                            (n.return = e),
                            n
                          );
                        case Ge:
                          return ((t = sl(t, e.mode, n)).return = e), t;
                      }
                      if (El(t) || ct(t))
                        return ((t = ol(t, e.mode, n, null)).return = e), t;
                      _l(e, t);
                    }
                    return null;
                  }
                  function p(e, t, n, r) {
                    var l = null !== t ? t.key : null;
                    if ("string" == typeof n || "number" == typeof n)
                      return null !== l ? null : u(e, t, "" + n, r);
                    if ("object" == typeof n && null !== n) {
                      switch (n.$$typeof) {
                        case Xe:
                          return n.key === l
                            ? n.type === Ze
                              ? f(e, t, n.props.children, r, l)
                              : c(e, t, n, r)
                            : null;
                        case Ge:
                          return n.key === l ? s(e, t, n, r) : null;
                      }
                      if (El(n) || ct(n))
                        return null !== l ? null : f(e, t, n, r, null);
                      _l(e, n);
                    }
                    return null;
                  }
                  function m(e, t, n, r, l) {
                    if ("string" == typeof r || "number" == typeof r)
                      return u(t, (e = e.get(n) || null), "" + r, l);
                    if ("object" == typeof r && null !== r) {
                      switch (r.$$typeof) {
                        case Xe:
                          return (
                            (e = e.get(null === r.key ? n : r.key) || null),
                            r.type === Ze
                              ? f(t, e, r.props.children, l, r.key)
                              : c(t, e, r, l)
                          );
                        case Ge:
                          return s(
                            t,
                            (e = e.get(null === r.key ? n : r.key) || null),
                            r,
                            l
                          );
                      }
                      if (El(r) || ct(r))
                        return f(t, (e = e.get(n) || null), r, l, null);
                      _l(t, r);
                    }
                    return null;
                  }
                  function h(l, a, o, u) {
                    for (
                      var c = null, s = null, f = a, h = (a = 0), v = null;
                      null !== f && h < o.length;
                      h++
                    ) {
                      f.index > h ? ((v = f), (f = null)) : (v = f.sibling);
                      var g = p(l, f, o[h], u);
                      if (null === g) {
                        null === f && (f = v);
                        break;
                      }
                      e && f && null === g.alternate && t(l, f),
                        (a = i(g, a, h)),
                        null === s ? (c = g) : (s.sibling = g),
                        (s = g),
                        (f = v);
                    }
                    if (h === o.length) return n(l, f), c;
                    if (null === f) {
                      for (; h < o.length; h++)
                        (f = d(l, o[h], u)) &&
                          ((a = i(f, a, h)),
                          null === s ? (c = f) : (s.sibling = f),
                          (s = f));
                      return c;
                    }
                    for (f = r(l, f); h < o.length; h++)
                      (v = m(f, l, h, o[h], u)) &&
                        (e &&
                          null !== v.alternate &&
                          f.delete(null === v.key ? h : v.key),
                        (a = i(v, a, h)),
                        null === s ? (c = v) : (s.sibling = v),
                        (s = v));
                    return (
                      e &&
                        f.forEach(function (e) {
                          return t(l, e);
                        }),
                      c
                    );
                  }
                  function v(a, o, u, c) {
                    var s = ct(u);
                    "function" != typeof s && l("150"),
                      null == (u = s.call(u)) && l("151");
                    for (
                      var f = (s = null), h = o, v = (o = 0), g = null, y = u.next();
                      null !== h && !y.done;
                      v++, y = u.next()
                    ) {
                      h.index > v ? ((g = h), (h = null)) : (g = h.sibling);
                      var b = p(a, h, y.value, c);
                      if (null === b) {
                        h || (h = g);
                        break;
                      }
                      e && h && null === b.alternate && t(a, h),
                        (o = i(b, o, v)),
                        null === f ? (s = b) : (f.sibling = b),
                        (f = b),
                        (h = g);
                    }
                    if (y.done) return n(a, h), s;
                    if (null === h) {
                      for (; !y.done; v++, y = u.next())
                        null !== (y = d(a, y.value, c)) &&
                          ((o = i(y, o, v)),
                          null === f ? (s = y) : (f.sibling = y),
                          (f = y));
                      return s;
                    }
                    for (h = r(a, h); !y.done; v++, y = u.next())
                      null !== (y = m(h, a, v, y.value, c)) &&
                        (e &&
                          null !== y.alternate &&
                          h.delete(null === y.key ? v : y.key),
                        (o = i(y, o, v)),
                        null === f ? (s = y) : (f.sibling = y),
                        (f = y));
                    return (
                      e &&
                        h.forEach(function (e) {
                          return t(a, e);
                        }),
                      s
                    );
                  }
                  return function (e, r, i, u) {
                    var c =
                      "object" == typeof i &&
                      null !== i &&
                      i.type === Ze &&
                      null === i.key;
                    c && (i = i.props.children);
                    var s = "object" == typeof i && null !== i;
                    if (s)
                      switch (i.$$typeof) {
                        case Xe:
                          e: {
                            for (s = i.key, c = r; null !== c; ) {
                              if (c.key === s) {
                                if (
                                  7 === c.tag ? i.type === Ze : c.elementType === i.type
                                ) {
                                  n(e, c.sibling),
                                    ((r = a(
                                      c,
                                      i.type === Ze ? i.props.children : i.props,
                                      u
                                    )).ref = Cl(e, c, i)),
                                    (r.return = e),
                                    (e = r);
                                  break e;
                                }
                                n(e, c);
                                break;
                              }
                              t(e, c), (c = c.sibling);
                            }
                            i.type === Ze
                              ? (((r = ol(i.props.children, e.mode, u, i.key)).return =
                                  e),
                                (e = r))
                              : (((u = il(
                                  i.type,
                                  i.key,
                                  i.props,
                                  null,
                                  e.mode,
                                  u
                                )).ref = Cl(e, r, i)),
                                (u.return = e),
                                (e = u));
                          }
                          return o(e);
                        case Ge:
                          e: {
                            for (c = i.key; null !== r; ) {
                              if (r.key === c) {
                                if (
                                  4 === r.tag &&
                                  r.stateNode.containerInfo === i.containerInfo &&
                                  r.stateNode.implementation === i.implementation
                                ) {
                                  n(e, r.sibling),
                                    ((r = a(r, i.children || [], u)).return = e),
                                    (e = r);
                                  break e;
                                }
                                n(e, r);
                                break;
                              }
                              t(e, r), (r = r.sibling);
                            }
                            ((r = sl(i, e.mode, u)).return = e), (e = r);
                          }
                          return o(e);
                      }
                    if ("string" == typeof i || "number" == typeof i)
                      return (
                        (i = "" + i),
                        null !== r && 6 === r.tag
                          ? (n(e, r.sibling), ((r = a(r, i, u)).return = e), (e = r))
                          : (n(e, r), ((r = cl(i, e.mode, u)).return = e), (e = r)),
                        o(e)
                      );
                    if (El(i)) return h(e, r, i, u);
                    if (ct(i)) return v(e, r, i, u);
                    if ((s && _l(e, i), void 0 === i && !c))
                      switch (e.tag) {
                        case 1:
                        case 0:
                          l("152", (u = e.type).displayName || u.name || "Component");
                      }
                    return n(e, r);
                  };
                }
                var Nl = Pl(!0),
                  zl = Pl(!1),
                  Rl = {},
                  Ul = {
                    current: Rl,
                  },
                  Il = {
                    current: Rl,
                  },
                  Ml = {
                    current: Rl,
                  };
                function Dl(e) {
                  return e === Rl && l("174"), e;
                }
                function Ol(e, t) {
                  Lr(Ml, t, e), Lr(Il, e, e), Lr(Ul, Rl, e);
                  var n = t.nodeType;
                  switch (n) {
                    case 9:
                    case 11:
                      t = (t = t.documentElement) ? t.namespaceURI : fr(null, "");
                      break;
                    default:
                      t = fr(
                        (t = (n = 8 === n ? t.parentNode : t).namespaceURI || null),
                        (n = n.tagName)
                      );
                  }
                  Fr(Ul, e), Lr(Ul, t, e);
                }
                function Fl(e) {
                  Fr(Ul, e), Fr(Il, e), Fr(Ml, e);
                }
                function Ll(e) {
                  Dl(Ml.current);
                  var t = Dl(Ul.current),
                    n = fr(t, e.type);
                  t !== n && (Lr(Il, e, e), Lr(Ul, n, e));
                }
                function Al(e) {
                  Il.current === e && (Fr(Ul, e), Fr(Il, e));
                }
                var Wl = 0,
                  Vl = 2,
                  jl = 4,
                  Bl = 8,
                  Hl = 16,
                  Ql = 32,
                  Kl = 64,
                  $l = 128,
                  ql = $e.ReactCurrentDispatcher,
                  Yl = 0,
                  Xl = null,
                  Gl = null,
                  Zl = null,
                  Jl = null,
                  ea = null,
                  ta = null,
                  na = 0,
                  ra = null,
                  la = 0,
                  aa = !1,
                  ia = null,
                  oa = 0;
                function ua() {
                  l("321");
                }
                function ca(e, t) {
                  if (null === t) return !1;
                  for (var n = 0; n < t.length && n < e.length; n++)
                    if (!ln(e[n], t[n])) return !1;
                  return !0;
                }
                function sa(e, t, n, r, a, i) {
                  if (
                    ((Yl = i),
                    (Xl = t),
                    (Zl = null !== e ? e.memoizedState : null),
                    (ql.current = null === Zl ? wa : Sa),
                    (t = n(r, a)),
                    aa)
                  ) {
                    do {
                      (aa = !1),
                        (oa += 1),
                        (Zl = null !== e ? e.memoizedState : null),
                        (ta = Jl),
                        (ra = ea = Gl = null),
                        (ql.current = Sa),
                        (t = n(r, a));
                    } while (aa);
                    (ia = null), (oa = 0);
                  }
                  return (
                    (ql.current = Ta),
                    ((e = Xl).memoizedState = Jl),
                    (e.expirationTime = na),
                    (e.updateQueue = ra),
                    (e.effectTag |= la),
                    (e = null !== Gl && null !== Gl.next),
                    (Yl = 0),
                    (ta = ea = Jl = Zl = Gl = Xl = null),
                    (na = 0),
                    (ra = null),
                    (la = 0),
                    e && l("300"),
                    t
                  );
                }
                function fa() {
                  (ql.current = Ta),
                    (Yl = 0),
                    (ta = ea = Jl = Zl = Gl = Xl = null),
                    (na = 0),
                    (ra = null),
                    (la = 0),
                    (aa = !1),
                    (ia = null),
                    (oa = 0);
                }
                function da() {
                  var e = {
                    memoizedState: null,
                    baseState: null,
                    queue: null,
                    baseUpdate: null,
                    next: null,
                  };
                  return null === ea ? (Jl = ea = e) : (ea = ea.next = e), ea;
                }
                function pa() {
                  if (null !== ta)
                    (ta = (ea = ta).next), (Zl = null !== (Gl = Zl) ? Gl.next : null);
                  else {
                    null === Zl && l("310");
                    var e = {
                      memoizedState: (Gl = Zl).memoizedState,
                      baseState: Gl.baseState,
                      queue: Gl.queue,
                      baseUpdate: Gl.baseUpdate,
                      next: null,
                    };
                    (ea = null === ea ? (Jl = e) : (ea.next = e)), (Zl = Gl.next);
                  }
                  return ea;
                }
                function ma(e, t) {
                  return "function" == typeof t ? t(e) : t;
                }
                function ha(e) {
                  var t = pa(),
                    n = t.queue;
                  if ((null === n && l("311"), (n.lastRenderedReducer = e), 0 < oa)) {
                    var r = n.dispatch;
                    if (null !== ia) {
                      var a = ia.get(n);
                      if (void 0 !== a) {
                        ia.delete(n);
                        var i = t.memoizedState;
                        do {
                          (i = e(i, a.action)), (a = a.next);
                        } while (null !== a);
                        return (
                          ln(i, t.memoizedState) || (Da = !0),
                          (t.memoizedState = i),
                          t.baseUpdate === n.last && (t.baseState = i),
                          (n.lastRenderedState = i),
                          [i, r]
                        );
                      }
                    }
                    return [t.memoizedState, r];
                  }
                  r = n.last;
                  var o = t.baseUpdate;
                  if (
                    ((i = t.baseState),
                    null !== o
                      ? (null !== r && (r.next = null), (r = o.next))
                      : (r = null !== r ? r.next : null),
                    null !== r)
                  ) {
                    var u = (a = null),
                      c = r,
                      s = !1;
                    do {
                      var f = c.expirationTime;
                      f < Yl
                        ? (s || ((s = !0), (u = o), (a = i)), f > na && (na = f))
                        : (i = c.eagerReducer === e ? c.eagerState : e(i, c.action)),
                        (o = c),
                        (c = c.next);
                    } while (null !== c && c !== r);
                    s || ((u = o), (a = i)),
                      ln(i, t.memoizedState) || (Da = !0),
                      (t.memoizedState = i),
                      (t.baseUpdate = u),
                      (t.baseState = a),
                      (n.lastRenderedState = i);
                  }
                  return [t.memoizedState, n.dispatch];
                }
                function va(e, t, n, r) {
                  return (
                    (e = {
                      tag: e,
                      create: t,
                      destroy: n,
                      deps: r,
                      next: null,
                    }),
                    null === ra
                      ? ((ra = {
                          lastEffect: null,
                        }).lastEffect = e.next =
                          e)
                      : null === (t = ra.lastEffect)
                      ? (ra.lastEffect = e.next = e)
                      : ((n = t.next), (t.next = e), (e.next = n), (ra.lastEffect = e)),
                    e
                  );
                }
                function ga(e, t, n, r) {
                  var l = da();
                  (la |= e),
                    (l.memoizedState = va(t, n, void 0, void 0 === r ? null : r));
                }
                function ya(e, t, n, r) {
                  var l = pa();
                  r = void 0 === r ? null : r;
                  var a = void 0;
                  if (null !== Gl) {
                    var i = Gl.memoizedState;
                    if (((a = i.destroy), null !== r && ca(r, i.deps)))
                      return void va(Wl, n, a, r);
                  }
                  (la |= e), (l.memoizedState = va(t, n, a, r));
                }
                function ba(e, t) {
                  return "function" == typeof t
                    ? ((e = e()),
                      t(e),
                      function () {
                        t(null);
                      })
                    : null != t
                    ? ((e = e()),
                      (t.current = e),
                      function () {
                        t.current = null;
                      })
                    : void 0;
                }
                function ka() {}
                function xa(e, t, n) {
                  25 > oa || l("301");
                  var r = e.alternate;
                  if (e === Xl || (null !== r && r === Xl))
                    if (
                      ((aa = !0),
                      (e = {
                        expirationTime: Yl,
                        action: n,
                        eagerReducer: null,
                        eagerState: null,
                        next: null,
                      }),
                      null === ia && (ia = new Map()),
                      void 0 === (n = ia.get(t)))
                    )
                      ia.set(t, e);
                    else {
                      for (t = n; null !== t.next; ) t = t.next;
                      t.next = e;
                    }
                  else {
                    lo();
                    var a = Vo(),
                      i = {
                        expirationTime: (a = so(a, e)),
                        action: n,
                        eagerReducer: null,
                        eagerState: null,
                        next: null,
                      },
                      o = t.last;
                    if (null === o) i.next = i;
                    else {
                      var u = o.next;
                      null !== u && (i.next = u), (o.next = i);
                    }
                    if (
                      ((t.last = i),
                      0 === e.expirationTime &&
                        (null === r || 0 === r.expirationTime) &&
                        null !== (r = t.lastRenderedReducer))
                    )
                      try {
                        var c = t.lastRenderedState,
                          s = r(c, n);
                        if (((i.eagerReducer = r), (i.eagerState = s), ln(s, c)))
                          return;
                      } catch (f) {}
                    ho(e, a);
                  }
                }
                var Ta = {
                    readContext: ti,
                    useCallback: ua,
                    useContext: ua,
                    useEffect: ua,
                    useImperativeHandle: ua,
                    useLayoutEffect: ua,
                    useMemo: ua,
                    useReducer: ua,
                    useRef: ua,
                    useState: ua,
                    useDebugValue: ua,
                  },
                  wa = {
                    readContext: ti,
                    useCallback: function (e, t) {
                      return (da().memoizedState = [e, void 0 === t ? null : t]), e;
                    },
                    useContext: ti,
                    useEffect: function (e, t) {
                      return ga(516, $l | Kl, e, t);
                    },
                    useImperativeHandle: function (e, t, n) {
                      return (
                        (n = null != n ? n.concat([e]) : null),
                        ga(4, jl | Ql, ba.bind(null, t, e), n)
                      );
                    },
                    useLayoutEffect: function (e, t) {
                      return ga(4, jl | Ql, e, t);
                    },
                    useMemo: function (e, t) {
                      var n = da();
                      return (
                        (t = void 0 === t ? null : t),
                        (e = e()),
                        (n.memoizedState = [e, t]),
                        e
                      );
                    },
                    useReducer: function (e, t, n) {
                      var r = da();
                      return (
                        (t = void 0 !== n ? n(t) : t),
                        (r.memoizedState = r.baseState = t),
                        (e = (e = r.queue =
                          {
                            last: null,
                            dispatch: null,
                            lastRenderedReducer: e,
                            lastRenderedState: t,
                          }).dispatch =
                          xa.bind(null, Xl, e)),
                        [r.memoizedState, e]
                      );
                    },
                    useRef: function (e) {
                      return (
                        (e = {
                          current: e,
                        }),
                        (da().memoizedState = e)
                      );
                    },
                    useState: function (e) {
                      var t = da();
                      return (
                        "function" == typeof e && (e = e()),
                        (t.memoizedState = t.baseState = e),
                        (e = (e = t.queue =
                          {
                            last: null,
                            dispatch: null,
                            lastRenderedReducer: ma,
                            lastRenderedState: e,
                          }).dispatch =
                          xa.bind(null, Xl, e)),
                        [t.memoizedState, e]
                      );
                    },
                    useDebugValue: ka,
                  },
                  Sa = {
                    readContext: ti,
                    useCallback: function (e, t) {
                      var n = pa();
                      t = void 0 === t ? null : t;
                      var r = n.memoizedState;
                      return null !== r && null !== t && ca(t, r[1])
                        ? r[0]
                        : ((n.memoizedState = [e, t]), e);
                    },
                    useContext: ti,
                    useEffect: function (e, t) {
                      return ya(516, $l | Kl, e, t);
                    },
                    useImperativeHandle: function (e, t, n) {
                      return (
                        (n = null != n ? n.concat([e]) : null),
                        ya(4, jl | Ql, ba.bind(null, t, e), n)
                      );
                    },
                    useLayoutEffect: function (e, t) {
                      return ya(4, jl | Ql, e, t);
                    },
                    useMemo: function (e, t) {
                      var n = pa();
                      t = void 0 === t ? null : t;
                      var r = n.memoizedState;
                      return null !== r && null !== t && ca(t, r[1])
                        ? r[0]
                        : ((e = e()), (n.memoizedState = [e, t]), e);
                    },
                    useReducer: ha,
                    useRef: function () {
                      return pa().memoizedState;
                    },
                    useState: function (e) {
                      return ha(ma, e);
                    },
                    useDebugValue: ka,
                  },
                  Ea = null,
                  Ca = null,
                  _a = !1;
                function Pa(e, t) {
                  var n = nl(5, null, null, 0);
                  (n.elementType = "DELETED"),
                    (n.type = "DELETED"),
                    (n.stateNode = t),
                    (n.return = e),
                    (n.effectTag = 8),
                    null !== e.lastEffect
                      ? ((e.lastEffect.nextEffect = n), (e.lastEffect = n))
                      : (e.firstEffect = e.lastEffect = n);
                }
                function Na(e, t) {
                  switch (e.tag) {
                    case 5:
                      var n = e.type;
                      return (
                        null !==
                          (t =
                            1 !== t.nodeType ||
                            n.toLowerCase() !== t.nodeName.toLowerCase()
                              ? null
                              : t) && ((e.stateNode = t), !0)
                      );
                    case 6:
                      return (
                        null !==
                          (t = "" === e.pendingProps || 3 !== t.nodeType ? null : t) &&
                        ((e.stateNode = t), !0)
                      );
                    case 13:
                    default:
                      return !1;
                  }
                }
                function za(e) {
                  if (_a) {
                    var t = Ca;
                    if (t) {
                      var n = t;
                      if (!Na(e, t)) {
                        if (!(t = Ir(n)) || !Na(e, t))
                          return (e.effectTag |= 2), (_a = !1), void (Ea = e);
                        Pa(Ea, n);
                      }
                      (Ea = e), (Ca = Mr(t));
                    } else (e.effectTag |= 2), (_a = !1), (Ea = e);
                  }
                }
                function Ra(e) {
                  for (
                    e = e.return;
                    null !== e && 5 !== e.tag && 3 !== e.tag && 18 !== e.tag;
        
                  )
                    e = e.return;
                  Ea = e;
                }
                function Ua(e) {
                  if (e !== Ea) return !1;
                  if (!_a) return Ra(e), (_a = !0), !1;
                  var t = e.type;
                  if (
                    5 !== e.tag ||
                    ("head" !== t && "body" !== t && !_r(t, e.memoizedProps))
                  )
                    for (t = Ca; t; ) Pa(e, t), (t = Ir(t));
                  return Ra(e), (Ca = Ea ? Ir(e.stateNode) : null), !0;
                }
                function Ia() {
                  (Ca = Ea = null), (_a = !1);
                }
                var Ma = $e.ReactCurrentOwner,
                  Da = !1;
                function Oa(e, t, n, r) {
                  t.child = null === e ? zl(t, null, n, r) : Nl(t, e.child, n, r);
                }
                function Fa(e, t, n, r, l) {
                  n = n.render;
                  var a = t.ref;
                  return (
                    ei(t, l),
                    (r = sa(e, t, n, r, a, l)),
                    null === e || Da
                      ? ((t.effectTag |= 1), Oa(e, t, r, l), t.child)
                      : ((t.updateQueue = e.updateQueue),
                        (t.effectTag &= -517),
                        e.expirationTime <= l && (e.expirationTime = 0),
                        Ka(e, t, l))
                  );
                }
                function La(e, t, n, r, l, a) {
                  if (null === e) {
                    var i = n.type;
                    return "function" != typeof i ||
                      rl(i) ||
                      void 0 !== i.defaultProps ||
                      null !== n.compare ||
                      void 0 !== n.defaultProps
                      ? (((e = il(n.type, null, r, null, t.mode, a)).ref = t.ref),
                        (e.return = t),
                        (t.child = e))
                      : ((t.tag = 15), (t.type = i), Aa(e, t, i, r, l, a));
                  }
                  return (
                    (i = e.child),
                    l < a &&
                    ((l = i.memoizedProps),
                    (n = null !== (n = n.compare) ? n : on)(l, r) && e.ref === t.ref)
                      ? Ka(e, t, a)
                      : ((t.effectTag |= 1),
                        ((e = al(i, r, a)).ref = t.ref),
                        (e.return = t),
                        (t.child = e))
                  );
                }
                function Aa(e, t, n, r, l, a) {
                  return null !== e &&
                    on(e.memoizedProps, r) &&
                    e.ref === t.ref &&
                    ((Da = !1), l < a)
                    ? Ka(e, t, a)
                    : Va(e, t, n, r, a);
                }
                function Wa(e, t) {
                  var n = t.ref;
                  ((null === e && null !== n) || (null !== e && e.ref !== n)) &&
                    (t.effectTag |= 128);
                }
                function Va(e, t, n, r, l) {
                  var a = Hr(n) ? jr : Wr.current;
                  return (
                    (a = Br(t, a)),
                    ei(t, l),
                    (n = sa(e, t, n, r, a, l)),
                    null === e || Da
                      ? ((t.effectTag |= 1), Oa(e, t, n, l), t.child)
                      : ((t.updateQueue = e.updateQueue),
                        (t.effectTag &= -517),
                        e.expirationTime <= l && (e.expirationTime = 0),
                        Ka(e, t, l))
                  );
                }
                function ja(e, t, n, r, l) {
                  if (Hr(n)) {
                    var a = !0;
                    Yr(t);
                  } else a = !1;
                  if ((ei(t, l), null === t.stateNode))
                    null !== e &&
                      ((e.alternate = null), (t.alternate = null), (t.effectTag |= 2)),
                      Tl(t, n, r, l),
                      Sl(t, n, r, l),
                      (r = !0);
                  else if (null === e) {
                    var i = t.stateNode,
                      o = t.memoizedProps;
                    i.props = o;
                    var u = i.context,
                      c = n.contextType;
                    "object" == typeof c && null !== c
                      ? (c = ti(c))
                      : (c = Br(t, (c = Hr(n) ? jr : Wr.current)));
                    var s = n.getDerivedStateFromProps,
                      f =
                        "function" == typeof s ||
                        "function" == typeof i.getSnapshotBeforeUpdate;
                    f ||
                      ("function" != typeof i.UNSAFE_componentWillReceiveProps &&
                        "function" != typeof i.componentWillReceiveProps) ||
                      ((o !== r || u !== c) && wl(t, i, r, c)),
                      (ii = !1);
                    var d = t.memoizedState;
                    u = i.state = d;
                    var p = t.updateQueue;
                    null !== p && (hi(t, p, r, i, l), (u = t.memoizedState)),
                      o !== r || d !== u || Vr.current || ii
                        ? ("function" == typeof s &&
                            (bl(t, n, s, r), (u = t.memoizedState)),
                          (o = ii || xl(t, n, o, r, d, u, c))
                            ? (f ||
                                ("function" != typeof i.UNSAFE_componentWillMount &&
                                  "function" != typeof i.componentWillMount) ||
                                ("function" == typeof i.componentWillMount &&
                                  i.componentWillMount(),
                                "function" == typeof i.UNSAFE_componentWillMount &&
                                  i.UNSAFE_componentWillMount()),
                              "function" == typeof i.componentDidMount &&
                                (t.effectTag |= 4))
                            : ("function" == typeof i.componentDidMount &&
                                (t.effectTag |= 4),
                              (t.memoizedProps = r),
                              (t.memoizedState = u)),
                          (i.props = r),
                          (i.state = u),
                          (i.context = c),
                          (r = o))
                        : ("function" == typeof i.componentDidMount &&
                            (t.effectTag |= 4),
                          (r = !1));
                  } else
                    (i = t.stateNode),
                      (o = t.memoizedProps),
                      (i.props = t.type === t.elementType ? o : vl(t.type, o)),
                      (u = i.context),
                      "object" == typeof (c = n.contextType) && null !== c
                        ? (c = ti(c))
                        : (c = Br(t, (c = Hr(n) ? jr : Wr.current))),
                      (f =
                        "function" == typeof (s = n.getDerivedStateFromProps) ||
                        "function" == typeof i.getSnapshotBeforeUpdate) ||
                        ("function" != typeof i.UNSAFE_componentWillReceiveProps &&
                          "function" != typeof i.componentWillReceiveProps) ||
                        ((o !== r || u !== c) && wl(t, i, r, c)),
                      (ii = !1),
                      (u = t.memoizedState),
                      (d = i.state = u),
                      null !== (p = t.updateQueue) &&
                        (hi(t, p, r, i, l), (d = t.memoizedState)),
                      o !== r || u !== d || Vr.current || ii
                        ? ("function" == typeof s &&
                            (bl(t, n, s, r), (d = t.memoizedState)),
                          (s = ii || xl(t, n, o, r, u, d, c))
                            ? (f ||
                                ("function" != typeof i.UNSAFE_componentWillUpdate &&
                                  "function" != typeof i.componentWillUpdate) ||
                                ("function" == typeof i.componentWillUpdate &&
                                  i.componentWillUpdate(r, d, c),
                                "function" == typeof i.UNSAFE_componentWillUpdate &&
                                  i.UNSAFE_componentWillUpdate(r, d, c)),
                              "function" == typeof i.componentDidUpdate &&
                                (t.effectTag |= 4),
                              "function" == typeof i.getSnapshotBeforeUpdate &&
                                (t.effectTag |= 256))
                            : ("function" != typeof i.componentDidUpdate ||
                                (o === e.memoizedProps && u === e.memoizedState) ||
                                (t.effectTag |= 4),
                              "function" != typeof i.getSnapshotBeforeUpdate ||
                                (o === e.memoizedProps && u === e.memoizedState) ||
                                (t.effectTag |= 256),
                              (t.memoizedProps = r),
                              (t.memoizedState = d)),
                          (i.props = r),
                          (i.state = d),
                          (i.context = c),
                          (r = s))
                        : ("function" != typeof i.componentDidUpdate ||
                            (o === e.memoizedProps && u === e.memoizedState) ||
                            (t.effectTag |= 4),
                          "function" != typeof i.getSnapshotBeforeUpdate ||
                            (o === e.memoizedProps && u === e.memoizedState) ||
                            (t.effectTag |= 256),
                          (r = !1));
                  return Ba(e, t, n, r, a, l);
                }
                function Ba(e, t, n, r, l, a) {
                  Wa(e, t);
                  var i = 0 != (64 & t.effectTag);
                  if (!r && !i) return l && Xr(t, n, !1), Ka(e, t, a);
                  (r = t.stateNode), (Ma.current = t);
                  var o =
                    i && "function" != typeof n.getDerivedStateFromError
                      ? null
                      : r.render();
                  return (
                    (t.effectTag |= 1),
                    null !== e && i
                      ? ((t.child = Nl(t, e.child, null, a)),
                        (t.child = Nl(t, null, o, a)))
                      : Oa(e, t, o, a),
                    (t.memoizedState = r.state),
                    l && Xr(t, n, !0),
                    t.child
                  );
                }
                function Ha(e) {
                  var t = e.stateNode;
                  t.pendingContext
                    ? $r(e, t.pendingContext, t.pendingContext !== t.context)
                    : t.context && $r(e, t.context, !1),
                    Ol(e, t.containerInfo);
                }
                function Qa(e, t, n) {
                  var r = t.mode,
                    l = t.pendingProps,
                    a = t.memoizedState;
                  if (0 == (64 & t.effectTag)) {
                    a = null;
                    var i = !1;
                  } else
                    (a = {
                      timedOutAt: null !== a ? a.timedOutAt : 0,
                    }),
                      (i = !0),
                      (t.effectTag &= -65);
                  if (null === e)
                    if (i) {
                      var o = l.fallback;
                      (e = ol(null, r, 0, null)),
                        0 == (1 & t.mode) &&
                          (e.child =
                            null !== t.memoizedState ? t.child.child : t.child),
                        (r = ol(o, r, n, null)),
                        (e.sibling = r),
                        ((n = e).return = r.return = t);
                    } else n = r = zl(t, null, l.children, n);
                  else
                    null !== e.memoizedState
                      ? ((o = (r = e.child).sibling),
                        i
                          ? ((n = l.fallback),
                            (l = al(r, r.pendingProps, 0)),
                            0 == (1 & t.mode) &&
                              (i =
                                null !== t.memoizedState ? t.child.child : t.child) !==
                                r.child &&
                              (l.child = i),
                            (r = l.sibling = al(o, n, o.expirationTime)),
                            (n = l),
                            (l.childExpirationTime = 0),
                            (n.return = r.return = t))
                          : (n = r = Nl(t, r.child, l.children, n)))
                      : ((o = e.child),
                        i
                          ? ((i = l.fallback),
                            ((l = ol(null, r, 0, null)).child = o),
                            0 == (1 & t.mode) &&
                              (l.child =
                                null !== t.memoizedState ? t.child.child : t.child),
                            ((r = l.sibling = ol(i, r, n, null)).effectTag |= 2),
                            (n = l),
                            (l.childExpirationTime = 0),
                            (n.return = r.return = t))
                          : (r = n = Nl(t, o, l.children, n))),
                      (t.stateNode = e.stateNode);
                  return (t.memoizedState = a), (t.child = n), r;
                }
                function Ka(e, t, n) {
                  if (
                    (null !== e && (t.contextDependencies = e.contextDependencies),
                    t.childExpirationTime < n)
                  )
                    return null;
                  if (
                    (null !== e && t.child !== e.child && l("153"), null !== t.child)
                  ) {
                    for (
                      n = al((e = t.child), e.pendingProps, e.expirationTime),
                        t.child = n,
                        n.return = t;
                      null !== e.sibling;
        
                    )
                      (e = e.sibling),
                        ((n = n.sibling =
                          al(e, e.pendingProps, e.expirationTime)).return = t);
                    n.sibling = null;
                  }
                  return t.child;
                }
                function $a(e, t, n) {
                  var r = t.expirationTime;
                  if (null !== e) {
                    if (e.memoizedProps !== t.pendingProps || Vr.current) Da = !0;
                    else if (r < n) {
                      switch (((Da = !1), t.tag)) {
                        case 3:
                          Ha(t), Ia();
                          break;
                        case 5:
                          Ll(t);
                          break;
                        case 1:
                          Hr(t.type) && Yr(t);
                          break;
                        case 4:
                          Ol(t, t.stateNode.containerInfo);
                          break;
                        case 10:
                          Za(t, t.memoizedProps.value);
                          break;
                        case 13:
                          if (null !== t.memoizedState)
                            return 0 !== (r = t.child.childExpirationTime) && r >= n
                              ? Qa(e, t, n)
                              : null !== (t = Ka(e, t, n))
                              ? t.sibling
                              : null;
                      }
                      return Ka(e, t, n);
                    }
                  } else Da = !1;
                  switch (((t.expirationTime = 0), t.tag)) {
                    case 2:
                      (r = t.elementType),
                        null !== e &&
                          ((e.alternate = null),
                          (t.alternate = null),
                          (t.effectTag |= 2)),
                        (e = t.pendingProps);
                      var a = Br(t, Wr.current);
                      if (
                        (ei(t, n),
                        (a = sa(null, t, r, e, a, n)),
                        (t.effectTag |= 1),
                        "object" == typeof a &&
                          null !== a &&
                          "function" == typeof a.render &&
                          void 0 === a.$$typeof)
                      ) {
                        if (((t.tag = 1), fa(), Hr(r))) {
                          var i = !0;
                          Yr(t);
                        } else i = !1;
                        t.memoizedState =
                          null !== a.state && void 0 !== a.state ? a.state : null;
                        var o = r.getDerivedStateFromProps;
                        "function" == typeof o && bl(t, r, o, e),
                          (a.updater = kl),
                          (t.stateNode = a),
                          (a._reactInternalFiber = t),
                          Sl(t, r, e, n),
                          (t = Ba(null, t, r, !0, i, n));
                      } else (t.tag = 0), Oa(null, t, a, n), (t = t.child);
                      return t;
                    case 16:
                      switch (
                        ((a = t.elementType),
                        null !== e &&
                          ((e.alternate = null),
                          (t.alternate = null),
                          (t.effectTag |= 2)),
                        (i = t.pendingProps),
                        (e = gl(a)),
                        (t.type = e),
                        (a = t.tag = ll(e)),
                        (i = vl(e, i)),
                        (o = void 0),
                        a)
                      ) {
                        case 0:
                          o = Va(null, t, e, i, n);
                          break;
                        case 1:
                          o = ja(null, t, e, i, n);
                          break;
                        case 11:
                          o = Fa(null, t, e, i, n);
                          break;
                        case 14:
                          o = La(null, t, e, vl(e.type, i), r, n);
                          break;
                        default:
                          l("306", e, "");
                      }
                      return o;
                    case 0:
                      return (
                        (r = t.type),
                        (a = t.pendingProps),
                        Va(e, t, r, (a = t.elementType === r ? a : vl(r, a)), n)
                      );
                    case 1:
                      return (
                        (r = t.type),
                        (a = t.pendingProps),
                        ja(e, t, r, (a = t.elementType === r ? a : vl(r, a)), n)
                      );
                    case 3:
                      return (
                        Ha(t),
                        null === (r = t.updateQueue) && l("282"),
                        (a = null !== (a = t.memoizedState) ? a.element : null),
                        hi(t, r, t.pendingProps, null, n),
                        (r = t.memoizedState.element) === a
                          ? (Ia(), (t = Ka(e, t, n)))
                          : ((a = t.stateNode),
                            (a = (null === e || null === e.child) && a.hydrate) &&
                              ((Ca = Mr(t.stateNode.containerInfo)),
                              (Ea = t),
                              (a = _a = !0)),
                            a
                              ? ((t.effectTag |= 2), (t.child = zl(t, null, r, n)))
                              : (Oa(e, t, r, n), Ia()),
                            (t = t.child)),
                        t
                      );
                    case 5:
                      return (
                        Ll(t),
                        null === e && za(t),
                        (r = t.type),
                        (a = t.pendingProps),
                        (i = null !== e ? e.memoizedProps : null),
                        (o = a.children),
                        _r(r, a)
                          ? (o = null)
                          : null !== i && _r(r, i) && (t.effectTag |= 16),
                        Wa(e, t),
                        1 !== n && 1 & t.mode && a.hidden
                          ? ((t.expirationTime = t.childExpirationTime = 1), (t = null))
                          : (Oa(e, t, o, n), (t = t.child)),
                        t
                      );
                    case 6:
                      return null === e && za(t), null;
                    case 13:
                      return Qa(e, t, n);
                    case 4:
                      return (
                        Ol(t, t.stateNode.containerInfo),
                        (r = t.pendingProps),
                        null === e ? (t.child = Nl(t, null, r, n)) : Oa(e, t, r, n),
                        t.child
                      );
                    case 11:
                      return (
                        (r = t.type),
                        (a = t.pendingProps),
                        Fa(e, t, r, (a = t.elementType === r ? a : vl(r, a)), n)
                      );
                    case 7:
                      return Oa(e, t, t.pendingProps, n), t.child;
                    case 8:
                    case 12:
                      return Oa(e, t, t.pendingProps.children, n), t.child;
                    case 10:
                      e: {
                        if (
                          ((r = t.type._context),
                          (a = t.pendingProps),
                          (o = t.memoizedProps),
                          Za(t, (i = a.value)),
                          null !== o)
                        ) {
                          var u = o.value;
                          if (
                            0 ===
                            (i = ln(u, i)
                              ? 0
                              : 0 |
                                ("function" == typeof r._calculateChangedBits
                                  ? r._calculateChangedBits(u, i)
                                  : 1073741823))
                          ) {
                            if (o.children === a.children && !Vr.current) {
                              t = Ka(e, t, n);
                              break e;
                            }
                          } else
                            for (
                              null !== (u = t.child) && (u.return = t);
                              null !== u;
        
                            ) {
                              var c = u.contextDependencies;
                              if (null !== c) {
                                o = u.child;
                                for (var s = c.first; null !== s; ) {
                                  if (s.context === r && 0 != (s.observedBits & i)) {
                                    1 === u.tag && (((s = ci(n)).tag = li), fi(u, s)),
                                      u.expirationTime < n && (u.expirationTime = n),
                                      null !== (s = u.alternate) &&
                                        s.expirationTime < n &&
                                        (s.expirationTime = n),
                                      (s = n);
                                    for (var f = u.return; null !== f; ) {
                                      var d = f.alternate;
                                      if (f.childExpirationTime < s)
                                        (f.childExpirationTime = s),
                                          null !== d &&
                                            d.childExpirationTime < s &&
                                            (d.childExpirationTime = s);
                                      else {
                                        if (!(null !== d && d.childExpirationTime < s))
                                          break;
                                        d.childExpirationTime = s;
                                      }
                                      f = f.return;
                                    }
                                    c.expirationTime < n && (c.expirationTime = n);
                                    break;
                                  }
                                  s = s.next;
                                }
                              } else
                                o = 10 === u.tag && u.type === t.type ? null : u.child;
                              if (null !== o) o.return = u;
                              else
                                for (o = u; null !== o; ) {
                                  if (o === t) {
                                    o = null;
                                    break;
                                  }
                                  if (null !== (u = o.sibling)) {
                                    (u.return = o.return), (o = u);
                                    break;
                                  }
                                  o = o.return;
                                }
                              u = o;
                            }
                        }
                        Oa(e, t, a.children, n), (t = t.child);
                      }
                      return t;
                    case 9:
                      return (
                        (a = t.type),
                        (r = (i = t.pendingProps).children),
                        ei(t, n),
                        (r = r((a = ti(a, i.unstable_observedBits)))),
                        (t.effectTag |= 1),
                        Oa(e, t, r, n),
                        t.child
                      );
                    case 14:
                      return (
                        (i = vl((a = t.type), t.pendingProps)),
                        La(e, t, a, (i = vl(a.type, i)), r, n)
                      );
                    case 15:
                      return Aa(e, t, t.type, t.pendingProps, r, n);
                    case 17:
                      return (
                        (r = t.type),
                        (a = t.pendingProps),
                        (a = t.elementType === r ? a : vl(r, a)),
                        null !== e &&
                          ((e.alternate = null),
                          (t.alternate = null),
                          (t.effectTag |= 2)),
                        (t.tag = 1),
                        Hr(r) ? ((e = !0), Yr(t)) : (e = !1),
                        ei(t, n),
                        Tl(t, r, a, n),
                        Sl(t, r, a, n),
                        Ba(null, t, r, !0, e, n)
                      );
                  }
                  l("156");
                }
                var qa = {
                    current: null,
                  },
                  Ya = null,
                  Xa = null,
                  Ga = null;
                function Za(e, t) {
                  var n = e.type._context;
                  Lr(qa, n._currentValue, e), (n._currentValue = t);
                }
                function Ja(e) {
                  var t = qa.current;
                  Fr(qa, e), (e.type._context._currentValue = t);
                }
                function ei(e, t) {
                  (Ya = e), (Ga = Xa = null);
                  var n = e.contextDependencies;
                  null !== n && n.expirationTime >= t && (Da = !0),
                    (e.contextDependencies = null);
                }
                function ti(e, t) {
                  return (
                    Ga !== e &&
                      !1 !== t &&
                      0 !== t &&
                      (("number" == typeof t && 1073741823 !== t) ||
                        ((Ga = e), (t = 1073741823)),
                      (t = {
                        context: e,
                        observedBits: t,
                        next: null,
                      }),
                      null === Xa
                        ? (null === Ya && l("308"),
                          (Xa = t),
                          (Ya.contextDependencies = {
                            first: t,
                            expirationTime: 0,
                          }))
                        : (Xa = Xa.next = t)),
                    e._currentValue
                  );
                }
                var ni = 0,
                  ri = 1,
                  li = 2,
                  ai = 3,
                  ii = !1;
                function oi(e) {
                  return {
                    baseState: e,
                    firstUpdate: null,
                    lastUpdate: null,
                    firstCapturedUpdate: null,
                    lastCapturedUpdate: null,
                    firstEffect: null,
                    lastEffect: null,
                    firstCapturedEffect: null,
                    lastCapturedEffect: null,
                  };
                }
                function ui(e) {
                  return {
                    baseState: e.baseState,
                    firstUpdate: e.firstUpdate,
                    lastUpdate: e.lastUpdate,
                    firstCapturedUpdate: null,
                    lastCapturedUpdate: null,
                    firstEffect: null,
                    lastEffect: null,
                    firstCapturedEffect: null,
                    lastCapturedEffect: null,
                  };
                }
                function ci(e) {
                  return {
                    expirationTime: e,
                    tag: ni,
                    payload: null,
                    callback: null,
                    next: null,
                    nextEffect: null,
                  };
                }
                function si(e, t) {
                  null === e.lastUpdate
                    ? (e.firstUpdate = e.lastUpdate = t)
                    : ((e.lastUpdate.next = t), (e.lastUpdate = t));
                }
                function fi(e, t) {
                  var n = e.alternate;
                  if (null === n) {
                    var r = e.updateQueue,
                      l = null;
                    null === r && (r = e.updateQueue = oi(e.memoizedState));
                  } else
                    (r = e.updateQueue),
                      (l = n.updateQueue),
                      null === r
                        ? null === l
                          ? ((r = e.updateQueue = oi(e.memoizedState)),
                            (l = n.updateQueue = oi(n.memoizedState)))
                          : (r = e.updateQueue = ui(l))
                        : null === l && (l = n.updateQueue = ui(r));
                  null === l || r === l
                    ? si(r, t)
                    : null === r.lastUpdate || null === l.lastUpdate
                    ? (si(r, t), si(l, t))
                    : (si(r, t), (l.lastUpdate = t));
                }
                function di(e, t) {
                  var n = e.updateQueue;
                  null ===
                  (n = null === n ? (e.updateQueue = oi(e.memoizedState)) : pi(e, n))
                    .lastCapturedUpdate
                    ? (n.firstCapturedUpdate = n.lastCapturedUpdate = t)
                    : ((n.lastCapturedUpdate.next = t), (n.lastCapturedUpdate = t));
                }
                function pi(e, t) {
                  var n = e.alternate;
                  return (
                    null !== n && t === n.updateQueue && (t = e.updateQueue = ui(t)), t
                  );
                }
                function mi(e, n, r, l, a, i) {
                  switch (r.tag) {
                    case ri:
                      return "function" == typeof (e = r.payload) ? e.call(i, l, a) : e;
                    case ai:
                      e.effectTag = (-2049 & e.effectTag) | 64;
                    case ni:
                      if (
                        null ==
                        (a = "function" == typeof (e = r.payload) ? e.call(i, l, a) : e)
                      )
                        break;
                      return t({}, l, a);
                    case li:
                      ii = !0;
                  }
                  return l;
                }
                function hi(e, t, n, r, l) {
                  ii = !1;
                  for (
                    var a = (t = pi(e, t)).baseState,
                      i = null,
                      o = 0,
                      u = t.firstUpdate,
                      c = a;
                    null !== u;
        
                  ) {
                    var s = u.expirationTime;
                    s < l
                      ? (null === i && ((i = u), (a = c)), o < s && (o = s))
                      : ((c = mi(e, t, u, c, n, r)),
                        null !== u.callback &&
                          ((e.effectTag |= 32),
                          (u.nextEffect = null),
                          null === t.lastEffect
                            ? (t.firstEffect = t.lastEffect = u)
                            : ((t.lastEffect.nextEffect = u), (t.lastEffect = u)))),
                      (u = u.next);
                  }
                  for (s = null, u = t.firstCapturedUpdate; null !== u; ) {
                    var f = u.expirationTime;
                    f < l
                      ? (null === s && ((s = u), null === i && (a = c)),
                        o < f && (o = f))
                      : ((c = mi(e, t, u, c, n, r)),
                        null !== u.callback &&
                          ((e.effectTag |= 32),
                          (u.nextEffect = null),
                          null === t.lastCapturedEffect
                            ? (t.firstCapturedEffect = t.lastCapturedEffect = u)
                            : ((t.lastCapturedEffect.nextEffect = u),
                              (t.lastCapturedEffect = u)))),
                      (u = u.next);
                  }
                  null === i && (t.lastUpdate = null),
                    null === s ? (t.lastCapturedUpdate = null) : (e.effectTag |= 32),
                    null === i && null === s && (a = c),
                    (t.baseState = a),
                    (t.firstUpdate = i),
                    (t.firstCapturedUpdate = s),
                    (e.expirationTime = o),
                    (e.memoizedState = c);
                }
                function vi(e, t, n) {
                  null !== t.firstCapturedUpdate &&
                    (null !== t.lastUpdate &&
                      ((t.lastUpdate.next = t.firstCapturedUpdate),
                      (t.lastUpdate = t.lastCapturedUpdate)),
                    (t.firstCapturedUpdate = t.lastCapturedUpdate = null)),
                    gi(t.firstEffect, n),
                    (t.firstEffect = t.lastEffect = null),
                    gi(t.firstCapturedEffect, n),
                    (t.firstCapturedEffect = t.lastCapturedEffect = null);
                }
                function gi(e, t) {
                  for (; null !== e; ) {
                    var n = e.callback;
                    if (null !== n) {
                      e.callback = null;
                      var r = t;
                      "function" != typeof n && l("191", n), n.call(r);
                    }
                    e = e.nextEffect;
                  }
                }
                function yi(e, t) {
                  return {
                    value: e,
                    source: t,
                    stack: ft(t),
                  };
                }
                function bi(e) {
                  e.effectTag |= 4;
                }
                var ki = void 0,
                  xi = void 0,
                  Ti = void 0,
                  wi = void 0;
                (ki = function (e, t) {
                  for (var n = t.child; null !== n; ) {
                    if (5 === n.tag || 6 === n.tag) e.appendChild(n.stateNode);
                    else if (4 !== n.tag && null !== n.child) {
                      (n.child.return = n), (n = n.child);
                      continue;
                    }
                    if (n === t) break;
                    for (; null === n.sibling; ) {
                      if (null === n.return || n.return === t) return;
                      n = n.return;
                    }
                    (n.sibling.return = n.return), (n = n.sibling);
                  }
                }),
                  (xi = function () {}),
                  (Ti = function (e, n, r, l, a) {
                    var i = e.memoizedProps;
                    if (i !== l) {
                      var o = n.stateNode;
                      switch ((Dl(Ul.current), (e = null), r)) {
                        case "input":
                          (i = Et(o, i)), (l = Et(o, l)), (e = []);
                          break;
                        case "option":
                          (i = rr(o, i)), (l = rr(o, l)), (e = []);
                          break;
                        case "select":
                          (i = t({}, i, {
                            value: void 0,
                          })),
                            (l = t({}, l, {
                              value: void 0,
                            })),
                            (e = []);
                          break;
                        case "textarea":
                          (i = ar(o, i)), (l = ar(o, l)), (e = []);
                          break;
                        default:
                          "function" != typeof i.onClick &&
                            "function" == typeof l.onClick &&
                            (o.onclick = wr);
                      }
                      kr(r, l), (o = r = void 0);
                      var u = null;
                      for (r in i)
                        if (!l.hasOwnProperty(r) && i.hasOwnProperty(r) && null != i[r])
                          if ("style" === r) {
                            var c = i[r];
                            for (o in c)
                              c.hasOwnProperty(o) && (u || (u = {}), (u[o] = ""));
                          } else
                            "dangerouslySetInnerHTML" !== r &&
                              "children" !== r &&
                              "suppressContentEditableWarning" !== r &&
                              "suppressHydrationWarning" !== r &&
                              "autoFocus" !== r &&
                              (b.hasOwnProperty(r)
                                ? e || (e = [])
                                : (e = e || []).push(r, null));
                      for (r in l) {
                        var s = l[r];
                        if (
                          ((c = null != i ? i[r] : void 0),
                          l.hasOwnProperty(r) && s !== c && (null != s || null != c))
                        )
                          if ("style" === r)
                            if (c) {
                              for (o in c)
                                !c.hasOwnProperty(o) ||
                                  (s && s.hasOwnProperty(o)) ||
                                  (u || (u = {}), (u[o] = ""));
                              for (o in s)
                                s.hasOwnProperty(o) &&
                                  c[o] !== s[o] &&
                                  (u || (u = {}), (u[o] = s[o]));
                            } else u || (e || (e = []), e.push(r, u)), (u = s);
                          else
                            "dangerouslySetInnerHTML" === r
                              ? ((s = s ? s.__html : void 0),
                                (c = c ? c.__html : void 0),
                                null != s && c !== s && (e = e || []).push(r, "" + s))
                              : "children" === r
                              ? c === s ||
                                ("string" != typeof s && "number" != typeof s) ||
                                (e = e || []).push(r, "" + s)
                              : "suppressContentEditableWarning" !== r &&
                                "suppressHydrationWarning" !== r &&
                                (b.hasOwnProperty(r)
                                  ? (null != s && Tr(a, r), e || c === s || (e = []))
                                  : (e = e || []).push(r, s));
                      }
                      u && (e = e || []).push("style", u),
                        (a = e),
                        (n.updateQueue = a) && bi(n);
                    }
                  }),
                  (wi = function (e, t, n, r) {
                    n !== r && bi(t);
                  });
                var Si = "function" == typeof WeakSet ? WeakSet : Set;
                function Ei(e, t) {
                  var n = t.source,
                    r = t.stack;
                  null === r && null !== n && (r = ft(n)),
                    null !== n && st(n.type),
                    (t = t.value),
                    null !== e && 1 === e.tag && st(e.type);
                  try {
                    console.error(t);
                  } catch (l) {
                    setTimeout(function () {
                      throw l;
                    });
                  }
                }
                function Ci(e) {
                  var t = e.ref;
                  if (null !== t)
                    if ("function" == typeof t)
                      try {
                        t(null);
                      } catch (n) {
                        co(e, n);
                      }
                    else t.current = null;
                }
                function _i(e, t, n) {
                  if (
                    null !== (n = null !== (n = n.updateQueue) ? n.lastEffect : null)
                  ) {
                    var r = (n = n.next);
                    do {
                      if ((r.tag & e) !== Wl) {
                        var l = r.destroy;
                        (r.destroy = void 0), void 0 !== l && l();
                      }
                      (r.tag & t) !== Wl && ((l = r.create), (r.destroy = l())),
                        (r = r.next);
                    } while (r !== n);
                  }
                }
                function Pi(e, t) {
                  for (var n = e; ; ) {
                    if (5 === n.tag) {
                      var r = n.stateNode;
                      if (t) r.style.display = "none";
                      else {
                        r = n.stateNode;
                        var l = n.memoizedProps.style;
                        (l =
                          null != l && l.hasOwnProperty("display") ? l.display : null),
                          (r.style.display = gr("display", l));
                      }
                    } else if (6 === n.tag)
                      n.stateNode.nodeValue = t ? "" : n.memoizedProps;
                    else {
                      if (13 === n.tag && null !== n.memoizedState) {
                        ((r = n.child.sibling).return = n), (n = r);
                        continue;
                      }
                      if (null !== n.child) {
                        (n.child.return = n), (n = n.child);
                        continue;
                      }
                    }
                    if (n === e) break;
                    for (; null === n.sibling; ) {
                      if (null === n.return || n.return === e) return;
                      n = n.return;
                    }
                    (n.sibling.return = n.return), (n = n.sibling);
                  }
                }
                function Ni(e) {
                  switch (("function" == typeof Zr && Zr(e), e.tag)) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      var t = e.updateQueue;
                      if (null !== t && null !== (t = t.lastEffect)) {
                        var n = (t = t.next);
                        do {
                          var r = n.destroy;
                          if (void 0 !== r) {
                            var l = e;
                            try {
                              r();
                            } catch (a) {
                              co(l, a);
                            }
                          }
                          n = n.next;
                        } while (n !== t);
                      }
                      break;
                    case 1:
                      if (
                        (Ci(e),
                        "function" == typeof (t = e.stateNode).componentWillUnmount)
                      )
                        try {
                          (t.props = e.memoizedProps),
                            (t.state = e.memoizedState),
                            t.componentWillUnmount();
                        } catch (a) {
                          co(e, a);
                        }
                      break;
                    case 5:
                      Ci(e);
                      break;
                    case 4:
                      Ui(e);
                  }
                }
                function zi(e) {
                  return 5 === e.tag || 3 === e.tag || 4 === e.tag;
                }
                function Ri(e) {
                  e: {
                    for (var t = e.return; null !== t; ) {
                      if (zi(t)) {
                        var n = t;
                        break e;
                      }
                      t = t.return;
                    }
                    l("160"), (n = void 0);
                  }
                  var r = (t = void 0);
                  switch (n.tag) {
                    case 5:
                      (t = n.stateNode), (r = !1);
                      break;
                    case 3:
                    case 4:
                      (t = n.stateNode.containerInfo), (r = !0);
                      break;
                    default:
                      l("161");
                  }
                  16 & n.effectTag && (mr(t, ""), (n.effectTag &= -17));
                  e: t: for (n = e; ; ) {
                    for (; null === n.sibling; ) {
                      if (null === n.return || zi(n.return)) {
                        n = null;
                        break e;
                      }
                      n = n.return;
                    }
                    for (
                      n.sibling.return = n.return, n = n.sibling;
                      5 !== n.tag && 6 !== n.tag && 18 !== n.tag;
        
                    ) {
                      if (2 & n.effectTag) continue t;
                      if (null === n.child || 4 === n.tag) continue t;
                      (n.child.return = n), (n = n.child);
                    }
                    if (!(2 & n.effectTag)) {
                      n = n.stateNode;
                      break e;
                    }
                  }
                  for (var a = e; ; ) {
                    if (5 === a.tag || 6 === a.tag)
                      if (n)
                        if (r) {
                          var i = t,
                            o = a.stateNode,
                            u = n;
                          8 === i.nodeType
                            ? i.parentNode.insertBefore(o, u)
                            : i.insertBefore(o, u);
                        } else t.insertBefore(a.stateNode, n);
                      else
                        r
                          ? ((o = t),
                            (u = a.stateNode),
                            8 === o.nodeType
                              ? (i = o.parentNode).insertBefore(u, o)
                              : (i = o).appendChild(u),
                            null != (o = o._reactRootContainer) ||
                              null !== i.onclick ||
                              (i.onclick = wr))
                          : t.appendChild(a.stateNode);
                    else if (4 !== a.tag && null !== a.child) {
                      (a.child.return = a), (a = a.child);
                      continue;
                    }
                    if (a === e) break;
                    for (; null === a.sibling; ) {
                      if (null === a.return || a.return === e) return;
                      a = a.return;
                    }
                    (a.sibling.return = a.return), (a = a.sibling);
                  }
                }
                function Ui(e) {
                  for (var t = e, n = !1, r = void 0, a = void 0; ; ) {
                    if (!n) {
                      n = t.return;
                      e: for (;;) {
                        switch ((null === n && l("160"), n.tag)) {
                          case 5:
                            (r = n.stateNode), (a = !1);
                            break e;
                          case 3:
                          case 4:
                            (r = n.stateNode.containerInfo), (a = !0);
                            break e;
                        }
                        n = n.return;
                      }
                      n = !0;
                    }
                    if (5 === t.tag || 6 === t.tag) {
                      e: for (var i = t, o = i; ; )
                        if ((Ni(o), null !== o.child && 4 !== o.tag))
                          (o.child.return = o), (o = o.child);
                        else {
                          if (o === i) break;
                          for (; null === o.sibling; ) {
                            if (null === o.return || o.return === i) break e;
                            o = o.return;
                          }
                          (o.sibling.return = o.return), (o = o.sibling);
                        }
                      a
                        ? ((i = r),
                          (o = t.stateNode),
                          8 === i.nodeType
                            ? i.parentNode.removeChild(o)
                            : i.removeChild(o))
                        : r.removeChild(t.stateNode);
                    } else if (4 === t.tag) {
                      if (null !== t.child) {
                        (r = t.stateNode.containerInfo),
                          (a = !0),
                          (t.child.return = t),
                          (t = t.child);
                        continue;
                      }
                    } else if ((Ni(t), null !== t.child)) {
                      (t.child.return = t), (t = t.child);
                      continue;
                    }
                    if (t === e) break;
                    for (; null === t.sibling; ) {
                      if (null === t.return || t.return === e) return;
                      4 === (t = t.return).tag && (n = !1);
                    }
                    (t.sibling.return = t.return), (t = t.sibling);
                  }
                }
                function Ii(e, t) {
                  switch (t.tag) {
                    case 0:
                    case 11:
                    case 14:
                    case 15:
                      _i(jl, Bl, t);
                      break;
                    case 1:
                      break;
                    case 5:
                      var n = t.stateNode;
                      if (null != n) {
                        var r = t.memoizedProps;
                        e = null !== e ? e.memoizedProps : r;
                        var a = t.type,
                          i = t.updateQueue;
                        (t.updateQueue = null), null !== i && Ur(n, i, a, e, r, t);
                      }
                      break;
                    case 6:
                      null === t.stateNode && l("162"),
                        (t.stateNode.nodeValue = t.memoizedProps);
                      break;
                    case 3:
                    case 12:
                      break;
                    case 13:
                      if (
                        ((n = t.memoizedState),
                        (r = void 0),
                        (e = t),
                        null === n
                          ? (r = !1)
                          : ((r = !0),
                            (e = t.child),
                            0 === n.timedOutAt && (n.timedOutAt = Vo())),
                        null !== e && Pi(e, r),
                        null !== (n = t.updateQueue))
                      ) {
                        t.updateQueue = null;
                        var o = t.stateNode;
                        null === o && (o = t.stateNode = new Si()),
                          n.forEach(function (e) {
                            var n = po.bind(null, t, e);
                            o.has(e) || (o.add(e), e.then(n, n));
                          });
                      }
                      break;
                    case 17:
                      break;
                    default:
                      l("163");
                  }
                }
                var Mi = "function" == typeof WeakMap ? WeakMap : Map;
                function Di(e, t, n) {
                  ((n = ci(n)).tag = ai),
                    (n.payload = {
                      element: null,
                    });
                  var r = t.value;
                  return (
                    (n.callback = function () {
                      Go(r), Ei(e, t);
                    }),
                    n
                  );
                }
                function Oi(e, t, n) {
                  (n = ci(n)).tag = ai;
                  var r = e.type.getDerivedStateFromError;
                  if ("function" == typeof r) {
                    var l = t.value;
                    n.payload = function () {
                      return r(l);
                    };
                  }
                  var a = e.stateNode;
                  return (
                    null !== a &&
                      "function" == typeof a.componentDidCatch &&
                      (n.callback = function () {
                        "function" != typeof r &&
                          (null === Zi ? (Zi = new Set([this])) : Zi.add(this));
                        var n = t.value,
                          l = t.stack;
                        Ei(e, t),
                          this.componentDidCatch(n, {
                            componentStack: null !== l ? l : "",
                          });
                      }),
                    n
                  );
                }
                function Fi(e) {
                  switch (e.tag) {
                    case 1:
                      Hr(e.type) && Qr(e);
                      var t = e.effectTag;
                      return 2048 & t ? ((e.effectTag = (-2049 & t) | 64), e) : null;
                    case 3:
                      return (
                        Fl(e),
                        Kr(e),
                        0 != (64 & (t = e.effectTag)) && l("285"),
                        (e.effectTag = (-2049 & t) | 64),
                        e
                      );
                    case 5:
                      return Al(e), null;
                    case 13:
                      return 2048 & (t = e.effectTag)
                        ? ((e.effectTag = (-2049 & t) | 64), e)
                        : null;
                    case 18:
                      return null;
                    case 4:
                      return Fl(e), null;
                    case 10:
                      return Ja(e), null;
                    default:
                      return null;
                  }
                }
                var Li = $e.ReactCurrentDispatcher,
                  Ai = $e.ReactCurrentOwner,
                  Wi = 1073741822,
                  Vi = !1,
                  ji = null,
                  Bi = null,
                  Hi = 0,
                  Qi = -1,
                  Ki = !1,
                  $i = null,
                  qi = !1,
                  Yi = null,
                  Xi = null,
                  Gi = null,
                  Zi = null;
                function Ji() {
                  if (null !== ji)
                    for (var e = ji.return; null !== e; ) {
                      var t = e;
                      switch (t.tag) {
                        case 1:
                          var n = t.type.childContextTypes;
                          null != n && Qr(t);
                          break;
                        case 3:
                          Fl(t), Kr(t);
                          break;
                        case 5:
                          Al(t);
                          break;
                        case 4:
                          Fl(t);
                          break;
                        case 10:
                          Ja(t);
                      }
                      e = e.return;
                    }
                  (Bi = null), (Hi = 0), (Qi = -1), (Ki = !1), (ji = null);
                }
                function eo() {
                  for (; null !== $i; ) {
                    var e = $i.effectTag;
                    if ((16 & e && mr($i.stateNode, ""), 128 & e)) {
                      var t = $i.alternate;
                      null !== t &&
                        null !== (t = t.ref) &&
                        ("function" == typeof t ? t(null) : (t.current = null));
                    }
                    switch (14 & e) {
                      case 2:
                        Ri($i), ($i.effectTag &= -3);
                        break;
                      case 6:
                        Ri($i), ($i.effectTag &= -3), Ii($i.alternate, $i);
                        break;
                      case 4:
                        Ii($i.alternate, $i);
                        break;
                      case 8:
                        Ui((e = $i)),
                          (e.return = null),
                          (e.child = null),
                          (e.memoizedState = null),
                          (e.updateQueue = null),
                          null !== (e = e.alternate) &&
                            ((e.return = null),
                            (e.child = null),
                            (e.memoizedState = null),
                            (e.updateQueue = null));
                    }
                    $i = $i.nextEffect;
                  }
                }
                function to() {
                  for (; null !== $i; ) {
                    if (256 & $i.effectTag)
                      e: {
                        var e = $i.alternate,
                          t = $i;
                        switch (t.tag) {
                          case 0:
                          case 11:
                          case 15:
                            _i(Vl, Wl, t);
                            break e;
                          case 1:
                            if (256 & t.effectTag && null !== e) {
                              var n = e.memoizedProps,
                                r = e.memoizedState;
                              (t = (e = t.stateNode).getSnapshotBeforeUpdate(
                                t.elementType === t.type ? n : vl(t.type, n),
                                r
                              )),
                                (e.__reactInternalSnapshotBeforeUpdate = t);
                            }
                            break e;
                          case 3:
                          case 5:
                          case 6:
                          case 4:
                          case 17:
                            break e;
                          default:
                            l("163");
                        }
                      }
                    $i = $i.nextEffect;
                  }
                }
                function no(e, t) {
                  for (; null !== $i; ) {
                    var n = $i.effectTag;
                    if (36 & n) {
                      var r = $i.alternate,
                        a = $i,
                        i = t;
                      switch (a.tag) {
                        case 0:
                        case 11:
                        case 15:
                          _i(Hl, Ql, a);
                          break;
                        case 1:
                          var o = a.stateNode;
                          if (4 & a.effectTag)
                            if (null === r) o.componentDidMount();
                            else {
                              var u =
                                a.elementType === a.type
                                  ? r.memoizedProps
                                  : vl(a.type, r.memoizedProps);
                              o.componentDidUpdate(
                                u,
                                r.memoizedState,
                                o.__reactInternalSnapshotBeforeUpdate
                              );
                            }
                          null !== (r = a.updateQueue) && vi(a, r, o, i);
                          break;
                        case 3:
                          if (null !== (r = a.updateQueue)) {
                            if (((o = null), null !== a.child))
                              switch (a.child.tag) {
                                case 5:
                                  o = a.child.stateNode;
                                  break;
                                case 1:
                                  o = a.child.stateNode;
                              }
                            vi(a, r, o, i);
                          }
                          break;
                        case 5:
                          (i = a.stateNode),
                            null === r &&
                              4 & a.effectTag &&
                              Cr(a.type, a.memoizedProps) &&
                              i.focus();
                          break;
                        case 6:
                        case 4:
                        case 12:
                        case 13:
                        case 17:
                          break;
                        default:
                          l("163");
                      }
                    }
                    128 & n &&
                      null !== (a = $i.ref) &&
                      ((i = $i.stateNode),
                      "function" == typeof a ? a(i) : (a.current = i)),
                      512 & n && (Yi = e),
                      ($i = $i.nextEffect);
                  }
                }
                function ro(e, t) {
                  Gi = Xi = Yi = null;
                  var n = xo;
                  xo = !0;
                  do {
                    if (512 & t.effectTag) {
                      var r = !1,
                        l = void 0;
                      try {
                        var a = t;
                        _i($l, Wl, a), _i(Wl, Kl, a);
                      } catch (i) {
                        (r = !0), (l = i);
                      }
                      r && co(t, l);
                    }
                    t = t.nextEffect;
                  } while (null !== t);
                  (xo = n),
                    0 !== (n = e.expirationTime) && jo(e, n),
                    _o || xo || $o(1073741823, !1);
                }
                function lo() {
                  null !== Xi && Rr(Xi), null !== Gi && Gi();
                }
                function ao(e, t) {
                  (qi = Vi = !0), e.current === t && l("177");
                  var r = e.pendingCommitExpirationTime;
                  0 === r && l("261"), (e.pendingCommitExpirationTime = 0);
                  var a = t.expirationTime,
                    i = t.childExpirationTime;
                  for (
                    dl(e, i > a ? i : a),
                      Ai.current = null,
                      a = void 0,
                      1 < t.effectTag
                        ? null !== t.lastEffect
                          ? ((t.lastEffect.nextEffect = t), (a = t.firstEffect))
                          : (a = t)
                        : (a = t.firstEffect),
                      Sr = Rn,
                      Er = Kn(),
                      Rn = !1,
                      $i = a;
                    null !== $i;
        
                  ) {
                    i = !1;
                    var o = void 0;
                    try {
                      to();
                    } catch (c) {
                      (i = !0), (o = c);
                    }
                    i &&
                      (null === $i && l("178"),
                      co($i, o),
                      null !== $i && ($i = $i.nextEffect));
                  }
                  for ($i = a; null !== $i; ) {
                    (i = !1), (o = void 0);
                    try {
                      eo();
                    } catch (c) {
                      (i = !0), (o = c);
                    }
                    i &&
                      (null === $i && l("178"),
                      co($i, o),
                      null !== $i && ($i = $i.nextEffect));
                  }
                  for (
                    $n(Er), Er = null, Rn = !!Sr, Sr = null, e.current = t, $i = a;
                    null !== $i;
        
                  ) {
                    (i = !1), (o = void 0);
                    try {
                      no(e, r);
                    } catch (c) {
                      (i = !0), (o = c);
                    }
                    i &&
                      (null === $i && l("178"),
                      co($i, o),
                      null !== $i && ($i = $i.nextEffect));
                  }
                  if (null !== a && null !== Yi) {
                    var u = ro.bind(null, e, a);
                    (Xi = n.unstable_runWithPriority(
                      n.unstable_NormalPriority,
                      function () {
                        return zr(u);
                      }
                    )),
                      (Gi = u);
                  }
                  (Vi = qi = !1),
                    "function" == typeof Gr && Gr(t.stateNode),
                    (r = t.expirationTime),
                    0 === (t = (t = t.childExpirationTime) > r ? t : r) && (Zi = null),
                    Wo(e, t);
                }
                function io(e) {
                  for (;;) {
                    var n = e.alternate,
                      r = e.return,
                      a = e.sibling;
                    if (0 == (1024 & e.effectTag)) {
                      ji = e;
                      e: {
                        var i = n,
                          o = Hi,
                          u = (n = e).pendingProps;
                        switch (n.tag) {
                          case 2:
                          case 16:
                            break;
                          case 15:
                          case 0:
                            break;
                          case 1:
                            Hr(n.type) && Qr(n);
                            break;
                          case 3:
                            Fl(n),
                              Kr(n),
                              (u = n.stateNode).pendingContext &&
                                ((u.context = u.pendingContext),
                                (u.pendingContext = null)),
                              (null !== i && null !== i.child) ||
                                (Ua(n), (n.effectTag &= -3)),
                              xi(n);
                            break;
                          case 5:
                            Al(n);
                            var c = Dl(Ml.current);
                            if (((o = n.type), null !== i && null != n.stateNode))
                              Ti(i, n, o, u, c),
                                i.ref !== n.ref && (n.effectTag |= 128);
                            else if (u) {
                              var s = Dl(Ul.current);
                              if (Ua(n)) {
                                i = (u = n).stateNode;
                                var f = u.type,
                                  d = u.memoizedProps,
                                  p = c;
                                switch (
                                  ((i[I] = u), (i[M] = d), (o = void 0), (c = f))
                                ) {
                                  case "iframe":
                                  case "object":
                                    Un("load", i);
                                    break;
                                  case "video":
                                  case "audio":
                                    for (f = 0; f < te.length; f++) Un(te[f], i);
                                    break;
                                  case "source":
                                    Un("error", i);
                                    break;
                                  case "img":
                                  case "image":
                                  case "link":
                                    Un("error", i), Un("load", i);
                                    break;
                                  case "form":
                                    Un("reset", i), Un("submit", i);
                                    break;
                                  case "details":
                                    Un("toggle", i);
                                    break;
                                  case "input":
                                    Ct(i, d), Un("invalid", i), Tr(p, "onChange");
                                    break;
                                  case "select":
                                    (i._wrapperState = {
                                      wasMultiple: !!d.multiple,
                                    }),
                                      Un("invalid", i),
                                      Tr(p, "onChange");
                                    break;
                                  case "textarea":
                                    ir(i, d), Un("invalid", i), Tr(p, "onChange");
                                }
                                for (o in (kr(c, d), (f = null), d))
                                  d.hasOwnProperty(o) &&
                                    ((s = d[o]),
                                    "children" === o
                                      ? "string" == typeof s
                                        ? i.textContent !== s && (f = ["children", s])
                                        : "number" == typeof s &&
                                          i.textContent !== "" + s &&
                                          (f = ["children", "" + s])
                                      : b.hasOwnProperty(o) && null != s && Tr(p, o));
                                switch (c) {
                                  case "input":
                                    Qe(i), Nt(i, d, !0);
                                    break;
                                  case "textarea":
                                    Qe(i), ur(i, d);
                                    break;
                                  case "select":
                                  case "option":
                                    break;
                                  default:
                                    "function" == typeof d.onClick && (i.onclick = wr);
                                }
                                (o = f), (u.updateQueue = o), (u = null !== o) && bi(n);
                              } else {
                                (d = n),
                                  (p = o),
                                  (i = u),
                                  (f = 9 === c.nodeType ? c : c.ownerDocument),
                                  s === cr.html && (s = sr(p)),
                                  s === cr.html
                                    ? "script" === p
                                      ? (((i = f.createElement("div")).innerHTML =
                                          "<script></script>"),
                                        (f = i.removeChild(i.firstChild)))
                                      : "string" == typeof i.is
                                      ? (f = f.createElement(p, {
                                          is: i.is,
                                        }))
                                      : ((f = f.createElement(p)),
                                        "select" === p &&
                                          ((p = f),
                                          i.multiple
                                            ? (p.multiple = !0)
                                            : i.size && (p.size = i.size)))
                                    : (f = f.createElementNS(s, p)),
                                  ((i = f)[I] = d),
                                  (i[M] = u),
                                  ki(i, n, !1, !1),
                                  (p = i);
                                var m = c,
                                  h = xr((f = o), (d = u));
                                switch (f) {
                                  case "iframe":
                                  case "object":
                                    Un("load", p), (c = d);
                                    break;
                                  case "video":
                                  case "audio":
                                    for (c = 0; c < te.length; c++) Un(te[c], p);
                                    c = d;
                                    break;
                                  case "source":
                                    Un("error", p), (c = d);
                                    break;
                                  case "img":
                                  case "image":
                                  case "link":
                                    Un("error", p), Un("load", p), (c = d);
                                    break;
                                  case "form":
                                    Un("reset", p), Un("submit", p), (c = d);
                                    break;
                                  case "details":
                                    Un("toggle", p), (c = d);
                                    break;
                                  case "input":
                                    Ct(p, d),
                                      (c = Et(p, d)),
                                      Un("invalid", p),
                                      Tr(m, "onChange");
                                    break;
                                  case "option":
                                    c = rr(p, d);
                                    break;
                                  case "select":
                                    (p._wrapperState = {
                                      wasMultiple: !!d.multiple,
                                    }),
                                      (c = t({}, d, {
                                        value: void 0,
                                      })),
                                      Un("invalid", p),
                                      Tr(m, "onChange");
                                    break;
                                  case "textarea":
                                    ir(p, d),
                                      (c = ar(p, d)),
                                      Un("invalid", p),
                                      Tr(m, "onChange");
                                    break;
                                  default:
                                    c = d;
                                }
                                kr(f, c), (s = void 0);
                                var v = f,
                                  g = p,
                                  y = c;
                                for (s in y)
                                  if (y.hasOwnProperty(s)) {
                                    var k = y[s];
                                    "style" === s
                                      ? yr(g, k)
                                      : "dangerouslySetInnerHTML" === s
                                      ? null != (k = k ? k.__html : void 0) && pr(g, k)
                                      : "children" === s
                                      ? "string" == typeof k
                                        ? ("textarea" !== v || "" !== k) && mr(g, k)
                                        : "number" == typeof k && mr(g, "" + k)
                                      : "suppressContentEditableWarning" !== s &&
                                        "suppressHydrationWarning" !== s &&
                                        "autoFocus" !== s &&
                                        (b.hasOwnProperty(s)
                                          ? null != k && Tr(m, s)
                                          : null != k && wt(g, s, k, h));
                                  }
                                switch (f) {
                                  case "input":
                                    Qe(p), Nt(p, d, !1);
                                    break;
                                  case "textarea":
                                    Qe(p), ur(p, d);
                                    break;
                                  case "option":
                                    null != d.value &&
                                      p.setAttribute("value", "" + St(d.value));
                                    break;
                                  case "select":
                                    ((c = p).multiple = !!d.multiple),
                                      null != (p = d.value)
                                        ? lr(c, !!d.multiple, p, !1)
                                        : null != d.defaultValue &&
                                          lr(c, !!d.multiple, d.defaultValue, !0);
                                    break;
                                  default:
                                    "function" == typeof c.onClick && (p.onclick = wr);
                                }
                                (u = Cr(o, u)) && bi(n), (n.stateNode = i);
                              }
                              null !== n.ref && (n.effectTag |= 128);
                            } else null === n.stateNode && l("166");
                            break;
                          case 6:
                            i && null != n.stateNode
                              ? wi(i, n, i.memoizedProps, u)
                              : ("string" != typeof u &&
                                  null === n.stateNode &&
                                  l("166"),
                                (i = Dl(Ml.current)),
                                Dl(Ul.current),
                                Ua(n)
                                  ? ((o = (u = n).stateNode),
                                    (i = u.memoizedProps),
                                    (o[I] = u),
                                    (u = o.nodeValue !== i) && bi(n))
                                  : ((o = n),
                                    ((u = (
                                      9 === i.nodeType ? i : i.ownerDocument
                                    ).createTextNode(u))[I] = n),
                                    (o.stateNode = u)));
                            break;
                          case 11:
                            break;
                          case 13:
                            if (((u = n.memoizedState), 0 != (64 & n.effectTag))) {
                              (n.expirationTime = o), (ji = n);
                              break e;
                            }
                            (u = null !== u),
                              (o = null !== i && null !== i.memoizedState),
                              null !== i &&
                                !u &&
                                o &&
                                null !== (i = i.child.sibling) &&
                                (null !== (c = n.firstEffect)
                                  ? ((n.firstEffect = i), (i.nextEffect = c))
                                  : ((n.firstEffect = n.lastEffect = i),
                                    (i.nextEffect = null)),
                                (i.effectTag = 8)),
                              (u || o) && (n.effectTag |= 4);
                            break;
                          case 7:
                          case 8:
                          case 12:
                            break;
                          case 4:
                            Fl(n), xi(n);
                            break;
                          case 10:
                            Ja(n);
                            break;
                          case 9:
                          case 14:
                            break;
                          case 17:
                            Hr(n.type) && Qr(n);
                            break;
                          case 18:
                            break;
                          default:
                            l("156");
                        }
                        ji = null;
                      }
                      if (((n = e), 1 === Hi || 1 !== n.childExpirationTime)) {
                        for (u = 0, o = n.child; null !== o; )
                          (i = o.expirationTime) > u && (u = i),
                            (c = o.childExpirationTime) > u && (u = c),
                            (o = o.sibling);
                        n.childExpirationTime = u;
                      }
                      if (null !== ji) return ji;
                      null !== r &&
                        0 == (1024 & r.effectTag) &&
                        (null === r.firstEffect && (r.firstEffect = e.firstEffect),
                        null !== e.lastEffect &&
                          (null !== r.lastEffect &&
                            (r.lastEffect.nextEffect = e.firstEffect),
                          (r.lastEffect = e.lastEffect)),
                        1 < e.effectTag &&
                          (null !== r.lastEffect
                            ? (r.lastEffect.nextEffect = e)
                            : (r.firstEffect = e),
                          (r.lastEffect = e)));
                    } else {
                      if (null !== (e = Fi(e, Hi))) return (e.effectTag &= 1023), e;
                      null !== r &&
                        ((r.firstEffect = r.lastEffect = null), (r.effectTag |= 1024));
                    }
                    if (null !== a) return a;
                    if (null === r) break;
                    e = r;
                  }
                  return null;
                }
                function oo(e) {
                  var t = $a(e.alternate, e, Hi);
                  return (
                    (e.memoizedProps = e.pendingProps),
                    null === t && (t = io(e)),
                    (Ai.current = null),
                    t
                  );
                }
                function uo(e, t) {
                  Vi && l("243"), lo(), (Vi = !0);
                  var n = Li.current;
                  Li.current = Ta;
                  var r = e.nextExpirationTimeToWorkOn;
                  (r === Hi && e === Bi && null !== ji) ||
                    (Ji(),
                    (Hi = r),
                    (ji = al((Bi = e).current, null, Hi)),
                    (e.pendingCommitExpirationTime = 0));
                  for (var a = !1; ; ) {
                    try {
                      if (t) for (; null !== ji && !Qo(); ) ji = oo(ji);
                      else for (; null !== ji; ) ji = oo(ji);
                    } catch (g) {
                      if (((Ga = Xa = Ya = null), fa(), null === ji)) (a = !0), Go(g);
                      else {
                        null === ji && l("271");
                        var i = ji,
                          o = i.return;
                        if (null !== o) {
                          e: {
                            var u = e,
                              c = o,
                              s = i,
                              f = g;
                            if (
                              ((o = Hi),
                              (s.effectTag |= 1024),
                              (s.firstEffect = s.lastEffect = null),
                              null !== f &&
                                "object" == typeof f &&
                                "function" == typeof f.then)
                            ) {
                              var d = f;
                              f = c;
                              var p = -1,
                                m = -1;
                              do {
                                if (13 === f.tag) {
                                  var h = f.alternate;
                                  if (null !== h && null !== (h = h.memoizedState)) {
                                    m = 10 * (1073741822 - h.timedOutAt);
                                    break;
                                  }
                                  "number" == typeof (h = f.pendingProps.maxDuration) &&
                                    (0 >= h ? (p = 0) : (-1 === p || h < p) && (p = h));
                                }
                                f = f.return;
                              } while (null !== f);
                              f = c;
                              do {
                                if (
                                  ((h = 13 === f.tag) &&
                                    (h =
                                      void 0 !== f.memoizedProps.fallback &&
                                      null === f.memoizedState),
                                  h)
                                ) {
                                  if (
                                    (null === (c = f.updateQueue)
                                      ? ((c = new Set()).add(d), (f.updateQueue = c))
                                      : c.add(d),
                                    0 == (1 & f.mode))
                                  ) {
                                    (f.effectTag |= 64),
                                      (s.effectTag &= -1957),
                                      1 === s.tag &&
                                        (null === s.alternate
                                          ? (s.tag = 17)
                                          : (((o = ci(1073741823)).tag = li),
                                            fi(s, o))),
                                      (s.expirationTime = 1073741823);
                                    break e;
                                  }
                                  c = o;
                                  var v = (s = u).pingCache;
                                  null === v
                                    ? ((v = s.pingCache = new Mi()),
                                      (h = new Set()),
                                      v.set(d, h))
                                    : void 0 === (h = v.get(d)) &&
                                      ((h = new Set()), v.set(d, h)),
                                    h.has(c) ||
                                      (h.add(c),
                                      (s = fo.bind(null, s, d, c)),
                                      d.then(s, s)),
                                    -1 === p
                                      ? (u = 1073741823)
                                      : (-1 === m &&
                                          (m = 10 * (1073741822 - ml(u, o)) - 5e3),
                                        (u = m + p)),
                                    0 <= u && Qi < u && (Qi = u),
                                    (f.effectTag |= 2048),
                                    (f.expirationTime = o);
                                  break e;
                                }
                                f = f.return;
                              } while (null !== f);
                              f = Error(
                                (st(s.type) || "A React component") +
                                  " suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display." +
                                  ft(s)
                              );
                            }
                            (Ki = !0), (f = yi(f, s)), (u = c);
                            do {
                              switch (u.tag) {
                                case 3:
                                  (u.effectTag |= 2048),
                                    (u.expirationTime = o),
                                    di(u, (o = Di(u, f, o)));
                                  break e;
                                case 1:
                                  if (
                                    ((p = f),
                                    (m = u.type),
                                    (s = u.stateNode),
                                    0 == (64 & u.effectTag) &&
                                      ("function" ==
                                        typeof m.getDerivedStateFromError ||
                                        (null !== s &&
                                          "function" == typeof s.componentDidCatch &&
                                          (null === Zi || !Zi.has(s)))))
                                  ) {
                                    (u.effectTag |= 2048),
                                      (u.expirationTime = o),
                                      di(u, (o = Oi(u, p, o)));
                                    break e;
                                  }
                              }
                              u = u.return;
                            } while (null !== u);
                          }
                          ji = io(i);
                          continue;
                        }
                        (a = !0), Go(g);
                      }
                    }
                    break;
                  }
                  if (((Vi = !1), (Li.current = n), (Ga = Xa = Ya = null), fa(), a))
                    (Bi = null), (e.finishedWork = null);
                  else if (null !== ji) e.finishedWork = null;
                  else {
                    if (
                      (null === (n = e.current.alternate) && l("281"), (Bi = null), Ki)
                    ) {
                      if (
                        ((a = e.latestPendingTime),
                        (i = e.latestSuspendedTime),
                        (o = e.latestPingedTime),
                        (0 !== a && a < r) || (0 !== i && i < r) || (0 !== o && o < r))
                      )
                        return pl(e, r), void Lo(e, n, r, e.expirationTime, -1);
                      if (!e.didError && t)
                        return (
                          (e.didError = !0),
                          (r = e.nextExpirationTimeToWorkOn = r),
                          (t = e.expirationTime = 1073741823),
                          void Lo(e, n, r, t, -1)
                        );
                    }
                    t && -1 !== Qi
                      ? (pl(e, r),
                        (t = 10 * (1073741822 - ml(e, r))) < Qi && (Qi = t),
                        (t = 10 * (1073741822 - Vo())),
                        (t = Qi - t),
                        Lo(e, n, r, e.expirationTime, 0 > t ? 0 : t))
                      : ((e.pendingCommitExpirationTime = r), (e.finishedWork = n));
                  }
                }
                function co(e, t) {
                  for (var n = e.return; null !== n; ) {
                    switch (n.tag) {
                      case 1:
                        var r = n.stateNode;
                        if (
                          "function" == typeof n.type.getDerivedStateFromError ||
                          ("function" == typeof r.componentDidCatch &&
                            (null === Zi || !Zi.has(r)))
                        )
                          return (
                            fi(n, (e = Oi(n, (e = yi(t, e)), 1073741823))),
                            void ho(n, 1073741823)
                          );
                        break;
                      case 3:
                        return (
                          fi(n, (e = Di(n, (e = yi(t, e)), 1073741823))),
                          void ho(n, 1073741823)
                        );
                    }
                    n = n.return;
                  }
                  3 === e.tag &&
                    (fi(e, (n = Di(e, (n = yi(t, e)), 1073741823))), ho(e, 1073741823));
                }
                function so(e, t) {
                  var r = n.unstable_getCurrentPriorityLevel(),
                    a = void 0;
                  if (0 == (1 & t.mode)) a = 1073741823;
                  else if (Vi && !qi) a = Hi;
                  else {
                    switch (r) {
                      case n.unstable_ImmediatePriority:
                        a = 1073741823;
                        break;
                      case n.unstable_UserBlockingPriority:
                        a = 1073741822 - 10 * (1 + (((1073741822 - e + 15) / 10) | 0));
                        break;
                      case n.unstable_NormalPriority:
                        a = 1073741822 - 25 * (1 + (((1073741822 - e + 500) / 25) | 0));
                        break;
                      case n.unstable_LowPriority:
                      case n.unstable_IdlePriority:
                        a = 1;
                        break;
                      default:
                        l("313");
                    }
                    null !== Bi && a === Hi && --a;
                  }
                  return (
                    r === n.unstable_UserBlockingPriority &&
                      (0 === So || a < So) &&
                      (So = a),
                    a
                  );
                }
                function fo(e, t, n) {
                  var r = e.pingCache;
                  null !== r && r.delete(t),
                    null !== Bi && Hi === n
                      ? (Bi = null)
                      : ((t = e.earliestSuspendedTime),
                        (r = e.latestSuspendedTime),
                        0 !== t &&
                          n <= t &&
                          n >= r &&
                          ((e.didError = !1),
                          (0 === (t = e.latestPingedTime) || t > n) &&
                            (e.latestPingedTime = n),
                          hl(n, e),
                          0 !== (n = e.expirationTime) && jo(e, n)));
                }
                function po(e, t) {
                  var n = e.stateNode;
                  null !== n && n.delete(t),
                    null !== (e = mo(e, (t = so((t = Vo()), e)))) &&
                      (fl(e, t), 0 !== (t = e.expirationTime) && jo(e, t));
                }
                function mo(e, t) {
                  e.expirationTime < t && (e.expirationTime = t);
                  var n = e.alternate;
                  null !== n && n.expirationTime < t && (n.expirationTime = t);
                  var r = e.return,
                    l = null;
                  if (null === r && 3 === e.tag) l = e.stateNode;
                  else
                    for (; null !== r; ) {
                      if (
                        ((n = r.alternate),
                        r.childExpirationTime < t && (r.childExpirationTime = t),
                        null !== n &&
                          n.childExpirationTime < t &&
                          (n.childExpirationTime = t),
                        null === r.return && 3 === r.tag)
                      ) {
                        l = r.stateNode;
                        break;
                      }
                      r = r.return;
                    }
                  return l;
                }
                function ho(e, t) {
                  null !== (e = mo(e, t)) &&
                    (!Vi && 0 !== Hi && t > Hi && Ji(),
                    fl(e, t),
                    (Vi && !qi && Bi === e) || jo(e, e.expirationTime),
                    Mo > Io && ((Mo = 0), l("185")));
                }
                function vo(e, t, r, l, a) {
                  return n.unstable_runWithPriority(
                    n.unstable_ImmediatePriority,
                    function () {
                      return e(t, r, l, a);
                    }
                  );
                }
                var go = null,
                  yo = null,
                  bo = 0,
                  ko = void 0,
                  xo = !1,
                  To = null,
                  wo = 0,
                  So = 0,
                  Eo = !1,
                  Co = null,
                  _o = !1,
                  Po = !1,
                  No = null,
                  zo = n.unstable_now(),
                  Ro = 1073741822 - ((zo / 10) | 0),
                  Uo = Ro,
                  Io = 50,
                  Mo = 0,
                  Do = null;
                function Oo() {
                  Ro = 1073741822 - (((n.unstable_now() - zo) / 10) | 0);
                }
                function Fo(e, t) {
                  if (0 !== bo) {
                    if (t < bo) return;
                    null !== ko && n.unstable_cancelCallback(ko);
                  }
                  (bo = t),
                    (e = n.unstable_now() - zo),
                    (ko = n.unstable_scheduleCallback(Ko, {
                      timeout: 10 * (1073741822 - t) - e,
                    }));
                }
                function Lo(e, t, n, r, l) {
                  (e.expirationTime = r),
                    0 !== l || Qo()
                      ? 0 < l && (e.timeoutHandle = Pr(Ao.bind(null, e, t, n), l))
                      : ((e.pendingCommitExpirationTime = n), (e.finishedWork = t));
                }
                function Ao(e, t, n) {
                  (e.pendingCommitExpirationTime = n),
                    (e.finishedWork = t),
                    Oo(),
                    (Uo = Ro),
                    qo(e, n);
                }
                function Wo(e, t) {
                  (e.expirationTime = t), (e.finishedWork = null);
                }
                function Vo() {
                  return xo
                    ? Uo
                    : (Bo(), (0 !== wo && 1 !== wo) || (Oo(), (Uo = Ro)), Uo);
                }
                function jo(e, t) {
                  null === e.nextScheduledRoot
                    ? ((e.expirationTime = t),
                      null === yo
                        ? ((go = yo = e), (e.nextScheduledRoot = e))
                        : ((yo = yo.nextScheduledRoot = e).nextScheduledRoot = go))
                    : t > e.expirationTime && (e.expirationTime = t),
                    xo ||
                      (_o
                        ? Po && ((To = e), (wo = 1073741823), Yo(e, 1073741823, !1))
                        : 1073741823 === t
                        ? $o(1073741823, !1)
                        : Fo(e, t));
                }
                function Bo() {
                  var e = 0,
                    t = null;
                  if (null !== yo)
                    for (var n = yo, r = go; null !== r; ) {
                      var a = r.expirationTime;
                      if (0 === a) {
                        if (
                          ((null === n || null === yo) && l("244"),
                          r === r.nextScheduledRoot)
                        ) {
                          go = yo = r.nextScheduledRoot = null;
                          break;
                        }
                        if (r === go)
                          (go = a = r.nextScheduledRoot),
                            (yo.nextScheduledRoot = a),
                            (r.nextScheduledRoot = null);
                        else {
                          if (r === yo) {
                            ((yo = n).nextScheduledRoot = go),
                              (r.nextScheduledRoot = null);
                            break;
                          }
                          (n.nextScheduledRoot = r.nextScheduledRoot),
                            (r.nextScheduledRoot = null);
                        }
                        r = n.nextScheduledRoot;
                      } else {
                        if ((a > e && ((e = a), (t = r)), r === yo)) break;
                        if (1073741823 === e) break;
                        (n = r), (r = r.nextScheduledRoot);
                      }
                    }
                  (To = t), (wo = e);
                }
                var Ho = !1;
                function Qo() {
                  return !!Ho || (!!n.unstable_shouldYield() && (Ho = !0));
                }
                function Ko() {
                  try {
                    if (!Qo() && null !== go) {
                      Oo();
                      var e = go;
                      do {
                        var t = e.expirationTime;
                        0 !== t && Ro <= t && (e.nextExpirationTimeToWorkOn = Ro),
                          (e = e.nextScheduledRoot);
                      } while (e !== go);
                    }
                    $o(0, !0);
                  } finally {
                    Ho = !1;
                  }
                }
                function $o(e, t) {
                  if ((Bo(), t))
                    for (
                      Oo(), Uo = Ro;
                      null !== To && 0 !== wo && e <= wo && !(Ho && Ro > wo);
        
                    )
                      Yo(To, wo, Ro > wo), Bo(), Oo(), (Uo = Ro);
                  else
                    for (; null !== To && 0 !== wo && e <= wo; ) Yo(To, wo, !1), Bo();
                  if (
                    (t && ((bo = 0), (ko = null)),
                    0 !== wo && Fo(To, wo),
                    (Mo = 0),
                    (Do = null),
                    null !== No)
                  )
                    for (e = No, No = null, t = 0; t < e.length; t++) {
                      var n = e[t];
                      try {
                        n._onComplete();
                      } catch (r) {
                        Eo || ((Eo = !0), (Co = r));
                      }
                    }
                  if (Eo) throw ((e = Co), (Co = null), (Eo = !1), e);
                }
                function qo(e, t) {
                  xo && l("253"), (To = e), (wo = t), Yo(e, t, !1), $o(1073741823, !1);
                }
                function Yo(e, t, n) {
                  if ((xo && l("245"), (xo = !0), n)) {
                    var r = e.finishedWork;
                    null !== r
                      ? Xo(e, r, t)
                      : ((e.finishedWork = null),
                        -1 !== (r = e.timeoutHandle) && ((e.timeoutHandle = -1), Nr(r)),
                        uo(e, n),
                        null !== (r = e.finishedWork) &&
                          (Qo() ? (e.finishedWork = r) : Xo(e, r, t)));
                  } else
                    null !== (r = e.finishedWork)
                      ? Xo(e, r, t)
                      : ((e.finishedWork = null),
                        -1 !== (r = e.timeoutHandle) && ((e.timeoutHandle = -1), Nr(r)),
                        uo(e, n),
                        null !== (r = e.finishedWork) && Xo(e, r, t));
                  xo = !1;
                }
                function Xo(e, t, r) {
                  var l = e.firstBatch;
                  if (
                    null !== l &&
                    l._expirationTime >= r &&
                    (null === No ? (No = [l]) : No.push(l), l._defer)
                  )
                    return (e.finishedWork = t), void (e.expirationTime = 0);
                  (e.finishedWork = null),
                    e === Do ? Mo++ : ((Do = e), (Mo = 0)),
                    n.unstable_runWithPriority(
                      n.unstable_ImmediatePriority,
                      function () {
                        ao(e, t);
                      }
                    );
                }
                function Go(e) {
                  null === To && l("246"),
                    (To.expirationTime = 0),
                    Eo || ((Eo = !0), (Co = e));
                }
                function Zo(e, t) {
                  var n = _o;
                  _o = !0;
                  try {
                    return e(t);
                  } finally {
                    (_o = n) || xo || $o(1073741823, !1);
                  }
                }
                function Jo(e, t) {
                  if (_o && !Po) {
                    Po = !0;
                    try {
                      return e(t);
                    } finally {
                      Po = !1;
                    }
                  }
                  return e(t);
                }
                function eu(e, t, r) {
                  _o || xo || 0 === So || ($o(So, !1), (So = 0));
                  var l = _o;
                  _o = !0;
                  try {
                    return n.unstable_runWithPriority(
                      n.unstable_UserBlockingPriority,
                      function () {
                        return e(t, r);
                      }
                    );
                  } finally {
                    (_o = l) || xo || $o(1073741823, !1);
                  }
                }
                function tu(e, t, n, r, a) {
                  var i = t.current;
                  e: if (n) {
                    t: {
                      (2 === un((n = n._reactInternalFiber)) && 1 === n.tag) ||
                        l("170");
                      var o = n;
                      do {
                        switch (o.tag) {
                          case 3:
                            o = o.stateNode.context;
                            break t;
                          case 1:
                            if (Hr(o.type)) {
                              o = o.stateNode.__reactInternalMemoizedMergedChildContext;
                              break t;
                            }
                        }
                        o = o.return;
                      } while (null !== o);
                      l("171"), (o = void 0);
                    }
                    if (1 === n.tag) {
                      var u = n.type;
                      if (Hr(u)) {
                        n = qr(n, u, o);
                        break e;
                      }
                    }
                    n = o;
                  } else n = Ar;
                  return (
                    null === t.context ? (t.context = n) : (t.pendingContext = n),
                    (t = a),
                    ((a = ci(r)).payload = {
                      element: e,
                    }),
                    null !== (t = void 0 === t ? null : t) && (a.callback = t),
                    lo(),
                    fi(i, a),
                    ho(i, r),
                    r
                  );
                }
                function nu(e, t, n, r) {
                  var l = t.current;
                  return tu(e, t, n, (l = so(Vo(), l)), r);
                }
                function ru(e) {
                  if (!(e = e.current).child) return null;
                  switch (e.child.tag) {
                    case 5:
                    default:
                      return e.child.stateNode;
                  }
                }
                function lu(e, t, n) {
                  var r =
                    3 < arguments.length && void 0 !== arguments[3]
                      ? arguments[3]
                      : null;
                  return {
                    $$typeof: Ge,
                    key: null == r ? null : "" + r,
                    children: e,
                    containerInfo: t,
                    implementation: n,
                  };
                }
                function au(e) {
                  var t =
                    1073741822 - 25 * (1 + (((1073741822 - Vo() + 500) / 25) | 0));
                  t >= Wi && (t = Wi - 1),
                    (this._expirationTime = Wi = t),
                    (this._root = e),
                    (this._callbacks = this._next = null),
                    (this._hasChildren = this._didComplete = !1),
                    (this._children = null),
                    (this._defer = !0);
                }
                function iu() {
                  (this._callbacks = null),
                    (this._didCommit = !1),
                    (this._onCommit = this._onCommit.bind(this));
                }
                function ou(e, t, n) {
                  (e = {
                    current: (t = nl(3, null, null, t ? 3 : 0)),
                    containerInfo: e,
                    pendingChildren: null,
                    pingCache: null,
                    earliestPendingTime: 0,
                    latestPendingTime: 0,
                    earliestSuspendedTime: 0,
                    latestSuspendedTime: 0,
                    latestPingedTime: 0,
                    didError: !1,
                    pendingCommitExpirationTime: 0,
                    finishedWork: null,
                    timeoutHandle: -1,
                    context: null,
                    pendingContext: null,
                    hydrate: n,
                    nextExpirationTimeToWorkOn: 0,
                    expirationTime: 0,
                    firstBatch: null,
                    nextScheduledRoot: null,
                  }),
                    (this._internalRoot = t.stateNode = e);
                }
                function uu(e) {
                  return !(
                    !e ||
                    (1 !== e.nodeType &&
                      9 !== e.nodeType &&
                      11 !== e.nodeType &&
                      (8 !== e.nodeType ||
                        " react-mount-point-unstable " !== e.nodeValue))
                  );
                }
                function cu(e, t) {
                  if (
                    (t ||
                      (t = !(
                        !(t = e
                          ? 9 === e.nodeType
                            ? e.documentElement
                            : e.firstChild
                          : null) ||
                        1 !== t.nodeType ||
                        !t.hasAttribute("data-reactroot")
                      )),
                    !t)
                  )
                    for (var n; (n = e.lastChild); ) e.removeChild(n);
                  return new ou(e, !1, t);
                }
                function su(e, t, n, r, l) {
                  var a = n._reactRootContainer;
                  if (a) {
                    if ("function" == typeof l) {
                      var i = l;
                      l = function () {
                        var e = ru(a._internalRoot);
                        i.call(e);
                      };
                    }
                    null != e
                      ? a.legacy_renderSubtreeIntoContainer(e, t, l)
                      : a.render(t, l);
                  } else {
                    if (
                      ((a = n._reactRootContainer = cu(n, r)), "function" == typeof l)
                    ) {
                      var o = l;
                      l = function () {
                        var e = ru(a._internalRoot);
                        o.call(e);
                      };
                    }
                    Jo(function () {
                      null != e
                        ? a.legacy_renderSubtreeIntoContainer(e, t, l)
                        : a.render(t, l);
                    });
                  }
                  return ru(a._internalRoot);
                }
                function fu(e, t) {
                  var n =
                    2 < arguments.length && void 0 !== arguments[2]
                      ? arguments[2]
                      : null;
                  return uu(t) || l("200"), lu(e, t, null, n);
                }
                (Pe = function (e, t, n) {
                  switch (t) {
                    case "input":
                      if ((Pt(e, n), (t = n.name), "radio" === n.type && null != t)) {
                        for (n = e; n.parentNode; ) n = n.parentNode;
                        for (
                          n = n.querySelectorAll(
                            "input[name=" + JSON.stringify("" + t) + '][type="radio"]'
                          ),
                            t = 0;
                          t < n.length;
                          t++
                        ) {
                          var r = n[t];
                          if (r !== e && r.form === e.form) {
                            var a = L(r);
                            a || l("90"), Ke(r), Pt(r, a);
                          }
                        }
                      }
                      break;
                    case "textarea":
                      or(e, n);
                      break;
                    case "select":
                      null != (t = n.value) && lr(e, !!n.multiple, t, !1);
                  }
                }),
                  (au.prototype.render = function (e) {
                    this._defer || l("250"),
                      (this._hasChildren = !0),
                      (this._children = e);
                    var t = this._root._internalRoot,
                      n = this._expirationTime,
                      r = new iu();
                    return tu(e, t, null, n, r._onCommit), r;
                  }),
                  (au.prototype.then = function (e) {
                    if (this._didComplete) e();
                    else {
                      var t = this._callbacks;
                      null === t && (t = this._callbacks = []), t.push(e);
                    }
                  }),
                  (au.prototype.commit = function () {
                    var e = this._root._internalRoot,
                      t = e.firstBatch;
                    if (((this._defer && null !== t) || l("251"), this._hasChildren)) {
                      var n = this._expirationTime;
                      if (t !== this) {
                        this._hasChildren &&
                          ((n = this._expirationTime = t._expirationTime),
                          this.render(this._children));
                        for (var r = null, a = t; a !== this; ) (r = a), (a = a._next);
                        null === r && l("251"),
                          (r._next = a._next),
                          (this._next = t),
                          (e.firstBatch = this);
                      }
                      (this._defer = !1),
                        qo(e, n),
                        (t = this._next),
                        (this._next = null),
                        null !== (t = e.firstBatch = t) &&
                          t._hasChildren &&
                          t.render(t._children);
                    } else (this._next = null), (this._defer = !1);
                  }),
                  (au.prototype._onComplete = function () {
                    if (!this._didComplete) {
                      this._didComplete = !0;
                      var e = this._callbacks;
                      if (null !== e) for (var t = 0; t < e.length; t++) (0, e[t])();
                    }
                  }),
                  (iu.prototype.then = function (e) {
                    if (this._didCommit) e();
                    else {
                      var t = this._callbacks;
                      null === t && (t = this._callbacks = []), t.push(e);
                    }
                  }),
                  (iu.prototype._onCommit = function () {
                    if (!this._didCommit) {
                      this._didCommit = !0;
                      var e = this._callbacks;
                      if (null !== e)
                        for (var t = 0; t < e.length; t++) {
                          var n = e[t];
                          "function" != typeof n && l("191", n), n();
                        }
                    }
                  }),
                  (ou.prototype.render = function (e, t) {
                    var n = this._internalRoot,
                      r = new iu();
                    return (
                      null !== (t = void 0 === t ? null : t) && r.then(t),
                      nu(e, n, null, r._onCommit),
                      r
                    );
                  }),
                  (ou.prototype.unmount = function (e) {
                    var t = this._internalRoot,
                      n = new iu();
                    return (
                      null !== (e = void 0 === e ? null : e) && n.then(e),
                      nu(null, t, null, n._onCommit),
                      n
                    );
                  }),
                  (ou.prototype.legacy_renderSubtreeIntoContainer = function (e, t, n) {
                    var r = this._internalRoot,
                      l = new iu();
                    return (
                      null !== (n = void 0 === n ? null : n) && l.then(n),
                      nu(t, r, e, l._onCommit),
                      l
                    );
                  }),
                  (ou.prototype.createBatch = function () {
                    var e = new au(this),
                      t = e._expirationTime,
                      n = this._internalRoot,
                      r = n.firstBatch;
                    if (null === r) (n.firstBatch = e), (e._next = null);
                    else {
                      for (n = null; null !== r && r._expirationTime >= t; )
                        (n = r), (r = r._next);
                      (e._next = r), null !== n && (n._next = e);
                    }
                    return e;
                  }),
                  (Me = Zo),
                  (De = eu),
                  (Oe = function () {
                    xo || 0 === So || ($o(So, !1), (So = 0));
                  });
                var du = {
                  createPortal: fu,
                  findDOMNode: function (e) {
                    if (null == e) return null;
                    if (1 === e.nodeType) return e;
                    var t = e._reactInternalFiber;
                    return (
                      void 0 === t &&
                        ("function" == typeof e.render
                          ? l("188")
                          : l("268", Object.keys(e))),
                      (e = null === (e = fn(t)) ? null : e.stateNode)
                    );
                  },
                  hydrate: function (e, t, n) {
                    return uu(t) || l("200"), su(null, e, t, !0, n);
                  },
                  render: function (e, t, n) {
                    return uu(t) || l("200"), su(null, e, t, !1, n);
                  },
                  unstable_renderSubtreeIntoContainer: function (e, t, n, r) {
                    return (
                      uu(n) || l("200"),
                      (null == e || void 0 === e._reactInternalFiber) && l("38"),
                      su(e, t, n, !1, r)
                    );
                  },
                  unmountComponentAtNode: function (e) {
                    return (
                      uu(e) || l("40"),
                      !!e._reactRootContainer &&
                        (Jo(function () {
                          su(null, null, e, !1, function () {
                            e._reactRootContainer = null;
                          });
                        }),
                        !0)
                    );
                  },
                  unstable_createPortal: function () {
                    return fu.apply(void 0, arguments);
                  },
                  unstable_batchedUpdates: Zo,
                  unstable_interactiveUpdates: eu,
                  flushSync: function (e, t) {
                    xo && l("187");
                    var n = _o;
                    _o = !0;
                    try {
                      return vo(e, t);
                    } finally {
                      (_o = n), $o(1073741823, !1);
                    }
                  },
                  unstable_createRoot: pu,
                  unstable_flushControlled: function (e) {
                    var t = _o;
                    _o = !0;
                    try {
                      vo(e);
                    } finally {
                      (_o = t) || xo || $o(1073741823, !1);
                    }
                  },
                  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
                    Events: [
                      O,
                      F,
                      L,
                      N.injectEventPluginsByName,
                      y,
                      H,
                      function (e) {
                        C(e, B);
                      },
                      Ue,
                      Ie,
                      Dn,
                      R,
                    ],
                  },
                };
                function pu(e, t) {
                  return (
                    uu(e) || l("299", "unstable_createRoot"),
                    new ou(e, !0, null != t && !0 === t.hydrate)
                  );
                }
                !(function (e) {
                  var n = e.findFiberByHostInstance;
                  el(
                    t({}, e, {
                      overrideProps: null,
                      currentDispatcherRef: $e.ReactCurrentDispatcher,
                      findHostInstanceByFiber: function (e) {
                        return null === (e = fn(e)) ? null : e.stateNode;
                      },
                      findFiberByHostInstance: function (e) {
                        return n ? n(e) : null;
                      },
                    })
                  );
                })({
                  findFiberByHostInstance: D,
                  bundleType: 0,
                  version: "16.8.6",
                  rendererPackageName: "react-dom",
                });
                var mu = {
                    default: du,
                  },
                  hu = (mu && du) || mu;
                module.exports = hu.default || hu;
              },
              {
                react: "SAdv",
                "object-assign": "0tLx",
                scheduler: "JlZK",
              },
            ],
            CSY6: [
              function (require, module, exports) {
                "use strict";
                function _() {
                  if (
                    "undefined" != typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ &&
                    "function" == typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE
                  ) {
                    0;
                    try {
                      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(_);
                    } catch (O) {
                      console.error(O);
                    }
                  }
                }
                _(), (module.exports = require("./cjs/react-dom.production.min.js"));
              },
              {
                "./cjs/react-dom.production.min.js": "5i0G",
              },
            ],
            //フォントの宣言やBandについて
            ZHoe: [
              function (require, module, exports) {
                "use strict";
                var e, o, t, n, r, s, p, w;
                (exports.__esModule = !0),
                  (function (e) {
                    (e.Point = "point"), (e.Line = "line");
                  })((t = exports.PlotType || (exports.PlotType = {}))),
                  // (function (e) {
                  //   (e.sans = "sans"), (e.serif = "serif");
                  // })((n = exports.Font || (exports.Font = {}))),
                  ////////////////////////////////////////
                  // エネルギーバンドごとの表示をするために追加
                  (function (e) {
                    (e.all = "All"), (e.high = "High"), (e.med = "Med"),(e.low = "Low");
                  })((w = exports.EnergyBand || (exports.EnergyBand = {}))),
                  ////////////////////////////////////////
                  (function (e) {
                    (e[(e.Default = 0)] = "Default"),
                      (e[(e.Append = 1)] = "Append"),
                      (e[(e.Range = 2)] = "Range");
                  })((r = exports.Mode || (exports.Mode = {}))),
                  (function (e) {
                    (e[(e.$2_20 = 0)] = "$2_20"),
                      (e[(e.$2_4 = 1)] = "$2_4"),
                      (e[(e.$4_10 = 2)] = "$4_10"),
                      (e[(e.$10_20 = 3)] = "$10_20");
                  })((s = exports.Band || (exports.Band = {}))),
                  (exports.BandTitles =
                    (((e = {})[s.$2_20] = "2-20keV"),
                    (e[s.$2_4] = "2-4keV"),
                    (e[s.$4_10] = "4-10keV"),
                    (e[s.$10_20] = "10-20keV"),
                    e)),
                  (function (e) {
                    (e.white = "#ffffff"),
                      (e.red = "#ff0000"),
                      (e.green = "#007f00"),
                      (e.blue = "#0000ff");
                  })((p = exports.Color || (exports.Color = {}))),
                  (exports.BandColors =
                    (((o = {})[s.$2_20] = p.white),
                    (o[s.$2_4] = p.red),
                    (o[s.$4_10] = p.green),
                    (o[s.$10_20] = p.blue),
                    o));
              },
              {},
            ],
            //時間関係の設定
            Aa4L: [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.SECOND_MS = 1e3),
                  (exports.MINUTE_MS = 6e4),
                  (exports.HOUR_MS = 36e5),
                  (exports.DAY_MS = 864e5), //１日をミリ秒で表している。
                  (exports.MJDEpochDate = -35067168e5); //1970/1/1/9:00:00からこのミリ秒分変えた日にする場所1858年になっているMJDの基準日が1858年
              },
              {},
            ],
            "RzZ+": [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                });
                var e = require("./constants");
                exports.mjdToDate = function (t) {
                  return new Date(e.MJDEpochDate + t * e.DAY_MS);
                };
        
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                //MJDをdptcに変える
                exports.mjdToDptc = function (mjd) {
                  return ((e.MJDEpochDate + mjd * e.DAY_MS) / 1000).toFixed();
                };
        
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
              },
              {
                "./constants": "Aa4L",
              },
            ],
            IiY9: [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                });
                var e = require("./constants");
                exports.dateToMJD = function (t) {
                  return (new Date(t).getTime() - e.MJDEpochDate) / e.DAY_MS;
                };
              },
              {
                "./constants": "Aa4L",
              },
            ],
            LNvY: [
              function (require, module, exports) {
                "use strict";
                function e(e) {
                  for (var r in e) exports.hasOwnProperty(r) || (exports[r] = e[r]);
                }
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  e(require("./constants")),
                  e(require("./mjdToDate")),
                  e(require("./dateToMJD"));
              },
              {
                "./constants": "Aa4L",
                "./mjdToDate": "RzZ+",
                "./dateToMJD": "IiY9",
              },
            ],
            //データの個数やページのタイトルなどの設定
            "39BI": [
              function (require, module, exports) {
                "use strict";
                var e, o;
                exports.__esModule = !0;
                var t,
                  r = require("../types"),
                  data_day = require("../../util/getRollingAverage"),
                  n = require("@maxi-js/date-tools");
                (exports.SVGNS = "http://www.w3.org/2000/svg"),
                  (exports.developMode = Boolean(
                    document.querySelector('meta[name="preprocessor"]')
                  )),
                  // (exports.APIBaseURL = new URL(
                  //   exports.developMode
                  //     ? location.protocol + "//" + location.hostname + ":80"
                  //     : location.protocol + "//" + location.host + ":80"
                  // )),
                  // 両plottypeを配列として格納
                  (exports.AvailablePlotTypes = [r.PlotType.Point, r.PlotType.Line]),
                  (exports.AvailablePlotTypeTitles =
                    (((e = {})[r.PlotType.Point] = "Point"),
                    (e[r.PlotType.Line] = "Line"),
                    e)),
                  // エネルギーバンドごとの表示をするための設定
                  (exports.AvailableEnergyBands = [r.EnergyBand.all, r.EnergyBand.low, r.EnergyBand.med, r.EnergyBand.high]),
                  //console.log(exports.AvailableEnergyBands),
                  // エネルギーバンドタイトル
                  (exports.AvailableEnergyBandTitles =
                    (((e = {})[r.EnergyBand.all] = "2-20keV"),
                    (e[r.EnergyBand.low] = "2-4keV"),
                    (e[r.EnergyBand.med] = "4-10keV"),
                    (e[r.EnergyBand.high] = "10-20keV"),
                    e)),
                  //console.log(exports.AvailableEnergyBandTitles),
                  // フォントの種類を格納している。
                  // (exports.AvailableFonts = [r.Font.sans, r.Font.serif]),
                  // (exports.AvailableFontTitles =
                  //   (((o = {})[r.Font.sans] = "Sans"), (o[r.Font.serif] = "Serif"), o)),
                  (function (e) {
                    (e.mjdRange = "mjd"), (e.binSize = "bin"), (e.plotType = "plot");
                    // (e.font = "font");
                  })((t = exports.URLParameterKey || (exports.URLParameterKey = {}))),
                  /////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                  (exports.epochMJD = data_day.judgeMJD(dict_LCdata[0][0] - 3600)), //表示範囲のスタート地点、データから1時間前から表示開始
                  (exports.endMJD = data_day.judgeMJD(
                    dict_LCdata[dict_LCdata.length - 1][0] + 3600
                  )), //表示範囲の終了地点、最後のデータから1時間後まで表示する。
                  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
                  (initial_MJDRange = [exports.epochMJD, exports.endMJD]),
                  //ページのタイトルを表示
                  //(exports.pageTitle = "MAXI GSC Data Viewer"),
                  //(exports.pageTitle = "光度曲線テスト"),
                  (exports.mainTickSize = 10),
                  (exports.subTickSize = 5),
                  //光度曲線の表示範囲（縦）
                  (exports.getAreaHeight = function () {
                    return 160; //0.2 * window.innerHeight;
                  }),
                  (exports.bandCount = 1) /*4*/;
              },
              {
                "../types": "ZHoe",
                "@maxi-js/date-tools": "LNvY",
                "../../util/getRollingAverage": "WubQ",
              },
            ],
            //エラーが出た時に使われる処理
            bU42: [
              function (require, module, exports) {
                "use strict";
                (exports.__esModule = !0),
                  (exports.createError = function (r, e, t) {
                    return Object.assign(new Error(e), {
                      code: r,
                      data: t,
                    });
                  });
              },
              {},
            ],
            lRms: [
              function (require, module, exports) {
                "use strict";
                (exports.__esModule = !0),
                  (exports.extractResponseData = function (e) {
                    return {
                      sourceTitle: e.headers.get("x-source-title"),
                      sourceURL: e.headers.get("x-source-url"),
                      createdAt: new Date(
                        e.headers.get("x-created-at") || "Invalid Date"
                      ),
                      elapsedSeconds: Number(e.headers.get("x-elapsed-seconds")),
                    };
                  });
              },
              {},
            ],
            //外部のデータを取得するところなどがある
            "7AM+": [
              function (require, module, exports) {
                "use strict";
                var e =
                    (this && this.__awaiter) ||
                    function (e, t, r, n) {
                      return new (r || (r = Promise))(function (a, o) {
                        function i(e) {
                          try {
                            c(n.next(e));
                          } catch (t) {
                            o(t);
                          }
                        }
                        function u(e) {
                          try {
                            c(n.throw(e));
                          } catch (t) {
                            o(t);
                          }
                        }
                        function c(e) {
                          e.done
                            ? a(e.value)
                            : new r(function (t) {
                                t(e.value);
                              }).then(i, u);
                        }
                        c((n = n.apply(e, t || [])).next());
                      });
                    },
                  t =
                    (this && this.__generator) ||
                    function (e, t) {
                      var r,
                        n,
                        a,
                        o,
                        i = {
                          label: 0,
                          sent: function () {
                            if (1 & a[0]) throw a[1];
                            return a[1];
                          },
                          trys: [],
                          ops: [],
                        };
                      return (
                        (o = {
                          next: u(0),
                          throw: u(1),
                          return: u(2),
                        }),
                        "function" == typeof Symbol &&
                          (o[Symbol.iterator] = function () {
                            return this;
                          }),
                        o
                      );
                      function u(o) {
                        return function (u) {
                          return (function (o) {
                            if (r)
                              throw new TypeError("Generator is already executing.");
                            for (; i; )
                              try {
                                if (
                                  ((r = 1),
                                  n &&
                                    (a =
                                      2 & o[0]
                                        ? n.return
                                        : o[0]
                                        ? n.throw || ((a = n.return) && a.call(n), 0)
                                        : n.next) &&
                                    !(a = a.call(n, o[1])).done)
                                )
                                  return a;
                                switch (
                                  ((n = 0), a && (o = [2 & o[0], a.value]), o[0])
                                ) {
                                  case 0:
                                  case 1:
                                    a = o;
                                    break;
                                  case 4:
                                    return (
                                      i.label++,
                                      {
                                        value: o[1],
                                        done: !1,
                                      }
                                    );
                                  case 5:
                                    i.label++, (n = o[1]), (o = [0]);
                                    continue;
                                  case 7:
                                    (o = i.ops.pop()), i.trys.pop();
                                    continue;
                                  default:
                                    if (
                                      !(a =
                                        (a = i.trys).length > 0 && a[a.length - 1]) &&
                                      (6 === o[0] || 2 === o[0])
                                    ) {
                                      i = 0;
                                      continue;
                                    }
                                    if (
                                      3 === o[0] &&
                                      (!a || (o[1] > a[0] && o[1] < a[3]))
                                    ) {
                                      i.label = o[1];
                                      break;
                                    }
                                    if (6 === o[0] && i.label < a[1]) {
                                      (i.label = a[1]), (a = o);
                                      break;
                                    }
                                    if (a && i.label < a[2]) {
                                      (i.label = a[2]), i.ops.push(o);
                                      break;
                                    }
                                    a[2] && i.ops.pop(), i.trys.pop();
                                    continue;
                                }
                                o = t.call(e, i);
                              } catch (u) {
                                (o = [6, u]), (n = 0);
                              } finally {
                                r = a = 0;
                              }
                            if (5 & o[0]) throw o[1];
                            return {
                              value: o[0] ? o[1] : void 0,
                              done: !0,
                            };
                          })([o, u]);
                        };
                      }
                    },
                  r = this;
                exports.__esModule = !0;
                var n = require("./constants"),
                  a = require("./createError"),
                  o = require("./extractResponseData");
                exports.getLightCurveData = function (i) {
                  return e(r, void 0, Promise, function () {
                    var e, r;
                    return t(this, function (t) {
                      switch (t.label) {
                        case 0:
                          return; //[4, dict_LCdata];
                        case 1:
                          if (200 !== (e = t.sent()).status)
                            throw a.createError(
                              "FETCH_OBJECT_DATA",
                              "failed to fetch object data",
                              e
                            );
                          return [4, e.json()];
                        case 2:
                          return (
                            (r = t.sent()),
                            [2, Object.assign(r, o.extractResponseData(e))]
                          );
                      }
                    });
                  });
                };
              },
              {
                "./constants": "39BI",
                "./createError": "bU42",
                "./extractResponseData": "lRms",
              },
            ],
            WubQ: [
              function (require, module, exports) {
                "use strict";
                let judge_dptc = require("./constants");
                var t =
                    (this && this.__awaiter) ||
                    function (t, e, n, r) {
                      return new (n || (n = Promise))(function (o, a) {
                        function i(t) {
                          try {
                            l(r.next(t));
                          } catch (e) {
                            a(e);
                          }
                        }
                        function u(t) {
                          try {
                            l(r.throw(t));
                          } catch (e) {
                            a(e);
                          }
                        }
                        function l(t) {
                          t.done
                            ? o(t.value)
                            : new n(function (e) {
                                e(t.value);
                              }).then(i, u);
                        }
                        l((r = r.apply(t, e || [])).next());
                      });
                    },
                  e =
                    (this && this.__generator) ||
                    function (t, e) {
                      var n,
                        r,
                        o,
                        a,
                        i = {
                          label: 0,
                          sent: function () {
                            if (1 & o[0]) throw o[1];
                            return o[1];
                          },
                          trys: [],
                          ops: [],
                        };
                      return (
                        (a = {
                          next: u(0),
                          throw: u(1),
                          return: u(2),
                        }),
                        "function" == typeof Symbol &&
                          (a[Symbol.iterator] = function () {
                            return this;
                          }),
                        a
                      );
                      function u(a) {
                        return function (u) {
                          return (function (a) {
                            if (n)
                              throw new TypeError("Generator is already executing.");
                            for (; i; )
                              try {
                                if (
                                  ((n = 1),
                                  r &&
                                    (o =
                                      2 & a[0]
                                        ? r.return
                                        : a[0]
                                        ? r.throw || ((o = r.return) && o.call(r), 0)
                                        : r.next) &&
                                    !(o = o.call(r, a[1])).done)
                                )
                                  return o;
        
                                switch (
                                  ((r = 0), o && (a = [2 & a[0], o.value]), a[0])
                                ) {
                                  case 0:
                                  case 1:
                                    o = a;
                                    break;
                                  case 4:
                                    return (
                                      i.label++,
                                      {
                                        value: a[1],
                                        done: !1,
                                      }
                                    );
                                  case 5:
                                    i.label++, (r = a[1]), (a = [0]);
                                    continue;
                                  case 7:
                                    (a = i.ops.pop()), i.trys.pop();
                                    continue;
                                  default:
                                    if (
                                      !(o =
                                        (o = i.trys).length > 0 && o[o.length - 1]) &&
                                      (6 === a[0] || 2 === a[0])
                                    ) {
                                      i = 0;
                                      continue;
                                    }
                                    if (
                                      3 === a[0] &&
                                      (!o || (a[1] > o[0] && a[1] < o[3]))
                                    ) {
                                      i.label = a[1];
                                      break;
                                    }
                                    if (6 === a[0] && i.label < o[1]) {
                                      (i.label = o[1]), (o = a);
                                      break;
                                    }
                                    if (o && i.label < o[2]) {
                                      (i.label = o[2]), i.ops.push(a);
                                      break;
                                    }
                                    o[2] && i.ops.pop(), i.trys.pop();
                                    continue;
                                }
                                a = e.call(t, i);
                              } catch (u) {
                                (a = [6, u]), (r = 0);
                              } finally {
                                n = o = 0;
                              }
                            if (5 & a[0]) throw a[1];
                            return {
                              value: a[0] ? a[1] : void 0,
                              done: !0,
                            };
                          })([a, u]);
                        };
                      }
                    },
                  n = this;
                (exports.__esModule = !0),
                  //計算結果が何を表しているかわからない。
                  (exports.getAB = function (t, e) {
                    var n = 0 === e ? 0 : 1 / Math.pow(e, 2);
                    return [n, t * n];
                  }),
                  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                  //受け取ったデータをMJDにする場所。
                  (exports.judgeMJD = function (data) {
                    let judge =
                      0.5 / 86400 +
                      (data * 1000 - judge_dptc.MJDEpochDate) / judge_dptc.DAY_MS;
  
                    return judge;
                  })(
                  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                    //8301行目のbにデータを返す。
                    (exports.getRollingAverageBin = function (t, e, n, r) {
                      var o = r[0],
                        a = r[1],
                        i = r[2], //i以降は2，3，4の光度曲線のデータはないため必要ない。
                        u = r[3],
                        l = r[4],
                        c = r[5],
                        s = r[6],
                        f = r[7];
                      return [
                        t,
                        e - 0.5 / 86400,
                        n + 0.5 / 86400,
                        a / o,
                        Math.pow(o, -0.5),
                        u / i, //これ以降は光度曲線のデータがないため必要ない
                        Math.pow(i, -0.5),
                        c / l,
                        Math.pow(l, -0.5),
                        f / s,
                        Math.pow(s, -0.5),
                      ];
                    })
                  ),
                  //bins、minX、minYの設定
                  //rにdict_LCdata、oにはbinsizeが入っている
                  (exports.count = true);
                exports.getRollingAverage = function (r, o) {
                  //dptcをMJDにして再代入。
                  if (this.count) {
                    for (let i = 0; i < r.length; i++) {
                      r[i][0] = exports.judgeMJD(r[i][0]);
                    }
                  }
        
                  this.count = false;
                  return t(n, void 0, Promise, function () {
                    var t,
                      n,
                      a,
                      i,
                      u,
                      l,
                      c,
                      s,
                      f,
                      h,
                      p,
                      g,
                      v,
                      x,
                      w,
                      b,
                      y,
                      m,
                      d,
                      A,
                      M,
                      B;
                    return e(this, function (e) {
                      for (
                        t = [],
                          n = [1 / 0, 1 / 0, 1 / 0, 1 / 0],
                          a = [0, 0, 0, 0],
                          i = [],
                          u = [0, 0, 0, 0, 0, 0, 0, 0],
                          l = function (t) {
                            //console.log(t); //dict_LCdata
                            var e = t[0],
                              n = exports.getAB(t[1], t[2]), //t[1]にはデータの2個目が、t[2]にはデータの3個目が入っている。
                              r = n[0],
                              o = n[1],
                              a = exports.getAB(t[3], t[4]), //t[3]にはデータの4個目が、t[4]にはデータの5個目が入っている。だがこれ以降はデータ無し
                              l = a[0],
                              c = a[1],
                              s = exports.getAB(t[5], t[6]), //t[5]にはデータの6個目が、t[6]にはデータの7個目が入っている。
                              f = s[0],
                              h = s[1],
                              p = exports.getAB(t[7], t[8]), //t[7]にはデータの8個目が、t[8]にはデータの9個目が入っている。
                              g = [e, r, o, l, c, f, h, p[0], p[1]]; //ここにはすべてのデータが格納されている
                            //console.log(g);
                            i.push(g), //iの中にすべて入れている
                              u.forEach(function (t, e) {
                                //console.log(t);
                                u[e] = t + g[e + 1];
                              });
                          },
                          c = function () {
                            var t = i.shift(); //配列の中の一番初めのデータ以外をtに代入
                            t &&
                              u.forEach(function (e, n) {
                                u[n] = e - t[n + 1];
                                //console.log(u[n]);
                              });
                          },
                          s = o / 2,
                          f = r.length,
                          h = 0,
                          p = 0;
                        p < f;
                        p++
                      ) {
                        for (
                          g = r[p][0],
                            /*ここでdict_LCdataの時間を抜き出している。*/ v = g + s;
                          h < f && (x = r[h]) && x[0] < v;
        
                        )
                          l(x), h++;
                        for (w = g - s; i[0][0] < w; ) c();
                        for (
                          b = exports.getRollingAverageBin(
                            g,
                            i[0][0],
                            i[i.length - 1][0],
                            u //このデータは何？
                          ),
                            // console.log(b),
                            y = 0;
                          y < 4;
                          y++
                        )
                          (d = b[(m = 2 * y + 3)]),
                            (A = b[m + 1]),
                            (n[y] = Math.min(n[y], d - A)),
                            (a[y] = Math.max(a[y], d + A)),
                            t.push(b);
                      }
                      console.log(n[0]); //minとmax//工事中
                      return (
                        (M = r[0][0]),
                        (B = r[r.length - 1][0]),
                        [
                          2,
                          {
                            bins: t,
                            minX: M,
                            maxX: B,
                            rangeX: B - M,
                            minY: n,
                            maxY: a,
                            //各強さのデータの範囲を計算して代入している。(範囲が小さいと散らばり度合いが小さいということ)
                            rangeY: [
                              a[0] - n[0],
                              a[1] - n[1],
                              a[2] - n[2],
                              a[3] - n[3],
                            ],
                          },
                        ]
                      );
                    });
                  });
                };
              },
              {
                "./constants": "Aa4L",
              },
            ],
            "/cZZ": [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react");
                exports.useCache = function (t) {
                  var n = e.useState(new Map()),
                    r = n[0],
                    c = n[1],
                    s = e.useState([]),
                    u = s[0],
                    o = s[1],
                    a = e.useState(0),
                    i = a[0],
                    f = a[1];
                  return (
                    e.useEffect(
                      function () {
                        for (
                          var e = function (e) {
                              r.has(e) ||
                                u.includes(e) ||
                                (o(u.concat([e])),
                                Promise.resolve(t.getter(e))
                                  .then(function (t) {
                                    null !== t && (r.set(e, t), c(new Map(r)));
                                  })
                                  .catch(t.onError)
                                  .finally(function () {
                                    o(
                                      u.filter(function (t) {
                                        return t !== e;
                                      })
                                    );
                                  }));
                            },
                            n = 0,
                            s = t.keys;
                          n < s.length;
                          n++
                        ) {
                          e(s[n]);
                        }
                      },
                      [t.keys, i]
                    ),
                    t.dependencies &&
                      e.useEffect(function () {
                        r.clear(), f(i + 1);
                      }, t.dependencies),
                    r
                  );
                };
              },
              {
                react: "SAdv",
              },
            ],
            //BinsizeやMJDrangeの判定部分
            somY: [
              function (require, module, exports) {
                "use strict";
                (exports.__esModule = !0),
                  (exports.clamp = function (e, t, r) {
                    return t < e ? (e < r ? e : r) : t;
                  });
              },
              {},
            ],
            //指定されたPlotTypeが格納されているかの判定
            PJvb: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("./constants");
                exports.isAvailablePlotType = function (s) {
                  return e.AvailablePlotTypes.includes(s);
                };
              },
              {
                "./constants": "39BI",
              },
            ],
            g9pg: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("../types"),
                  t = require("./clamp"),
                  r = require("./constants"),
                  i = require("./isAvailablePlotType"),
                  n = require("@maxi-js/date-tools");
                ////引数eを受け取りそれを数値に変換（1〜100の範囲、デフォルトは20）
                exports.default_binsize = 1; //binsizeの初期設定
                (exports.filterBinSize = function (e) {
                  let num = 1 / 86400; //桁数限定したものを格納。
                  return t.clamp(
                    (e && Number(e)) || num * this.default_binsize,
                    num,
                    0.001
                  );
                }),
                  (exports.filterMJDRange = function (e) {
                    var i = [
                      r.epochMJD, //初期表示の開始時刻
                      r.endMJD, //初期表示の終了時刻
                    ];
                    if ("string" == typeof e) {
                      var a = e.match(/\d+(\.\d+)?/g);
                      a &&
                        2 === a.length &&
                        ((i[0] = t.clamp(Number(a[0]), i[0], i[1] - 1)),
                        (i[1] = t.clamp(Number(a[1]), i[0] + 1, i[1])));
                    } else
                      Array.isArray(e) &&
                        ((i[0] = t.clamp(Number(e[0]), i[0], i[1] - 1)),
                        (i[1] = t.clamp(Number(e[1]), i[0] + 1, i[1])));
                    return i;
                  }),
                  (exports.filterPlotType = function (t) {
                    return i.isAvailablePlotType(t) ? t : e.PlotType.Point;
                  }),
                  // (exports.filterFont = function (t) {
                  //   return a.isAvailableFont(t) ? t : e.Font.sans;
                  // }),
                  (exports.getDefaultPreferences = function (e) {
                    //e.get(r.URLParameterKey.binSize);
                    return {
                      //ここのbinsizeを変更することでも光度曲線の十字の数を変更することができる
                      binSize: exports.filterBinSize(e.get(r.URLParameterKey.binSize)),
                      mjdRange: exports.filterMJDRange(
                        e.get(r.URLParameterKey.mjdRange)
                      ),
        
                      plotType: exports.filterPlotType(
                        e.get(r.URLParameterKey.plotType)
                      ),
                      //font: exports.filterFont(e.get(r.URLParameterKey.font)),
                    };
                  });
              },
              {
                "../types": "ZHoe",
                "./clamp": "somY",
                "./constants": "39BI",
                "./isAvailablePlotType": "PJvb",
                "@maxi-js/date-tools": "LNvY",
              },
            ],
            "9aF6": [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.sanitizeHTMLAttribute = function (t) {
                    return t.split("<").join("&lt;").split(">").join("&gt;");
                  });
              },
              {},
            ],
            lLpc: [
              function (require, module, exports) {
                "use strict";
                // Object.defineProperty(exports, "__esModule", {
                //   value: !0,
                // }),
                //   (exports.stringifyTable = function (n) {
                //     return "[\n".concat(
                //       n
                //         .map(function (n) {
                //           return "  ".concat(JSON.stringify(n));
                //         })
                //         .join(",\n"),
                //       "\n]"
                //     );
                //   });
              },
              {},
            ],
            "5qfz": [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.isNonEmptyString = function (t) {
                    return Boolean(t.match(/\S/));
                  }),
                  (exports.getNonEmptyTrimmedLinesFrom = function (t) {
                    return t.split(/\s*[\r\n]\s*/).filter(exports.isNonEmptyString);
                  }),
                  (exports.xsv2js = function (t, s, r) {
                    return exports.getNonEmptyTrimmedLinesFrom(t).map(function (t) {
                      return t.split(s).map(r);
                    });
                  }),
                  (exports.csv2js = function (t, s) {
                    return exports.xsv2js(t, /\s*,\s*/, s);
                  }),
                  (exports.ssv2js = function (t, s) {
                    return exports.xsv2js(t, /\s+/, s);
                  }),
                  (exports.tsv2js = function (t, s) {
                    return exports.xsv2js(t, "\t", s);
                  });
              },
              {},
            ],
            IrJk: [
              function (require, module, exports) {
                "use strict";
                function e(e) {
                  for (var r in e) exports.hasOwnProperty(r) || (exports[r] = e[r]);
                }
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  e(require("./getTableFromHTML")),
                  e(require("./getTitleFromHTML")),
                  e(require("./sanitizeHTMLAttribute")),
                  e(require("./stringifyTable")),
                  e(require("./xsvToJSON"));
              },
              {
                "./getTableFromHTML": "rFu0",
                "./getTitleFromHTML": "eyJq",
                "./sanitizeHTMLAttribute": "9aF6",
                "./stringifyTable": "lLpc",
                "./xsvToJSON": "5qfz",
              },
            ],
            W05B: [
              function (require, module, exports) {
                module.exports = {
                  container: "_container_a1adc",
                  id: "_id_a1adc",
                  number: "_number_a1adc",
                  loading: "_loading_a1adc",
                  selected: "_selected_a1adc",
                  tableWrap: "_tableWrap_a1adc",
                };
              },
              {},
            ],
            //サイトで言う上のデータの集まりの部分(Mrk 335しか今は残していない)(いらない)
            hnqh: [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.createdAt = "2019-06-24T05:36:40.729Z"),
                  (exports.source = {
                    title: "MAXI GSC All-Sky Monitor Index (v3)",
                    urls: {
                      html: "http://maxi.riken.jp/pubdata/v3/",
                    },
                  }),
                  (exports.map = new Map()),
                  exports.map.set("J0006+202", {
                    id: "J0006+202",
                    name: "Mrk 335",
                    category: "ExtraGalactic-AGN",
                    ra: 1.582,
                    dec: 20.203,
                    l: 108.764,
                    b: -41.424,
                    source: {
                      title: "Mrk 335",
                      urls: {
                        html: "http://maxi.riken.jp/star_data/J0006+202/J0006+202.html",
                        image:
                          "http://maxi.riken.jp/star_data/J0006+202/J0006+202_00055058g_lc_all.gif",
                        data: "http://maxi.riken.jp/star_data/J0006+202/J0006+202_g_lc_1day_all.dat",
                      },
                    },
                  });
              },
              {},
            ],
            aSxN: [
              function (require, module, exports) {
                "use strict";
                function e(e) {
                  for (var r in e) exports.hasOwnProperty(r) || (exports[r] = e[r]);
                }
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  e(require("./catalog"));
              },
              {
                "./catalog": "hnqh",
              },
            ],
            wLbE: [
              function (require, module, exports) {
                "use strict";
                var r =
                    (this && this.__assign) ||
                    function () {
                      return (r =
                        Object.assign ||
                        function (r) {
                          for (var t, e = 1, a = arguments.length; e < a; e++)
                            for (var s in (t = arguments[e]))
                              Object.prototype.hasOwnProperty.call(t, s) &&
                                (r[s] = t[s]);
                          return r;
                        }).apply(this, arguments);
                    },
                  t =
                    (this && this.__importStar) ||
                    function (r) {
                      if (r && r.__esModule) return r;
                      var t = {};
                      if (null != r)
                        for (var e in r)
                          Object.hasOwnProperty.call(r, e) && (t[e] = r[e]);
                      return (t.default = r), t;
                    };
                exports.__esModule = !0;
                var e = t(require("@maxi-js/catalog"));
                (exports.createdAt = new Date(e.createdAt)),
                  (exports.source = e.source),
                  (exports.firstObjectId = ""),
                  (exports.map = new Map(
                    Array.from(e.map).map(function (t, e) {
                      var a = t[1];
                      return (
                        0 === e && (exports.firstObjectId = a.id),
                        [
                          a.id,
                          r({}, a, {
                            hash: [a.id, a.name, a.category].join(" "),
                          }),
                        ]
                      );
                    })
                  ));
              },
              {
                "@maxi-js/catalog": "aSxN",
              },
            ],
            QM4m: [
              function (require, module, exports) {
                module.exports = {
                  svg: "_svg_f0ba2",
                  download: "_download_f0ba2",
                };
              },
              {},
            ],
            //カーソルと一緒に動く縦線の設定
            "0fuv": [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react"),
                  t = require("@maxi-js/date-tools"),
                  r = require("../../types");
                exports.Cursor = e.memo(function (o) {
                  var i = o.cursor,
                    l = o.svgHeight, //縦線の長さの設定
                    a = o.left,
                    n = o.areaWidth,
                    c = o.minMJD,
                    u = o.maxMJD,
                    x = o.lineHeight;
                  exports.parent = document.getElementById("body");
                  if (!i) return null;
                  var s = u - c,
                    m = function (e) {
                      return c + (e / n) * s;
                    };

                  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                  //カーソルの位置がどのデータに近いかを判定;
                  let cursor_position = function (data, cursor_time) {
                    let i, array_num; //array_numは配列内で最小の値が入っている場所。
                    let dptc = [];
                  
                    //カーソルの位置のdptcと各データの中央のdptcの差を代入。
                    for (i = 0; i < data.length; i++) {
                      dptc.push(
                        Math.abs(
                          t.mjdToDptc(data[i][Math.round(data[i].length / 2)][0]) -
                            cursor_time
                        )
                      );
                    }
                    console.log(dptc);
                  
                    //データの中央の時間からカーソルが200秒未満の距離でクリックされたらなら、配列の番号をarray_numに格納。そうでない時はnull。
                    array_num =
                      dptc[dptc.indexOf(Math.min(...dptc))] < 200
                        ? dptc.indexOf(Math.min(...dptc))
                        : (array_num = null);
                  
                    console.log(array_num);
                  
                    return array_num;
                  };
                
                  //制限時間内にクリックした回数でダブルクリックかを判定
                  //ダブルクリックした時に呼ばれる。工事中
                  document.onclick = function () {
                    clickCount += 1;
                    //下の関数の中では使えないため外に出す。
                    let target_id = event.target.id == "can_zoom" ? true : false;
                    let shift_on = event.shiftKey ? true : false;
                  
                    if (clickCount === 1) {
                      //タイマーをセットし、タイマー終了時にカウントに応じた処理をする
                      timer = setTimeout(() => {
                        if (clickCount === 2) {
                          let graph_num = cursor_position(
                            graph_data,
                            t.mjdToDptc(m(i.x))
                          );
                          
                          if (
                            graph_num != null &&
                            graph_scale_change[0] == 0 &&
                            target_id
                          ) {
                            //初期表示範囲から選択したデータの時間を比べ差異を格納。発表
                            let start_MJDRange =
                              graph_data[graph_num][0][0] -
                              10 / 86400 -
                              initial_MJDRange[0];
                            let end_MJDRange =
                              initial_MJDRange[1] -
                              (graph_data[graph_num][
                                graph_data[graph_num].length - 1
                              ][0] +
                                10 / 86400);
                            
                            //shiftを押されていた場合初期表示画面に戻す。
                            if (shift_on) {
                              start_MJDRange = 0;
                              end_MJDRange = 0;
                              // graph_scale_change = [0, 0];
                              shift_event = true;
                            }
                          
                            //拡大時一回すべて消した後変更したものを表示。
                            function child_remove() {
                              setTimeout(function () {
                                // 初めはすべて削除するが２回目からは一つ目の子要素のみ削除する。
                                while (exports.parent.firstChild) {
                                  exports.parent.removeChild(
                                    exports.parent.firstChild
                                  );
                                  // 全て消えてしまう場合はこのへんを修正
                                  // if (delete_child == 6) {
                                  //   break;
                                  // }
                                  // delete_child++;
                                }
                              
                                graph_scale_change[0] = start_MJDRange;
                                graph_scale_change[1] = end_MJDRange;
                                console.log("子要素 削除完了");
                                console.log(graph_data[graph_num]);
                              }, 540); //この処理を540ミリ秒経過後に完了させる。
                            
                              //ダブルクリックされたときに新しい光度曲線を作成して、画面に表示
                              Create_LightCurve();
                            
                              //divタグ内の要素がもしもなくなってしまった時の対処。
                              setTimeout(function () {
                                if (exports.parent.childElementCount != 1) {
                                  //一旦全部初期化
                                  console.log("表示エラーが発生しました");
                                
                                  graph_scale_change = [0, 0];
                                  createLC(); //一旦初期表示画面にする。
                                } else if (exports.parent.childElementCount == 1) {
                                  console.log("正常に動作している。");
                                  console.log(graph_scale_change);
                                }
                              }, 700); //この判定は700ミリ秒経過後に実行される。
                            }
                            child_remove();
                          }
                        } else {
                          console.log("クリックカウント" + clickCount);
                        }
                        //変数をリセット
                        timer = null;
                        clickCount = 0;
                      }, time_over);
                    }
                  };
                
                  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
                
                  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                  let date = new Date(t.mjdToDptc(m(i.x)) * 1000 - 32400000); //new Dateの()内について、表示はUTCなので9時間引かなければいけない。
                  let Hour = ("00" + date.getHours()).slice(-2); //時間
                  let Minute = ("00" + date.getMinutes()).slice(-2); //分
                  let Second = ("00" + date.getSeconds()).slice(-2); //秒
        
                  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        
                  //縦線の作成
                  return e.createElement(
                    "g",
                    null,
                    e.createElement("path", {
                      d: "M" + (a + i.x) + ",1V" + (l - 1),
                      id: "can_zoom",
                      stroke: r.Color.white,
                      opacity: 0.3,
                    }),
                    e.createElement(
                      "text",
                      {
                        x: a + i.x + 2,
                        y: i.y - 2 - 0.9 * x,
                        fontSize: "80%",
                        fill: r.Color.white,
                        opacity: 0.7,
                      },
                      t.mjdToDptc(m(i.x)) + " " + "dptc"
                    ),
                    e.createElement(
                      "text",
                      {
                        x: a + i.x + 2,
                        y: i.y - 2,
                        fontSize: "80%",
                        fill: r.Color.white,
                        opacity: 0.7,
                      },
                      Hour + ":" + Minute + ":" + Second + " " + "Time" //カーソルの場所の時間を表示
                      //m(i.x)はカーソル位置のMJD
                    )
                  );
                });
              },
              {
                react: "SAdv",
                "@maxi-js/date-tools": "LNvY",
                "../../types": "ZHoe",
              },
            ],
            "4NfL": [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.clamp = function (e) {
                    var t =
                        arguments.length > 1 && void 0 !== arguments[1]
                          ? arguments[1]
                          : -1 / 0,
                      r =
                        arguments.length > 2 && void 0 !== arguments[2]
                          ? arguments[2]
                          : 1 / 0;
                    return t < e ? (e < r ? e : r) : t;
                  });
              },
              {},
            ],
            YORH: [
              function (require, module, exports) {
                "use strict";
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  (exports.nearest = function (e, t) {
                    return e.reduce(function (e, r) {
                      return Math.abs(e - t) < Math.abs(r - t) ? e : r;
                    });
                  });
              },
              {},
            ],
            "1evX": [
              function (require, module, exports) {
                "use strict";
                function e(e) {
                  for (var r in e) exports.hasOwnProperty(r) || (exports[r] = e[r]);
                }
                Object.defineProperty(exports, "__esModule", {
                  value: !0,
                }),
                  e(require("./clamp")),
                  e(require("./nearest"));
              },
              {
                "./clamp": "4NfL",
                "./nearest": "YORH",
              },
            ],
            //目盛りなどのスケールの設定
            CKjx: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var t = require("@maxi-js/number-tools");
                exports.getTickScale = function (e, r, a, o, s) {
                  void 0 === s && (s = 10);
                  var i = r - e;
                  if (0 < i) {
                    var l = Math.pow(s, Math.floor(Math.log(i) / Math.log(s) - 1)),
                      u = t.nearest(o, i / a / l),
                      n = l * u,
                      M = l * Math.ceil(e / l),
                      c = n * Math.ceil(e / n);
                    return {
                      step: u,
                      stepOffset: Math.floor((c - M) / l),
                      subScale: l,
                      firstSub: M,
                      mainScale: n,
                      firstMain: c,
                    };
                  }
                  return null;
                };
              },
              {
                "@maxi-js/number-tools": "1evX",
              },
            ],
            "+xmN": [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("./getTickScale");
                let MJDChange = require("@maxi-js/date-tools");
                exports.getTicks = function (t, r, s, i) {
                  void 0 === i &&
                    (i = function (e) {
                      return MJDChange.mjdToDptc(e); //MJDをdptcに変更して返す
                    });
                  var u = e.getTickScale(t, r, s, [1, 2, 5]);
                  if (u) {
                    for (var n = [], a = u.firstMain; a < r; a += u.mainScale)
                      n.push(a);
                    var f = [];
                    for (a = u.firstSub; a < r; a += u.subScale) f.push(a);
        
                    return {
                      step: u.step,
                      stepOffset: u.stepOffset,
                      main: n,
                      sub: f,
                      min: t,
                      max: r,
                      toString: i,
                    };
                  }
                  return null;
                };
              },
              {
                "./getTickScale": "CKjx",
                "@maxi-js/date-tools": "LNvY",
              },
            ],
            //縦目盛りの作成、設定
            ebhF: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react"),
                  t = require("../../util/getTicks"),
                  i = require("../../types"),
                  r = require("../../util/constants");
                //YTicksの設定、YTicksを宣言するとこれが呼ばれる。
                exports.YTicks = e.memo(function (n) {
                  var a = n.min,
                    c = n.max,
                    o = n.left,
                    l = n.bottom,
                    s = n.height,
                    u = t.getTicks(a, c, s / 100);
                  if (!u) return null;
                  var m = c - a,
                    h = s / m,
                    k = function (e) {
                      return l - h * (e - a);
                    },
                    //縦目盛りの値の計算式
                    f = Math.max(Math.ceil(1 - Math.log10(m)), 0),
                    d = [
                      e.createElement("path", {
                        key: "ticks",
                        d: u.sub
                          .map(function (e, t) {
                            return (
                              "M" +
                              o +
                              "," +
                              k(e) +
                              "h" +
                              ((t - u.stepOffset) % u.step == 0
                                ? r.mainTickSize
                                : r.subTickSize)
                            );
                          })
                          .join(""),
                        stroke: i.Color.white,
                      }),
                    ];
                  return (
                    //縦の目盛りの値を入力
                    u.main.forEach(function (t, r) {
                      d.push(
                        e.createElement(
                          "text",
                          {
                            key: "yLabel-" + r,
                            x: o - 4,
                            y: k(t),
                            fill: i.Color.white,
                            dominantBaseline: "middle",
                            textAnchor: "end",
                          },
                          t.toFixed(f)
                        )
                      );
                    }),
                    e.createElement("g", {
                      children: d,
                    })
                  );
                });
              },
              {
                react: "SAdv",
                "../../util/getTicks": "+xmN",
                "../../types": "ZHoe",
                "../../util/constants": "39BI",
              },
            ],
            //色々な項目のスケールの指定
            vCs1: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("./getTickScale"),
                  t = 6e4,
                  i = 60 * t,
                  r = 24 * i;
                (exports.getMillisecondsTicks = function (t, i, r) {
                  var n = t.getTime(),
                    s = i.getTime(),
                    a = e.getTickScale(n, s, r, [2, 5, 10]);
                  if (a) {
                    for (var u = [], g = a.firstMain; g < s; g += a.mainScale)
                      u.push(new Date(g).getTime());
                    var f = [];
                    for (g = a.firstSub; g < s; g += a.subScale)
                      f.push(new Date(g).getTime());
                    console.log("MIllionTicks");
                    return {
                      step: a.step,
                      stepOffset: a.stepOffset,
                      main: u,
                      sub: f,
                      min: t.getTime(),
                      max: i.getTime(),
                      toString: function (e) {
                        num.push(new Date(e).toISOString().slice(0, -8).slice(0, 10));
                        return new Date(e).toISOString().slice(0, -1).slice(11, 23) ==
                          "00:00:00.000"
                        ? new Date(e).toISOString()
                        : new Date(e).toISOString().slice(0, -1).slice(11, 23); //new Date(e).getTime() / 1000; //秒で表示にするために1000で割る。
                      },
                    };
                  }
                  return null;
                }),
                  (exports.getSecondsTicks = function (t, i, r) {
                    var n = t.getTime() / 1e3,
                      s = i.getTime() / 1e3,
                      a = e.getTickScale(n, s, r, [2, 5, 10]);
                    if (a) {
                      for (var u = [], g = a.firstMain; g < s; g += a.mainScale)
                        u.push(new Date(1e3 * g).getTime());
                      var f = [];
                      for (g = a.firstSub; g < s; g += a.subScale)
                        f.push(new Date(1e3 * g).getTime());
                      console.log("SecoundsTicks");
        
                      return {
                        step: a.step,
                        stepOffset: a.stepOffset,
                        main: u,
                        sub: f,
                        min: t.getTime(),
                        max: i.getTime(),
                        toString: function (e) {
                          num.push(
                            new Date(e).toISOString().slice(0, -8).slice(0, 10)
                          );
                          return new Date(e)
                            .toISOString()
                            .slice(0, -5)
                            .slice(11, 19) == "00:00:00"
                            ? new Date(e).toISOString().slice(0, -5)
                            : new Date(e).toISOString().slice(0, -5).slice(11, 19); //new Date(e).getTime() / 1000; //秒で表示にするために1000で割る。
                        },
                      };
                    }
                    return null;
                  }),
                  (exports.getMinuteTicks = function (i, r, n) {
                    var s = i.getTime() / t,
                      a = r.getTime() / t,
                      u = e.getTickScale(s, a, n, [5, 10, 15, 20, 30], 15);
                    if (u) {
                      for (var g = [], f = u.firstMain; f < a; f += u.mainScale)
                        g.push(new Date(f * t).getTime());
                      var o = [];
                      for (f = u.firstSub; f < a; f += u.subScale)
                        o.push(new Date(f * t).getTime());
                      console.log("MinuteTicks");
                      return {
                        step: u.step,
                        stepOffset: u.stepOffset,
                        sub: o,
                        main: g,
                        min: i.getTime(),
                        max: r.getTime(),
                        toString: function (e) {
                          num.push(
                            new Date(e).toISOString().slice(0, -8).slice(0, 10)
                          );
                          return new Date(e)
                            .toISOString()
                            .slice(0, -8)
                            .slice(11, 16) == "00:00"
                            ? new Date(e).toISOString().slice(0, -8)
                            : new Date(e).toISOString().slice(0, -8).slice(11, 16); //new Date(e).getTime() / 1000; //秒で表示にするために1000で割る。
                        },
                      };
                    }
                    return null;
                  }),
                  (exports.getHourTicks = function (t, r, n) {
                    var s = t.getTime() / i,
                      a = r.getTime() / i,
                      u = e.getTickScale(s, a, n, [6, 12, 24], 12);
                    if (u) {
                      for (var g = [], f = u.firstMain; f < a; f += u.mainScale)
                        g.push(new Date(f * i).getTime());
                      var o = [];
                      for (f = u.firstSub; f < a; f += u.subScale)
                        o.push(new Date(f * i).getTime());
                      console.log("HourTicks");
                      return {
                        step: u.step,
                        stepOffset: u.stepOffset,
                        sub: o,
                        main: g,
                        min: t.getTime(),
                        max: r.getTime(),
                        toString: function (e) {
                          num.push(
                            new Date(e).toISOString().slice(0, -8).slice(0, 10) 
                          );
                          // console.log(num);
                          return new Date(e)
                            .toISOString()
                            .slice(0, -8)
                            .slice(11, 16) == "00:00"
                            ? new Date(e).toISOString().slice(0, -8)
                            : new Date(e).toISOString().slice(0, -8).slice(11, 16); //new Date(e).getTime() / 1000; //秒で表示にするために1000で割る。
                        },
                      };
                    }
                    return null;
                  }),
                  (exports.getDayTicks = function (t, i, n) {
                    var s = t.getTime() / r,
                      a = i.getTime() / r,
                      u = e.getTickScale(s, a, n, [5, 10, 20], 10);
                    if (u) {
                      for (var g = [], f = u.firstMain; f < a; f += u.mainScale)
                        g.push(new Date(f * r).getTime());
                      var o = [];
                      for (f = u.firstSub; f < a; f += u.subScale)
                        o.push(new Date(f * r).getTime());
                      console.log("DayTicks");
                      return {
                        step: u.step,
                        stepOffset: u.stepOffset,
                        sub: o,
                        main: g,
                        min: t.getTime(),
                        max: i.getTime(),
                        toString: function (e) {
                          return new Date(e).toISOString().slice(0, -14); //new Date(e).getTime() / 1000;  //秒で表示にするために1000で割る。
                        },
                      };
                    }
                    return null;
                  }),
                  (exports.getMonthTicks = function (t, i, r) {
                    var n = 12 * t.getFullYear() + t.getMonth() + 1,
                      s = 12 * i.getFullYear() + i.getMonth() + 1,
                      a = e.getTickScale(n, s, r, [1, 12, 24], 12); //[1,12,24]一番左が時間の間隔
        
                    if (a) {
                      for (
                        var u = [], g = Math.max(a.mainScale, 1), f = a.firstMain;
                        f < s;
                        f += g
                      ) {
                        var o = ("" + Math.floor(f / 12)).padStart(4, "0"),
                          c = ("" + (Math.floor(f % 12) + 1)).padStart(2, "0");
                        u.push(new Date(o + "-" + c + "-01T00:00:00Z").getTime());
                      }
                      var m = [];
                      for (f = a.firstSub; f < s; f += a.subScale) {
                        (o = ("" + Math.floor(f / 12)).padStart(4, "0")),
                          (c = ("" + (Math.floor(f % 12) + 1)).padStart(2, "0"));
                        m.push(new Date(o + "-" + c + "-01T00:00:00Z").getTime());
                      }
                      console.log("MonthTicks");
                      return {
                        step: a.step,
                        stepOffset: a.stepOffset,
                        sub: m,
                        main: u,
                        min: t.getTime(),
                        max: i.getTime(),
                        toString: function (e) {
                          //console.log(new +Date(e).toISOString().slice(0, -14)); //こうすると年月日で表示できる
                          return new Date(e).toISOString().slice(0, -14); //new Date(e).getTime() / 1000; //秒で表示にするために1000で割る。
                        },
                      };
                    }
                    return null;
                  }),
                  (exports.getDateTicks = function (e, n, s) {
                    var a = n.getTime() - e.getTime(); //現時刻からデータ時刻の差
                    return a < 1e3
                      ? exports.getMillisecondsTicks(e, n, s)
                      : a < 2 * t
                      ? exports.getSecondsTicks(e, n, s)
                      : a < 2 * i
                      ? exports.getMinuteTicks(e, n, s)
                      : a < 2 * r
                      ? exports.getHourTicks(e, n, s)
                      : a < 30 * r * 2
                      ? exports.getDayTicks(e, n, s)
                      : exports.getMonthTicks(e, n, s);
                  });
              },
              {
                "./getTickScale": "CKjx",
              },
            ],
            //dptcや光度曲線上部の目盛りなどの作成、設定
            Q0eE: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react"),
                  t = require("../../util/getTicks"),
                  i = require("../../types"),
                  n = require("../../util/constants"),
                  r = require("../../util/getDateTicks"),
                  a = require("@maxi-js/date-tools"),
                  dptc = require("./Cursor"),
                  redline = require("../../util/getRollingAverage"),
                  l = function (e, t, i, n, r) {
                    return n || r
                      ? function (a) {
                          if (a && a.parentElement) {
                            var l,
                              o = 0.5 * a.getBoundingClientRect().width;
                            if (n)
                              0 < (l = t - (e - o)) &&
                                a.setAttribute("x", "" + (e + l));
                            if (r)
                              0 < (l = e + o - i) && a.setAttribute("x", "" + (e - l));
                          }
                        }
                      : null;
                  };
                exports.XTicks = e.memo(function (o) {
                  var c = o.min,
                    s = o.max,
                    u = o.left,
                    m = o.right,
                    d = o.top,
                    f = o.bottom,
                    k = o.width,
                    b = o.mjdLabel,
                    h = o.dateLabel,
                    g = o.mjdToString,
                    x = o.dateToString,
                    p = o.lineHeight,
                    T = t.getTicks(c, s, k / 200), //横軸下部のMJDの設定
                    v = r.getDateTicks(a.mjdToDate(c), a.mjdToDate(s), k / 200),//横軸上部のdptcの設定
                    redline_mjd = redline.judgeMJD(dptczero_to_GPStime),
                    result = "";
                  if (!T || !v) return null;
                  var j = k / (s - c),
                    y = function (e) {
                      return u + j * (e - c);
                    },
                    //光度曲線内の目盛り？
                    E = [
                      e.createElement("path", {
                        key: "ticks",
                        d: [
                          v.sub
                            .map(function (e, t) {
                              var i = (t - v.stepOffset) % v.step == 0;
                              return (
                                "M" +
                                y(a.dateToMJD(e)) +
                                "," +
                                d +
                                "v" +
                                (i ? n.mainTickSize : n.subTickSize) //目盛りの長さ
                              );
                            })
                            .join(""),
                          T.sub
                            .map(function (e, t) {
                              var i = (t - T.stepOffset) % T.step == 0;
                              return (
                                "M" +
                                y(e) +
                                "," +
                                f +
                                "v" +
                                -(i ? n.mainTickSize : n.subTickSize)
                              );
                            })
                            .join(""),
                        ].join(""),
                        stroke: i.Color.white,
                      }),
                      //基準となるdptc(赤線)を描画
                      e.createElement("path", {
                        d: [ 
                          "M" +
                          y(redline_mjd) + 
                          ", 1v225"
                        ],
                        stroke: i.Color.red,
                      }),
                      //triggerという文字を表示
                      e.createElement(
                        "text",
                        {
                          x: y(redline_mjd) + 2,
                          y: 10,
                          fontSize: "80%",
                          fill: i.Color.white,
                          opacity: 0.7,
                        },
                        "trigger"
                      ),
                    ];
                  if (h) {
                    var S = v.main.length - 1;
                    v.main.forEach(function (t, n) {
                      var r = y(a.dateToMJD(t));
                      //光度曲線上部の年月日の表示
                      E.push(
                        e.createElement(
                          "text",
                          {
                            key: "dateLabel-" + n,
                            x: r,
                            y: d - 4,
                            fill: i.Color.white,
                            dominantBaseline: "baseline",
                            textAnchor: "middle",
                            ref: l(r, u, m, 0 === n, n === S),
                          },
                          (x || v.toString)(t)
                        )
                      );
                    }),
                      //光度曲線上部のUTCという文字の表示
                      E.push(
                        e.createElement(
                          "text",
                          {
                            key: "dateLabel",
                            x: y(s),
                            y: d - 4 - p,
                            fill: i.Color.white,
                            dominantBaseline: "baseline",
                            textAnchor: "end",
                          },
                          "UTC"
                        )
                      );
                    ////////////////////////////////////////////////////////////////////////////////////
                    //表示されている年月日の中で最頻値の年月日を取得
                    result = num[Math.round(num.length / 2) - 1];
                    //初期化
                    num = [];
                    ////////////////////////////////////////////////////////////////////////////////////
                    E.push(
                      e.createElement(
                        "text",
                        {
                          key: "dateLabel",
                          x: y(c) + 50,
                          y: d - 4 - p,
                          fill: i.Color.white,
                          dominantBaseline: "baseline",
                          textAnchor: "end",
                        },
                        result
                      )
                    );
                  }
                  if (b) {
                    var C = T.main.length - 1;
                    T.main.forEach(function (t, n) {
                      var r = y(t);
                      //光度曲線下部（dptc）の数字を表示。
                      E.push(
                        e.createElement(
                          "text",
                          {
                            key: "mjdLabel-" + n,
                            x: r,
                            y: f + 4,
                            fill: i.Color.white,
                            dominantBaseline: "hanging",
                            textAnchor: "middle",
                            ref: l(r, u, m, 0 === n, n === C),
                          },
                          (g || T.toString)(t)
                        )
                      );
                    });
                    //光度曲線右下にMJDを表示
                    E.push(
                      e.createElement(
                        "text",
                        {
                          key: "mjdLabel",
                          x: y(s),
                          y: f + 4 + p,
                          fill: i.Color.white,
                          dominantBaseline: "hanging",
                          textAnchor: "end",
                        },
                        "dptc"
                      )
                    );
                  }
                  return e.createElement("g", {
                    children: E,
                  });
                });
              },
              {
                react: "SAdv",
                "../../util/getTicks": "+xmN",
                "../../types": "ZHoe",
                "../../util/constants": "39BI",
                "../../util/getDateTicks": "vCs1",
                "./Cursor": "0fuv",
                "@maxi-js/date-tools": "LNvY",
                "../../util/getRollingAverage": "WubQ",
              },
            ],
            //縦の目盛りや横の目盛りをここで合体させてタグに追加
            jY8I: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react"),
                  t = require("../../types"),
                  i = require("../../util/constants"),
                  n = require("./YTicks"),
                  r = require("./XTicks");
                exports.Area = e.memo(function (a) {
                  var o = a.band,
                    l = a.left,
                    s = a.right,
                    c = a.top,
                    m = a.bottom,
                    h = a.width,
                    u = a.height,
                    p = a.lineHeight,
                    k = a.minMJD,
                    y = a.maxMJD,
                    d = a.binSize,
                    f = a.object,
                    x = a.data,
                    T = a.plotType,
                    g = a.isFirst,
                    b = a.isLast,
                    v = t.BandTitles[o],
                    //色を設定
                    E = t.BandColors[o],
                    //L = 0.5 * (c + m),
                    //おそらくこれを呼べば作られるようになっている。
                    M = [
                      //光度曲線の枠組み
                      e.createElement("rect", {
                        key: "frame",
                        x: l,
                        y: c,
                        width: h,
                        height: u,
                        stroke: t.Color.white,
                      }),
                      //光度曲線の目盛り
                      e.createElement(r.XTicks, {
                        key: "xTicks",
                        min: k,
                        max: y,
                        left: l,
                        right: s,
                        top: c,
                        bottom: m,
                        width: h,
                        height: u,
                        mjdLabel: b,
                        dateLabel: g,
                        lineHeight: p,
                      }),
                    ];
                  if (f && x) {
                    var j = h / (y - k),
                      z = function (e) {
                        return l + j * (e - k);
                      },
                      //表示されているバーの高さ
                      C = x.minY[o],
                      q = x.maxY[o],
                      B = u / (q - C),
                      P = function (e) {
                        return m - B * (e - C);
                      },
                      S = function (e) {
                        return l <= e && e <= s;
                      },
                      w = 2 * o + 3,
                      A = w + 1;
                    //plottypeがlineの光度曲線の作成
                    if (
                      (M.push(
                        e.createElement(n.YTicks, {
                          key: "yTicks",
                          min: C,
                          max: q,
                          left: l,
                          right: s,
                          top: c,
                          bottom: m,
                          width: h,
                          height: u,
                        })
                      ),
                      T === t.PlotType.Line)
                    ) {
                      var Y = -1,
                        H = [],
                        D = [],
                        J = function () {
                          0 < H.length &&
                            D.push(
                              [
                                "M" +
                                  H.map(function (e) {
                                    return z(e[0]) + "," + P(e[w] + e[A]);
                                  }).join("L"),
                                "L" +
                                  H.reverse()
                                    .map(function (e) {
                                      return z(e[0]) + "," + P(e[w] - e[A]);
                                    })
                                    .join("L") +
                                  "z",
                                "z",
                              ].join("")
                            ),
                            (H = []);
                        },
                        X = x.bins
                          .map(function (e) {
                            var t = z(e[0]);
                            if (((Y = e[2]), S(t))) {
                              var i = P(e[w]);
                              return Y < e[1]
                                ? (J(), H.push(e), "M" + t + "," + i)
                                : (H.push(e), "L" + t + "," + i);
                            }
                            return "";
                          })
                          .join("");
                      J(),
                        X &&
                          M.push(
                            e.createElement("path", {
                              key: t.PlotType.Line + "-error",
                              id: "can_zoom",
                              d: D.join(""),
                              fill: E,
                              opacity: 0.2,
                            }),
                            e.createElement("path", {
                              key: t.PlotType.Line,
                              id: "can_zoom",
                              d: "M" + X.slice(1),
                              stroke: E,
                            })
                          );
                    } else {
                      var _ = -1;
                      //plottypeがpointの光度曲線の作成場所
                      M.push(
                        e.createElement("path", {
                          key: t.PlotType.Point,
                          id: "can_zoom",
                          d: x.bins
                            //eには色々計算されたデータが入っている。
                            .map(function (e) {
                              if (e[1] < _) return "";
                              _ = e[2];
                              var t = z(e[0]),
                                i = z(e[1]),
                                n = z(e[2]),
                                r = P(e[w]),
                                a = e[A] * B,
                                o = [];
                              if (l < n && i < s) {
                                o.push(
                                  "M" + Math.max(l, i) + "," + r + "H" + Math.min(s, n)
                                ); //sとnで小さいほうの数字が入れられる。
                                if (S(t)) {
                                  o.push("M" + t + "," + (r - a) + "v" + 2 * a);
                                }
                              }
                              return o.join("");
                            })
                            .join(""),
                          stroke: E,
                        })
                      );
                    }
                  }
                  //光度曲線本体をgタグの子要素に入れる。
                  return e.createElement("g", {
                    children: M,
                  });
                });
              },
              {
                react: "SAdv",
                "../../types": "ZHoe",
                "../../util/constants": "39BI",
                "./YTicks": "ebhF",
                "./XTicks": "Q0eE",
              },
            ],
            //光度曲線の細かい設定
            mWuP: [
              function (require, module, exports) {
                "use strict";
                var e =
                  (this && this.__importStar) ||
                  function (e) {
                    if (e && e.__esModule) return e;
                    var t = {};
                    if (null != e)
                      for (var r in e)
                        Object.hasOwnProperty.call(e, r) && (t[r] = e[r]);
                    return (t.default = e), t;
                  };
                exports.__esModule = !0;
                var t = require("react"),
                  r = require("../../types"),
                  i = require("../../util/constants"),
                  a = require("./Area"),
                  n = e(require("../../util/catalog"));
                exports.Body = t.memo(function (e) {
                  //widthがもし0になってもエラーにならないように。発表
                  if (e.svgWidth != 0) {
                    width_error_anti = e.svgWidth;
                  } else if (e.svgWidth == 0) {
                    console.log("widthが0になった");
                  }
                  var o = e.objects,
                    l = e.cache,
                    u = e.minMJD,
                    h = e.maxMJD,
                    c = e.plotType,
                    s = e.binSize,
                    g = e.svgWidth,
                    d = e.areaHeight,
                    p = e.margin,
                    f = g - p.left - p.right,
                    m = [];
                  return (
                    //ここで光度曲線全体の設定をしている。
                    [
                      r.Band.$2_20 /*,
                      r.Band.$2_4,
                      r.Band.$4_10,
                      r.Band.$10_20 (今はとりあえずいらない)*/,
                    ].forEach(function (e, r) {
                      o.forEach(function (_, b) {
                        //vは光度曲線の番号で0から4まである。
                        var v = o.length * r + b,
                          y = p.top + d * (v + 1) + p.gap * v,
                          M = y - d;
                        m.push(
                          t.createElement(a.Area, {
                            key: v,
                            band: e,
                            left: p.left,
                            right: g - p.right,
                            top: M,
                            bottom: y,
                            lineHeight: p.lineHeight,
                            width: f,
                            height: d, //光度曲線枠の高さ
                            minMJD: u,
                            maxMJD: h,
                            binSize: s,
                            object: n.map.get(_),
                            data: l.get(_),
                            plotType: c,
                            isFirst: 0 === v,
                            isLast: v === i.bandCount * o.length - 1,
                          })
                        );
                      });
                    }),
                    t.createElement("g", {
                      children: m,
                    })
                  );
                });
              },
              {
                react: "SAdv",
                "../../types": "ZHoe",
                "../../util/constants": "39BI",
                "./Area": "jY8I",
                "../../util/catalog": "wLbE",
              },
            ],
            //ここも色々な設定
            JLzx: [
              function (require, module, exports) {
                "use strict";
                var e =
                  (this && this.__importDefault) ||
                  function (e) {
                    return e && e.__esModule
                      ? e
                      : {
                          default: e,
                        };
                  };
                exports.__esModule = !0;
                var t = require("react"),
                  n = e(require("./style.css")),
                  i = require("../../util/constants"),
                  r = require("./Cursor"),
                  o = require("./Body");
                (exports.getMargin = function (e) {
                  return e < 470
                    ? {
                        left: 56,
                        right: 0.5,
                        top: 32,
                        bottom: 32,
                        gap: 6,
                        lineHeight: 12,
                      }
                    : e < 658
                    ? {
                        left: 64,
                        right: 0.5,
                        top: 32,
                        bottom: 32,
                        gap: 6,
                        lineHeight: 14,
                      }
                    : {
                        left: 70,
                        right: 0.5,
                        top: 32,
                        bottom: 32,
                        gap: 6,
                        lineHeight: 16,
                      };
                }),
                  (exports.LightCurve = function (e) {
                    exports.h = t.useState(e.preferences.mjdRange);

                    exports.h[0][0] += graph_scale_change[0];
                    exports.h[0][1] -= graph_scale_change[1];

                    var u = t.useRef(null),
                      s = t.useState(0.94 * window.innerWidth),
                      a = s[0],
                      l = s[1],
                      c = exports.getMargin(a),
                      v = t.useState(i.getAreaHeight()),
                      f = v[0],
                      m = v[1],
                      d = a - c.left - c.right,
                      // h = t.useState(e.preferences.mjdRange),
                      g = exports.h[0],
                      p = exports.h[1],
                      E = t.useState(null),
                      L = E[0],
                      b = E[1],
                      M = function (e) {
                        var t = u.current;
                        if (t) {
                          var n = t.getBoundingClientRect(),
                            i = e.clientX - n.left - c.left;
                          if (0 < i && i < d) {
                            var r = e.clientY - n.top;
                            return void b({
                              x: i,
                              y: r,
                            });
                          }
                        }
                        b(null);
                      },
                      w =
                        c.top +
                        (f + c.gap) *
                          i.bandCount /*ここで光度曲線の数分の高さにしている*/ *
                          (e.objects.length || 1) -
                        c.gap +
                        c.bottom,
                      D = g[1] - g[0];
                    return (
                      t.useEffect(
                        function () {
                          var t = setTimeout(function () {
                            return e.setPreferences({
                              Range: g,
                            });
                          }, 800);
                          return function () {
                            return clearTimeout(t);
                          };
                        },
                        [g]
                      ),
                      t.useEffect(function () {
                        var e = null,
                          t = function () {
                            null !== e && clearTimeout(e);
                          },
                          n = function () {
                            t(),
                              (e = setTimeout(function () {
                                var e = u.current,
                                  t = e && e.parentElement;
                                t && (l(t.clientWidth), m(i.getAreaHeight()));
                              }, 400));
                          };
                        return (
                          addEventListener("resize", n),
                          n(),
                          function () {
                            t(), removeEventListener("resize", n);
                          }
                        );
                      }, []),
                      t.useEffect(
                        function () {
                          var e = u.current;
        
                          if (e) {
                            var t = 0,
                              n = 0,
                              i = function (i) {
                                var r = e.getBoundingClientRect(),
                                  o = i.clientX - r.left - c.left,
                                  u = ((D - t + n) * i.deltaY) / d;
                                if (i.ctrlKey) {
                                  var s = o / d;
                                  (t += u * -s),
                                    (n += u * (1 - s)),
                                    p([g[0] + t, g[1] + n]),
                                    i.preventDefault();
                                } else
                                  i.shiftKey &&
                                    ((t += u),
                                    (n += u),
                                    p([g[0] + t, g[1] + n]),
                                    i.preventDefault());
                              },
                              r = function (i) {
                                i.preventDefault();
                                var r = e.getBoundingClientRect().left + c.left,
                                  o = i.clientX - r,
                                  u = i.clientY,
                                  s = o / d,
                                  a = 1 - s,
                                  l = t,
                                  v = n,
                                  f = function (e) {
                                    var i = e.clientX - r,
                                      o = e.clientY - u,
                                      c = Math.pow(1.005, o),
                                      f = i / d,
                                      m = (D - l + v) / c;
                                    (t = l + m * (s * c - f)),
                                      (n = v + m * -(a * c - (1 - f))),
                                      p([g[0] + t, g[1] + n]);
                                  };
                                addEventListener(
                                  "mouseup",
                                  function e() {
                                    removeEventListener("mouseup", e),
                                      removeEventListener("mousemove", f);
                                  },
                                  {
                                    passive: !0,
                                  }
                                ),
                                  addEventListener("mousemove", f, {
                                    passive: !0,
                                  });
                              },
                              o = function i(r) {
                                var o = r.touches.item(0),
                                  u = r.touches.item(1);
                                if (o && u) {
                                  r.preventDefault();
                                  var s = e.getBoundingClientRect().left + c.left,
                                    a = o.clientX - s,
                                    l = u.clientX - s,
                                    v = Math.abs(a - l),
                                    f = (a + l) / 2 / d,
                                    m = 1 - f,
                                    h = t,
                                    E = n,
                                    L = function e(t) {
                                      t.touches.length <= 1 &&
                                        (removeEventListener("touchmove", e),
                                        removeEventListener("touchend", i));
                                    };
                                  addEventListener("touchend", L, {
                                    passive: !0,
                                  }),
                                    addEventListener(
                                      "touchmove",
                                      function (e) {
                                        for (
                                          var i = null, r = null, a = e.touches.length;
                                          a--;
        
                                        ) {
                                          var l = e.touches.item(a);
                                          if (l) {
                                            var c = l.identifier;
                                            c === o.identifier
                                              ? (i = l)
                                              : c === u.identifier && (r = l);
                                          }
                                        }
                                        if (i && r) {
                                          var b = i.clientX - s,
                                            M = r.clientX - s,
                                            w = Math.abs(b - M),
                                            H = (b + M) / 2 / d,
                                            x = w / v,
                                            y = (D - h + E) / x;
                                          (t = h + y * (f * x - H)),
                                            (n = E + y * -(m * x - (1 - H))),
                                            p([g[0] + t, g[1] + n]);
                                        } else L(e);
                                      },
                                      {
                                        passive: !0,
                                      }
                                    );
                                }
                              };
                            return (
                              e.addEventListener("wheel", i),
                              e.addEventListener("mousedown", r),
                              e.addEventListener("touchstart", o),
                              e.addEventListener("mousemove", M, {
                                passive: !0,
                              }),
                              e.addEventListener("mouseleave", M, {
                                passive: !0,
                              }),
                              function () {
                                e.removeEventListener("wheel", i),
                                  e.removeEventListener("mousedown", r),
                                  e.removeEventListener("touchstart", o),
                                  e.removeEventListener("mousemove", M),
                                  e.removeEventListener("mouseleave", M);
                              }
                            );
                          }
                        },
                        [u.current, d]
                      ),
                      //svgの設定
                      t.createElement(
                        "svg",
                        {
                          id: "can_zoom",
                          width: a,
                          height: w + 10,
                          className: n.default.svg,
                          ref: u,
                          viewBox: "0 0 " + a + " " + w,
                          fontSize: "1rem",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          fill: "none",
                        },
                        //縦線の設定
                        t.createElement(r.Cursor, {
                          cursor: L,
                          svgHeight: w,
                          left: c.left,
                          areaWidth: d,
                          minMJD: g[0],
                          maxMJD: g[1],
                          lineHeight: c.lineHeight,
                        }),
        
                        //光度曲線の設定
                        t.createElement(o.Body, {
                          objects: e.objects,
                          cache: e.cache,
                          minMJD: g[0],
                          maxMJD: g[1],
                          plotType: e.preferences.plotType,
                          binSize: e.preferences.binSize,
                          svgWidth: a,
                          areaHeight: f,
                          margin: c,
                        })
                      )
                    );
                  });
              },
              {
                react: "SAdv",
                "./style.css": "QM4m",
                "../../util/constants": "39BI",
                "./Cursor": "0fuv",
                "./Body": "mWuP",
              },
            ],
            z0la: [
              function (require, module, exports) {
                "use strict";
                (exports.__esModule = !0),
                  (exports.normalizeSearchText = function (e) {
                    return e.replace(/\s+/, "").toLowerCase();
                  });
              },
              {},
            ],
            "7SfU": [
              function (require, module, exports) {
                module.exports = {
                  radioLabel: "_radioLabel_08df7",
                  showAllButtonWrap: "_showAllButtonWrap_08df7",
                  showAllButton: "_showAllButton_08df7",
                };
              },
              {},
            ],
            //エラー時Errorsの表示
            hK5F: [
              function (require, module, exports) {
                "use strict";
                exports.__esModule = !0;
                var e = require("react");
                exports.Errors = e.memo(function (r) {
                  var t = r.errors;
                  return 0 < t.length
                    ? e.createElement(
                        e.Fragment,
                        null,
                        e.createElement("h1", null, "Errors"),
                        e.createElement.apply(
                          void 0,
                          ["ol", null].concat(
                            t.map(function (r) {
                              return e.createElement(
                                "li",
                                null,
                                r.message,
                                e.createElement("pre", null, r.stack)
                              );
                            })
                          )
                        )
                      )
                    : null;
                });
              },
              {
                react: "SAdv",
              },
            ],
            //ページタイトルのcreateElementの設定など
            "2oAZ": [
              function (require, module, exports) {
                "use strict";
                var e =
                    (this && this.__importStar) ||
                    function (e) {
                      if (e && e.__esModule) return e;
                      var t = {};
                      if (null != e)
                        for (var n in e)
                          Object.hasOwnProperty.call(e, n) && (t[n] = e[n]);
                      return (t.default = e), t;
                    },
                  t =
                    (this && this.__importDefault) ||
                    function (e) {
                      return e && e.__esModule
                        ? e
                        : {
                            default: e,
                          };
                    };
                exports.__esModule = !0;
                var n = require("react"),
                  r = require("../../types"),
                  l = require("../../util/getData"),
                  a = require("../../util/getRollingAverage"),
                  i = require("../../util/useCache"),
                  c = require("../../util/getDefaultPreferences"),
                  o = require("../../util/constants"),
                  s = require("../LightCurve/index"),
                  m = require("../../util/normalizeSearchText"),
                  h = e(require("../../util/catalog")),
                  p = t(require("./style.css")),
                  g = require("../Errors");
                (exports.getInitialSelectedObjects = function () {
                  var e = location.pathname.match(/^\/objects\/([^\/]+)$/),
                    t = [];
        
                  return (
                    e &&
                      (t = e[1].split(/\s*,\s*/).filter(function (e) {
                        return h.map.has(e);
                      })),
                    0 === t.length && t.push(h.firstObjectId),
                    t
                  );
                }),
                  (exports.App = function () {
                    var e = n.useReducer(function (e, t) {
                        return e.concat(t);
                      }, []),
                      t = e[0],
                      E = e[1],
                      //サイトのURLに表示する項目(binsizeとplottype以外はとりあえずいらない)
                      b = n.useReducer(function (e, t) {
                        return {
                          binSize: c.filterBinSize(t.binSize || e.binSize),
                          //mjdRange: c.filterMJDRange(t.mjdRange || e.mjdRange),
                          plotType: c.filterPlotType(t.plotType || e.plotType),
                          //font: c.filterFont(t.font || e.font),
                        };
                      }, c.getDefaultPreferences(new URLSearchParams(location.search))),
                      //b[0]にplottypeの情報が入っている。
                      y = b[0],
                      v = b[1],
                      //サイトのURLに表示する項目(binsizeとplottype以外はとりあえずいらない)
                      S = n.useReducer(function (e, t) {
                        return {
                          binSize: t.binSize || e.binSize,
                          //mjdRange: t.mjdRange || e.mjdRange, //データのMJDと現時刻のMJD
                          plotType: t.plotType || e.plotType,
                          //font: t.font || e.font,
                        };
                      }, c.getDefaultPreferences(new URLSearchParams(location.search))),
                      R = S[0],
                      T = S[1],
                      j = n.useState(!1),
                      L = j[0],
                      z = j[1],
                      P = n.useState(""),
                      C = P[0],
                      q = P[1],
                      w = n.useState(exports.getInitialSelectedObjects()),
                      F = w[0],
                      U = w[1],
                      //サイトのURL名作成
                      x = n.useReducer(function (e, t) {
                        return new URL("?" + t, e.protocol + "//" + e.host);
                      }, new URL(location.href)),
                      A = x[0],
                      k = x[1],
                      _ = i.useCache({
                        keys: F,
                        getter: l.getLightCurveData,
                        onError: E,
                      }),
                      O = i.useCache({
                        keys: F,
                        getter: function (e) {
                          var t = dict_LCdata; /*_.get(e)とりあえず今は直接入れる。*/
                          //console.log(t ? a.getRollingAverage(t, y.binSize) : null);
        
                          return t ? a.getRollingAverage(t, y.binSize) : null;
                        },
                        onError: E,
                        dependencies: [y.binSize, _],
                      });
        
                    //plottypeを変更を実行する部分
                    n.useEffect(
                      function () {
                        var e = setTimeout(function () {
                          return v(R);
                        }, 300);
                        return function () {
                          return clearTimeout(e);
                        };
                      },
                      [R]
                    ),
                      //サイトのURLに実際にセットする箇所(binsizeとplottype以外はとりあえずいらない)
                      n.useEffect(
                        function () {
                          var e = new URLSearchParams();
                          // e.set(
                          //   o.URLParameterKey.mjdRange,
                          //   y.mjdRange
                          //     .map(function (e) {
                          //       return e.toFixed(0);
                          //     })
                          //     .join("-")
                          // ),
                          e.set(o.URLParameterKey.binSize, "" + y.binSize),
                            e.set(o.URLParameterKey.plotType, "" + y.plotType),
                            //e.set(o.URLParameterKey.font, "" + y.font);
                            k(e);
                        },
                        [F, y]
                      ),
                      n.useEffect(
                        function () {
                          return history.replaceState(null, "", "" + A);
                        },
                        [A]
                      );
                    //Kに光度曲線のReact要素を作成する。
                    var K = n.createElement(s.LightCurve, {
                      preferences: y,
                      objects: 0 < F.length ? F : [""],
                      cache: O,
                      setPreferences: v,
                    });
                    return L
                      ? n.createElement(n.Fragment, null, K)
                      : n.createElement(
                          n.Fragment,
                          null,
                          n.createElement(
                            "header",
                            null,
                            n.createElement(
                              "h1",
                              null /*{className: 'Title'}*/,
                              o.pageTitle
                            )
                          ),
                          n.createElement(
                            "article",
                            null,
                            //光度曲線のPlot typeやBin sizeを設定する場所
                            n.createElement(
                              "ul",
                              null,
                              n.createElement(
                                "li",
                                null,
                                n.createElement(
                                  "label",
                                  {
                                    htmlFor: o.URLParameterKey.binSize,
                                    style: {color: "white"},
                                  },
                                  "Bin size: "),
                                n.createElement("input", {
                                  id: o.URLParameterKey.binSize,
                                  type: "number",
                                  min: 1, //min: 0.00001, //下限の値
                                  max: 100, //max: 0.001, //上限の値
                                  defaultValue: c.default_binsize,
                                  onChange: function (e) {
                                    T({
                                      binSize: c.filterBinSize(
                                        e.currentTarget.value * (1 / 86400)
                                      ), //ここでbinsizeの変更をグラフに反映している？
                                    });
                                  },
                                }),
                                //sの設定
                                n.createElement(
                                  "label", 
                                  {
                                    style: {color: "white"}
                                  },
                                  "s"),
                              ),
                              n.createElement.apply(
                                void 0,
                                [
                                  "li",
                                  null,
                                  n.createElement("label", 
                                  {
                                    style: {color: "white"}
                                  }, 
                                  "Plot type: "),
                                ].concat(
                                  o.AvailablePlotTypes.map(function (e) {
                                    return n.createElement(
                                      "label",
                                      {
                                        className: p.default.radioLabel,
                                        style: {color: "white"},
                                      },
                                      n.createElement("input", {
                                        type: "radio",
                                        name: o.URLParameterKey.plotType,
                                        value: e,
                                        defaultChecked: y.plotType === e,
                                        onChange: function (e) {
                                          T({
                                            plotType: c.filterPlotType(
                                              e.currentTarget.value
                                            ),
                                          });
                                        },
                                      }),
                                      o.AvailablePlotTypeTitles[e]
                                    );
                                  }),
                                  ["."]
                                )
                              )
                              ,
                              // エネルギーバンドを選択するためのラジオボタン
                              ///////////////////////////
                              n.createElement.apply(
                                void 0,
                                [
                                  "li",
                                  null,
                                  n.createElement("label", 
                                  {
                                    style: {color: "white"}
                                  }, 
                                  "Energy band: "),
                                ].concat(
                                  o.AvailableEnergyBands.map(function (e) {
                                    return n.createElement(
                                      "label",
                                      {
                                        className: "EnergyBand_name",
                                        style: {color: "white"},
                                      },
                                      n.createElement("input", {
                                        type: "radio",
                                        name: "EnergyBandChice", //設定必要？
                                        value: e,
                                        defaultChecked: selectedEnergyBand === e, //要改善
                                        onChange: function (e) {
                                          ////////////// 選択肢ごとの処理 //////////////
                                          // console.log('選択前の格納データ = ' + pre_LCdata)
                                          console.log('選択されたエネルギーバンド = ' + e.currentTarget.value);
                                          selectedEnergyBand = e.currentTarget.value;
                                          switch (selectedEnergyBand) {
                                            case "All":
                                              pre_LCdata = all_LCdata;
                                            case "High":
                                              pre_LCdata = high_LCdata;
                                              break;
                                            case "Med":
                                              pre_LCdata = med_LCdata;
                                              break;
                                            case "Low":
                                              pre_LCdata = low_LCdata;
                                              break;
                                            default:
                                              // デフォルトの処理
                                              break;
                                          }
                                          // console.log('格納データ = ' + pre_LCdata)

                                          // 光度曲線を消去
                                          var divs = document.getElementsByTagName('div');
                                          for(var i = 0; i < divs.length; i++){
                                            divs[i].innerHTML = '';
                                          };
                                          // console.log('光度曲線を消去しました。');

                                          // 光度曲線を再描画
                                          createLC(pre_LCdata);
                                          /////////////////////////////////////////////
                                        },
                                      }),
                                      o.AvailableEnergyBandTitles[e],
                                      // console.log(o.AvailableEnergyBandTitles[e])
                                    );
                                  }),
                                  ["."]
                                )
                              )
                             /////////////////////////////////////////////
                            ),
                            //光度曲線全体をfigureタグの中に入れている
                            n.createElement("figure", null, K)
                          )
                        );
                  });
              },
              {
                react: "SAdv",
                "../../types": "ZHoe",
                "../../util/getData": "7AM+",
                "../../util/getRollingAverage": "WubQ",
                "../../util/useCache": "/cZZ",
                "../../util/getDefaultPreferences": "g9pg",
                "../../util/constants": "39BI",
                "../LightCurve/index": "JLzx",
                "../../util/normalizeSearchText": "z0la",
                "../../util/catalog": "wLbE",
                "./style.css": "7SfU",
                "../Errors": "hK5F",
              },
            ],
        
            "TC+f": [
              function (require, module, exports) {
                module.exports = {};
              },
              {},
            ],
            vqK8: [
              function (require, module, exports) {
                "use strict";
                var e =
                  (this && this.__importStar) ||
                  function (e) {
                    if (e && e.__esModule) return e;
                    var t = {};
                    if (null != e)
                      for (var r in e)
                        Object.hasOwnProperty.call(e, r) && (t[r] = e[r]);
                    return (t.default = e), t;
                  };
                exports.__esModule = !0;
                var t = require("react"),
                  r = e(require("react-dom")),
                  n = require("./components/App");
                require("./style.css");
                var s = document.createElement("div");
                document.body.appendChild(s),
                  r.render(t.createElement(n.App), s),
                  [
                    "https://cdn.maxi.wemo.me/fonts/Serif/cmun-serif.css",
                    "https://cdn.maxi.wemo.me/fonts/Sans/cmun-sans.css",
                    "https://cdn.maxi.wemo.me/fonts/Typewriter/cmun-typewriter-light.css",
                  ].forEach(function (e) {
                    var t = document.createElement("link");
                    (t.rel = "stylesheet"), (t.href = e), document.head.appendChild(t);
                  });
                  document.body.setAttribute("id", "body");
              },
              {
                react: "SAdv",
                "react-dom": "CSY6",
                "./components/App": "2oAZ",
                "./style.css": "TC+f",
              },
            ],
          },
          {},
          ["vqK8"],
          null
        );
        }      
      })
      .fail(() => {
        console.log("failed");
      });
}


