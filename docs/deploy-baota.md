# 腾讯云轻量服务器 + 宝塔面板部署文档

本文档用于把 HTML Studio 部署到已有域名下的子域名，例如：

```text
html-ppt.your-domain.com
```

项目是零依赖前端工具，推荐优先用宝塔面板做静态站点部署。`server/index.js` 只用于本地开发或需要 `/health` 健康检查时的 Node 部署。

## 方案选择

推荐方案：静态站点部署

- 优点：最稳、最简单、资源占用最低。
- 适合：宝塔面板已有 Nginx/Apache，子域名只需要访问编辑器页面。
- 入口：`index.html`。

可选方案：Node 服务部署

- 优点：保留 `/health` 健康检查。
- 适合：后续需要增加接口、用户系统、云端保存。
- 启动命令：`node server/index.js`。

## 一、DNS 解析

在腾讯云 DNSPod 或域名解析控制台中添加子域名解析：

```text
主机记录：html-ppt
记录类型：A
记录值：你的腾讯云轻量服务器公网 IP
线路类型：默认
TTL：默认
```

如果你想使用 `www.html-ppt.your-domain.com`，再添加一条：

```text
主机记录：www.html-ppt
记录类型：A
记录值：你的腾讯云轻量服务器公网 IP
```

注意：DNS 解析只负责把域名指向服务器。真正让子域名对应到哪个目录，还需要在宝塔面板里创建站点并绑定域名。

## 二、宝塔创建站点

进入宝塔面板：

1. 打开「网站」。
2. 点击「添加站点」。
3. 域名填写你的子域名，例如：

```text
html-ppt.your-domain.com
```

4. 根目录建议使用：

```text
/www/wwwroot/html-ppt.your-domain.com
```

5. PHP 版本选择「纯静态」或不启用 PHP。
6. 提交创建。

## 三、上传项目文件

把这些文件上传到站点根目录：

```text
index.html
styles.css
app.js
package.json
README.md
server/
scripts/
docs/
```

静态部署真正需要的是：

```text
index.html
styles.css
app.js
```

但建议把 `README.md` 和 `docs/` 也上传，方便后期查看版本说明。不要把整个项目套进额外目录里，必须保证：

```text
/www/wwwroot/html-ppt.your-domain.com/index.html
```

而不是：

```text
/www/wwwroot/html-ppt.your-domain.com/html-tool/index.html
```

## 四、设置默认首页

在宝塔站点设置中确认默认文档包含：

```text
index.html
```

如果没有，把 `index.html` 添加到默认文档列表的前面。

## 五、申请 SSL

在宝塔面板中：

1. 打开站点设置。
2. 进入「SSL」。
3. 选择 Let's Encrypt。
4. 勾选子域名。
5. 申请证书。
6. 开启「强制 HTTPS」。

如果 SSL 申请失败，先确认 DNS 已经生效，可以在本地运行：

```bash
ping html-ppt.your-domain.com
```

返回的 IP 应该是你的腾讯云轻量服务器公网 IP。

## 六、Nginx 静态站点配置

一般宝塔默认配置就够用。如果需要手动确认，核心配置类似：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

这个项目不是单页路由应用，通常不需要复杂 rewrite。

## 七、更新部署

以后更新版本时：

1. 本地确认功能。
2. 运行检查：

```bash
npm run check
```

3. 上传覆盖：

```text
index.html
styles.css
app.js
```

4. 浏览器强制刷新：

```text
Ctrl + F5
```

如果你用了 CDN，需要刷新 CDN 缓存。

## 八、可选 Node 服务部署

如果你想让 `/health` 可用，或者未来要扩展接口，可以用 Node 项目方式部署。

宝塔准备：

1. 安装「Node 项目管理器」。
2. 上传完整项目。
3. 在项目目录运行：

```bash
npm install
npm run check
```

本项目当前没有外部依赖，`npm install` 主要用于标准化项目流程。

启动命令：

```bash
node server/index.js
```

默认端口：

```text
5178
```

然后在宝塔反向代理中把子域名代理到：

```text
http://127.0.0.1:5178
```

Node 方案需要确保安全组和宝塔防火墙只开放必要端口。对公网推荐只开放 `80` 和 `443`，不要直接暴露 `5178`。

## 九、上线前检查清单

- DNS A 记录已指向腾讯云轻量服务器公网 IP。
- 宝塔站点已绑定子域名。
- `index.html` 在站点根目录。
- HTTPS 证书已申请并开启强制 HTTPS。
- 浏览器访问子域名可以打开 HTML Studio。
- 上传一个 HTML PPT 文件测试预览。
- 修改文本后导出，确认导出文件不会发生大面积样式变化。
- 尝试刷新页面，确认本地草稿恢复提示正常。

## 十、常见问题

### 打开子域名显示宝塔默认页

通常是站点根目录不对，或 `index.html` 不在站点根目录。

### DNS 已解析但访问不到

检查腾讯云轻量服务器安全组和宝塔防火墙是否允许 `80`、`443`。

### HTTPS 证书申请失败

确认子域名已经解析到当前服务器，并等待 DNS 生效。

### 页面更新后浏览器还是旧版本

使用 `Ctrl + F5` 强制刷新。如果用了 CDN，刷新 CDN 缓存。
