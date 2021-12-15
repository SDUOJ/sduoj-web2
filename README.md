# SDUOJ 新版前端

之前的前端，管理端与用户端是分离的，使用了 Vue 作为开发的框架，
由于使用的 UI 框架有一些 Bug 长时间无人维护，所以决定使用 React 与 Ant Design
重新进行编写。

> 项目正在施工中，预计完成时间为 2022 年 6 月

## 当前进度

- M 端 (Manage)
  - 考试
    - 查看（基于表格）
    - 添加
    - 修改（当前仅支持修改未开始的考试）
    - 【TODO：查看并导出考试结果】
  - 客观题
    - 查看 （基于表格）
    - 添加
    - 修改
- E 端 (Exam)
  - 考试列表（当前使用表格，【TODO：使用 Card 替换】）
  - 考前等待页面
  - 考试页面（支持客观题【TODO：编程题】）
  - 考试完成页面