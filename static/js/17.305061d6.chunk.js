(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[17],{1023:function(e,t,a){"use strict";var n=a(27),r=a(66),o=a(991),c=a(313),i=a(981),l=a(64),s=a(1107),u=a(990),d=a(0),m=a(91),b=a(71),p=a(312),j=a(43),f=a(316),h=a(63),g=a(306),O=a(6);t.a=Object(b.b)((function(e){var t,a=e.UserReducer,r=e.TableReduce;return{roles:null===(t=a.userInfo)||void 0===t?void 0:t.roles,tableData:Object(n.a)({},r.tableData)}}),(function(e){return{setTableInfo:function(t,a){return e({type:"setTableInfo",name:t,data:a})},setDataSource:function(t,a){return e({type:"setDataSource",data:t,name:a,add:!1})}}}))(Object(p.a)()(Object(j.e)((function(e){var t,a,b=Object(d.useState)(0),p=Object(r.a)(b,2),j=p[0],v=p[1],y=Object(d.useState)(),x=Object(r.a)(y,2),S=x[0],w=x[1],C=Object(d.useState)(!0),N=Object(r.a)(C,2),z=N[0],P=N[1],E=Object(d.useState)(1),I=Object(r.a)(E,2),k=I[0],F=I[1],L=Object(d.useState)(Object(h.a)(e.defaultPageSize,m.h)),T=Object(r.a)(L,2),D=T[0],A=T[1],K=Object(d.useState)(),M=Object(r.a)(K,2),V=M[0],J=M[1],R=Object(d.useState)(0),B=Object(r.a)(R,2),W=B[0],Q=B[1],U=function(t){w(t),void 0!==e.setDataSource&&void 0!==e.name&&e.setDataSource(t,e.name)},q=function(t,a,r,o){var c,i,l,s,u,d,m,b,p,j=null===(c=e.tableData[e.name])||void 0===c?void 0:c.tableInfo;void 0!==j&&(void 0===o&&void 0!==j.moreProps&&G.setFieldsValue(j.moreProps),t=null!==(d=t)&&void 0!==d?d:j.pageNow,a=null!==(m=a)&&void 0!==m?m:j.pageSize,r=null!==(b=r)&&void 0!==b?b:j.searchKey,o=null!==(p=o)&&void 0!==p?p:j.moreProps);var f=null!==(i=t)&&void 0!==i?i:k,h=null!==(l=a)&&void 0!==l?l:D,g=null!==(s=r)&&void 0!==s?s:V,O=null!==(u=o)&&void 0!==u?u:G.getFieldsValue();F(f),A(h),J(g),P(!0),e.API(Object(n.a)({pageNow:f,pageSize:h,searchKey:g},O)).then((function(t){null===t.rows&&(t.rows=[]),void 0!==e.APIRowsTransForm?U(e.APIRowsTransForm(t.rows)):U(t.rows),void 0!==t.totalNum&&"0"!==t.totalNum?(v(t.totalNum),e.name&&e.setTableInfo(e.name,{total:t.totalNum,pageNow:f,pageSize:h,searchKey:g,moreProps:O})):(v(h*t.totalPage),e.name&&e.setTableInfo(e.name,{total:h*t.totalPage,pageNow:f,pageSize:h,searchKey:g,moreProps:O})),P(!1)}))};Object(d.useEffect)((function(){G.setFieldsValue(e.initRequestProps),q()}),[e.name]);var H=Object(g.a)(),G=Object(r.a)(H,1)[0],X=function(){var e=G.getFieldsValue();"{}"!==JSON.stringify(e)&&q(1,D,void 0,e)},Y=function(){var t,a=G.getFieldsValue();G.resetFields();var n=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableInfo;e.name&&e.setTableInfo(e.name,{total:n.total,pageNow:n.pageNow,pageSize:n.pageSize,searchKey:n.searchKey,moreProps:void 0});var r=G.getFieldsValue();JSON.stringify(a)!==JSON.stringify(r)&&q(1,D,void 0,void 0)};return Object(d.useEffect)((function(){var t,a=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableVersion;if(void 0!==a&&W!==a)if(a<0){var n;Q(-a),w(null===(n=e.tableData[e.name])||void 0===n?void 0:n.dataSource)}else{Q(a);var r=G.getFieldsValue();q(k,D,V,r)}}),[e.tableData,W]),Object(O.jsxs)(O.Fragment,{children:[e.useList&&Object(O.jsx)(o.a,{title:e.title,bordered:!0,size:"default",className:null!==(t=e.cardProps)&&void 0!==t?t:"zeroBodyPaddingLeft",extra:(!0===e.search||void 0!==e.getForm)&&Object(O.jsxs)(O.Fragment,{children:[!0===e.search&&Object(O.jsx)(f.a,{placeholder:e.t("searchUser"),onSearch:function(e){J(e),F(1);var t=G.getFieldsValue();q(1,D,e,t)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(O.jsxs)(c.a,{form:G,children:[e.getForm(X),e.useFormBtn&&Object(O.jsxs)(i.b,{style:{marginLeft:"30px"},size:20,children:[Object(O.jsx)(l.a,{type:"primary",onClick:X,children:"\u7b5b\u9009"}),Object(O.jsx)(l.a,{htmlType:"button",onClick:Y,children:"\u91cd\u7f6e"})]})]})]}),children:Object(O.jsx)(s.b,{grid:e.grid,itemLayout:"vertical",loading:z,size:e.size,dataSource:S,renderItem:e.renderItem,pagination:{onChange:function(e,t){q(e,t)},current:k,pageSize:D,total:j,size:"small",hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(h.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})}),!e.useList&&Object(O.jsx)(o.a,{bordered:!1,size:"small",extra:(!0===e.search||void 0!==e.getForm)&&Object(O.jsxs)(O.Fragment,{children:[!0===e.search&&Object(O.jsx)(f.a,{placeholder:"\u641c\u7d22",onSearch:function(e){J(e),F(1),q(1,D,e)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(O.jsxs)(c.a,{form:G,children:[e.getForm(X),Object(O.jsxs)(i.b,{style:{marginLeft:"30px"},size:20,children:[Object(O.jsx)(l.a,{type:"primary",onClick:X,children:e.t("filtering")}),Object(O.jsx)(l.a,{htmlType:"button",onClick:Y,children:e.t("Reset")})]})]})]}),children:Object(O.jsx)(u.a,{rowKey:e.rowKey,loading:z,size:e.size,columns:e.columns,rowSelection:e.rowSelection,dataSource:S,pagination:null!==(a=e.pagination)&&void 0!==a?a:{onChange:function(e,t){q(e,t)},current:k,pageSize:D,total:j,hideOnSinglePage:!1,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(h.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})})]})}))))},1107:function(e,t,a){"use strict";a.d(t,"a",(function(){return N}));var n=a(18),r=a(3),o=a(5),c=a(12),i=a(17),l=a(2),s=a.n(l),u=a(0),d=a.n(u),m=a(39),b=a(196),p=a(978),j=a(148),f=a(321),h=a(254),g=a(117),O=a(189),v=a(25),y=function(e,t){var a={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(a[n]=e[n]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(n=Object.getOwnPropertySymbols(e);r<n.length;r++)t.indexOf(n[r])<0&&Object.prototype.propertyIsEnumerable.call(e,n[r])&&(a[n[r]]=e[n[r]])}return a},x=function(e,t){var a=e.prefixCls,n=e.children,c=e.actions,i=e.extra,l=e.className,b=e.colStyle,p=y(e,["prefixCls","children","actions","extra","className","colStyle"]),j=Object(u.useContext)(N),f=j.grid,h=j.itemLayout,g=Object(u.useContext)(m.b).getPrefixCls,x=g("list",a),S=c&&c.length>0&&d.a.createElement("ul",{className:"".concat(x,"-item-action"),key:"actions"},c.map((function(e,t){return d.a.createElement("li",{key:"".concat(x,"-item-action-").concat(t)},e,t!==c.length-1&&d.a.createElement("em",{className:"".concat(x,"-item-action-split")}))}))),w=f?"div":"li",C=d.a.createElement(w,Object(r.a)({},p,f?{}:{ref:t},{className:s()("".concat(x,"-item"),Object(o.a)({},"".concat(x,"-item-no-flex"),!("vertical"===h?i:!function(){var e;return u.Children.forEach(n,(function(t){"string"===typeof t&&(e=!0)})),e&&u.Children.count(n)>1}())),l)}),"vertical"===h&&i?[d.a.createElement("div",{className:"".concat(x,"-item-main"),key:"content"},n,S),d.a.createElement("div",{className:"".concat(x,"-item-extra"),key:"extra"},i)]:[n,S,Object(v.a)(i,{key:"extra"})]);return f?d.a.createElement(O.a,{ref:t,flex:1,style:b},C):C},S=Object(u.forwardRef)(x);S.Meta=function(e){var t=e.prefixCls,a=e.className,n=e.avatar,o=e.title,c=e.description,i=y(e,["prefixCls","className","avatar","title","description"]),l=(0,Object(u.useContext)(m.b).getPrefixCls)("list",t),b=s()("".concat(l,"-item-meta"),a),p=d.a.createElement("div",{className:"".concat(l,"-item-meta-content")},o&&d.a.createElement("h4",{className:"".concat(l,"-item-meta-title")},o),c&&d.a.createElement("div",{className:"".concat(l,"-item-meta-description")},c));return d.a.createElement("div",Object(r.a)({},i,{className:b}),n&&d.a.createElement("div",{className:"".concat(l,"-item-meta-avatar")},n),(o||c)&&p)};var w=S,C=function(e,t){var a={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(a[n]=e[n]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var r=0;for(n=Object.getOwnPropertySymbols(e);r<n.length;r++)t.indexOf(n[r])<0&&Object.prototype.propertyIsEnumerable.call(e,n[r])&&(a[n[r]]=e[n[r]])}return a},N=u.createContext({});N.Consumer;function z(e){var t,a=e.pagination,l=void 0!==a&&a,d=e.prefixCls,O=e.bordered,v=void 0!==O&&O,y=e.split,x=void 0===y||y,S=e.className,w=e.children,z=e.itemLayout,P=e.loadMore,E=e.grid,I=e.dataSource,k=void 0===I?[]:I,F=e.size,L=e.header,T=e.footer,D=e.loading,A=void 0!==D&&D,K=e.rowKey,M=e.renderItem,V=e.locale,J=C(e,["pagination","prefixCls","bordered","split","className","children","itemLayout","loadMore","grid","dataSource","size","header","footer","loading","rowKey","renderItem","locale"]),R=l&&"object"===Object(i.a)(l)?l:{},B=u.useState(R.defaultCurrent||1),W=Object(c.a)(B,2),Q=W[0],U=W[1],q=u.useState(R.defaultPageSize||10),H=Object(c.a)(q,2),G=H[0],X=H[1],Y=u.useContext(m.b),Z=Y.getPrefixCls,$=Y.renderEmpty,_=Y.direction,ee={},te=function(e){return function(t,a){U(t),X(a),l&&l[e]&&l[e](t,a)}},ae=te("onChange"),ne=te("onShowSizeChange"),re=Z("list",d),oe=A;"boolean"===typeof oe&&(oe={spinning:oe});var ce=oe&&oe.spinning,ie="";switch(F){case"large":ie="lg";break;case"small":ie="sm"}var le=s()(re,(t={},Object(o.a)(t,"".concat(re,"-vertical"),"vertical"===z),Object(o.a)(t,"".concat(re,"-").concat(ie),ie),Object(o.a)(t,"".concat(re,"-split"),x),Object(o.a)(t,"".concat(re,"-bordered"),v),Object(o.a)(t,"".concat(re,"-loading"),ce),Object(o.a)(t,"".concat(re,"-grid"),!!E),Object(o.a)(t,"".concat(re,"-something-after-last-item"),!!(P||l||T)),Object(o.a)(t,"".concat(re,"-rtl"),"rtl"===_),t),S),se=Object(r.a)(Object(r.a)(Object(r.a)({},{current:1,total:0}),{total:k.length,current:Q,pageSize:G}),l||{}),ue=Math.ceil(se.total/se.pageSize);se.current>ue&&(se.current=ue);var de=l?u.createElement("div",{className:"".concat(re,"-pagination")},u.createElement(f.a,Object(r.a)({},se,{onChange:ae,onShowSizeChange:ne}))):null,me=Object(n.a)(k);l&&k.length>(se.current-1)*se.pageSize&&(me=Object(n.a)(k).splice((se.current-1)*se.pageSize,se.pageSize));var be=Object.keys(E||{}).some((function(e){return["xs","sm","md","lg","xl","xxl"].includes(e)})),pe=Object(j.a)(be),je=u.useMemo((function(){for(var e=0;e<g.b.length;e+=1){var t=g.b[e];if(pe[t])return t}}),[pe]),fe=u.useMemo((function(){if(E){var e=je&&E[je]?E[je]:E.column;return e?{width:"".concat(100/e,"%"),maxWidth:"".concat(100/e,"%")}:void 0}}),[null===E||void 0===E?void 0:E.column,je]),he=ce&&u.createElement("div",{style:{minHeight:53}});if(me.length>0){var ge=me.map((function(e,t){return function(e,t){return M?((a="function"===typeof K?K(e):K?e[K]:e.key)||(a="list-item-".concat(t)),ee[t]=a,M(e,t)):null;var a}(e,t)})),Oe=u.Children.map(ge,(function(e,t){return u.createElement("div",{key:ee[t],style:fe},e)}));he=E?u.createElement(p.a,{gutter:E.gutter},Oe):u.createElement("ul",{className:"".concat(re,"-items")},ge)}else w||ce||(he=function(e,t){return u.createElement("div",{className:"".concat(e,"-empty-text")},V&&V.emptyText||t("List"))}(re,$||b.a));var ve=se.position||"bottom",ye=u.useMemo((function(){return{grid:E,itemLayout:z}}),[JSON.stringify(E),z]);return u.createElement(N.Provider,{value:ye},u.createElement("div",Object(r.a)({className:le},J),("top"===ve||"both"===ve)&&de,L&&u.createElement("div",{className:"".concat(re,"-header")},L),u.createElement(h.a,Object(r.a)({},oe),he,w),T&&u.createElement("div",{className:"".concat(re,"-footer")},T),P||("bottom"===ve||"both"===ve)&&de))}z.Item=w;t.b=z},1379:function(e,t,a){"use strict";a.r(t);var n=a(142),r=a(143),o=a(145),c=a(144),i=a(0),l=a(43),s=a(991),u=a(981),d=a(64),m=a(986),b=a(105),p=a(1023),j=a(128),f=a(91),h=a(312),g=a(6),O=function(e){Object(o.a)(a,e);var t=Object(c.a)(a);function a(e,r){var o;return Object(n.a)(this,a),(o=t.call(this,e,r)).state={ACList:[]},o}return Object(r.a)(a,[{key:"componentDidMount",value:function(){var e=this;b.a.getACProblem().then((function(t){e.setState({ACList:t})}))}},{key:"render",value:function(){var e=this;return Object(g.jsx)(g.Fragment,{children:Object(g.jsx)("div",{style:{textAlign:"center",margin:"0 auto"},children:Object(g.jsx)("div",{style:{textAlign:"left",maxWidth:"1500px",margin:"0 auto"},children:Object(g.jsx)(s.a,{title:this.props.t("ProblemList"),children:Object(g.jsx)(p.a,{API:b.a.getProblemList,columns:[{title:this.props.t("problemCode"),dataIndex:"problemCode",key:"problemCode",width:"120px",render:function(e){var t=e.split("-");return Object(g.jsxs)(g.Fragment,{children:[Object(g.jsx)("span",{style:{fontWeight:"bold"},children:t[0]}),"-",Object(g.jsx)("span",{children:t[1]})]})}},{title:this.props.t("title"),dataIndex:"problemTitle",key:"problemTitle",width:"300px",render:function(t,a){return Object(g.jsx)(g.Fragment,{children:Object(g.jsxs)(u.b,{size:3,children:[Object(g.jsx)(d.a,{size:"small",type:"text",onClick:function(){e.props.history.push(f.g+"/problem/"+a.problemCode)},children:t}),[""].map((function(){if(-1!==e.state.ACList.indexOf(a.problemCode))return Object(g.jsx)(j.a,{style:{color:"green"}})})),[""].map((function(){if(0===a.isPublic)return Object(g.jsx)(m.a,{color:"orange",children:e.props.t("private")})}))]})})}},{title:this.props.t("source"),dataIndex:"source",key:"source",width:"450px"},{title:this.props.t("acceptNumber"),dataIndex:"acceptNum",key:"acceptNum",width:"120px"}],size:"small",name:"C-ProblemList-Main"})})})})})}}]),a}(i.Component);t.default=Object(h.a)()(Object(l.e)(O))}}]);
//# sourceMappingURL=17.305061d6.chunk.js.map