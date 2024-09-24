/*! For license information please see 40.f9a59c08.chunk.js.LICENSE.txt */
(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[40],{1082:function(e,t,n){"use strict";var a=n(3),r=n(12),c=n(150),o=n(2),i=n.n(o),u=n(86),s=n(118),l=n(0),d=n(39),f=n(982),p=n(25),m=n(64),b=n(152),g=n(264),h=n(72),j=n(79),O=n(263);function x(e){var t=e.prefixCls,n=e.okButtonProps,r=e.cancelButtonProps,c=e.title,o=e.cancelText,i=e.okText,u=e.okType,s=e.icon,f=e.showCancel,p=void 0===f||f,x=e.close,v=e.onConfirm,y=e.onCancel,w=l.useContext(d.b).getPrefixCls;return l.createElement(h.a,{componentName:"Popconfirm",defaultLocale:j.a.Popconfirm},(function(e){return l.createElement("div",{className:"".concat(t,"-inner-content")},l.createElement("div",{className:"".concat(t,"-message")},s,l.createElement("div",{className:"".concat(t,"-message-title")},Object(O.a)(c))),l.createElement("div",{className:"".concat(t,"-buttons")},p&&l.createElement(m.a,Object(a.a)({onClick:y,size:"small"},r),o||e.cancelText),l.createElement(g.a,{buttonProps:Object(a.a)(Object(a.a)({size:"small"},Object(b.a)(u)),n),actionFn:v,close:x,prefixCls:w("btn"),quitOnNullishReturnValue:!0,emitEvent:!0},i||e.okText)))}))}var v=void 0,y=function(e,t){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(a=Object.getOwnPropertySymbols(e);r<a.length;r++)t.indexOf(a[r])<0&&Object.prototype.propertyIsEnumerable.call(e,a[r])&&(n[a[r]]=e[a[r]])}return n},w=l.forwardRef((function(e,t){var n=l.useContext(d.b).getPrefixCls,c=Object(u.a)(!1,{value:e.visible,defaultValue:e.defaultVisible}),o=Object(r.a)(c,2),m=o[0],b=o[1],g=function(t,n){var a;b(t,!0),null===(a=e.onVisibleChange)||void 0===a||a.call(e,t,n)},h=e.prefixCls,j=e.placement,O=e.children,w=e.overlayClassName,A=y(e,["prefixCls","placement","children","overlayClassName"]),L=n("popover",h),C=n("popconfirm",h),E=i()(C,w);return l.createElement(f.a,Object(a.a)({},A,{prefixCls:L,placement:j,onVisibleChange:function(t){e.disabled||g(t)},visible:m,_overlay:l.createElement(x,Object(a.a)({},e,{prefixCls:L,close:function(e){g(!1,e)},onConfirm:function(t){var n;return null===(n=e.onConfirm)||void 0===n?void 0:n.call(v,t)},onCancel:function(t){var n;g(!1,t),null===(n=e.onCancel)||void 0===n||n.call(v,t)}})),overlayClassName:E,ref:t}),Object(p.a)(O,{onKeyDown:function(e){var t,n;l.isValidElement(O)&&(null===(n=null===O||void 0===O?void 0:(t=O.props).onKeyDown)||void 0===n||n.call(t,e)),function(e){e.keyCode===s.a.ESC&&m&&g(!1,e)}(e)}}))}));w.defaultProps={placement:"top",trigger:"click",okType:"primary",icon:l.createElement(c.a,null),disabled:!1};t.a=w},1097:function(e,t,n){"use strict";var a=n(43),r=n(0),c=n(71),o=n(312),i=n(105),u=n(91),s=n(6);t.a=Object(o.a)()(Object(a.e)((function(e){var t=Object(c.c)(),n=Object(c.d)((function(e){return e.UserReducer.isLogin}));return Object(r.useEffect)((function(){!1===n&&i.a.getProfile().then((function(e){t({type:"setUserInfo",data:e}),t({type:"userLogin"})})).catch((function(){e.jump&&e.history.replace(u.g+"/login?to="+e.location.pathname)}))}),[n]),Object(s.jsx)(s.Fragment,{})})))},1103:function(e,t,n){"use strict";var a=n(27),r=n(9),c=n(4),o=n.n(c),i=n(10),u={getExamGroupList:function(e){var t=arguments;return Object(r.a)(o.a.mark((function n(){var a;return o.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return a=t.length>1&&void 0!==t[1]&&t[1],n.abrupt("return",i.a.get("/exam/getGroupList",{examId:e,reportMode:a}));case 2:case"end":return n.stop()}}),n)})))()},getProInfo:function(e){var t=arguments;return Object(r.a)(o.a.mark((function n(){var r;return o.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return r=t.length>1&&void 0!==t[1]&&t[1],n.abrupt("return",i.a.get("/exam/getExamProblem",Object(a.a)(Object(a.a)({},e),{},{reportMode:r})));case 2:case"end":return n.stop()}}),n)})))()},getAnswerSheet:function(e,t){var n=arguments;return Object(r.a)(o.a.mark((function a(){var r;return o.a.wrap((function(a){for(;;)switch(a.prev=a.next){case 0:return r=n.length>2&&void 0!==n[2]&&n[2],a.abrupt("return",i.a.get("/exam/getAnswerSheet",{examId:e,groupId:t,reportMode:r}));case 2:case"end":return a.stop()}}),a)})))()},getSubmission:function(e,t){var n=arguments;return Object(r.a)(o.a.mark((function a(){var r;return o.a.wrap((function(a){for(;;)switch(a.prev=a.next){case 0:return r=n.length>2&&void 0!==n[2]&&n[2],a.abrupt("return",i.a.get("/exam/getSubmission",{examId:e,submissionId:t,reportMode:r}));case 2:case"end":return a.stop()}}),a)})))()},getExamResult:function(e){return Object(r.a)(o.a.mark((function t(){return o.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",i.a.get("/exam/getExamResult",{examId:e,reportMode:!0}));case 1:case"end":return t.stop()}}),t)})))()},CreateSubmit:function(e){return Object(r.a)(o.a.mark((function t(){return o.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",i.a.post("/exam/createSubmission",e));case 1:case"end":return t.stop()}}),t)})))()},getExamInfo:function(e){return Object(r.a)(o.a.mark((function t(){return o.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",i.a.get("/exam/getInfo",{examId:e}));case 1:case"end":return t.stop()}}),t)})))()},getExamList:function(e){return Object(r.a)(o.a.mark((function t(){return o.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",i.a.post("/exam/getInfos",e));case 1:case"end":return t.stop()}}),t)})))()},setAnswerSheet:function(e,t,n){return Object(r.a)(o.a.mark((function r(){return o.a.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:return r.abrupt("return",i.a.post("/exam/submitAnswerSheet",Object(a.a)({examId:t,problemGroupId:n},e)));case 1:case"end":return r.stop()}}),r)})))()},ExamOver:function(e){return Object(r.a)(o.a.mark((function t(){return o.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",i.a.get("/exam/userSubmit",e));case 1:case"end":return t.stop()}}),t)})))()},getSubmissionList:function(e){var t=arguments;return Object(r.a)(o.a.mark((function n(){var r;return o.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return r=t.length>1&&void 0!==t[1]&&t[1],n.abrupt("return",i.a.post("/exam/getSubmissionList",Object(a.a)(Object(a.a)({},e),{},{reportMode:r})));case 2:case"end":return n.stop()}}),n)})))()}};t.a=u},1126:function(e,t,n){"use strict";var a=n(3),r=n(5),c=n(2),o=n.n(c),i=n(0),u=n(39),s=function(e,t){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(a=Object.getOwnPropertySymbols(e);r<a.length;r++)t.indexOf(a[r])<0&&Object.prototype.propertyIsEnumerable.call(e,a[r])&&(n[a[r]]=e[a[r]])}return n};t.a=function(e){var t,n=i.useContext(u.b),c=n.getPrefixCls,l=n.direction,d=e.prefixCls,f=e.type,p=void 0===f?"horizontal":f,m=e.orientation,b=void 0===m?"center":m,g=e.orientationMargin,h=e.className,j=e.children,O=e.dashed,x=e.plain,v=s(e,["prefixCls","type","orientation","orientationMargin","className","children","dashed","plain"]),y=c("divider",d),w=b.length>0?"-".concat(b):b,A=!!j,L="left"===b&&null!=g,C="right"===b&&null!=g,E=o()(y,"".concat(y,"-").concat(p),(t={},Object(r.a)(t,"".concat(y,"-with-text"),A),Object(r.a)(t,"".concat(y,"-with-text").concat(w),A),Object(r.a)(t,"".concat(y,"-dashed"),!!O),Object(r.a)(t,"".concat(y,"-plain"),!!x),Object(r.a)(t,"".concat(y,"-rtl"),"rtl"===l),Object(r.a)(t,"".concat(y,"-no-default-orientation-margin-left"),L),Object(r.a)(t,"".concat(y,"-no-default-orientation-margin-right"),C),t),h),k=Object(a.a)(Object(a.a)({},L&&{marginLeft:g}),C&&{marginRight:g});return i.createElement("div",Object(a.a)({className:E},v,{role:"separator"}),j&&i.createElement("span",{className:"".concat(y,"-inner-text"),style:k},j))}},1256:function(e,t,n){"use strict";t.a=n.p+"static/media/logo.871e1201.png"},1287:function(e,t,n){"use strict";var a=n(142),r=n(143),c=n(319),o=n(145),i=n(144),u=n(0),s=n(177),l=n(981),d=n(279),f=n(275),p=n(71),m=n(132),b=n.n(m),g=(n(1291),n(210)),h=n(6),j=s.a.Option,O=function(e){Object(o.a)(n,e);var t=Object(i.a)(n);function n(e){var r;return Object(a.a)(this,n),(r=t.call(this,e)).defLang=Object(g.a)(),d.a.languages.map((function(e){0!==f.a.filter((function(t){return t.id===e})).length&&0===r.defLang.length&&(r.defLang=e)})),r.changeLang=r.changeLang.bind(Object(c.a)(r)),r.changeLang(r.defLang),r}return Object(r.a)(n,[{key:"changeLang",value:function(e){d.a.changeLanguage(e);var t=f.a.findIndex((function(t){return t.id===e}));this.props.ChangeLanguage(f.b[e],f.a[t].code),b.a.locale(f.a[t].time),localStorage.setItem("language",f.a[t].code)}},{key:"render",value:function(){return Object(h.jsx)(h.Fragment,{children:Object(h.jsxs)(l.b,{children:[Object(h.jsx)("img",{src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAlBJREFUWEfFlo0xBEEQhd9FgAgQASJABIgAESACRIAIEAEiQAROBIgAEVDf1vTpmp2/rVO1XaVOzU/369eve3aikW0ycnwNAbAo6UjSraT3/wI+BMCTpE1JX5KWxgDw44IOAV7Eao52A72lw1tuEzZKRpluWlgyANC60HJhwJnVFq0YAKvvAP/Fo6+S1luc+Vp6ilvucuYsCJP/ryTdh4vTINaqn3nERFu+SeIXa6I8RlQCgDCvQx23ExkdhH18Pkji/GArAYDOneDxPNDtAzCMlsPCnqN/EIgaA3fBG10CxfxiPvsPSSuJqKwB8LmEqKYB3x0wQqaYz/4w0fMEfwn6SLE3w1QDQCvhyAwArJ2GhVz2l26wARb2klYDwCVazQJSAlM9e4gzNRXjwZZiqQPUAoBz9PValAJ9f5xIy+vDtgEJ2J61AqCm9LxZLErvODdVk3OiFQAPy34EnzWo9eY18x1a0+4lGWsBkApuQdk7ce3pzxIQMRpzSdZKABDbReh5C0hLoWompJlNwdxo9iXpiTEHAGeP0YvGG4/AMC80Bg0PWW40+3XEvOFrlgJgb4Bvt1QbEZQ/BhSOS6PZ7wGA853FAPwAYR8h0Wq1rxuAwJhZPBsQpyXkmewB8PXiowL6Zmh7Tfy3UBJq6hoftd27EjNAJkw+gPDbYmT22XLQnaFzYLt5Epb8+1GNIHPAGWbWPbP3oWUO1JLzAsu9DeajJ9R5AXjx5V5GnwCCZrZg3TM9LwAcoRdUjmDtozTHGnrhPOUA/PQ/ANRKVNwfHcAv9/p/IZj3OnUAAAAASUVORK5CYII=",alt:"lang",width:20}),Object(h.jsx)(s.a,{onChange:this.changeLang,defaultValue:this.defLang,bordered:!1,style:{marginLeft:-15},children:f.a.map((function(e,t){return Object(h.jsx)(j,{value:e.id,children:e.name},t.toString())}))})]})})}}]),n}(u.Component);t.a=Object(p.b)((function(e){return{lang:e.ConfigReducer.lang}}),(function(e){return{ChangeLanguage:function(t,n){return e({type:"updateLanguage",lang:t,langCode:n})}}}))(O)},1291:function(e,t,n){!function(e){"use strict";e.defineLocale("zh-cn",{months:"\u4e00\u6708_\u4e8c\u6708_\u4e09\u6708_\u56db\u6708_\u4e94\u6708_\u516d\u6708_\u4e03\u6708_\u516b\u6708_\u4e5d\u6708_\u5341\u6708_\u5341\u4e00\u6708_\u5341\u4e8c\u6708".split("_"),monthsShort:"1\u6708_2\u6708_3\u6708_4\u6708_5\u6708_6\u6708_7\u6708_8\u6708_9\u6708_10\u6708_11\u6708_12\u6708".split("_"),weekdays:"\u661f\u671f\u65e5_\u661f\u671f\u4e00_\u661f\u671f\u4e8c_\u661f\u671f\u4e09_\u661f\u671f\u56db_\u661f\u671f\u4e94_\u661f\u671f\u516d".split("_"),weekdaysShort:"\u5468\u65e5_\u5468\u4e00_\u5468\u4e8c_\u5468\u4e09_\u5468\u56db_\u5468\u4e94_\u5468\u516d".split("_"),weekdaysMin:"\u65e5_\u4e00_\u4e8c_\u4e09_\u56db_\u4e94_\u516d".split("_"),longDateFormat:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY/MM/DD",LL:"YYYY\u5e74M\u6708D\u65e5",LLL:"YYYY\u5e74M\u6708D\u65e5Ah\u70b9mm\u5206",LLLL:"YYYY\u5e74M\u6708D\u65e5ddddAh\u70b9mm\u5206",l:"YYYY/M/D",ll:"YYYY\u5e74M\u6708D\u65e5",lll:"YYYY\u5e74M\u6708D\u65e5 HH:mm",llll:"YYYY\u5e74M\u6708D\u65e5dddd HH:mm"},meridiemParse:/\u51cc\u6668|\u65e9\u4e0a|\u4e0a\u5348|\u4e2d\u5348|\u4e0b\u5348|\u665a\u4e0a/,meridiemHour:function(e,t){return 12===e&&(e=0),"\u51cc\u6668"===t||"\u65e9\u4e0a"===t||"\u4e0a\u5348"===t?e:"\u4e0b\u5348"===t||"\u665a\u4e0a"===t?e+12:e>=11?e:e+12},meridiem:function(e,t,n){var a=100*e+t;return a<600?"\u51cc\u6668":a<900?"\u65e9\u4e0a":a<1130?"\u4e0a\u5348":a<1230?"\u4e2d\u5348":a<1800?"\u4e0b\u5348":"\u665a\u4e0a"},calendar:{sameDay:"[\u4eca\u5929]LT",nextDay:"[\u660e\u5929]LT",nextWeek:function(e){return e.week()!==this.week()?"[\u4e0b]dddLT":"[\u672c]dddLT"},lastDay:"[\u6628\u5929]LT",lastWeek:function(e){return this.week()!==e.week()?"[\u4e0a]dddLT":"[\u672c]dddLT"},sameElse:"L"},dayOfMonthOrdinalParse:/\d{1,2}(\u65e5|\u6708|\u5468)/,ordinal:function(e,t){switch(t){case"d":case"D":case"DDD":return e+"\u65e5";case"M":return e+"\u6708";case"w":case"W":return e+"\u5468";default:return e}},relativeTime:{future:"%s\u540e",past:"%s\u524d",s:"\u51e0\u79d2",ss:"%d \u79d2",m:"1 \u5206\u949f",mm:"%d \u5206\u949f",h:"1 \u5c0f\u65f6",hh:"%d \u5c0f\u65f6",d:"1 \u5929",dd:"%d \u5929",w:"1 \u5468",ww:"%d \u5468",M:"1 \u4e2a\u6708",MM:"%d \u4e2a\u6708",y:"1 \u5e74",yy:"%d \u5e74"},week:{dow:1,doy:4}})}(n(132))},1319:function(e,t,n){"use strict";n.d(t,"a",(function(){return r}));var a=n(105);function r(){return function(e,t){a.a.logout().then((function(t){e({type:"userLogout"}),e({type:"clearRedux"})}))}}},1378:function(e,t,n){"use strict";n.d(t,"a",(function(){return c}));var a=n(0),r=n(91),c=[{id:2,path:r.g+"/exam/list",exact:!0,component:Object(a.lazy)((function(){return Promise.all([n.e(0),n.e(2),n.e(4),n.e(5),n.e(26)]).then(n.bind(null,1411))}))},{id:3,path:r.g+"/exam/wait/:eid",exact:!0,component:Object(a.lazy)((function(){return Promise.all([n.e(3),n.e(4),n.e(5),n.e(6),n.e(45)]).then(n.bind(null,1409))}))},{id:4,path:r.g+"/exam/running/:eid/:gid/:pid",exact:!0,component:Object(a.lazy)((function(){return Promise.all([n.e(0),n.e(2),n.e(3),n.e(1),n.e(33)]).then(n.bind(null,1413))}))},{id:5,path:r.g+"/exam/finish",exact:!0,component:Object(a.lazy)((function(){return Promise.all([n.e(4),n.e(61)]).then(n.bind(null,1410))}))},{id:6,path:r.g+"/exam/report/:eid",exact:!0,component:Object(a.lazy)((function(){return Promise.all([n.e(0),n.e(3),n.e(1),n.e(4),n.e(36)]).then(n.bind(null,1416))}))}]},1390:function(e,t,n){"use strict";var a=n(351),r=n(219),c=a.e;c.Header=a.c,c.Footer=a.b,c.Content=a.a,c.Sider=r.b,t.a=c},1426:function(e,t,n){"use strict";var a=n(1),r=n(0),c={icon:{tag:"svg",attrs:{viewBox:"64 64 896 896",focusable:"false"},children:[{tag:"path",attrs:{d:"M868 732h-70.3c-4.8 0-9.3 2.1-12.3 5.8-7 8.5-14.5 16.7-22.4 24.5a353.84 353.84 0 01-112.7 75.9A352.8 352.8 0 01512.4 866c-47.9 0-94.3-9.4-137.9-27.8a353.84 353.84 0 01-112.7-75.9 353.28 353.28 0 01-76-112.5C167.3 606.2 158 559.9 158 512s9.4-94.2 27.8-137.8c17.8-42.1 43.4-80 76-112.5s70.5-58.1 112.7-75.9c43.6-18.4 90-27.8 137.9-27.8 47.9 0 94.3 9.3 137.9 27.8 42.2 17.8 80.1 43.4 112.7 75.9 7.9 7.9 15.3 16.1 22.4 24.5 3 3.7 7.6 5.8 12.3 5.8H868c6.3 0 10.2-7 6.7-12.3C798 160.5 663.8 81.6 511.3 82 271.7 82.6 79.6 277.1 82 516.4 84.4 751.9 276.2 942 512.4 942c152.1 0 285.7-78.8 362.3-197.7 3.4-5.3-.4-12.3-6.7-12.3zm88.9-226.3L815 393.7c-5.3-4.2-13-.4-13 6.3v76H488c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112a8 8 0 000-12.6z"}}]},name:"logout",theme:"outlined"},o=n(14),i=function(e,t){return r.createElement(o.a,Object(a.a)(Object(a.a)({},e),{},{ref:t,icon:c}))};i.displayName="LogoutOutlined";t.a=r.forwardRef(i)},996:function(e,t,n){"use strict";n.r(t);var a=n(142),r=n(143),c=n(145),o=n(144),i=n(0),u=n(1390),s=n(338),l=n(350),d=n(43),f=n(312),p=n(197),m=n(201),b=n(101),g=n(64),h=n(981),j=n(1126),O=n(1287),x=n(1426),v=n(208),y=n(1256),w=n(71),A=n(1319),L=n(66),C=n(1082),E=n(1103),k=n(91),I=n(6),P=Object(w.b)((function(e){return{}}),(function(e){return{}}))(Object(f.a)()(Object(d.e)((function(e){var t=Object(i.useState)(!1),n=Object(L.a)(t,2),a=n[0],r=n[1],c=Object(w.c)();return Object(I.jsx)(I.Fragment,{children:Object(I.jsx)(C.a,{okType:"primary",title:"\u4ea4\u5377\u540e\u5c06\u65e0\u6cd5\u7ee7\u7eed\u4f5c\u7b54\uff0c\u4f60\u786e\u5b9a\u8981\u4ea4\u5377\u5417\uff1f",onConfirm:function(){r(!0);var t=e.location.pathname.split("/"),n=t[t.length-3];E.a.ExamOver({examId:n}).then((function(){c({type:"setExamInfo",key:n,data:void 0}),e.history.push(k.g+"/exam/finish")})).catch((function(){r(!1)}))},okText:"\u786e\u5b9a\u4ea4\u5377",cancelText:"\u53d6\u6d88",disabled:a,children:Object(I.jsx)(g.a,{danger:!0,style:{marginRight:"30px"},type:"primary",disabled:a,children:"\u4ea4\u5377"})})})})))),_=u.a.Header,Y=Object(w.b)((function(e){var t,n,a,r,c,o,i=e.UserReducer,u=null===(t=i.userInfo)||void 0===t?void 0:t.realName,s=null===(n=i.userInfo)||void 0===n?void 0:n.sduId;return{isLogin:i.isLogin,realName:void 0===u||null===u?null===(a=i.userInfo)||void 0===a?void 0:a.nickname:null===(r=i.userInfo)||void 0===r?void 0:r.realName,sduId:void 0===s||null===s?null===(c=i.userInfo)||void 0===c?void 0:c.studentId:null===(o=i.userInfo)||void 0===o?void 0:o.sduId}}),(function(e){return{userLogout:function(){return e(Object(A.a)())}}}))(Object(f.a)()(Object(d.e)((function(e){return Object(I.jsxs)(_,{className:"site-layout-sub-header-background",style:{minWidth:550},children:[Object(I.jsx)("div",{className:"logo",style:{float:"left",marginTop:"-5px",marginLeft:"-10px"},children:Object(I.jsx)("img",{src:y.a,style:{width:"125px",height:"30px"},alt:"SDUOJ-logo"})},"logo"),Object(I.jsxs)("div",{style:{float:"right"},children:[null!==e.location.pathname.match(/\/exam\/running\//)&&Object(I.jsx)(P,{},"ExamOver"),Object(I.jsx)(O.a,{}),[""].map((function(){if(e.isLogin)return Object(I.jsx)(p.a,{overlay:Object(I.jsx)(m.a,{onClick:function(){e.userLogout(),b.b.info("\u5df2\u9000\u51fa\u767b\u5f55")},children:Object(I.jsx)(m.a.Item,{icon:Object(I.jsx)(x.a,{}),children:e.t("Logout")},"1")}),children:Object(I.jsx)(g.a,{type:"text",size:"large",children:Object(I.jsxs)(h.b,{children:[Object(I.jsxs)("div",{style:{marginTop:-10},children:[e.realName,Object(I.jsx)(j.a,{type:"vertical"}),e.sduId]}),Object(I.jsx)(v.a,{style:{fontSize:10,marginBottom:20}})]})})})}))]},"operator")]})})))),S=n(1378),D=n(1097),N=u.a.Footer,M=u.a.Content,T=function(e){Object(c.a)(n,e);var t=Object(o.a)(n);function n(){return Object(a.a)(this,n),t.apply(this,arguments)}return Object(r.a)(n,[{key:"componentDidMount",value:function(){this.props.location.pathname!==k.g+"/exam"&&this.props.location.pathname!==k.g+"/exam/"||0===S.a.length||this.props.history.push(Object(l.a)(S.a,2))}},{key:"render",value:function(){return Object(I.jsxs)(I.Fragment,{children:[Object(I.jsx)(D.a,{jump:!0}),Object(I.jsx)(u.a,{style:{height:"max-content",minHeight:"100%"},children:Object(I.jsxs)(u.a,{style:{minWidth:500},children:[Object(I.jsx)(Y,{}),Object(I.jsx)(M,{style:{margin:"24px 16px 0",display:"table",height:"auto"},children:Object(I.jsx)("div",{className:"site-layout-background",style:{padding:24},children:Object(I.jsx)(i.Suspense,{fallback:Object(I.jsx)(s.a,{}),children:S.a.map((function(e){return Object(I.jsx)(d.a,{path:e.path,exact:e.exact,component:e.component},e.id)}))})})}),Object(I.jsx)(N,{style:{textAlign:"center"},children:"\u82e5\u9047\u5230\u9650\u6d41\u95ee\u9898\uff0c\u8bf7\u7a0d\u540e\u5237\u65b0\u9875\u9762\u5373\u53ef\u3002 \u8003\u8bd5\u7ed3\u675f\u540e\uff0c\u8bd5\u5377\u4f1a\u81ea\u52a8\u63d0\u4ea4\u3002 \u82e5\u4e3b\u52a8\u4ea4\u5377\uff0c\u5219\u8bd5\u5377\u5c06\u88ab\u9501\u5b9a\uff0c\u65e0\u6cd5\u518d\u6b21\u6539\u52a8\u3002"})]})})]})}}]),n}(i.Component);t.default=Object(w.b)((function(e){return{}}),(function(e){return{}}))(Object(f.a)()(Object(d.e)(T)))}}]);
//# sourceMappingURL=40.f9a59c08.chunk.js.map