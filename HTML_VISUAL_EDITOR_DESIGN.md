# HTML 可视化编辑工具设计文档

## 1. 背景

在实际开发和内容制作中，很多团队会使用 HTML/CSS 来制作 PPT、演示页、活动页或视觉稿。相比传统 PPT，HTML 的优势很明显：

- 样式自由度高
- 动效和交互能力强
- 可以复用前端组件和设计系统
- 适合网页发布和多端展示
- AI 可以直接生成或修改源码

但 HTML 作为 PPT 或视觉内容载体时，也存在一个明显问题：**编辑不够直观**。

目前常见修改方式主要有两种：

1. 让 AI 根据自然语言修改源码
2. 开发者或使用者手动修改 HTML/CSS 源码

这两种方式都不够所见即所得。用户看到页面上的某个标题、图片、卡片或按钮时，不能像在 PPT、Figma 或可视化编辑器中那样直接点击并调整，而是需要回到源码中寻找对应元素。

因此，本工具的目标是提供一个介于浏览器 DevTools、PPT 编辑器和源码编辑器之间的 HTML 可视化编辑体验。

## 2. 产品定位

本工具定位为：

> 面向 HTML PPT 和 HTML 页面内容的可视化微调编辑器。

它不是传统低代码平台，也不是从零拖拽生成页面的页面搭建器，而是围绕已有 HTML 源码进行编辑：

1. 导入已有 HTML 源码
2. 实时预览页面效果
3. 在预览区域直接选中元素
4. 修改文本、图片、样式、布局等属性
5. 将修改结果同步回 HTML/CSS 源码
6. 导出修改后的 HTML 文件

核心理念是：

> 源码仍然是最终产物，可视化编辑只是更直观的修改入口。

## 3. 核心用户场景

### 3.1 HTML PPT 微调

用户通过 AI 或模板生成一份 HTML PPT，随后需要调整：

- 标题文案
- 字体大小
- 颜色
- 图片
- 卡片间距
- 页面布局
- 局部样式

用户希望直接点击页面上的元素完成修改，而不是反复查找源码。

### 3.2 AI 生成页面后的人工修正

AI 生成 HTML 后，整体效果不错，但细节需要调整。用户可以：

- 预览 AI 生成的页面
- 点击不满意的元素
- 直接修改属性
- 查看源码同步变化

### 3.3 设计和开发协作

设计人员或非专业开发者可以通过可视化界面做基础修改，开发者仍然可以查看和维护最终源码。

## 4. MVP 范围

第一版建议严格控制范围，优先验证核心链路：

> 导入 HTML → 预览 → 点击元素 → 编辑属性 → 同步源码 → 导出 HTML

### 4.1 MVP 支持能力

- 支持粘贴或上传单个 HTML 文件
- 支持 HTML 内部的 `<style>` 样式
- 使用 iframe 实时预览 HTML
- 鼠标悬停元素时显示高亮边框
- 点击元素后选中该元素
- 在属性面板中编辑常见属性
- 修改后实时更新预览
- 修改后同步更新源码
- 支持导出修改后的 HTML

### 4.2 MVP 可编辑内容

第一版重点支持以下内容：

- 文本内容
- 图片地址：`src`
- 链接地址：`href`
- 元素 class
- 元素 id
- inline style
- 常见 CSS 属性：
  - color
  - background-color
  - font-size
  - font-weight
  - font-family
  - width
  - height
  - margin
  - padding
  - border-radius
  - box-shadow
  - opacity
  - transform

### 4.3 MVP 暂不支持内容

为了降低第一版复杂度，以下能力可以暂时不做：

- 多文件项目导入
- 复杂外部 CSS 文件编辑
- JavaScript 动态生成 DOM 的反向源码同步
- 响应式断点可视化编辑
- 拖拽式复杂布局重排
- 多人协作
- 历史版本管理
- 组件化框架源码回写，例如 React、Vue、Svelte

## 5. 页面结构

建议第一版采用三栏结构：

```text
+----------------+----------------------+----------------+
| 源码编辑区      | 页面预览区            | 属性编辑区      |
| Monaco Editor  | iframe Preview        | Inspector      |
+----------------+----------------------+----------------+
```

### 5.1 源码编辑区

功能：

- 展示当前 HTML 源码
- 支持手动编辑
- 源码变化后刷新预览
- 高亮当前选中元素对应的源码位置，后续增强

建议使用：

- Monaco Editor

### 5.2 页面预览区

功能：

- 使用 iframe 渲染 HTML
- 隔离用户 HTML 对主应用的影响
- 支持元素 hover 高亮
- 支持元素 click 选中
- 支持选中元素边框和操作浮层

建议实现方式：

- iframe 使用 `srcdoc`
- 在注入预览前，为元素增加编辑器内部标识
- 预览页面内注入一段 editor bridge script
- 通过 `postMessage` 与主应用通信

### 5.3 属性编辑区

功能：

- 显示当前选中元素信息
- 编辑文本内容
- 编辑属性
- 编辑常见样式
- 支持颜色选择器、数字输入、下拉选项等控件

示例字段：

- Tag name
- Text content
- id
- class
- src
- href
- color
- background
- font size
- margin
- padding
- border radius

## 6. 技术架构

### 6.1 推荐技术栈

前端：

- React
- TypeScript
- Vite
- Monaco Editor

HTML 解析：

- parse5

CSS 解析：

- PostCSS

状态管理：

- Zustand 或 React Context

预览：

- iframe `srcdoc`
- `postMessage`

### 6.2 核心模块

```text
src/
  editor/
    sourceStore.ts
    domMapper.ts
    htmlParser.ts
    cssParser.ts
    sourceWriter.ts
  preview/
    PreviewFrame.tsx
    previewBridge.ts
  inspector/
    InspectorPanel.tsx
    StyleControls.tsx
    AttributeControls.tsx
  components/
    SourceEditor.tsx
    Toolbar.tsx
```

### 6.3 数据流

```text
用户导入 HTML
  ↓
解析 HTML 源码
  ↓
为元素注入 data-editor-id
  ↓
iframe 预览
  ↓
用户点击元素
  ↓
iframe 发送 selected editor id
  ↓
主应用找到对应源码节点
  ↓
属性面板展示可编辑字段
  ↓
用户修改字段
  ↓
更新 DOM / AST / 源码
  ↓
刷新预览和源码编辑器
```

## 7. 元素映射方案

可视化编辑的关键是：用户点击预览中的元素后，系统必须知道它对应源码中的哪个节点。

第一版可以采用 `data-editor-id` 方案。

### 7.1 注入编辑标识

导入 HTML 后，解析 DOM，为每个可编辑元素注入唯一 id：

```html
<h1 data-editor-id="el_001">标题</h1>
<img data-editor-id="el_002" src="./cover.png" />
```

这些 id 只用于编辑器内部，不应出现在最终导出的源码中。

### 7.2 选中元素

iframe 内部监听鼠标事件：

- `mouseover`：显示 hover 边框
- `mouseout`：移除 hover 边框
- `click`：阻止默认行为，读取 `data-editor-id`，发送给主应用

### 7.3 回写源码

主应用根据 `data-editor-id` 找到对应的 AST 节点，进行修改：

- 修改文本节点
- 修改属性
- 修改 style
- 修改 class

导出时移除所有 `data-editor-id`。

## 8. 源码同步策略

源码同步是本项目最大的技术难点。

### 8.1 第一阶段：HTML 节点回写

优先支持简单、稳定的回写：

- 修改标签文本
- 修改属性
- 修改 inline style

例如：

```html
<h1 style="color: red; font-size: 48px;">Hello</h1>
```

用户在属性面板中将颜色改为蓝色后，源码变为：

```html
<h1 style="color: blue; font-size: 48px;">Hello</h1>
```

### 8.2 第二阶段：CSS 规则回写

后续支持修改 `<style>` 中的 CSS 规则：

```css
.title {
  color: red;
}
```

当用户选中使用 `.title` 的元素并修改颜色时，可以选择：

- 仅修改当前元素，写入 inline style
- 修改该 class 对应的 CSS 规则

### 8.3 第三阶段：源码格式保持

后续可以引入更精细的源码定位能力，尽量保持用户原始格式。

第一版可以接受格式化后输出，重点先验证编辑链路。

## 9. 关键难点

### 9.1 样式来源复杂

一个元素的最终样式可能来自：

- 浏览器默认样式
- 父元素继承
- class
- id
- inline style
- media query
- CSS variable
- JavaScript 动态样式

第一版可以优先读取 `getComputedStyle` 展示最终样式，但修改时优先写入 inline style。

### 9.2 JavaScript 动态 DOM

如果页面中的元素由 JS 动态生成，源码中可能没有对应 HTML 节点。

第一版可以限制：

- 只支持静态 HTML
- JS 可以执行，但动态生成的节点不保证能同步回源码

### 9.3 PPT 多页结构

HTML PPT 可能通过以下方式表达页面：

- 每页一个 `.slide`
- 每页一个 `<section>`
- CSS transform 控制翻页
- JS 控制当前页

第一版可以先不强制理解 PPT 页结构，只按普通 HTML 页面编辑。后续可以增加 Slide 管理器。

### 9.4 拖拽和布局修改

拖拽元素看起来简单，但实际需要决定修改哪类 CSS：

- `left/top`
- `margin`
- `transform`
- flex/grid 布局属性
- absolute positioning

第一版建议先做表单式属性编辑，不急于做自由拖拽。

## 10. 迭代路线

### 10.1 第一阶段：基础可用

目标：完成最小闭环。

- HTML 输入
- iframe 预览
- 元素 hover/click
- 属性面板
- 文本编辑
- inline style 编辑
- 源码同步
- HTML 导出

### 10.2 第二阶段：更像编辑器

目标：提升可用性。

- Monaco 源码编辑器
- 选中元素源码定位
- 撤销/重做
- 图片替换
- 颜色选择器
- 常用尺寸控件
- 快捷属性面板
- 清理编辑器内部属性

### 10.3 第三阶段：面向 HTML PPT

目标：强化 PPT 场景。

- Slide 列表
- 当前页缩略图
- 新增/复制/删除页面
- 页面顺序调整
- 演示模式
- 导出单文件 HTML
- 导出 PDF 或图片

### 10.4 第四阶段：AI 辅助编辑

目标：结合自然语言和可视化编辑。

- 选中元素后让 AI 修改
- 对当前页面提修改建议
- 根据设计风格统一页面
- 批量调整所有标题/卡片/按钮
- 自然语言生成新 slide

## 11. 建议的第一版功能清单

第一版可以做成一个单页应用，包含：

- 顶部工具栏
  - 上传 HTML
  - 导出 HTML
  - 重置
  - 预览刷新
- 左侧源码编辑器
  - 展示 HTML
  - 支持手动编辑
- 中间预览区
  - iframe 预览
  - hover 高亮
  - click 选中
- 右侧属性面板
  - 文本内容
  - 标签属性
  - 常见样式

## 12. 成功标准

MVP 完成后，应该可以支持以下完整流程：

1. 用户上传或粘贴一份 HTML PPT
2. 页面可以正确预览
3. 用户点击一个标题
4. 属性面板显示标题文本和样式
5. 用户修改标题文字和颜色
6. 预览立即更新
7. 源码同步变化
8. 用户导出新的 HTML
9. 导出的 HTML 可以独立打开并保持修改结果

## 13. 总结

这个工具的核心价值不是替代 HTML、CSS 或 AI 编码，而是补齐 HTML 内容制作中的可视化编辑体验。

它应该保留 HTML 的自由度，同时让常见视觉修改变得更直接：

> 能看见，能点选，能修改，能回到源码。

第一版只要把“点选元素并回写源码”这条链路做稳，就已经具备很强的实用价值。后续再逐步扩展到 HTML PPT 管理、CSS 规则编辑、AI 辅助修改和导出能力。
