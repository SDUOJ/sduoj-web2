(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[48],{1074:function(e,t,n){"use strict";var a=n(41),c=n(0),i=n(76),r=n(421),o=n(127),l=n(99),s=n(6);t.a=Object(i.b)((function(e){return{isLogin:e.UserReducer.isLogin}}),(function(e){return{setUserInfo:function(t){return e(t)},userLogin:function(t){return e(t)}}}))(Object(r.a)()(Object(a.e)((function(e){return Object(c.useEffect)((function(){!1===e.isLogin&&o.a.getProfile().then((function(t){e.setUserInfo({type:"setUserInfo",data:t}),e.userLogin({type:"userLogin"})})).catch((function(){e.history.replace(l.g+"/login?to="+e.location.pathname)}))}),[e.isLogin]),Object(s.jsx)(s.Fragment,{})}))))},1109:function(e,t,n){"use strict";n.d(t,"a",(function(){return c})),n.d(t,"c",(function(){return i})),n.d(t,"d",(function(){return r})),n.d(t,"b",(function(){return o}));var a=n(127);function c(){return function(e,t){a.a.getProfile().then((function(t){e({type:"setUserInfo",data:t}),e({type:"userLogin"})})).catch((function(t){e({type:"userLogout"}),e({type:"clearRedux"})}))}}function i(e){return function(t,n){a.a.login(e).then((function(e){a.a.getProfile().then((function(e){t({type:"userLogin"}),t({type:"setUserInfo",data:e})}))}))}}function r(){return function(e,t){a.a.logout().then((function(t){e({type:"userLogout"}),e({type:"clearRedux"})}))}}function o(){return function(e,t){a.a.getProfile().then((function(t){null!==t&&e({type:"setUserInfo",data:t})}))}}},1237:function(e,t,n){"use strict";var a=n(1446),c=n(1062),i=n.n(c),r=(n(0),n(1256)),o=n(6);t.a=function(e){return void 0!==e.email&&null!==e.email?Object(o.jsx)(r.a,{shape:e.shape,src:"https://cravatar.cn/avatar/"+i()(e.email)+("number"===typeof e.size?"?s="+e.size:"")+("number"===typeof e.size?"&d=identicon":"?d=identicon"),alt:"\u5934\u50cf",size:e.size}):Object(o.jsx)(r.a,{icon:Object(o.jsx)(a.a,{})})}},1263:function(e,t,n){"use strict";t.a=n.p+"static/media/logo.871e1201.png"},1288:function(e,t,n){"use strict";var a=n(137),c=n(138),i=n(313),r=n(141),o=n(140),l=n(0),s=n(174),u=n(974),h=n(275),d=n(271),j=n(76),b=n(128),p=n.n(b),f=(n(1292),n(207)),g=n(6),m=s.a.Option,O=function(e){Object(r.a)(n,e);var t=Object(o.a)(n);function n(e){var c;return Object(a.a)(this,n),(c=t.call(this,e)).defLang=Object(f.a)(),h.a.languages.map((function(e){0!==d.a.filter((function(t){return t.id===e})).length&&0===c.defLang.length&&(c.defLang=e)})),c.changeLang=c.changeLang.bind(Object(i.a)(c)),c.changeLang(c.defLang),c}return Object(c.a)(n,[{key:"changeLang",value:function(e){h.a.changeLanguage(e);var t=d.a.findIndex((function(t){return t.id===e}));this.props.ChangeLanguage(d.b[e],d.a[t].code),p.a.locale(d.a[t].time),localStorage.setItem("language",d.a[t].code)}},{key:"render",value:function(){return Object(g.jsx)(g.Fragment,{children:Object(g.jsxs)(u.b,{children:[Object(g.jsx)("img",{src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAlBJREFUWEfFlo0xBEEQhd9FgAgQASJABIgAESACRIAIEAEiQAROBIgAEVDf1vTpmp2/rVO1XaVOzU/369eve3aikW0ycnwNAbAo6UjSraT3/wI+BMCTpE1JX5KWxgDw44IOAV7Eao52A72lw1tuEzZKRpluWlgyANC60HJhwJnVFq0YAKvvAP/Fo6+S1luc+Vp6ilvucuYsCJP/ryTdh4vTINaqn3nERFu+SeIXa6I8RlQCgDCvQx23ExkdhH18Pkji/GArAYDOneDxPNDtAzCMlsPCnqN/EIgaA3fBG10CxfxiPvsPSSuJqKwB8LmEqKYB3x0wQqaYz/4w0fMEfwn6SLE3w1QDQCvhyAwArJ2GhVz2l26wARb2klYDwCVazQJSAlM9e4gzNRXjwZZiqQPUAoBz9PValAJ9f5xIy+vDtgEJ2J61AqCm9LxZLErvODdVk3OiFQAPy34EnzWo9eY18x1a0+4lGWsBkApuQdk7ce3pzxIQMRpzSdZKABDbReh5C0hLoWompJlNwdxo9iXpiTEHAGeP0YvGG4/AMC80Bg0PWW40+3XEvOFrlgJgb4Bvt1QbEZQ/BhSOS6PZ7wGA853FAPwAYR8h0Wq1rxuAwJhZPBsQpyXkmewB8PXiowL6Zmh7Tfy3UBJq6hoftd27EjNAJkw+gPDbYmT22XLQnaFzYLt5Epb8+1GNIHPAGWbWPbP3oWUO1JLzAsu9DeajJ9R5AXjx5V5GnwCCZrZg3TM9LwAcoRdUjmDtozTHGnrhPOUA/PQ/ANRKVNwfHcAv9/p/IZj3OnUAAAAASUVORK5CYII=",alt:"lang",width:20}),Object(g.jsx)(s.a,{onChange:this.changeLang,defaultValue:this.defLang,bordered:!1,style:{marginLeft:-15},children:d.a.map((function(e,t){return Object(g.jsx)(m,{value:e.id,children:e.name},t.toString())}))})]})})}}]),n}(l.Component);t.a=Object(j.b)((function(e){return{lang:e.ConfigReducer.lang}}),(function(e){return{ChangeLanguage:function(t,n){return e({type:"updateLanguage",lang:t,langCode:n})}}}))(O)},988:function(e,t,n){"use strict";n.r(t);var a=n(137),c=n(138),i=n(141),r=n(140),o=n(0),l=n(1390),s=n(1263),u=n(251),h=n(88),d=n(199),j=n(249),b=n(41),p=n(421),f=n(1446),g=n(1),m={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-40 824H232V687h97.9c11.6 32.8 32 62.3 59.1 84.7 34.5 28.5 78.2 44.3 123 44.3s88.5-15.7 123-44.3c27.1-22.4 47.5-51.9 59.1-84.7H792v-63H643.6l-5.2 24.7C626.4 708.5 573.2 752 512 752s-114.4-43.5-126.5-103.3l-5.2-24.7H232V136h560v752zM320 341h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 160h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"}}]},name:"container",theme:"outlined"},O=n(14),v=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:m}))};v.displayName="ContainerOutlined";var x=o.forwardRef(v),A={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M956.9 845.1L896.4 632V168c0-17.7-14.3-32-32-32h-704c-17.7 0-32 14.3-32 32v464L67.9 845.1C60.4 866 75.8 888 98 888h828.8c22.2 0 37.6-22 30.1-42.9zM200.4 208h624v395h-624V208zm228.3 608l8.1-37h150.3l8.1 37H428.7zm224 0l-19.1-86.7c-.8-3.7-4.1-6.3-7.8-6.3H398.2c-3.8 0-7 2.6-7.8 6.3L371.3 816H151l42.3-149h638.2l42.3 149H652.7z"}}]},name:"laptop",theme:"outlined"},y=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:A}))};y.displayName="LaptopOutlined";var z=o.forwardRef(y),L=n(247),w={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M916 210H376c-17.7 0-32 14.3-32 32v236H108c-17.7 0-32 14.3-32 32v272c0 17.7 14.3 32 32 32h540c17.7 0 32-14.3 32-32V546h236c17.7 0 32-14.3 32-32V242c0-17.7-14.3-32-32-32zm-504 68h200v200H412V278zm-68 468H144V546h200v200zm268 0H412V546h200v200zm268-268H680V278h200v200z"}}]},name:"build",theme:"outlined"},H=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:w}))};H.displayName="BuildOutlined";var V=o.forwardRef(H),C={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M856 376H648V168c0-8.8-7.2-16-16-16H168c-8.8 0-16 7.2-16 16v464c0 8.8 7.2 16 16 16h208v208c0 8.8 7.2 16 16 16h464c8.8 0 16-7.2 16-16V392c0-8.8-7.2-16-16-16zm-480 16v188H220V220h360v156H392c-8.8 0-16 7.2-16 16zm204 52v136H444V444h136zm224 360H444V648h188c8.8 0 16-7.2 16-16V444h156v360z"}}]},name:"block",theme:"outlined"},E=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:C}))};E.displayName="BlockOutlined";var P=o.forwardRef(E),R=n(420),B={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M839.2 278.1a32 32 0 00-30.4-22.1H736V144c0-17.7-14.3-32-32-32H320c-17.7 0-32 14.3-32 32v112h-72.8a31.9 31.9 0 00-30.4 22.1L112 502v378c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V502l-72.8-223.9zM360 184h304v72H360v-72zm480 656H184V513.4L244.3 328h535.4L840 513.4V840zM652 572H544V464c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v108H372c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h108v108c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V636h108c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8z"}}]},name:"medicine-box",theme:"outlined"},I=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:B}))};I.displayName="MedicineBoxOutlined";var S=o.forwardRef(I),k={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M676 565c-50.8 0-92 41.2-92 92s41.2 92 92 92 92-41.2 92-92-41.2-92-92-92zm0 126c-18.8 0-34-15.2-34-34s15.2-34 34-34 34 15.2 34 34-15.2 34-34 34zm204-523H668c0-30.9-25.1-56-56-56h-80c-30.9 0-56 25.1-56 56H264c-17.7 0-32 14.3-32 32v200h-88c-17.7 0-32 14.3-32 32v448c0 17.7 14.3 32 32 32h336c17.7 0 32-14.3 32-32v-16h368c17.7 0 32-14.3 32-32V200c0-17.7-14.3-32-32-32zm-412 64h72v-56h64v56h72v48H468v-48zm-20 616H176V616h272v232zm0-296H176v-88h272v88zm392 240H512V432c0-17.7-14.3-32-32-32H304V240h100v104h336V240h100v552zM704 408v96c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-96c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8zM592 512h48c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8z"}}]},name:"reconciliation",theme:"outlined"},M=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:k}))};M.displayName="ReconciliationOutlined";var N=o.forwardRef(M),J={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M892 772h-80v-80c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v80h-80c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h80v80c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-80h80c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM373.5 498.4c-.9-8.7-1.4-17.5-1.4-26.4 0-15.9 1.5-31.4 4.3-46.5.7-3.6-1.2-7.3-4.5-8.8-13.6-6.1-26.1-14.5-36.9-25.1a127.54 127.54 0 01-38.7-95.4c.9-32.1 13.8-62.6 36.3-85.6 24.7-25.3 57.9-39.1 93.2-38.7 31.9.3 62.7 12.6 86 34.4 7.9 7.4 14.7 15.6 20.4 24.4 2 3.1 5.9 4.4 9.3 3.2 17.6-6.1 36.2-10.4 55.3-12.4 5.6-.6 8.8-6.6 6.3-11.6-32.5-64.3-98.9-108.7-175.7-109.9-110.8-1.7-203.2 89.2-203.2 200 0 62.8 28.9 118.8 74.2 155.5-31.8 14.7-61.1 35-86.5 60.4-54.8 54.7-85.8 126.9-87.8 204a8 8 0 008 8.2h56.1c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5 29.4-29.4 65.4-49.8 104.7-59.7 3.8-1.1 6.4-4.8 5.9-8.8zM824 472c0-109.4-87.9-198.3-196.9-200C516.3 270.3 424 361.2 424 472c0 62.8 29 118.8 74.2 155.5a300.95 300.95 0 00-86.4 60.4C357 742.6 326 814.8 324 891.8a8 8 0 008 8.2h56c4.3 0 7.9-3.4 8-7.7 1.9-58 25.4-112.3 66.7-153.5C505.8 695.7 563 672 624 672c110.4 0 200-89.5 200-200zm-109.5 90.5C690.3 586.7 658.2 600 624 600s-66.3-13.3-90.5-37.5a127.26 127.26 0 01-37.5-91.8c.3-32.8 13.4-64.5 36.3-88 24-24.6 56.1-38.3 90.4-38.7 33.9-.3 66.8 12.9 91 36.6 24.8 24.3 38.4 56.8 38.4 91.4-.1 34.2-13.4 66.3-37.6 90.5z"}}]},name:"usergroup-add",theme:"outlined"},U=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:J}))};U.displayName="UsergroupAddOutlined";var Q=o.forwardRef(U),D={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M880 112c-3.8 0-7.7.7-11.6 2.3L292 345.9H128c-8.8 0-16 7.4-16 16.6v299c0 9.2 7.2 16.6 16 16.6h101.7c-3.7 11.6-5.7 23.9-5.7 36.4 0 65.9 53.8 119.5 120 119.5 55.4 0 102.1-37.6 115.9-88.4l408.6 164.2c3.9 1.5 7.8 2.3 11.6 2.3 16.9 0 32-14.2 32-33.2V145.2C912 126.2 897 112 880 112zM344 762.3c-26.5 0-48-21.4-48-47.8 0-11.2 3.9-21.9 11-30.4l84.9 34.1c-2 24.6-22.7 44.1-47.9 44.1zm496 58.4L318.8 611.3l-12.9-5.2H184V417.9h121.9l12.9-5.2L840 203.3v617.4z"}}]},name:"notification",theme:"outlined"},F=function(e,t){return o.createElement(O.a,Object(g.a)(Object(g.a)({},e),{},{ref:t,icon:D}))};F.displayName="NotificationOutlined";var T=o.forwardRef(F),W=n(99),_=n(6),G=[{id:0,path:W.g+"/manage/user",title_i18n:"user",exact:!1,icon:Object(_.jsx)(f.a,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(2),n.e(4),n.e(36)]).then(n.bind(null,1444))}))},{id:11,path:W.g+"/manage/problem/program",exact:!0,title_i18n:"\u9898\u76ee",icon:Object(_.jsx)(x,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(2),n.e(6),n.e(30)]).then(n.bind(null,1439))}))},{id:21,path:W.g+"/manage/contest",exact:!0,title_i18n:"contest",icon:Object(_.jsx)(z,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(2),n.e(4),n.e(25)]).then(n.bind(null,1442))}))},{id:3,path:W.g+"/manage/template",title_i18n:"template",exact:!1,icon:Object(_.jsx)(L.a,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(6),n.e(8),n.e(9)]).then(n.bind(null,1436))})),children:[{id:31,path:W.g+"/manage/template/io",exact:!0,title_i18n:"ioTemplate",icon:Object(_.jsx)(V,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(6),n.e(8),n.e(9)]).then(n.bind(null,1436))}))},{id:32,path:W.g+"/manage/template/advanced",exact:!0,title_i18n:"advancedTemplate",icon:Object(_.jsx)(P,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(6),n.e(8),n.e(9)]).then(n.bind(null,1436))}))}]},{id:9,path:W.g+"/manage/problemSet",title_i18n:"problemSetMod",exact:!1,icon:Object(_.jsx)(R.a,{}),children:[{id:91,path:W.g+"/manage/problemSet/problem_group",exact:!0,title_i18n:"problemGroup",icon:Object(_.jsx)(S,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(2),n.e(4),n.e(26)]).then(n.bind(null,1440))}))},{id:92,path:W.g+"/manage/problemSet/problem_set",exact:!0,title_i18n:"problemSet",icon:Object(_.jsx)(N,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(4),n.e(7),n.e(27)]).then(n.bind(null,1441))}))}]},{id:4,path:W.g+"/manage/group",title_i18n:"group",exact:!1,icon:Object(_.jsx)(Q,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(6),n.e(18),n.e(43)]).then(n.bind(null,1443))}))},{id:7,path:W.g+"/manage/announcement",title_i18n:"Announcement",exact:!0,icon:Object(_.jsx)(T,{}),component:Object(o.lazy)((function(){return Promise.all([n.e(0),n.e(1),n.e(6),n.e(18),n.e(42)]).then(n.bind(null,1445))}))}],Y=Object(p.a)()(Object(b.e)((function(e){var t=Object(o.useState)([]),n=Object(h.a)(t,2),a=n[0],c=n[1];Object(o.useEffect)((function(){var t=[];!function n(a){for(var c=0;c<a.length;c++)null!==RegExp(a[c].path).exec(e.location.pathname)&&(t.push(a[c].id.toString()),void 0!==a[c].children&&n(a[c].children))}(G),c(t)}),[e.location.pathname]);return Object(_.jsx)(_.Fragment,{children:Object(_.jsx)("div",{children:Object(_.jsx)(d.a,{selectedKeys:a,openKeys:a,onOpenChange:function(e){c([].concat(Object(u.a)(a),Object(u.a)(e)))},mode:"inline",theme:"dark",children:function t(n){return n.map((function(n,a){return void 0===n.children?Object(_.jsx)(d.a.Item,{icon:n.icon,children:Object(_.jsx)(j.b,{to:n.path,children:e.t(n.title_i18n)})},n.id):Object(_.jsx)(d.a.SubMenu,{title:e.t(n.title_i18n),icon:n.icon,children:t(n.children)},n.id)}))}(G)})})})}))),Z=n(975),K=n(62),X=n(974),q=n(1133),$=n(129),ee=n(1237),te=function(e){Object(i.a)(n,e);var t=Object(r.a)(n);function n(){return Object(a.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"render",value:function(){var e=this;return Object(_.jsx)(_.Fragment,{children:Object(_.jsx)(Z.a,{content:this.props.t("backToOJ"),children:Object(_.jsx)(K.a,{type:"text",size:"large",children:Object(_.jsx)("div",{onClick:function(){e.props.history.push(W.g+"")},children:Object(_.jsxs)(X.b,{children:[Object(_.jsxs)("div",{style:{marginTop:-10},children:[null!==this.props.email&&Object(_.jsxs)(_.Fragment,{children:[Object(_.jsx)(ee.a,{email:this.props.email}),Object(_.jsx)(q.a,{type:"vertical"})]}),this.props.username]}),Object(_.jsx)($.a,{style:{fontSize:10,marginBottom:20}})]})})})})})}}]),n}(o.Component),ne=Object(p.a)()(Object(b.e)(te)),ae=n(1288),ce=n(1109),ie=n(76),re=l.a.Header,oe=function(e){Object(i.a)(n,e);var t=Object(r.a)(n);function n(){return Object(a.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"render",value:function(){var e=this;return Object(_.jsx)(re,{className:"site-layout-sub-header-background",style:{minWidth:550,position:"fixed",zIndex:1,width:"100%"},children:Object(_.jsx)("div",{style:{float:"right"},children:Object(_.jsxs)("div",{style:{position:"relative",right:"200px"},children:[Object(_.jsx)(K.a,{type:"text",onClick:function(){e.props.history.replace("/manage"),window.location.reload()},children:"\u8fd4\u56de\u8001\u7248"}),Object(_.jsx)(ae.a,{}),this.props.isLogin&&Object(_.jsx)(ne,{email:this.props.email,username:this.props.username})]})})})}}]),n}(o.Component),le=Object(ie.b)((function(e){var t,n,a=e.UserReducer;return{isLogin:a.isLogin,email:null===(t=a.userInfo)||void 0===t?void 0:t.email,username:null===(n=a.userInfo)||void 0===n?void 0:n.username}}),(function(e){return{testLogin:function(){return e(Object(ce.a)())}}}))(Object(p.a)()(Object(b.e)(oe))),se=n(330),ue=n(1074),he=l.a.Sider,de=l.a.Content,je=function(e){Object(i.a)(n,e);var t=Object(r.a)(n);function n(){return Object(a.a)(this,n),t.apply(this,arguments)}return Object(c.a)(n,[{key:"componentDidMount",value:function(){this.props.location.pathname!==W.g+"/manage"&&this.props.location.pathname!==W.g+"/manage/"||0===G.length||this.props.history.push(G[0].path)}},{key:"render",value:function(){return Object(_.jsxs)(_.Fragment,{children:[Object(_.jsx)(ue.a,{}),Object(_.jsxs)(l.a,{style:{height:"max-content",minHeight:"100%"},children:[Object(_.jsxs)(he,{theme:"dark",style:{position:"fixed",zIndex:50,height:"100vh",overflow:"auto"},children:[Object(_.jsx)("div",{className:"logo",children:Object(_.jsx)("img",{src:s.a,style:{width:"125px",height:"30px"},alt:"SDUOJ-logo"})}),Object(_.jsx)(Y,{id:1,roles:["superadmin"]})]}),Object(_.jsxs)(l.a,{style:{minWidth:1200,marginLeft:200},children:[Object(_.jsx)(le,{}),Object(_.jsx)(de,{style:{backgroundColor:"#ffffff",paddingTop:64,margin:"20px 16px 0",display:"table",height:"auto"},children:Object(_.jsx)("div",{className:"site-layout-background",style:{padding:24},children:Object(_.jsx)(o.Suspense,{fallback:Object(_.jsx)(se.a,{}),children:function e(t){return t.map((function(t){return void 0!==t.children?e(t.children):Object(_.jsx)(b.a,{path:t.path,exact:t.exact,component:t.component},t.id)}))}(G)})})})]})]})]})}}]),n}(o.Component);t.default=Object(p.a)()(Object(b.e)(je))}}]);
//# sourceMappingURL=48.dbc677e8.chunk.js.map