(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[19],{1124:function(e,t,r){"use strict";var n=r(3),s=r(18),a=r(0),i=r(310),c=function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var s=0;for(n=Object.getOwnPropertySymbols(e);s<n.length;s++)t.indexOf(n[s])<0&&Object.prototype.propertyIsEnumerable.call(e,n[s])&&(r[n[s]]=e[n[s]])}return r},o=function(e,t){var r=e.ellipsis,s=e.rel,o=c(e,["ellipsis","rel"]),l=a.useRef(null);a.useImperativeHandle(t,(function(){return l.current}));var j=Object(n.a)(Object(n.a)({},o),{rel:void 0===s&&"_blank"===o.target?"noopener noreferrer":s});return delete j.navigate,a.createElement(i.a,Object(n.a)({},j,{ref:l,ellipsis:!!r,component:"a"}))},l=a.forwardRef(o),j=function(e,t){return a.createElement(i.a,Object(n.a)({ref:t},e,{component:"div"}))},u=a.forwardRef(j),p=r(30),d=function(e,t){var r={};for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&t.indexOf(n)<0&&(r[n]=e[n]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var s=0;for(n=Object.getOwnPropertySymbols(e);s<n.length;s++)t.indexOf(n[s])<0&&Object.prototype.propertyIsEnumerable.call(e,n[s])&&(r[n[s]]=e[n[s]])}return r},b=function(e,t){var r=e.ellipsis,c=d(e,["ellipsis"]),o=a.useMemo((function(){return r&&"object"===Object(s.a)(r)?Object(p.a)(r,["expandable","rows"]):r}),[r]);return a.createElement(i.a,Object(n.a)({ref:t},c,{ellipsis:o,component:"span"}))},O=a.forwardRef(b),m=r(80),g=r(323).a;g.Text=O,g.Link=l,g.Title=m.a,g.Paragraph=u;t.a=g},1381:function(e,t,r){"use strict";r.r(t);r(0);var n=r(41),s=r(974),a=r(1006),i=r(307),c=r(174),o=r(1125),l=r(984),j=r(979),u=r(1124),p=r(127),d=r(977),b=r(1446),O=r(253),m=r(1237),g=r(66),x=r(1382),f=r(1383),h=r(99),y=r(1018),v=r(408),I=r(6);t.default=Object(n.e)((function(e){var t=Object(v.a)().t;return Object(I.jsx)(I.Fragment,{children:Object(I.jsx)("div",{style:{textAlign:"center",margin:"0 auto"},children:Object(I.jsx)("div",{style:{textAlign:"left",maxWidth:"1500px",margin:"0 auto"},children:Object(I.jsx)("div",{className:"GroupPage",children:Object(I.jsx)(y.a,{useList:!0,cardProps:{},name:"GroupList",title:t("group"),API:p.a.getGroupList,size:"small",grid:{gutter:8,column:4,md:2,lg:3,xl:3,sm:2,xs:1},initRequestProps:{isParticipating:"1"},getForm:function(e){return Object(I.jsxs)(s.b,{size:30,children:[Object(I.jsx)(a.a.Item,{label:t("Search"),name:"title",children:Object(I.jsx)(i.a,{onPressEnter:function(){e()}})}),Object(I.jsx)(a.a.Item,{label:t("Classification"),name:"isParticipating",children:Object(I.jsxs)(c.a,{onChange:e,style:{width:80},defaultValue:"1",children:[Object(I.jsx)(c.a.Option,{value:"1",children:t("Mine")}),Object(I.jsx)(c.a.Option,{value:"0",children:t("All")})]})})]})},useFormBtn:!1,defaultPageSize:12,renderItem:function(r){return null===r.status&&(r.status=0),Object(I.jsx)(o.b.Item,{children:Object(I.jsx)(l.a,{extra:Object(I.jsxs)(I.Fragment,{children:[1===r.status&&Object(I.jsx)(j.a,{color:"green",children:t("ApplicationInProgress")}),2===r.status&&Object(I.jsx)(x.a,{groupId:r.groupId,groupName:r.title}),3===r.status&&Object(I.jsx)(j.a,{color:"orange",children:t("ApplicationRejected")}),(0===r.status||3===r.status)&&2!==r.openness&&Object(I.jsx)(f.a,{groupId:r.groupId,groupName:r.title}),0===r.status&&2===r.openness&&Object(I.jsx)(j.a,{color:"red",children:t("private")})]}),title:Object(I.jsx)("a",{type:"text",href:h.g+"/group/"+r.groupId,children:Object(I.jsx)(u.a.Title,{level:5,ellipsis:{rows:1,tooltip:r.title},style:{marginBottom:0},onClick:function(){e.history.push(h.g+"/group/"+r.groupId)},children:r.title})}),size:"small",className:"GroupListItemCard",actions:[Object(I.jsxs)("span",{children:[" ",Object(I.jsx)(d.a,{})," ",Object(O.d)(r.gmtCreate)]}),Object(I.jsxs)("span",{children:[" ",Object(I.jsx)(b.a,{})," ",r.memberNum]})],children:Object(I.jsx)(o.b.Item.Meta,{style:{padding:12,margin:0},avatar:Object(I.jsx)("div",{onClick:function(){e.history.push(h.g+"/group/"+r.groupId)},children:Object(I.jsx)(m.a,{email:r.owner.email,shape:"square",size:60})}),description:Object(I.jsxs)(I.Fragment,{children:[Object(I.jsxs)("div",{children:[t("creator:"),r.owner.username]}),Object(I.jsx)("div",{children:Object(I.jsxs)(u.a.Paragraph,{ellipsis:{rows:2,expandable:!0,symbol:t("more")},style:{marginBottom:0,color:"rgba(0, 0, 0, 0.45)"},children:[t("introduction:"),Object(g.c)(r.description)?t("none"):r.description]})})]})})})},r.groupId)}})})})})})}))}}]);
//# sourceMappingURL=19.494c8a13.chunk.js.map