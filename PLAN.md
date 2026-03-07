我们的目标是开发一款名为 RitMEX Earn 的 Solana Mobile 移动应用程序，该应用程序允许用户在 Meteora DLMM 上创建和管理流动性头寸。用户可以创建平衡/不平衡/单边头寸、交换代币和管理流动性——支持 Jito 捆绑包以实现 MEV 保护和可配置优先费用。

docs/legacy-web-app 是旧的 web 应用程序，你可以参考其中的业务逻辑，但绝对不要使用其中的代码。

docs/meteora 是最新的 meteora dlmm 文档，请按照文档中的指南进行开发。

我们基于 Expo React Native 开发

样式使用 tailwindcss + uniwind 实现

目标只需要兼容 Solana Mobile Android 平台

计划 MVP 版本包含 3 个页面

1. 首页热门 DLMM Pool 市场行情页面
2. 指定的 DLMM Pool 添加流动性/Swap 页面
3. 个人账户详情 + 仓位管理页面

请保证核心功能完整，UI 设计极简现代，请使用最佳实践。