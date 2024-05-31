
# 课程减减学习
nvm -v
1.1.12

node -v
v21.2.0

https://mp.weixin.qq.com/s?__biz=MzUyMjkwNTgwOA==&mid=2247485923&idx=1&sn=0710d33fd1e1287e10f88bd4139e0a0e&chksm=f9c5f85cceb2714a585567f21751ae703f8ba80519a7a089746079a05c4f916c962fe81332d1#rd

## 项目构建，安装依赖
```
yarn config set registry https://registry.npmmirror.com
```
### FE

```

react-learn/src
yarn create react-app react-learn 
yarn add antd
```

### BE
```
react-learn/node-src
yarn init

yarn add node-fetch@2 node-xlsx koa koa-router

.gitignore
```


## UI设计
* header
* body
    - 搜索框  和下边card 联动
    - tag 和 下边card 联动
    - card
        - button
        - image
        - text
* footer

## 数据库/后端http服务
* 存储在excel里，koa作为http后端从excel里读取数据返回前端
* node koa.js 提供httpserver

## 交互, 前端组件通信
* 点击tag
* 搜索
* 加载动画
* 触底加载
* 跨域,设置允许的域名和 header 头

```javascript
app.use(async (ctx, next) => {
  // 设置允许跨域访问的源
  ctx.set("Access-Control-Allow-Origin", "http://localhost:3000");
  // 设置允许跨域访问的方法
  ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  // 设置允许跨域访问的请求头
  ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // 如果是跨域请求的预检请求，直接返回成功响应
  if (ctx.method === "OPTIONS") {
    ctx.body = "";
    ctx.status = 204;
  } else {
    await next();
  }
});
```

### react hooks
useState 响应式变量
useRef 引用值或者标签
useEffect 参数2 更新时 调用参数1的函数