(this.webpackJsonpsduoj=this.webpackJsonpsduoj||[]).push([[7],{1023:function(e,t,n){"use strict";var a=n(27),o=n(66),s=n(991),r=n(313),i=n(981),c=n(64),l=n(1107),u=n(990),d=n(0),b=n(91),m=n(71),j=n(312),f=n(43),O=n(316),p=n(63),h=n(306),v=n(6);t.a=Object(m.b)((function(e){var t,n=e.UserReducer,o=e.TableReduce;return{roles:null===(t=n.userInfo)||void 0===t?void 0:t.roles,tableData:Object(a.a)({},o.tableData)}}),(function(e){return{setTableInfo:function(t,n){return e({type:"setTableInfo",name:t,data:n})},setDataSource:function(t,n){return e({type:"setDataSource",data:t,name:n,add:!1})}}}))(Object(j.a)()(Object(f.e)((function(e){var t,n,m=Object(d.useState)(0),j=Object(o.a)(m,2),f=j[0],S=j[1],g=Object(d.useState)(),y=Object(o.a)(g,2),x=y[0],w=y[1],I=Object(d.useState)(!0),T=Object(o.a)(I,2),D=T[0],k=T[1],C=Object(d.useState)(1),R=Object(o.a)(C,2),P=R[0],z=R[1],F=Object(d.useState)(Object(p.a)(e.defaultPageSize,b.h)),K=Object(o.a)(F,2),A=K[0],N=K[1],L=Object(d.useState)(),V=Object(o.a)(L,2),M=V[0],J=V[1],Y=Object(d.useState)(0),E=Object(o.a)(Y,2),B=E[0],H=E[1],Q=function(t){w(t),void 0!==e.setDataSource&&void 0!==e.name&&e.setDataSource(t,e.name)},U=function(t,n,o,s){var r,i,c,l,u,d,b,m,j,f=null===(r=e.tableData[e.name])||void 0===r?void 0:r.tableInfo;void 0!==f&&(void 0===s&&void 0!==f.moreProps&&$.setFieldsValue(f.moreProps),t=null!==(d=t)&&void 0!==d?d:f.pageNow,n=null!==(b=n)&&void 0!==b?b:f.pageSize,o=null!==(m=o)&&void 0!==m?m:f.searchKey,s=null!==(j=s)&&void 0!==j?j:f.moreProps);var O=null!==(i=t)&&void 0!==i?i:P,p=null!==(c=n)&&void 0!==c?c:A,h=null!==(l=o)&&void 0!==l?l:M,v=null!==(u=s)&&void 0!==u?u:$.getFieldsValue();z(O),N(p),J(h),k(!0),e.API(Object(a.a)({pageNow:O,pageSize:p,searchKey:h},v)).then((function(t){null===t.rows&&(t.rows=[]),void 0!==e.APIRowsTransForm?Q(e.APIRowsTransForm(t.rows)):Q(t.rows),void 0!==t.totalNum&&"0"!==t.totalNum?(S(t.totalNum),e.name&&e.setTableInfo(e.name,{total:t.totalNum,pageNow:O,pageSize:p,searchKey:h,moreProps:v})):(S(p*t.totalPage),e.name&&e.setTableInfo(e.name,{total:p*t.totalPage,pageNow:O,pageSize:p,searchKey:h,moreProps:v})),k(!1)}))};Object(d.useEffect)((function(){$.setFieldsValue(e.initRequestProps),U()}),[e.name]);var _=Object(h.a)(),$=Object(o.a)(_,1)[0],q=function(){var e=$.getFieldsValue();"{}"!==JSON.stringify(e)&&U(1,A,void 0,e)},W=function(){var t,n=$.getFieldsValue();$.resetFields();var a=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableInfo;e.name&&e.setTableInfo(e.name,{total:a.total,pageNow:a.pageNow,pageSize:a.pageSize,searchKey:a.searchKey,moreProps:void 0});var o=$.getFieldsValue();JSON.stringify(n)!==JSON.stringify(o)&&U(1,A,void 0,void 0)};return Object(d.useEffect)((function(){var t,n=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableVersion;if(void 0!==n&&B!==n)if(n<0){var a;H(-n),w(null===(a=e.tableData[e.name])||void 0===a?void 0:a.dataSource)}else{H(n);var o=$.getFieldsValue();U(P,A,M,o)}}),[e.tableData,B]),Object(v.jsxs)(v.Fragment,{children:[e.useList&&Object(v.jsx)(s.a,{title:e.title,bordered:!0,size:"default",className:null!==(t=e.cardProps)&&void 0!==t?t:"zeroBodyPaddingLeft",extra:(!0===e.search||void 0!==e.getForm)&&Object(v.jsxs)(v.Fragment,{children:[!0===e.search&&Object(v.jsx)(O.a,{placeholder:e.t("searchUser"),onSearch:function(e){J(e),z(1);var t=$.getFieldsValue();U(1,A,e,t)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(v.jsxs)(r.a,{form:$,children:[e.getForm(q),e.useFormBtn&&Object(v.jsxs)(i.b,{style:{marginLeft:"30px"},size:20,children:[Object(v.jsx)(c.a,{type:"primary",onClick:q,children:"\u7b5b\u9009"}),Object(v.jsx)(c.a,{htmlType:"button",onClick:W,children:"\u91cd\u7f6e"})]})]})]}),children:Object(v.jsx)(l.b,{grid:e.grid,itemLayout:"vertical",loading:D,size:e.size,dataSource:x,renderItem:e.renderItem,pagination:{onChange:function(e,t){U(e,t)},current:P,pageSize:A,total:f,size:"small",hideOnSinglePage:!0,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(p.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})}),!e.useList&&Object(v.jsx)(s.a,{bordered:!1,size:"small",extra:(!0===e.search||void 0!==e.getForm)&&Object(v.jsxs)(v.Fragment,{children:[!0===e.search&&Object(v.jsx)(O.a,{placeholder:"\u641c\u7d22",onSearch:function(e){J(e),z(1),U(1,A,e)},enterButton:!0,style:{width:300}},"search"),void 0!==e.getForm&&Object(v.jsxs)(r.a,{form:$,children:[e.getForm(q),Object(v.jsxs)(i.b,{style:{marginLeft:"30px"},size:20,children:[Object(v.jsx)(c.a,{type:"primary",onClick:q,children:e.t("filtering")}),Object(v.jsx)(c.a,{htmlType:"button",onClick:W,children:e.t("Reset")})]})]})]}),children:Object(v.jsx)(u.a,{rowKey:e.rowKey,loading:D,size:e.size,columns:e.columns,rowSelection:e.rowSelection,dataSource:x,pagination:null!==(n=e.pagination)&&void 0!==n?n:{onChange:function(e,t){U(e,t)},current:P,pageSize:A,total:f,hideOnSinglePage:!1,showQuickJumper:!0,showLessItems:!0,showSizeChanger:Object(p.a)(e.showSizeChanger,!0),pageSizeOptions:["5","15","20","50","80"]}})})]})}))))},1044:function(e,t,n){"use strict";var a=n(27),o=n(103),s=n(66),r=n(312),i=n(78),c=n(64),l=n(981),u=n(313),d=n(190),b=n(177),m=n(991),j=n(101),f=n(336),O=n(105),p=n(980),h=n(38),v=n(108),S=n(0),g=n(132),y=n.n(g),x=n(1066),w=n(204),I=n(71),T=n(43),D=n(63),k=n(199),C=n(1099),R=n(6);t.a=Object(I.b)((function(e){var t,n=e.TableReduce,a=e.UserReducer;return{tableData:n.tableData,roles:null===(t=a.userInfo)||void 0===t?void 0:t.roles,isLogin:a.isLogin}}),(function(e){return{addTableVersion:function(t){return e({type:"addTableVersion",name:t})},setSelectedRowKeys:function(t,n){return e({type:"setSelectedRowKeys",data:t,name:n})},setDataSource:function(t,n){return e({type:"setDataSource",data:t,name:n,add:!0})},setTopSubmission:function(t,n){return e({type:"setTopSubmission",submissionID:t,submissionInfo:n})},setSubmissionModalVis:function(t){return e({type:"setSubmissionModalVis",data:t})}}}))(Object(r.a)()(Object(T.e)((function(e){var t,n,r=Object(S.useState)(!1),g=Object(s.a)(r,2),I=g[0],T=g[1],P=Object(S.useState)([]),z=Object(s.a)(P,2),F=z[0],K=z[1],A=Object(S.useState)(!1),N=Object(s.a)(A,2),L=N[0],V=N[1],M=Object(D.a)(null===(t=e.tableData[e.name])||void 0===t?void 0:t.selectedRowKeys,[]),J=Object(D.a)(null===(n=e.tableData[e.name])||void 0===n?void 0:n.dataSource,[]),Y=function(t){e.setTopSubmission(t.submissionId,{title:t.problemTitle,TimeLimit:t.timeLimit,MemoryLimit:t.memoryLimit,scoreMod:void 0===t.sumScore?"disable":"show",sumScore:t.sumScore,testcaseMod:"show",QuerySubmissionAPI:e.QuerySubmissionAPI}),e.setSubmissionModalVis(!0)},E=[{title:e.t("results"),dataIndex:"result",key:"result",render:function(e,t){return Object(R.jsx)("div",{style:{cursor:"pointer"},onClick:function(){Y(t)},children:Object(R.jsx)(v.a,{type:"text",caseType:h.b.indexOf(h.c[e]),append:"-2"===e?"("+t.RunningStep+"/"+(t.checkpointNum+t.publicCheckpointNum)+")":""})})}},{title:e.t("score"),dataIndex:"score",key:"score",render:function(e,t){return void 0===t.sumScore?e:Math.floor(e/t.sumScore*100)+"%"}},{title:e.t("submissionTime"),dataIndex:"submitTime",key:"submitTime",render:function(e){return Object(R.jsx)(i.a,{title:y()(e).format("YYYY-MM-DD HH:mm:ss"),children:Object(R.jsx)("span",{children:y()(e).fromNow()})})}}],B=[{title:"ID",dataIndex:"submissionId",key:"submissionId",render:function(e,t){return Object(R.jsx)(c.a,{type:"link",size:"small",onClick:function(){Y(t)},children:e})}},{title:e.t("username"),dataIndex:"username",key:"username"},{title:e.t("problemNo."),dataIndex:"problemCode",key:"problemCode",render:e.problemCodeRender},{title:e.t("problemName"),dataIndex:"problemTitle",key:"problemTitle"},{title:e.t("results"),dataIndex:"result",key:"result",width:170,render:function(e,t){return Object(R.jsx)("div",{style:{cursor:"pointer"},onClick:function(){Y(t)},children:Object(R.jsx)(v.a,{type:"text",caseType:h.b.indexOf(h.c[e]),append:"-2"===e?"("+t.RunningStep+"/"+(t.checkpointNum+t.publicCheckpointNum)+")":""})})}},{title:e.t("score"),dataIndex:"score",key:"score",render:function(e,t){return void 0===t.sumScore?e:Math.floor(e/t.sumScore*100)+"%"}},{title:e.t("template"),dataIndex:"judgeTemplateTitle",key:"judgeTemplateTitle"},{title:e.t("memoryUsage"),dataIndex:"usedMemory",key:"usedMemory",render:function(e){return e+" KB"}},{title:e.t("timeUsage"),dataIndex:"usedTime",key:"usedTime",render:function(e){return e+" ms"}},{title:e.t("submissionTime"),dataIndex:"submitTime",key:"submitTime",render:function(e){return Object(R.jsx)(i.a,{title:y()(e).format("YYYY-MM-DD HH:mm:ss"),children:Object(R.jsx)("span",{children:y()(e).fromNow()})})}}];return Object(R.jsx)(R.Fragment,{children:Object(R.jsx)(m.a,{title:Object(R.jsxs)(l.b,{children:[void 0!==e.title?e.title:e.t("submissionRecord"),Object(R.jsx)(f.a,{open:I,dataHandle:function(t){var n=t[0],a=t[1],s=t[3],r=t[5],i=t[6],c=t[7],l=t[8],u=J,d=u.findIndex((function(e){return e.submissionId===n}));if(-1!==d){if(Object(D.c)(u[d].cur_cpt)&&(u[d].cur_cpt=new Set),s<0){u[d].result=s.toString(),-1===s&&(localStorage.setItem("submissionVersion:".concat(n),"".concat(a)),u[d].result=r,u[d].score=i,u[d].usedTime=c,u[d].usedMemory=l);var b,m=0,j=Object(o.a)(u);try{for(j.s();!(b=j.n()).done;){var f=b.value;parseInt(f.result)<=0&&(m+=1)}}catch(O){j.e(O)}finally{j.f()}0===m&&T(!1)}else u[d].cur_cpt.add(s),u[d].RunningStep=u[d].cur_cpt.size,u[d].score+=i;e.setDataSource(u,e.name)}},queryList:F})]}),style:e.lessInfo?{}:{minWidth:1200},className:e.lessInfo?"smallBodyPadding":"",extra:Object(R.jsxs)(l.b,{children:[!0!==e.lessInfo&&Object(k.a)(e.roles,["admin","superadmin"])&&Object(R.jsx)(w.a,{API:O.a.rejudge,data:M,afterSuccess:function(){e.addTableVersion(e.name),e.setSelectedRowKeys([],e.name)}}),Object(R.jsx)(c.a,{icon:Object(R.jsx)(p.a,{}),onClick:function(){V(!0),e.addTableVersion(e.name),j.b.success(e.t("refreshSuccessfully")),setTimeout((function(){V(!1)}),3e3)},disabled:L,children:e.t("refresh")})]}),actions:e.lessInfo&&e.isLogin?[Object(R.jsx)("div",{children:e.lessInfo&&e.isLogin&&Object(R.jsx)(C.a,{btnProps:{type:"text",block:!0},btnText:e.t("ShowAllInformation"),name:"Pro-SubmissionList-"+e.name,API:e.API,QuerySubmissionAPI:e.QuerySubmissionAPI})})]:void 0,children:Object(R.jsx)(x.a,{disableSelection:e.lessInfo||!Object(k.a)(e.roles,["admin","superadmin"]),defaultPageSize:e.lessInfo?5:void 0,showSizeChanger:!e.lessInfo&&void 0,pagination:!e.lessInfo&&void 0,columns:e.lessInfo?E:B,getForm:!0===e.useForm?function(t){return Object(R.jsxs)(l.b,{size:30,children:[Object(R.jsx)(u.a.Item,{label:e.t("username"),name:"username",children:Object(R.jsx)(d.a,{onPressEnter:function(e){t()},allowClear:!0})}),Object(R.jsx)(u.a.Item,{label:e.t("problemNo."),name:"problemCode",children:Object(R.jsx)(d.a,{onPressEnter:function(e){t()},allowClear:!0})}),Object(R.jsx)(u.a.Item,{label:e.t("JudgeResult"),name:"judgeResult",children:Object(R.jsx)(b.a,{onChange:t,allowClear:!0,style:{width:200},children:h.a.map((function(e){return Object(R.jsx)(b.a.Option,{value:parseInt(e),children:Object(R.jsx)(v.a,{type:"text",caseType:h.b.indexOf(h.c[e])})})}))})})]})}:void 0,name:e.name,size:"small",rowKey:"submissionId",API:function(t){if("problemCode"in t&&!Object(D.c)(t.problemCode)){var n=t.problemCode;1===n.length?(null!==n.match(/^[a-z]$/)&&(n=(n.charCodeAt(0)-"a".charCodeAt(0)+1).toString()),null!==n.match(/^[A-Z]$/)&&(n=(n.charCodeAt(0)-"A".charCodeAt(0)+1).toString())):null!==n.match(/^[0-9]{4}$/)&&(n="SDUOJ-"+n),t.problemCode=n}return e.API(t)},APIRowsTransForm:function(e){Object(D.c)(e)&&(e=[]);var t,n=[],s=[],r=Object(o.a)(e);try{for(r.s();!(t=r.n()).done;){var i=t.value;i.judgeResult<=0&&n.push(i.submissionId),s.push(Object(a.a)(Object(a.a)({},i),{},{score:i.judgeScore,RunningStep:0,result:i.judgeResult.toString(),sumScore:i.sumScore,submitTime:parseInt(i.gmtCreate)}))}}catch(c){r.e(c)}finally{r.f()}return 0!==n.length&&(T(!0),K(n)),s}})})})}))))},1062:function(e,t,n){"use strict";var a=n(1084),o=n(27),s=n(66),r=n(990),i=n(0),c=n.n(i),l=n(71),u=n(312),d=n(43),b=n(1102),m=n(1449),j=n(1098),f=n(6),O=["className","style"];t.a=c.a.memo(Object(l.b)((function(e){var t=e.TableReduce;return{tableData:Object(o.a)({},t.tableData)}}),(function(e){return{setTableInfo:function(t,n){return e({type:"setTableInfo",name:t,data:n})},setDataSource:function(t,n){return e({type:"setDataSource",data:t,name:n,add:!1})}}}))(Object(u.a)()(Object(d.e)((function(e){var t=Object(i.useState)([]),n=Object(s.a)(t,2),c=n[0],l=n[1],u=Object(i.useState)(!0),d=Object(s.a)(u,2),p=d[0],h=d[1],v=Object(i.useState)(0),S=Object(s.a)(v,2),g=S[0],y=S[1],x=function(t){l(t),void 0!==e.setDataSource&&void 0!==e.name&&e.setDataSource(t,e.name)},w=function(){h(!0),e.API().then((function(t){null===t&&(t=[]),void 0!==e.APIRowsTransForm?x(e.APIRowsTransForm(t)):x(t),h(!1)}))};Object(i.useEffect)((function(){w()}),[e.name]),Object(i.useEffect)((function(){var t,n,a=null===(t=e.tableData[e.name])||void 0===t?void 0:t.tableVersion;void 0!==a&&g!==a&&(a<0?(y(-a),l(null===(n=e.tableData[e.name])||void 0===n?void 0:n.dataSource)):(y(a),w()))}),[e.tableData,g]);var I=Object(b.c)((function(){return Object(f.jsx)(m.a,{style:{cursor:"grab",color:"#999"}})})),T=Object(b.b)((function(e){return Object(f.jsx)("tr",Object(o.a)({},e))})),D=Object(b.a)((function(e){return Object(f.jsx)("tbody",Object(o.a)({},e))})),k=function(t){var n=t.oldIndex,a=t.newIndex;n!==a&&(x(Object(j.a)(c,n,a)),e.afterDrag&&e.afterDrag(c,n,a))},C=[{title:"",dataIndex:"sort",width:50,className:"drag-visable",render:function(){return Object(f.jsx)(I,{})}}],R=e.columns;return e.useDrag&&(R=C.concat(R)),Object(f.jsx)(r.a,Object(o.a)(Object(o.a)({},e),{},{rowSelection:e.rowSelection,rowKey:e.rowKey,loading:p,size:e.size,columns:R,dataSource:c,pagination:!1,components:{body:{wrapper:function(e){return Object(f.jsx)(D,Object(o.a)({useDragHandle:!0,disableAutoscroll:!0,helperClass:"row-dragging",onSortEnd:k},e))},row:function(t){t.className,t.style;var n=Object(a.a)(t,O),s=c.findIndex((function(t){return t[e.rowKey]===n["data-row-key"]}));return Object(f.jsx)(T,Object(o.a)({index:s},n))}}}}))})))),(function(e,t){var n,a;return e.columns===t.columns&&(null===(n=e.rowSelection)||void 0===n?void 0:n.selectedRowKeys.length)===(null===(a=t.rowSelection)||void 0===a?void 0:a.selectedRowKeys.length)&&e.tableData===t.tableData&&e.updateTrick===t.updateTrick}))},1066:function(e,t,n){"use strict";var a=n(27),o=n(142),s=n(143),r=n(145),i=n(144),c=n(0),l=n(312),u=n(43),d=n(71),b=n(1023),m=n(63),j=n(1062),f=n(6),O=function(e){Object(r.a)(n,e);var t=Object(i.a)(n);function n(){var e;Object(o.a)(this,n);for(var a=arguments.length,s=new Array(a),r=0;r<a;r++)s[r]=arguments[r];return(e=t.call.apply(t,[this].concat(s))).setSelectedRowKeys=function(t){e.props.setSelectedRowKeys(t,e.props.name)},e}return Object(s.a)(n,[{key:"componentDidMount",value:function(){}},{key:"render",value:function(){var e,t=this,n=Object(m.a)(null===(e=this.props.tableData[this.props.name])||void 0===e?void 0:e.selectedRowKeys,[]),o={selectedRowKeys:n,onChange:function(e){t.setSelectedRowKeys(e)},selections:[{key:"all",text:this.props.t("selectedAll"),onSelect:function(e){var a=e;a=a.concat(n.filter((function(t){return!e.includes(t)}))),t.setSelectedRowKeys(a)}},{key:"clear",text:this.props.t("clear"),onSelect:function(e){var a=n.filter((function(t){return!e.includes(t)}));t.setSelectedRowKeys(a)}},{key:"invert",text:this.props.t("invert"),onSelect:function(e){var a=e.filter((function(e){return!n.includes(e)}));a=a.concat(n.filter((function(t){return!e.includes(t)}))),t.setSelectedRowKeys(a)}}]};return Object(f.jsxs)(f.Fragment,{children:[this.props.uesAlldata&&Object(f.jsx)(j.a,Object(a.a)(Object(a.a)({},this.props),{},{rowSelection:this.props.disableSelection?void 0:o})),!0!==this.props.uesAlldata&&Object(f.jsx)(b.a,Object(a.a)(Object(a.a)({},this.props),{},{rowSelection:this.props.disableSelection?void 0:o}))]})}}]),n}(c.Component);t.a=Object(d.b)((function(e){return{tableData:e.TableReduce.tableData}}),(function(e){return{setSelectedRowKeys:function(t,n){return e({type:"setSelectedRowKeys",data:t,name:n})}}}))(Object(l.a)()(Object(u.e)(O)))},1099:function(e,t,n){"use strict";var a=n(27),o=n(66),s=n(312),r=n(43),i=n(0),c=n(64),l=n(984),u=n(1044),d=n(6);t.a=Object(s.a)()(Object(r.e)((function(e){var t=Object(i.useState)(!1),n=Object(o.a)(t,2),s=n[0],r=n[1];return Object(d.jsxs)(d.Fragment,{children:[Object(d.jsx)(c.a,Object(a.a)(Object(a.a)({},e.btnProps),{},{onClick:function(){r(!0)},children:e.btnText})),Object(d.jsx)(l.a,{width:1250,visible:s,footer:!1,onCancel:function(){r(!1)},children:Object(d.jsx)(u.a,Object(a.a)({},e))})]})})))}}]);
//# sourceMappingURL=7.7e03f527.chunk.js.map