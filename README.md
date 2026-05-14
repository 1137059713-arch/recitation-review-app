# 背诵复习管理

一个本地运行的 React + Vite 单页应用，用于记录每天新背内容，并根据 1、7、14、28 天规则自动生成复习任务。数据保存在浏览器 `localStorage`，不需要登录或后端。

## 运行方法

```bash
npm install
npm run dev
```

启动后打开终端输出的本地地址，通常是 `http://localhost:5173/`。

## 代码结构

```text
src/
  App.jsx                     # 应用路由和整体布局
  main.jsx                    # React 入口
  styles.css                  # Tailwind 入口和全局样式
  components/
    AddItemForm.jsx           # 添加今日背诵表单
    CompleteButton.jsx        # 透明/红色完成圆圈按钮
    TaskCard.jsx              # 单个任务卡片
    TaskSection.jsx           # 首页任务分区
  hooks/
    useRecitationStore.js     # localStorage 状态、添加内容、完成任务逻辑
  pages/
    HomePage.jsx              # 今日任务首页
    OverviewPage.jsx          # 全部内容和复习安排
    CalendarPage.jsx          # 按日期分组的任务列表
  utils/
    date.js                   # 本地日期格式化和日期加减
    schedule.js               # 复习计划生成
    storage.js                # localStorage 读写
```

## 核心规则

- 添加内容后会生成当天新背任务，以及第 1、7、14、28 天复习任务。
- 完成第 1 天复习时必须填写 `0-100` 的回忆程度。
- 回忆程度低于 `80` 时，自动增加第 3 天补强复习。
- 每个任务右侧的圆圈按钮点击后会变成红色实心圆，表示已完成。
