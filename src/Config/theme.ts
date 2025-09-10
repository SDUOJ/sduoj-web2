import { ThemeConfig } from 'antd';

// 全局 antd v5 主题配置：将原全局 CSS 中稳定且通用的视觉变量提炼为 Token / 组件 Token
// 仅放入“通用且多处复用”的值；局部差异继续用组件 props / className。
// 若某 token 不生效，请对照官方文档核对版本可用性后再增删。
export const appTheme: ThemeConfig = {
  token: {
    // 布局 & 背景
    colorBgLayout: '#ffffff',
    // 基础边框色（原多处 #dcdee2）
    colorBorder: '#dcdee2',
    // 标题常用前景色（定时器标题等）
    colorTextHeading: '#282c34',
    // 提升全局弹出层基准 z-index（覆盖 message 等弹出层）
    zIndexPopupBase: 3000,
  },
  components: {
    Card: {
      // 全局统一去除 Card 头部底色，改为透明；若个别页面需要背景请在组件 headStyle 中单独设置
      headerBg: 'transparent',
      // 明确卡片次级边框颜色，匹配旧样式 #dcdee2
      colorBorderSecondary: '#dcdee2',
    },
    Tabs: {
      // 示例：保持默认即可，如需后续定制可在此添加
    },
    Message: {
      // 目前直接继承 zIndexPopupBase；如需单独提升可添加
    },
  },
};
