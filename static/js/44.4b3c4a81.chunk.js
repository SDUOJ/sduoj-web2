(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[44],{1018:function(e,t,n){"use strict";var a=n(31),r=n(88),c=n(984),i=n(1006),o=n(974),l=n(62),s=n(1125),d=n(983),u=n(0),j=n(99),b=n(76),m=n(421),f=n(41),g=n(309),v=n(66),O=n(1376),h=n(6);t.a=Object(b.b)((function(e){var t,n=e.UserReducer,r=e.TableReduce;return{roles:null===(t=n.userInfo)||void 0===t?void 0:t.roles,tableData:Object(a.a)({},r.tableData)}}),(function(e){return{setTableInfo:function(t,n){return e({type:"setTableInfo",name:t,data:n})},setDataSource:function(t,n){return e({type:"setDataSource",data:t,name:n,add:!1})}}}))(Object(m.a)()(Object(f.e)((function(e){var t,n=Object(u.useState)(0),b=Object(r.a)(n,2),m=b[0],f=b[1],p=Object(u.useState)(),x=Object(r.a)(p,2),y=x[0],S=x[1],w=Object(u.useState)(!0),C=Object(r.a)(w,2),k=C[0],I=C[1],z=Object(u.useState)(1),N=Object(r.a)(z,2),P=N[0],E=N[1],L=Object(u.useState)(Object(v.a)(e.defaultPageSize,j.h)),F=Object(r.a)(L,2),T=F[0],J=F[1],V=Object(u.useState)(),D=Object(r.a)(V,2),R=D[0],K=D[1],A=Object(u.useState)(0),M=Object(r.a)(A,2),B=M[0],_=M[1],$=function(t){S(t),void 0!==e.setDataSource&&void 0!==e.name&&e.setDataSource(t,e.name)},U=function(t,n,r,c){var i,o,l,s,d,u,j,b,m,g=null===(i=e.tableData[e.name])||void 0===i?void 0:i.tableInfo;void 0!==g&&(void 0===c&&void 0!==g.moreProps&&Q.setFieldsValue(g.moreProps),t=null!==(u=t)&&void 0!==u?u:g.pageNow,n=null!==(j=n)&&void 0!==j?j:g.pageSize,r=null!==(b=r)&&void 0!==b?b:g.searchKey,c=null!==(m=c)&&void 0!==m?m:g.moreProps);var v=null!==(o=t)&&void 0!==o?o:P,O=null!==(l=n)&&void 0!==l?l:T,h=null!==(s=r)&&void 0!==s?s:R,p=null!==(d=c)&&void 0!==d?d:Q.getFieldsValue();E(v),J(O),K(h),I(!0),e.API(Object(a.a)({pageNow:v,pageSize:O,searchKey:h},p)).then((function(t){null===t.rows&&(t.rows=[]),void 0!==e.APIRowsTransForm?$(e.APIRowsTransForm(t.rows)):$(t.rows),void 0!==t.totalNum&&"0"!==t.totalNum?(f(t.totalNum),e.name&&e.setTableInfo(e.name,{total:t.totalNum,pageNow:v,pageSize:O,searchKey:h,moreProps:p})):(f(O*t.totalPage),e.name&&e.setTableInfo(e.name,{total:O*t.totalPage,pageNow:v,pageSize:O,searchKey:h,moreProps:p})),I(!1)}))};Object(u.useEffect)((function(){Q.setFieldsValue(e.initRequestProps),U()}),[e.name]);var q=Object(O.a)(),Q=Object(r.a)(q,1)[0],W=function(){var e=Q.getFieldsValue();"{}"!==JSON.stringify(e)&&U(1,T,void 0,e)},G=function(){var t,n=Q.getFieldsValue();Q.resetFields();var a=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableInfo;e.name&&e.setTableInfo(e.name,{total:a.total,pageNow:a.pageNow,pageSize:a.pageSize,searchKey:a.searchKey,moreProps:void 0});var r=Q.getFieldsValue();JSON.stringify(n)!==JSON.stringify(r)&&U(1,T,void 0,void 0)};return Object(u.useEffect)((function(){var t,n=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableVersion;if(void 0!==n&&B!==n)if(n<0){var a;_(-n),S(null===(a=e.tableData[e.name])||void 0===a?void 0:a.dataSource)}else{_(n);var r=Q.getFieldsValue();U(P,T,R,r)}}),[e.tableData,B]),Object(h.jsxs)(h.Fragment,{children:[e.useList&&Object(h.jsx)(c.a,{title:e.title,bordered:!0,size:"default",className:null!==(t=e.cardProps)&&void 0!==t?t:"zeroBodyPaddingLeft",extra:(!0===e.search||void 0!==e.getForm)&&Object(h.jsxs)(h.Fragment,{children:[!0===e.search&&Object(h.jsx)(g.a,{placeholder:e.t("searchUser"),onSearch:function(e){K(e),E(1);var t=Q.getFieldsValue();U(1,T,e,t)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(h.jsxs)(i.a,{form:Q,children:[e.getForm(W),e.useFormBtn&&Object(h.jsxs)(o.b,{style:{marginLeft:"30px"},size:20,children:[Object(h.jsx)(l.a,{type:"primary",onClick:W,children:"\u7b5b\u9009"}),Object(h.jsx)(l.a,{htmlType:"button",onClick:G,children:"\u91cd\u7f6e"})]})]})]}),children:Object(h.jsx)(s.b,{grid:e.grid,itemLayout:"vertical",loading:k,size:e.size,dataSource:y,renderItem:e.renderItem,pagination:{onChange:function(e,t){U(e,t)},current:P,pageSize:T,total:m,size:"small",hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(v.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})}),!e.useList&&Object(h.jsx)(c.a,{bordered:!1,size:"small",extra:(!0===e.search||void 0!==e.getForm)&&Object(h.jsxs)(h.Fragment,{children:[!0===e.search&&Object(h.jsx)(g.a,{placeholder:"\u641c\u7d22",onSearch:function(e){K(e),E(1),U(1,T,e)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(h.jsxs)(i.a,{form:Q,children:[e.getForm(W),Object(h.jsxs)(o.b,{style:{marginLeft:"30px"},size:20,children:[Object(h.jsx)(l.a,{type:"primary",onClick:W,children:e.t("filtering")}),Object(h.jsx)(l.a,{htmlType:"button",onClick:G,children:e.t("Reset")})]})]})]}),children:Object(h.jsx)(d.a,{rowKey:e.rowKey,loading:k,size:e.size,columns:e.columns,rowSelection:e.rowSelection,dataSource:y,pagination:{onChange:function(e,t){U(e,t)},current:P,pageSize:T,total:m,hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(v.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})})]})}))))},1032:function(e,t,n){"use strict";var a=n(88),r=n(1096),c=n.n(r),i=n(66),o="https://oj.qd.sdu.edu.cn";var l=n(0),s=n(6);t.a=function(e){var t=Object(l.useState)(!1),n=Object(a.a)(t,2),r=n[0],d=n[1],u=Object(l.useState)(!1),j=Object(a.a)(u,2),b=j[0],m=j[1];return Object(l.useEffect)((function(){Object(i.c)(e.text)||r||b===e.text||(d(!0),m(e.text),function(e,t){var n,a,r;(Object(i.c)(e)||Object(i.c)(null===(n=e)||void 0===n?void 0:n.trim()))&&(e=""),e=null===(r=e=null===(a=e)||void 0===a?void 0:a.replaceAll(/`{3}\n([-|0-9a-zA-Z])/g,"```plaintext\n$1"))||void 0===r?void 0:r.replaceAll(/\$\n(.*)\n\$/g,"$ $1 $");var l={mode:"light",cdn:o+"/vditor",emojiPath:o+"/vditor/dist/images/emoji",theme:{path:o+"/vditor/dist/css/content-theme"},hljs:{lineNumber:!1},markdown:{toc:!0,mark:!0,footnotes:!0,autoSpace:!0},math:{inlineDigit:!0,engine:"KaTeX"}};return c.a.preview(document.getElementById(t),e,l)}(e.text,e.id).then((function(e){d(!1)})))}),[e.id,e.text,r]),Object(s.jsx)("div",{id:e.id,style:{overflowY:"hidden"}})}},1125:function(e,t,n){"use strict";n.d(t,"a",(function(){return k}));var a=n(23),r=n(3),c=n(5),i=n(12),o=n(18),l=n(2),s=n.n(l),d=n(0),u=n.n(d),j=n(39),b=n(193),m=n(971),f=n(145),g=n(316),v=n(250),O=n(112),h=n(453),p=n(25),x=function(e,t){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(a=Object.getOwnPropertySymbols(e);r<a.length;r++)t.indexOf(a[r])<0&&Object.prototype.propertyIsEnumerable.call(e,a[r])&&(n[a[r]]=e[a[r]])}return n},y=function(e,t){var n=e.prefixCls,a=e.children,i=e.actions,o=e.extra,l=e.className,b=e.colStyle,m=x(e,["prefixCls","children","actions","extra","className","colStyle"]),f=Object(d.useContext)(k),g=f.grid,v=f.itemLayout,O=Object(d.useContext)(j.b).getPrefixCls,y=O("list",n),S=i&&i.length>0&&u.a.createElement("ul",{className:"".concat(y,"-item-action"),key:"actions"},i.map((function(e,t){return u.a.createElement("li",{key:"".concat(y,"-item-action-").concat(t)},e,t!==i.length-1&&u.a.createElement("em",{className:"".concat(y,"-item-action-split")}))}))),w=g?"div":"li",C=u.a.createElement(w,Object(r.a)({},m,g?{}:{ref:t},{className:s()("".concat(y,"-item"),Object(c.a)({},"".concat(y,"-item-no-flex"),!("vertical"===v?o:!function(){var e;return d.Children.forEach(a,(function(t){"string"===typeof t&&(e=!0)})),e&&d.Children.count(a)>1}())),l)}),"vertical"===v&&o?[u.a.createElement("div",{className:"".concat(y,"-item-main"),key:"content"},a,S),u.a.createElement("div",{className:"".concat(y,"-item-extra"),key:"extra"},o)]:[a,S,Object(p.a)(o,{key:"extra"})]);return g?u.a.createElement(h.a,{ref:t,flex:1,style:b},C):C},S=Object(d.forwardRef)(y);S.Meta=function(e){var t=e.prefixCls,n=e.className,a=e.avatar,c=e.title,i=e.description,o=x(e,["prefixCls","className","avatar","title","description"]),l=(0,Object(d.useContext)(j.b).getPrefixCls)("list",t),b=s()("".concat(l,"-item-meta"),n),m=u.a.createElement("div",{className:"".concat(l,"-item-meta-content")},c&&u.a.createElement("h4",{className:"".concat(l,"-item-meta-title")},c),i&&u.a.createElement("div",{className:"".concat(l,"-item-meta-description")},i));return u.a.createElement("div",Object(r.a)({},o,{className:b}),a&&u.a.createElement("div",{className:"".concat(l,"-item-meta-avatar")},a),(c||i)&&m)};var w=S,C=function(e,t){var n={};for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&t.indexOf(a)<0&&(n[a]=e[a]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(a=Object.getOwnPropertySymbols(e);r<a.length;r++)t.indexOf(a[r])<0&&Object.prototype.propertyIsEnumerable.call(e,a[r])&&(n[a[r]]=e[a[r]])}return n},k=d.createContext({});k.Consumer;function I(e){var t,n=e.pagination,l=void 0!==n&&n,u=e.prefixCls,h=e.bordered,p=void 0!==h&&h,x=e.split,y=void 0===x||x,S=e.className,w=e.children,I=e.itemLayout,z=e.loadMore,N=e.grid,P=e.dataSource,E=void 0===P?[]:P,L=e.size,F=e.header,T=e.footer,J=e.loading,V=void 0!==J&&J,D=e.rowKey,R=e.renderItem,K=e.locale,A=C(e,["pagination","prefixCls","bordered","split","className","children","itemLayout","loadMore","grid","dataSource","size","header","footer","loading","rowKey","renderItem","locale"]),M=l&&"object"===Object(o.a)(l)?l:{},B=d.useState(M.defaultCurrent||1),_=Object(i.a)(B,2),$=_[0],U=_[1],q=d.useState(M.defaultPageSize||10),Q=Object(i.a)(q,2),W=Q[0],G=Q[1],H=d.useContext(j.b),X=H.getPrefixCls,Y=H.renderEmpty,Z=H.direction,ee={},te=function(e){return function(t,n){U(t),G(n),l&&l[e]&&l[e](t,n)}},ne=te("onChange"),ae=te("onShowSizeChange"),re=X("list",u),ce=V;"boolean"===typeof ce&&(ce={spinning:ce});var ie=ce&&ce.spinning,oe="";switch(L){case"large":oe="lg";break;case"small":oe="sm"}var le=s()(re,(t={},Object(c.a)(t,"".concat(re,"-vertical"),"vertical"===I),Object(c.a)(t,"".concat(re,"-").concat(oe),oe),Object(c.a)(t,"".concat(re,"-split"),y),Object(c.a)(t,"".concat(re,"-bordered"),p),Object(c.a)(t,"".concat(re,"-loading"),ie),Object(c.a)(t,"".concat(re,"-grid"),!!N),Object(c.a)(t,"".concat(re,"-something-after-last-item"),!!(z||l||T)),Object(c.a)(t,"".concat(re,"-rtl"),"rtl"===Z),t),S),se=Object(r.a)(Object(r.a)(Object(r.a)({},{current:1,total:0}),{total:E.length,current:$,pageSize:W}),l||{}),de=Math.ceil(se.total/se.pageSize);se.current>de&&(se.current=de);var ue=l?d.createElement("div",{className:"".concat(re,"-pagination")},d.createElement(g.a,Object(r.a)({},se,{onChange:ne,onShowSizeChange:ae}))):null,je=Object(a.a)(E);l&&E.length>(se.current-1)*se.pageSize&&(je=Object(a.a)(E).splice((se.current-1)*se.pageSize,se.pageSize));var be=Object.keys(N||{}).some((function(e){return["xs","sm","md","lg","xl","xxl"].includes(e)})),me=Object(f.a)(be),fe=d.useMemo((function(){for(var e=0;e<O.b.length;e+=1){var t=O.b[e];if(me[t])return t}}),[me]),ge=d.useMemo((function(){if(N){var e=fe&&N[fe]?N[fe]:N.column;return e?{width:"".concat(100/e,"%"),maxWidth:"".concat(100/e,"%")}:void 0}}),[null===N||void 0===N?void 0:N.column,fe]),ve=ie&&d.createElement("div",{style:{minHeight:53}});if(je.length>0){var Oe=je.map((function(e,t){return function(e,t){return R?((n="function"===typeof D?D(e):D?e[D]:e.key)||(n="list-item-".concat(t)),ee[t]=n,R(e,t)):null;var n}(e,t)})),he=d.Children.map(Oe,(function(e,t){return d.createElement("div",{key:ee[t],style:ge},e)}));ve=N?d.createElement(m.a,{gutter:N.gutter},he):d.createElement("ul",{className:"".concat(re,"-items")},Oe)}else w||ie||(ve=function(e,t){return d.createElement("div",{className:"".concat(e,"-empty-text")},K&&K.emptyText||t("List"))}(re,Y||b.a));var pe=se.position||"bottom",xe=d.useMemo((function(){return{grid:N,itemLayout:I}}),[JSON.stringify(N),I]);return d.createElement(k.Provider,{value:xe},d.createElement("div",Object(r.a)({className:le},A),("top"===pe||"both"===pe)&&ue,F&&d.createElement("div",{className:"".concat(re,"-header")},F),d.createElement(v.a,Object(r.a)({},ce),ve,w),T&&d.createElement("div",{className:"".concat(re,"-footer")},T),z||("bottom"===pe||"both"===pe)&&ue))}I.Item=w;t.b=I},1248:function(e,t,n){"use strict";var a=n(88),r=n(76),c=n(127),i=n(0);t.a=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:void 0,n=Object(r.d)((function(t){return t.ProblemSetReducer.problemSetInfo[e]})),o=Object(r.d)((function(t){return t.ProblemSetReducer.problemSetInfo[e+"-cache"]})),l=Object(r.c)(),s=Object(i.useState)(),d=Object(a.a)(s,2),u=d[0],j=d[1],b=Object(i.useState)(),m=Object(a.a)(b,2),f=m[0],g=m[1];return Object(i.useEffect)((function(){u!==e?(void 0===o&&void 0===n?(l({type:"setProblemSetInfo",key:e+"-cache",data:!0}),c.a.getProblemSetInfo({psid:parseInt(e)}).then((function(t){l({type:"setProblemSetInfo",key:e,data:t}),l({type:"setProblemSetInfo",key:e+"-cache",data:void 0}),g(t)})).catch((function(e){t&&t(e)}))):g(n),j(e)):g(n)}),[n,e]),f}},1259:function(e,t,n){"use strict";var a=n(1094),r=n(123),c=n(61),i=(n(0),n(6));t.a=function(e){var t,n,o=e.value,l=e.onChange;return Object(i.jsx)(i.Fragment,{children:Object(i.jsx)(a.a,{checked:1===o,onChange:function(e){l(e?1:0)},checkedChildren:null!==(t=e.ck)&&void 0!==t?t:Object(i.jsx)(r.a,{}),unCheckedChildren:null!==(n=e.unck)&&void 0!==n?n:Object(i.jsx)(c.a,{})})})}},1330:function(e,t,n){"use strict";var a=n(88),r=n(984),c=n(62),i=n(80),o=n(1032),l=n(0),s=n(6);t.a=function(e){var t,n,d,u=Object(l.useState)(240),j=Object(a.a)(u,2),b=j[0],m=j[1],f=Object(l.useState)(!1),g=Object(a.a)(f,2),v=g[0],O=g[1];return Object(l.useEffect)((function(){m(240)}),[e.description,e.answer]),Object(s.jsxs)(s.Fragment,{children:[Object(s.jsx)("div",{children:Object(s.jsx)(r.a,{title:Object(s.jsx)(i.a,{level:5,children:" \u539f\u95ee\u9898 "}),style:{marginTop:24},extra:Object(s.jsx)(c.a,{type:"default",onClick:function(){m(998244353===b?240:998244353)},children:998244353===b?"\u6536\u9f50\u5168\u6587":"\u5c55\u5f00\u5168\u6587"}),children:Object(s.jsx)(o.a,{id:"proDescription",text:(null!==(t=null===e||void 0===e?void 0:e.description)&&void 0!==t?t:"").substr(0,b)})})}),Object(s.jsxs)(r.a,{title:Object(s.jsx)(i.a,{level:5,children:" \u5b66\u751f\u7b54\u6848 "}),style:{marginTop:24},extra:Object(s.jsx)(c.a,{type:"default",onClick:function(){O(!v)},children:v?"\u663e\u793a\u6e32\u67d3":"\u663e\u793a\u539f\u6587"}),children:[v&&Object(s.jsx)("pre",{children:null===e||void 0===e||null===(n=e.answer)||void 0===n?void 0:n[0]}),!v&&Object(s.jsx)(o.a,{id:"userAnswer",text:null===e||void 0===e||null===(d=e.answer)||void 0===d?void 0:d[0]})]})]})}},1399:function(e,t,n){},1425:function(e,t,n){"use strict";n.r(t);var a=n(31),r=n(139),c=n(88),i=n(62),o=n(974),l=n(1006),s=n(307),d=n(174),u=n(978),j=n(981),b=n(982),m=n(984),f=n(120),g=n(0),v=(n(1399),n(421)),O=n(1028),h=n(985),p=n(202),x=n(123),y=n(61),S=n(1032),w=n(6),C=Object(v.a)()((function(e){var t=e.reviewInfo,n=e.setReviewInfo,c=function(e,c){var i,o,l=Object(a.a)({},t),s=e.split("-"),d="";l[e]=null!==(i=l[e])&&void 0!==i?i:0,l[0]=(null!==(o=l[0])&&void 0!==o?o:0)-l[e]+c;var u,j=Object(r.a)(s);try{for(j.s();!(u=j.n()).done;){var b;l[d+=u.value]=(null!==(b=l[d])&&void 0!==b?b:0)+c-l[e],d+="-"}}catch(m){j.e(m)}finally{j.f()}n(l)};return Object(w.jsx)(w.Fragment,{children:function e(n){var a;return Object(w.jsxs)(m.a,{title:n.title,size:"small",bordered:!1,children:[Object(w.jsx)("div",{style:{float:"right"},children:Object(w.jsxs)(o.b,{children:[void 0===n.children&&Object(w.jsxs)(o.b,{children:[Object(w.jsx)(i.a,{type:"primary",shape:"round",size:"small",icon:Object(w.jsx)(x.a,{}),onClick:function(){c(n.key,n.score)}}),Object(w.jsx)(i.a,{type:"primary",shape:"round",size:"small",danger:!0,icon:Object(w.jsx)(y.a,{}),onClick:function(){c(n.key,0)}})]}),Object(w.jsxs)("span",{children:["0"===n.key?"\u603b\u5206\uff1a":"\u5206\u6570\uff1a",void 0===n.children&&Object(w.jsx)(O.a,{style:{width:64},size:"small",min:0,max:n.score,value:t[n.key],onChange:function(e){c(n.key,e)}}),void 0!==n.children&&(null!==(a=t[n.key])&&void 0!==a?a:0)," ","/ ",n.score]})]})}),Object(w.jsx)("div",{style:{marginTop:32},children:void 0===n.children?Object(w.jsxs)(w.Fragment,{children:[void 0!==n.answer&&Object(w.jsx)(h.a,{message:Object(w.jsx)(S.a,{id:"problemReview-answer-".concat(n.key),text:n.answer}),type:"success"}),function(){if(void 0!==n.info)return Object(w.jsx)(p.a.Group,{onChange:function(e){c(n.key,e.target.value)},value:t[n.key],children:Object(w.jsx)(j.a,{children:n.info&&n.info.map((function(e){return Object(w.jsx)(b.a,{span:12,children:Object(w.jsxs)(p.a,{value:e[0],children:[" ",e[0],"\u5206 ",e[1]]})})}))})})}()]}):n.children.map((function(t){return e(t)}))})]})}(e.scoreModeInfo)})})),k=n(1018),I=n(127),z=n(253),N=n(1248),P=n(66),E=n(76),L=n(41),F=n(1330),T=n(1259);t.default=Object(E.b)((function(e){var t;return{username:null===(t=e.UserReducer.userInfo)||void 0===t?void 0:t.username}}),(function(e){return{addTableVersion:function(t){return e({type:"addTableVersion",name:t})}}}))(Object(v.a)()(Object(L.e)((function(e){var t=parseInt(e.match.params.problemSetId),n=Object(N.a)(t.toString()),v=Object(g.useState)({}),O=Object(c.a)(v,2),h=O[0],p=O[1],x=Object(g.useState)({}),y=Object(c.a)(x,2),S=y[0],E=y[1],L=Object(g.useState)(),J=Object(c.a)(L,2),V=J[0],D=J[1],R=Object(g.useState)(!1),K=Object(c.a)(R,2),A=K[0],M=K[1],B=Object(g.useState)(0),_=Object(c.a)(B,2),$=_[0],U=_[1],q=Object(g.useState)(!1),Q=Object(c.a)(q,2),W=Q[0],G=Q[1];Object(g.useEffect)((function(){!1===A&&(p({}),E({}))}),[t,A]);var H=[];if(void 0!==n){var X,Y=Object(r.a)(n.groupInfo);try{for(Y.s();!(X=Y.n()).done;){var Z=X.value;if(1===Z.type){var ee,te=Object(r.a)(Z.problemInfo);try{for(te.s();!(ee=te.n()).done;){var ne=ee.value;H.push({value:"".concat(Z.index,"-").concat(ne.index),label:Z.name+"-"+(ne.index+1).toString()})}}catch(re){te.e(re)}finally{te.f()}}}}catch(re){Y.e(re)}finally{Y.f()}}var ae=function(e){I.a.getJudgeInfo({psid:t,gid:e.gid,pid:e.pid,username:e.username}).then((function(t){for(var n=0;n<t.judgeConfig.length;n++){var a=t.judgeConfig[n];a.title=a.name,a.key=(n+1).toString()}if(t.judgeConfig={key:"0",score:100,children:t.judgeConfig},t.pid=e.pid,t.gid=e.gid,!Object(P.c)(t.judgeLog)){for(var r=0,c={},i=0;i<t.judgeLog.length;i++){var o=t.judgeLog[i];c[(i+1).toString()]=o.jScore,r+=o.jScore}c[0]=r,p(c)}E(t),D(t.judgeComment),M(!0)}))};return Object(w.jsxs)("div",{style:{marginTop:24},className:"ListPage",children:[Object(w.jsx)(k.a,{name:"problemSetSubjectiveJudgeList",columns:[{title:"\u9898\u76ee\u540d",dataIndex:"name",key:"name"},{title:"\u7528\u6237\u540d",dataIndex:"username",key:"username"},{title:"\u63d0\u4ea4\u65f6\u95f4",dataIndex:"tm_answer_submit",key:"tm_answer_submit",render:function(e){return Object(z.e)(e)}},{title:"\u6279\u9605\u72b6\u6001",dataIndex:"hasJudge",key:"hasJudge",render:function(e){return e?"\u5df2\u6279\u9605":"\u672a\u6279\u9605"}},{title:"\u6279\u9605\u4eba",dataIndex:"judgeLock",key:"judgeLock"},{title:"\u64cd\u4f5c",key:"operator",render:function(e){return Object(w.jsx)(i.a,{type:"link",onClick:function(){ae(e)},children:"\u5f00\u59cb\u6253\u5206"})}}],API:function(e){return I.a.getJudgeList(Object(a.a)({psid:t},e)).then((function(e){if(1===$&&0!==e.rows.length&&W)for(var t=0;t<e.rows.length;t++)if(!e.rows[t].hasJudge){ae(e.rows[t]);break}return G(!1),Promise.resolve(e)}))},size:"small",getForm:function(e){return Object(w.jsxs)(o.b,{size:30,children:[Object(w.jsx)(l.a.Item,{label:"\u7528\u6237\u540d",name:"username",children:Object(w.jsx)(s.a,{onPressEnter:function(){e()}})}),Object(w.jsx)(l.a.Item,{label:"\u6279\u9605\u4eba",name:"judgeLock",children:Object(w.jsx)(s.a,{onPressEnter:function(){e()}})}),Object(w.jsx)(l.a.Item,{label:"\u6279\u9605\u72b6\u6001",name:"hasJudge",children:Object(w.jsx)(d.a,{onChange:e,style:{width:120},allowClear:!0,options:[{value:0,label:"\u672a\u6279\u9605"},{value:1,label:"\u5df2\u6279\u9605"}]})}),Object(w.jsx)(l.a.Item,{label:"\u9898\u76ee",name:"proStr",children:Object(w.jsx)(d.a,{onChange:e,style:{width:240},allowClear:!0,options:H})})]})},useFormBtn:!1}),Object(w.jsx)("div",{style:{marginTop:12,float:"right"},children:Object(w.jsx)("span",{children:"\u63d0\u793a\uff1a\u5982\u679c\u5bf9\u4e3b\u89c2\u9898\u8fdb\u884c\u4e86\u6279\u9605\uff0c\u4f1a\u5bfc\u81f4\u5b66\u751f\u65e0\u6cd5\u518d\u6b21\u63d0\u4ea4\uff0c\u8bf7\u786e\u5b9a\u4f5c\u7b54\u5b8c\u6210\u540e\u518d\u8fdb\u884c\u6279\u9605"})}),Object(w.jsx)(u.a,{title:"\u4e3b\u89c2\u9898\u8bc4\u5206",width:1400,visible:A,maskClosable:!1,onCancel:function(){M(!1),e.addTableVersion("problemSetSubjectiveJudgeList")},footer:!1,destroyOnClose:!0,children:Object(w.jsxs)(j.a,{gutter:24,children:[Object(w.jsx)(b.a,{span:14,children:Object(w.jsx)(F.a,{description:null===S||void 0===S?void 0:S.description,answer:null===S||void 0===S?void 0:S.answer})}),Object(w.jsx)(b.a,{span:10,children:Object(w.jsx)(m.a,{className:"scorePane",title:"\u5206\u6570\u9762\u677f",children:Object(w.jsxs)("div",{children:[Object(w.jsx)(C,{reviewInfo:h,setReviewInfo:p,scoreModeInfo:S.judgeConfig}),Object(w.jsx)(l.a,{layout:"vertical",style:{marginBottom:32},children:Object(w.jsx)(l.a.Item,{label:"\u8bc4\u9605\u5907\u6ce8",children:Object(w.jsx)(s.a.TextArea,{value:V,onChange:function(e){D(e.target.value)}})})}),Object(w.jsx)("div",{style:{marginTop:12,marginBottom:12},children:Object(w.jsx)(l.a.Item,{label:"\u81ea\u52a8\u6253\u5f00\u4e0b\u4e00\u4e2a",children:Object(w.jsx)(T.a,{value:$,onChange:U,ck:"Auto Next",unck:"Manual Next"})})}),Object(w.jsx)(i.a,{disabled:S.judgeLock_username!==e.username,block:!0,type:"primary",onClick:function(){if(Object.keys(h).length<S.judgeConfig.children.length+1)f.b.error("\u5206\u6570\u4e0d\u5b8c\u6574");else{for(var n=[],a=0;a<S.judgeConfig.children.length;a++){var r=S.judgeConfig.children[a];n.push({name:r.name,score:r.score,jScore:h[a+1]})}I.a.updateJudgeInfo({psid:t,gid:S.gid,pid:S.pid,username:S.username,judgeLog:n,judgeComment:V}).then((function(){G(!0),M(!1),e.addTableVersion("problemSetSubjectiveJudgeList")}))}},children:" \u63d0\u4ea4\u5206\u6570 "}),Object(w.jsxs)(i.a,{disabled:S.judgeLock_username!==e.username||0!==Object.keys(h).length,block:!0,style:{marginTop:12},type:"ghost",danger:!0,onClick:function(){for(var n=[],a=0;a<S.judgeConfig.children.length;a++){var r=S.judgeConfig.children[a];n.push({name:r.name,score:r.score,jScore:r.score})}I.a.updateJudgeInfo({psid:t,gid:S.gid,pid:S.pid,username:S.username,judgeLog:n,judgeComment:V}).then((function(){G(!0),M(!1),e.addTableVersion("problemSetSubjectiveJudgeList")}))},children:["\u8bbe\u4e3a",Object(w.jsx)("span",{style:{fontWeight:"bolder"},children:"\u6ee1\u5206"}),"\u5e76\u63d0\u4ea4\u5206\u6570"]}),S.judgeLock_username===e.username&&Object(w.jsx)(i.a,{danger:!0,block:!0,type:"primary",style:{marginTop:12},onClick:function(){I.a.updateJudgeInfo({psid:t,gid:S.gid,pid:S.pid,username:S.username,judgeLog:[],cancel:1}).then((function(){M(!1),e.addTableVersion("problemSetSubjectiveJudgeList")}))},children:"\u53d6\u6d88\u8bc4\u6d4b"})]})})})]})})]})}))))}}]);
//# sourceMappingURL=44.4b3c4a81.chunk.js.map