(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[9],{1018:function(e,t,a){"use strict";var n=a(31),r=a(88),i=a(984),o=a(1006),c=a(974),l=a(62),s=a(1125),u=a(983),d=a(0),b=a(99),j=a(76),m=a(421),p=a(41),f=a(309),h=a(66),O=a(1376),v=a(6);t.a=Object(j.b)((function(e){var t,a=e.UserReducer,r=e.TableReduce;return{roles:null===(t=a.userInfo)||void 0===t?void 0:t.roles,tableData:Object(n.a)({},r.tableData)}}),(function(e){return{setTableInfo:function(t,a){return e({type:"setTableInfo",name:t,data:a})},setDataSource:function(t,a){return e({type:"setDataSource",data:t,name:a,add:!1})}}}))(Object(m.a)()(Object(p.e)((function(e){var t,a=Object(d.useState)(0),j=Object(r.a)(a,2),m=j[0],p=j[1],g=Object(d.useState)(),x=Object(r.a)(g,2),y=x[0],w=x[1],F=Object(d.useState)(!0),S=Object(r.a)(F,2),I=S[0],T=S[1],C=Object(d.useState)(1),N=Object(r.a)(C,2),z=N[0],P=N[1],k=Object(d.useState)(Object(h.a)(e.defaultPageSize,b.h)),D=Object(r.a)(k,2),L=D[0],V=D[1],E=Object(d.useState)(),K=Object(r.a)(E,2),R=K[0],q=K[1],M=Object(d.useState)(0),A=Object(r.a)(M,2),J=A[0],B=A[1],U=function(t){w(t),void 0!==e.setDataSource&&void 0!==e.name&&e.setDataSource(t,e.name)},Q=function(t,a,r,i){var o,c,l,s,u,d,b,j,m,f=null===(o=e.tableData[e.name])||void 0===o?void 0:o.tableInfo;void 0!==f&&(void 0===i&&void 0!==f.moreProps&&H.setFieldsValue(f.moreProps),t=null!==(d=t)&&void 0!==d?d:f.pageNow,a=null!==(b=a)&&void 0!==b?b:f.pageSize,r=null!==(j=r)&&void 0!==j?j:f.searchKey,i=null!==(m=i)&&void 0!==m?m:f.moreProps);var h=null!==(c=t)&&void 0!==c?c:z,O=null!==(l=a)&&void 0!==l?l:L,v=null!==(s=r)&&void 0!==s?s:R,g=null!==(u=i)&&void 0!==u?u:H.getFieldsValue();P(h),V(O),q(v),T(!0),e.API(Object(n.a)({pageNow:h,pageSize:O,searchKey:v},g)).then((function(t){null===t.rows&&(t.rows=[]),void 0!==e.APIRowsTransForm?U(e.APIRowsTransForm(t.rows)):U(t.rows),void 0!==t.totalNum&&"0"!==t.totalNum?(p(t.totalNum),e.name&&e.setTableInfo(e.name,{total:t.totalNum,pageNow:h,pageSize:O,searchKey:v,moreProps:g})):(p(O*t.totalPage),e.name&&e.setTableInfo(e.name,{total:O*t.totalPage,pageNow:h,pageSize:O,searchKey:v,moreProps:g})),T(!1)}))};Object(d.useEffect)((function(){H.setFieldsValue(e.initRequestProps),Q()}),[e.name]);var W=Object(O.a)(),H=Object(r.a)(W,1)[0],Z=function(){var e=H.getFieldsValue();"{}"!==JSON.stringify(e)&&Q(1,L,void 0,e)},_=function(){var t,a=H.getFieldsValue();H.resetFields();var n=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableInfo;e.name&&e.setTableInfo(e.name,{total:n.total,pageNow:n.pageNow,pageSize:n.pageSize,searchKey:n.searchKey,moreProps:void 0});var r=H.getFieldsValue();JSON.stringify(a)!==JSON.stringify(r)&&Q(1,L,void 0,void 0)};return Object(d.useEffect)((function(){var t,a=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableVersion;if(void 0!==a&&J!==a)if(a<0){var n;B(-a),w(null===(n=e.tableData[e.name])||void 0===n?void 0:n.dataSource)}else{B(a);var r=H.getFieldsValue();Q(z,L,R,r)}}),[e.tableData,J]),Object(v.jsxs)(v.Fragment,{children:[e.useList&&Object(v.jsx)(i.a,{title:e.title,bordered:!0,size:"default",className:null!==(t=e.cardProps)&&void 0!==t?t:"zeroBodyPaddingLeft",extra:(!0===e.search||void 0!==e.getForm)&&Object(v.jsxs)(v.Fragment,{children:[!0===e.search&&Object(v.jsx)(f.a,{placeholder:e.t("searchUser"),onSearch:function(e){q(e),P(1);var t=H.getFieldsValue();Q(1,L,e,t)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(v.jsxs)(o.a,{form:H,children:[e.getForm(Z),e.useFormBtn&&Object(v.jsxs)(c.b,{style:{marginLeft:"30px"},size:20,children:[Object(v.jsx)(l.a,{type:"primary",onClick:Z,children:"\u7b5b\u9009"}),Object(v.jsx)(l.a,{htmlType:"button",onClick:_,children:"\u91cd\u7f6e"})]})]})]}),children:Object(v.jsx)(s.b,{grid:e.grid,itemLayout:"vertical",loading:I,size:e.size,dataSource:y,renderItem:e.renderItem,pagination:{onChange:function(e,t){Q(e,t)},current:z,pageSize:L,total:m,size:"small",hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(h.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})}),!e.useList&&Object(v.jsx)(i.a,{bordered:!1,size:"small",extra:(!0===e.search||void 0!==e.getForm)&&Object(v.jsxs)(v.Fragment,{children:[!0===e.search&&Object(v.jsx)(f.a,{placeholder:"\u641c\u7d22",onSearch:function(e){q(e),P(1),Q(1,L,e)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(v.jsxs)(o.a,{form:H,children:[e.getForm(Z),Object(v.jsxs)(c.b,{style:{marginLeft:"30px"},size:20,children:[Object(v.jsx)(l.a,{type:"primary",onClick:Z,children:e.t("filtering")}),Object(v.jsx)(l.a,{htmlType:"button",onClick:_,children:e.t("Reset")})]})]})]}),children:Object(v.jsx)(u.a,{rowKey:e.rowKey,loading:I,size:e.size,columns:e.columns,rowSelection:e.rowSelection,dataSource:y,pagination:{onChange:function(e,t){Q(e,t)},current:z,pageSize:L,total:m,hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(h.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})})]})}))))},1034:function(e,t,a){"use strict";var n=a(9),r=a(31),i=a(88),o=a(4),c=a.n(o),l=a(0),s=a(76),u=a(421),d=a(41),b=a(120),j=a(62),m=a(978),p=a(1006),f=a(416),h=a(418),O=a(66),v=a(1376),g=a(1205),x=a(6);t.a=Object(s.b)((function(){return{}}),(function(e){return{addTableVersion:function(t){return e({type:"addTableVersion",name:t})},addManageInitData:function(t,a){return e({type:"addManageInitData",key:t,data:a})}}}))(Object(u.a)()(Object(d.e)((function(e){var t,a=Object(v.a)(),o=Object(i.a)(a,1)[0],s=Object(l.useRef)([]),u=Object(l.useState)(!1),d=Object(i.a)(u,2),y=d[0],w=d[1],F=Object(l.useState)(),S=Object(i.a)(F,2),I=S[0],T=S[1],C=Object(l.useState)(0),N=Object(i.a)(C,2),z=N[0],P=N[1];Object(l.useEffect)((function(){setTimeout((function(){!Object(O.c)(s.current)&&s.current.forEach((function(e){var t;null===(t=e.current)||void 0===t||t.setFieldsValue(I)})),o&&o.setFieldsValue(I)}),100),y||(P(0),s.current.forEach((function(e){var t;null===(t=e.current)||void 0===t||t.resetFields()})),e.formName&&e.addManageInitData(e.formName,void 0))}),[y,I]),Object(l.useEffect)((function(){e.formName&&e.addManageInitData(e.formName,I)}),[I]);var k=function(t){var a=function(t){e.updateAppendProps&&Object.assign(t,e.updateAppendProps),e.dataSubmitter(t).then((function(t){e.TableName&&e.addTableVersion(e.TableName),e.afterSubmit&&e.afterSubmit(t),e.onClose&&e.onClose(),w(!1),b.b.success("\u6210\u529f")}))};1===e.subForm.length?o.validateFields().then((function(e){a(e)})).catch((function(){b.b.error("\u8868\u5355\u4e0d\u5b8c\u6574")})):a(t)};return Object(x.jsxs)(x.Fragment,{children:[Object(x.jsxs)(j.a,Object(r.a)(Object(r.a)({},e.btnProps),{},{type:Object(O.a)(e.btnType,{create:"primary",update:"link",fork:"link",batchUpdate:"primary"}[e.type]),onClick:function(){if("update"===e.type||"fork"===e.type)if(void 0===e.initData){var t=b.b.loading({content:"\u52a0\u8f7d\u4e2d",duration:0});if(void 0===e.dataLoader)return t(),void b.b.error("\u672a\u5b9a\u4e49\u6570\u636e\u52a0\u8f7d\u5668");e.dataLoader&&e.dataLoader().then((function(e){T(e),t(),w(!0)})).catch((function(){t()}))}else T(e.initData),w(!0);else"create"===e.type?(void 0!==e.initData&&T(e.initData),w(!0)):w(!0)},style:"fork"===e.type||"update"===e.type||"link"===e.btnType?{paddingLeft:5,paddingRight:5}:void 0,children:[function(){if(!1!==e.btnIcon){if("create"===e.type)return Object(x.jsx)(f.a,{});if("batchUpdate"===e.type)return Object(x.jsx)(h.a,{})}}(),function(){if(void 0!==e.btnName)return e.btnName;switch(e.type){case"create":return e.t("create");case"update":return e.t("Edit");case"fork":return"\u514b\u9686";default:return"\u6279\u91cf\u4fee\u6539"}}()]})),1===e.subForm.length&&Object(x.jsx)(m.a,{width:e.width,style:{minWidth:e.width},destroyOnClose:!0,title:e.title,className:e.className,visible:y,maskClosable:!1,onCancel:function(){e.onClose&&e.onClose(),w(!1)},footer:[Object(x.jsx)(j.a,{type:"primary",onClick:k,children:e.t("Submit")},"submit")],children:Object(x.jsx)(p.a,{form:o,layout:null!==(t=e.layout)&&void 0!==t?t:"vertical",initialValues:e.initData,scrollToFirstError:!0,preserve:!1,children:e.subForm[0].component})}),1!==e.subForm.length&&Object(x.jsx)(g.b,{current:z,onCurrentChange:function(e){P(e)},formMapRef:s,onFinish:function(){var e=Object(n.a)(c.a.mark((function e(t){return c.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:k(t);case 1:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),stepsFormRender:function(t,a){var n;return Object(x.jsx)(m.a,{destroyOnClose:!0,title:e.title,className:e.className,visible:y,maskClosable:!1,width:null!==(n=e.width)&&void 0!==n?n:1200,style:{minWidth:e.width},onCancel:function(){e.onClose&&e.onClose(),w(!1)},footer:a,children:t})},children:e.subForm.map((function(t,a){var r;return Object(x.jsx)(g.b.StepForm,{layout:null!==(r=e.layout)&&void 0!==r?r:"vertical",name:"step"+a,title:t.label,onFinish:Object(n.a)(c.a.mark((function e(){return c.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",!0);case 1:case"end":return e.stop()}}),e)}))),children:t.component})}))})]})}))))},1038:function(e,t,a){"use strict";a.d(t,"a",(function(){return o})),a.d(t,"b",(function(){return c}));var n=a(127),r=a(1062),i=a.n(r),o=function(e,t){var a=new FormData,r=0,o=[],c=[];e.forEach((function(e){c.push(e.arrayBuffer().then((function(c){var l=i()(c);return o.push(n.a.getFileByMD5({md5:l}).then((function(n){return null!==n?(t(n),Promise.resolve()):(a.append("files",e),r+=1,Promise.resolve())}))),Promise.resolve()})))})),Promise.all(c).then((function(){Promise.all(o).then((function(){0!==r&&n.a.uploadFile(a).then((function(e){e.map((function(e){t(e)}))}))}))}))},c=function(e,t){var a=new FormData;a.append("file",e),n.a.uploadSingleFile(a).then((function(e){t(e)}))}},1078:function(e,t,a){"use strict";var n=a(1006),r=a(307),i=(a(0),a(421)),o=a(6);t.a=Object(i.a)()((function(e){var t,a;return Object(o.jsx)(o.Fragment,{children:Object(o.jsx)(n.a.Item,{label:null!==(t=e.label)&&void 0!==t?t:e.t("title"),name:null!==(a=e.name)&&void 0!==a?a:"title",required:!0,children:Object(o.jsx)(r.a,{})})})}))},1090:function(e,t,a){"use strict";var n=a(1100),r=a(1102),i=a(1103),o=a(1104),c=a(1099),l=a(1105),s=a(6),u={cpp:i.a,c:i.a,java:o.a,sql:c.a,python:l.a};t.a=function(e){var t;return Object(s.jsx)(s.Fragment,{children:Object(s.jsx)(n.a,{value:e.value,height:"400px",readOnly:null!==(t=e.readOnly)&&void 0!==t&&t,theme:r.a,autoFocus:!0,extensions:[u[e.lang]()],basicSetup:{lineNumbers:!0,autocompletion:!0,syntaxHighlighting:!0,tabSize:4,completionKeymap:!0,lintKeymap:!0,foldKeymap:!0,searchKeymap:!0,allowMultipleSelections:!0,bracketMatching:!0},onChange:function(t){e.onChange&&e.onChange(t)}})})}},1120:function(e,t,a){"use strict";var n=a(1006),r=a(307),i=(a(0),a(421)),o=a(6);t.a=Object(i.a)()((function(e){var t;return Object(o.jsx)(o.Fragment,{children:Object(o.jsx)(n.a.Item,{label:e.label,name:e.name,required:null===(t=e.required)||void 0===t||t,initialValue:e.initialValue,help:e.help,children:Object(o.jsx)(r.a,{addonAfter:e.addonAfter})})})}))},1307:function(e,t,a){"use strict";var n=a(31),r=a(1006),i=a(1090),o=a(6);t.a=function(e){return Object(o.jsx)(r.a.Item,Object(n.a)(Object(n.a)({label:e.label,name:e.name},e),{},{children:Object(o.jsx)(i.a,{lang:e.lang})}))}},1373:function(e,t,a){"use strict";var n=a(421),r=a(1078),i=a(1120),o=a(1006),c=a(174),l=a(1307),s=a(139),u=a(31),d=a(974),b=a(62),j=(a(0),a(1431)),m=a(1308),p=a.n(m),f=a(66),h=a(147),O=a(1038),v=a(6),g=function(e){var t,a,n=e.value,r=e.onChange,i=[],o=Object(s.a)(e.accept.split(","));try{for(o.s();!(a=o.n()).done;){var c=a.value;i.push("*"+c)}}catch(m){o.e(m)}finally{o.f()}var l=function(e){r(e.id)},u=(null!==(t=e.downloadFilename)&&void 0!==t?t:n)+e.downloadFileSuffix;return Object(v.jsxs)(v.Fragment,{children:[!Object(f.c)(n)&&Object(v.jsxs)("div",{style:{marginBottom:24},children:[Object(v.jsx)("div",{children:" \u5df2\u6709\u6587\u4ef6\uff1a "}),Object(v.jsxs)(d.b,{children:[u,Object(v.jsx)(b.a,{size:"small",onClick:function(){var e=Object(h.a)().CLIENT_SERVER+"/api/filesys/download/"+n+"/"+u;window.open(e)},children:"\u4e0b\u8f7d"}),Object(v.jsx)(b.a,{danger:!0,size:"small",onClick:function(){r(null)},children:"\u5220\u9664"})]})]}),Object(v.jsxs)(p.a,{multiple:!1,accept:e.accept,action:"",listType:"text",beforeUpload:function(t){"user"===e.ues?Object(O.b)(t,l):Object(O.a)([t],l)},showUploadList:!1,children:[Object(v.jsx)("p",{className:"ant-upload-drag-icon",children:Object(v.jsx)(j.a,{})}),Object(v.jsx)("p",{className:"ant-upload-text",children:"\u5355\u51fb\u6216\u62d6\u52a8\u6587\u4ef6\u5230\u6b64\u533a\u57df\u8fdb\u884c\u4e0a\u4f20"}),Object(v.jsxs)("p",{className:"ant-upload-hint",children:["\u8bf7\u4e0a\u4f20\u4e00\u4e2a ",i," \u6587\u4ef6"]})]})]})},x=Object(n.a)()((function(e){var t;return Object(v.jsx)(v.Fragment,{children:Object(v.jsx)(o.a.Item,{label:null!==(t=e.label)&&void 0!==t?t:"\u4e0a\u4f20\u6587\u4ef6",name:e.name,rules:[{required:e.required}],children:Object(v.jsx)(g,Object(u.a)({},e))})})}));t.a=Object(n.a)()((function(e){return Object(v.jsxs)(v.Fragment,{children:[Object(v.jsx)(r.a,{}),Object(v.jsx)(i.a,{label:"\u5907\u6ce8",name:"comment",required:!1}),Object(v.jsx)(o.a.Item,{label:"\u6587\u4ef6\u540e\u7f00",name:"acceptFileExtensions",required:!0,children:Object(v.jsx)(c.a,{mode:"tags",style:{width:"100%"}})}),Object(v.jsx)(l.a,{label:"shell\u811a\u672c",name:"shellScript",lang:"cpp",className:"JudgeTemplateCodeEditor",rules:[{required:!0}]}),Object(v.jsx)(x,{label:"ZIP\u8d44\u6e90\u6587\u4ef6",name:"zipFileId",required:!1,accept:".zip",use:"admin",downloadFileSuffix:".zip"})]})}))},1436:function(e,t,a){"use strict";a.r(t);var n=a(31),r=a(9),i=a(4),o=a.n(i),c=(a(0),a(974)),l=a(984),s=a(252),u=a(421),d=a(41),b=a(1018),j=a(253),m=a(1034),p=a(1373),f=a(6);t.default=Object(u.a)()(Object(d.e)((function(e){var t=e.location.pathname.split("/"),a=t[t.length-1],i=[{title:"ID",dataIndex:"id",width:50,responsive:["lg","sm","xs"]},{title:e.t("Owner"),dataIndex:"username",width:"auto",responsive:["lg"]},{title:e.t("title"),dataIndex:"title",width:"auto",responsive:["lg","sm"]},{title:e.t("comment"),dataIndex:"comment",width:"auto",responsive:["lg"]},{title:e.t("CreateTime"),dataIndex:"gmtCreate",width:"auto",responsive:["lg","sm"],render:function(e){return Object(j.e)(parseInt(e))}},{title:e.t("ModifiedTime"),dataIndex:"gmtModified",width:"auto",responsive:["lg","sm"],render:function(e){return Object(j.e)(parseInt(e))}},{title:e.t("operator"),width:"150px",render:function(e,t){return Object(f.jsxs)(c.b,{size:3,children:[Object(f.jsx)(m.a,{TableName:"TemplateList-".concat(a),width:600,title:t.title,type:"update",subForm:[{component:Object(f.jsx)(p.a,{}),label:""}],dataLoader:Object(r.a)(o.a.mark((function e(){return o.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",s.a.getOneTemplate({id:t.id}).then((function(e){return Promise.resolve(e)})));case 1:case"end":return e.stop()}}),e)}))),updateAppendProps:{id:t.id},dataSubmitter:function(e){return s.a.updateTemplate(Object(n.a)({type:"io"===a?0:2},e))}}),Object(f.jsx)(m.a,{TableName:"TemplateList-".concat(a),width:600,title:"\u65b0\u5efa\u6a21\u677f(\u514b\u9686\u81ea"+t.title+")",type:"fork",subForm:[{component:Object(f.jsx)(p.a,{}),label:""}],dataLoader:Object(r.a)(o.a.mark((function e(){return o.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.abrupt("return",s.a.getOneTemplate({id:t.id}).then((function(e){return Promise.resolve(e)})));case 1:case"end":return e.stop()}}),e)}))),dataSubmitter:function(e){return s.a.createTemplate(Object(n.a)({type:"io"===a?0:2},e))}})]})}}];return Object(f.jsx)("div",{style:{marginTop:-20,overflow:"hidden"},children:Object(f.jsx)(l.a,{size:"small",bordered:!0,title:"io"===a?"\u57fa\u7840IO\u6a21\u677f":"\u9ad8\u9636\u8bc4\u6d4b\u6a21\u677f",extra:Object(f.jsx)(f.Fragment,{children:Object(f.jsx)(m.a,{TableName:"TemplateList-".concat(a),width:600,title:"\u65b0\u5efa\u6a21\u677f",type:"create",subForm:[{component:Object(f.jsx)(p.a,{}),label:""}],dataSubmitter:function(e){return s.a.createTemplate(Object(n.a)({type:"io"===a?0:2},e))}})}),children:Object(f.jsx)(b.a,{name:"TemplateList-".concat(a),columns:i,API:function(e){return s.a.pageTemplateList(Object(n.a)(Object(n.a)({},e),{},{type:"io"===a?0:2}))},size:"small",rowKey:"id"})})})})))}}]);
//# sourceMappingURL=9.b6546a5b.chunk.js.map