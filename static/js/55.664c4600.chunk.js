(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[55],{1032:function(e,t,n){"use strict";var i=n(88),r=n(1096),o=n.n(r),c=n(66),a="https://oj.qd.sdu.edu.cn";var s=n(0),u=n(6);t.a=function(e){var t=Object(s.useState)(!1),n=Object(i.a)(t,2),r=n[0],l=n[1],d=Object(s.useState)(!1),b=Object(i.a)(d,2),m=b[0],j=b[1];return Object(s.useEffect)((function(){Object(c.c)(e.text)||r||m===e.text||(l(!0),j(e.text),function(e,t){var n,i,r;(Object(c.c)(e)||Object(c.c)(null===(n=e)||void 0===n?void 0:n.trim()))&&(e=""),e=null===(r=e=null===(i=e)||void 0===i?void 0:i.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g,"```plaintext\n$1"))||void 0===r?void 0:r.replaceAll(/\$\n(.*)\n\$/g,"$ $1 $");var s={mode:"light",cdn:a+"/vditor",emojiPath:a+"/vditor/dist/images/emoji",theme:{path:a+"/vditor/dist/css/content-theme"},hljs:{lineNumber:!1},markdown:{toc:!0,mark:!0,footnotes:!0,autoSpace:!0},math:{inlineDigit:!0,engine:"KaTeX"}};return o.a.preview(document.getElementById(t),e,s)}(e.text,e.id).then((function(e){l(!1)})))}),[e.id,e.text,r]),Object(u.jsx)("div",{id:e.id,style:{overflowY:"hidden"}})}},1074:function(e,t,n){"use strict";var i=n(41),r=n(0),o=n(76),c=n(421),a=n(127),s=n(99),u=n(6);t.a=Object(o.b)((function(e){return{isLogin:e.UserReducer.isLogin}}),(function(e){return{setUserInfo:function(t){return e(t)},userLogin:function(t){return e(t)}}}))(Object(c.a)()(Object(i.e)((function(e){return Object(r.useEffect)((function(){!1===e.isLogin&&a.a.getProfile().then((function(t){e.setUserInfo({type:"setUserInfo",data:t}),e.userLogin({type:"userLogin"})})).catch((function(){e.history.replace(s.g+"/login?to="+e.location.pathname)}))}),[e.isLogin]),Object(u.jsx)(u.Fragment,{})}))))},1248:function(e,t,n){"use strict";var i=n(88),r=n(76),o=n(127),c=n(0);t.a=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:void 0,n=Object(r.d)((function(t){return t.ProblemSetReducer.problemSetInfo[e]})),a=Object(r.d)((function(t){return t.ProblemSetReducer.problemSetInfo[e+"-cache"]})),s=Object(r.c)(),u=Object(c.useState)(),l=Object(i.a)(u,2),d=l[0],b=l[1],m=Object(c.useState)(),j=Object(i.a)(m,2),f=j[0],p=j[1];return Object(c.useEffect)((function(){d!==e?(void 0===a&&void 0===n?(s({type:"setProblemSetInfo",key:e+"-cache",data:!0}),o.a.getProblemSetInfo({psid:parseInt(e)}).then((function(t){s({type:"setProblemSetInfo",key:e,data:t}),s({type:"setProblemSetInfo",key:e+"-cache",data:void 0}),p(t)})).catch((function(e){t&&t(e)}))):p(n),b(e)):p(n)}),[n,e]),f}},1423:function(e,t,n){"use strict";n.r(t);var i=n(88),r=n(41),o=n(984),c=n(1437),a=n(66),s=n(1032),u=n(0),l=n(1248),d=n(99),b=n(76),m=n(421),j=n(6),f=Object(b.b)((function(e){var t;return{roles:null===(t=e.UserReducer.userInfo)||void 0===t?void 0:t.roles}}),(function(e){return{}}))(Object(m.a)()(Object(r.e)((function(e){var t=e.match.params.problemSetId,n=e.location.pathname,r=Object(l.a)(t,(function(){e.history.replace(d.g+"/problemSetPublic/"+t)})),b=[{name:"\u603b\u89c8",link:d.g+"/problemSet/"+t+"/overview",re:/\/problemSet\/.*\/overview/g},{name:"\u9898\u76ee",link:d.g+"/problemSet/"+t+"/problem/0/0",re:/\/problemSet\/.*\/problem/g},{name:"\u8bc4\u9605",link:d.g+"/problemSet/"+t+"/review",re:/\/problemSet\/.*\/review/g},{name:"\u699c\u5355",link:d.g+"/problemSet/"+t+"/rank",re:/\/problemSet\/.*\/rank/g},{name:"\u63d0\u4ea4\u5217\u8868",link:d.g+"/problemSet/"+t+"/submission",re:/\/problemSet\/.*\/submission/g}],m=Object(u.useState)(),f=Object(i.a)(m,2),p=f[0],v=f[1],h=["\u603b\u89c8","\u9898\u76ee"];return!0===(null===r||void 0===r?void 0:r.isAdmin)&&h.push("\u8bc4\u9605","\u63d0\u4ea4\u5217\u8868","\u699c\u5355"),Object(u.useEffect)((function(){null!==n.match(/\/problemSet\/[0-9]*\/?$/g)&&e.history.replace(b[0].link),b.map((function(e){null!==n.match(e.re)&&v(e.name)}))}),[n]),Object(j.jsx)(j.Fragment,{children:void 0!==r&&Object(j.jsxs)(j.Fragment,{children:[Object(j.jsxs)(o.a,{style:{marginTop:25},extra:Object(j.jsx)("div",{style:{marginTop:12}}),children:[1===r.config.useSameSE&&Object(j.jsx)(j.Fragment,{children:Object(j.jsx)("div",{style:{textAlign:"center"},children:Object(j.jsx)("span",{style:{fontWeight:"bold",fontSize:"1.45rem"},children:Object(j.jsx)("span",{style:{paddingRight:10},children:r.name})})})}),!Object(a.c)(r.description)&&!Object(a.c)(r.description.trim())&&Object(j.jsx)(s.a,{id:"problemSet-markdownDescription",text:r.description.trim()})]}),Object(j.jsx)(c.a,{block:!0,options:h,value:p,onChange:function(t){b.map((function(n){n.name===t&&e.history.push(n.link)}))}})]})})})))),p=n(330),v=n(1293),h=n(1074),O=n(1414);t.default=Object(b.b)((function(e){var t,n,i=e.ContestReducer,r=e.UserReducer;return{minWidth:i.minWidth,realName:null===(t=r.userInfo)||void 0===t?void 0:t.nickname,sduId:null===(n=r.userInfo)||void 0===n?void 0:n.username}}),(function(e){return{}}))(Object(m.a)()(Object(r.e)((function(e){var t,n=500,o=Object(u.useState)(null===(t=document.querySelector("body"))||void 0===t?void 0:t.clientWidth),c=Object(i.a)(o,2),a=c[0],s=c[1];Object(u.useEffect)((function(){return window.addEventListener("resize",d),document.addEventListener("contextmenu",(function(e){e.preventDefault()})),window.addEventListener("keydown",(function(e){"F12"===e.key&&e.preventDefault()}),!1),window.addEventListener("contextmenu",(function(e){e.preventDefault()}),!1),function(){window.removeEventListener("resize",d)}}));var l,d=function(e){s(e.target.innerWidth)};null!==e.location.pathname.match(/\/problemSet\/.*\/rank/g)&&(n=Math.max(500,(null!==(l=e.minWidth)&&void 0!==l?l:0)+100));var b=Object(j.jsxs)(j.Fragment,{children:[Object(j.jsx)(f,{}),Object(j.jsx)(u.Suspense,{fallback:Object(j.jsx)(p.a,{}),children:v.d.map((function(e){var t=e.id,n=e.path,i=e.exact,o=e.component;return Object(j.jsx)(r.a,{path:n,exact:i,component:o},t)}))})]});return Object(j.jsxs)(j.Fragment,{children:[Object(j.jsx)(h.a,{}),Object(j.jsx)("div",{style:n<=1500?{textAlign:"center",margin:"0 auto"}:void 0,children:Object(j.jsx)("div",{style:n<=1500?{textAlign:"left",maxWidth:"1500px",margin:"0 auto"}:{textAlign:"left",maxWidth:"1500px",marginLeft:Math.max(0,(a-n)/2)},children:Object(j.jsx)(O.a,{rotate:-25,gapX:200,gapY:200,offsetLeft:20,content:e.realName+" "+e.sduId,fontColor:"rgba(212, 212, 212, 0.5)",fontSize:18,zIndex:500,children:b})})})]})}))))}}]);
//# sourceMappingURL=55.664c4600.chunk.js.map