# 前端 HTTP 学习指南

# 写在前面

文章会从前端的视角分享一些 HTTP 相关的知识, 希望能帮助读者对 HTTP 协议建立更健全的认知, 为了实现更好的学习效果, 推荐阅读本文的同时希望读者也能做一些简单的尝试或者写一些代码来辅助理解, 对于模糊的点可以在提供的学习资料中寻找, 也可以抛出来大家一起交流.

本文的实例代码都可以在 [nzhl/http-learning-guide](https://raw.githubusercontent.com/nzhl/http-learning-guide) 找到.

# 1. 概览

## 学习资料

[https://developer.mozilla.org/en-US/docs/Web/HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) （文章大部分内容的参考, 一定程度上, 可以认为本文是精简+意译版的 MDN）
[RFC 7230 - Hypertext Transfer Protocol (HTTP/1.1): Message Syntax and Routing](https://tools.ietf.org/html/rfc7230) (HTTP1.1 规范)

## 特点

HTTP 协议是一个应用非常广泛的协议, 它本身非常简单, 但是一定程度上仍然能够保证:

1. 可靠性: 通常基于 TCP 协议实现, TCP 保证了其传输的可靠性

2. 安全性: 本身明文(ASCII)传输, 并不保证安全, 主要依赖 HTTPS

3. 有状态: 设计上是无状态的, 不过现实场景中通常通过 Cookie 来保证有记忆

## 结构

HTTP 是典型的 CS 模型, 协议规定了 Client 和 Server 之间数据交换的方式, 形式上非常简单, 从 Client 发起请求, Server 根据 Client 的请求作出响应. 由于 HTTP 是明文传输, 报文内容都是可读的, 所以可以说是非常容易理解的.

请求和响应无一例外都由三部分组成:

1. Start Line (Request) / Status Line (Response)

2. headers

3. Body

![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-1-1620799673079.png)

## 实现一个简易的 Client & Server

### 分析需求

Ok, 现在已经拥有了足够的知识, 来尝试实现一个简易的 Client & Server, 先来分析下工作:

1. Client 需要发送 HTTP 请求, 并收到来自 Server 的响应, 常见的例子有 浏览器, Postman, curl 之类.

2. Server 需要监听某个端口, 并随时对到来的请求作出回应, 常见的例子有 你访问的任何一个网站, 后端起的 API 服务, 甚至包括你开发用的 devServer.

### 指导文档

[https://nodejs.org/api/net.html](https://nodejs.org/api/net.html)

### 代码实现

**相关的代码可以在文章首部给出的代码仓库中的 src/example1 中找到**

1. 首先根据上面报文结构的说明, 简单生成下报文, 这里直接写死

```typescript
// http.ts

// [https://stackoverflow.com/questions/5757290/http-header-line-break-style](https://stackoverflow.com/questions/5757290/http-header-line-break-style)
const LINE_SEPERATOR = '\r\n';

const createHttpMessage = ({
  startLine,
  headers,
  body,
}: {
  startLine: string;
  headers: string;
  body: string;
}) => {
  const headersWithLength =
    headers + `Content-length: ${body.length}` + LINE_SEPERATOR;
  return startLine + headersWithLength + LINE_SEPERATOR + body;
};

export const REQUEST = createHttpMessage({
  startLine: 'GET / HTTP/1.1' + LINE_SEPERATOR,
  headers: 'Host: [github.com](http://github.com/)' + LINE_SEPERATOR,
  body: '',
});

export const RESPONSE = createHttpMessage({
  startLine: 'HTTP/1.1 200 OK' + LINE_SEPERATOR,
  headers:
    'Server: FredHomeMadeServer Node/14' +
    LINE_SEPERATOR +
    'Content-type: text/html' +
    LINE_SEPERATOR,
  body: `<html> <body> <h1> hello wrold </h1> </body> </html>`,
});
```

2. 实现一个客户端, 大致工作:

   1. 初始化一个 Socket 并与某个服务器建立连接

   2. 发送请求报文

   3. 接受响应报文

```typescript
// [https://stackoverflow.com/questions/5757290/http-header-line-break-style](https://stackoverflow.com/questions/5757290/http-header-line-break-style)
const LINE_SEPERATOR = '\r\n';

const createHttpMessage = ({
  startLine,
  headers,
  body,
}: {
  startLine: string;
  headers: string;
  body: string;
}) => {
  const headersWithLength =
    headers + `Content-length: ${body.length}` + LINE_SEPERATOR;
  return startLine + headersWithLength + LINE_SEPERATOR + body;
};

export const REQUEST = createHttpMessage({
  startLine: 'GET / HTTP/1.1' + LINE_SEPERATOR,
  headers: 'Host: myfakehost' + LINE_SEPERATOR,
  body: '',
});

export const RESPONSE = createHttpMessage({
  startLine: 'HTTP/1.1 200 OK' + LINE_SEPERATOR,
  headers:
    'Server: FredHomeMadeServer Node/14' +
    LINE_SEPERATOR +
    'Content-type: text/html' +
    LINE_SEPERATOR,
  body: `<html> <body> <h1> hello world </h1> </body> </html>`,
});
```

尝试运行代码，应该能看到 302 重定向, 这是因为 github 希望我们使用 https 访问其站点

```css
  dev:client ~~ request sent ~~ +0ms
  dev:client request write finish +1ms
  dev:client HTTP/1.1 301 Moved Permanently
  dev:client Content-Length: 0
  dev:client Location: [https](https://raw.githubusercontent.com/)[://](https://raw.githubusercontent.com/)[github](https://raw.githubusercontent.com/)[.com](https://raw.githubusercontent.com/)[/](https://raw.githubusercontent.com/)
  dev:client
  dev:client  +302ms
  dev:client response read end +0ms
  dev:client socket close +0ms
```

3. 实现一个服务器, 大致工作:

   1. 初始化一个 Server 并监听某个端口

   2. 解析发来的请求

   3. 作出恰当的响应

```typescript
// server.ts

import { Server } from 'net';
import debug from 'debug';
import { RESPONSE } from './http';

const d = debug('dev:server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = new Server();

  server.on('connection', (reqSocket) => {
    d('~~ request coming ~~');
    let tmp = Buffer.alloc(0);

    reqSocket.on('data', (chunk) => {
      tmp = Buffer.concat([tmp, chunk]);
      const tmpStr = tmp.toString();

      // check end of http
      // [https://httpwg.org/specs/rfc7230.html#rfc.section.3.3.3](https://httpwg.org/specs/rfc7230.html#rfc.section.3.3.3)
      if (tmp.includes('Content-Length')) {
        // todo
      } else if (tmp.includes('Transfer-Encoding')) {
        // todo
      } else if (tmpStr.endsWith('\r\n\r\n')) {
        // [https://raw.githubusercontent.com/jinhailang/blog/issues/34](https://raw.githubusercontent.com/jinhailang/blog/issues/34)
        // body empty
        d(tmp.toString());
        reqSocket.end(RESPONSE);
      }
    });

    // no more content to read
    reqSocket.on('end', () => {
      d('request read end');
    });

    // no more content to write
    reqSocket.on('finish', () => {
      d('response write finish');
    });

    reqSocket.on('close', () => {
      d('socket close');
    });
  });

  server.listen(port, host, () => {
    d(`server listening ${host}:${port}`);
    cb();
  });
};

startServer(10086, '0.0.0.0');
```

打开浏览器, 访问 [http://localhost:10086/,](http://localhost:10086/,) 应该该能看到
![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-2-1620799675708.png)

### 小练习

1. 沿着上面的思路, 改造 Client, 实现 Postman 儿童版 Postchild, 能自定义发送 HTTP 请求.

2. 沿着上面的思路, 改造 Server, 实现 [http-server](https://raw.githubusercontent.com/http-party/http-server) 简陋版, HOST 当前目录.

# 2. 基础的概念

下面介绍 HTTP 协议中一些基础的概念, 当然为了不让文章变得过于枯燥, 只会有个简要的描述, 其中一些重要的概念会在下一节中结合实际场景被强调.

## 学习资料

[HTTP request methods - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
[HTTP headers - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
[HTTP response status codes - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
[理解 RESTful 架构 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2011/09/restful.html)
[RESTful API 设计指南 - 阮一峰的网络日志](http://www.ruanyifeng.com/blog/2014/05/restful_api.html)
[Architectural Styles and the Design of Network-based Software Architectures](https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm)

## 请求方法

## 请求/响应头

头信息为 http 交互过程提供了额外的信息, MDN 列出了 Headers 的多种分类方式, 感觉刻意去记忆这些分类意义不大, 更多是理解每个字段的意义, 这个后面结合场景来讲. 这里只讲两点:

1. Headers 的名字是大小写不敏感的, 名字和值靠冒号隔开, 值签名的空格会被忽略.

2. 我们在业务里面通常会使用 X- 来命名自定义的请求头, 不过这个习惯已经被标记为废弃了, 因为使得后续这个非标准请求头变为标准时候, 命名的变更会非常麻烦.

## 响应状态码

### 1xx

1. 101: 更换协议, 比如 websocket 建立连接的时候需要发送一个 HTTP 的握手包, 此时如果服务器能理解并同意升级, 就会返回 101

### 2xx

成功相关

1. 200: 请求成功

2. 206: 部分内容, 一般在分片传输的过程中用到, 后面具体讲

### 3xx

重定向相关的, 比较常见的比如:

1. 301, 308: 永久重定向, 后者规定重定向后必须使用相同的请求方法

2. 302, 307: 暂时重定向, 后者规定重定向后必须使用相同的请求方法

3. 304: 内容没变: 直接使用缓存作为响应, 细节后面结合 HTTP Headers 具体讲.

### 4xx

客户端错误, 比较常见的比如:

1. 400: 错误的请求, 一般是请求格式不对或者多了少了参数

2. 401: 未授权, 一般是身份校验没过

3. 403: 被禁止, 和 401 有点像, 但这里更多用作服务器了解客户端的身份但是仍然禁止, 譬如写爬虫未经允许强行爬简历

4. 404: 找不到, 一般是 Url 对应的页面, 资源没了, 通常是访问了已经下线或者不存在的 Url

5. 405: 方法不允许: 使用了服务器不允许的请求方法

### 5xx

服务端错误, 比较常见的比如:

1. 500: 服务器内部错误, 通常是服务器逻辑有问题, 内部出现了没法处理的异常

2. 502: 网关错误, 通常是服务端针对你的请求给出了非法的响应, 此时作为中间层的代理或网关将直接返回 502, 譬如有时候用 whistle 代理访问后端开发机, 后端直接关机了, 就会返回 502.

3. 503: 服务不可用, 通常是服务器过载了, 比如你的博客突然上了微博热榜, qps 直接上百万, 这时候大概率你的服务器会返回 503.

4. 504: 网关超时, 指服务器无法在给定的时间内给出响应, 此时作为中间层的代理或网关将直接返回 504, 譬如有时候服务器访问数据库的耗时超过了 nginx 的默认超时时间, 就会返回 504.

## RESTful API

### **概念**

一套比较流行的 HTTP API 的设计规范, 大致规则如下:

1. 用 URI 表示资源

2. 用 HTTP METHOD 表示对资源执行的动作

   - 创建：POST

   - 删除：DELETE

   - 完整修改: PUT

   - 部分修改: PATCH

   - 查询：GET

### **示例**

GITHUB 的 API 给了一个很好的示范: [Projects - GitHub Docs](https://docs.github.com/en/rest/reference/projects#get-a-project)

```coffeescript
GET /projects/{project_id}  获取一个项目
PATCH /projects/{project_id} 更新一个项目
DELETE /projects/{project_id} 删除一个项目
```

###

### **优点**

简单清晰, 可读性高, 使用广泛.

### **局限性**

有些场景下基于资源的抽象不够直观, 比如我们常见的 "登录, 登出" 接口, 按照 RESTful 规范得:

1. `登陆: POST /user/session`

2. `登出: DELETE /user/session`

但真这么设计反而很费解, 现实中往往会直接用 `/api/login` / `/api/logout` 会清晰.

# 3. 一些实际的场景

## 3.1 缓存相关

### 学习资料

[HTTP caching - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

### 概述

缓存可以认为是一个计算机领域非常常见的优化策略, 一方面它能有效缓解了服务器的负载压力, 另一方面变相提升了服务的性能, 改善了用户体验. 但是与此同时, 它也引入了一些复杂性, 比如如何保证合理地配置缓存而避免将”过期“的信息呈现给用户呢?
受到篇幅限制, 这一节侧重点会放在与 HTTP 相关的缓存知识, 另一方面即使是这样, 也会选择性地删减掉一些具体细节, 此外组里已经有了一篇不错的 [HTTP 缓存科普文章](https://bytedance.feishu.cn/wiki/wikcn1jPz5yeWqnQih8Fy77Yvte#) , 大家可以对照着看, 互为补充.

### 适用范围

缓存虽然好, 但是要明确的是, 并不是所有的场景都适合做缓存, 合适缓存优化有几个条件:

1. 首先第一点, 缓存更多是针对资源的读取, 资源的更新/修改的动作本身是很难缓存的

2. 进一步讲, 必须确保读取到的资源在一定时间内, 一定(用户)范围内是可复用的, 因为只有这样的场景缓存优化才有意义.

具体到 HTTP 协议, 可以看出来大部分情况下只有 GET 请求做缓存优化才有意义. 原因是 GET 请求往往表示对 HTML / JS / CSS / 图片 / 某段 JSON 等等资源的获取, 其次它本身对服务器也没有副作用, 所以 GET 请求的结果相对来说会更可复用.

### 分类

在 MDN 上缓存被分成了两类: Private Cache (也叫 Local Cache) 和 Shared Cache.

1. Private Cache 指的是针对单个用户(准确来说是每个浏览器)的缓存, 例如经常能在控制台中看到的 Memory/Disk Cache, 这属于浏览器自身对于资源的缓存, 因为存储在本地, 所以又叫做 Local Cache. 浏览器会按照一定的规则来决定是否复用这些缓存, 这些规则和我们下面要讲的 HTTP 请求头是息息相关的.

![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-3-1620799678128.png) 2. Shared Cache 指的是可以被多方复用的 cache, 具体来说, 从浏览器(客户端)到最终的服务器之间可能存在用户配置的代理, 各级 CDN 的节点, 以及服务端的反向代理, 理论上他们都可以有自己的缓存, 这一类缓存都算是 Shared Cache. HTTP Headers 中有些指令是专为 Shared Cache 准备的.

了解了这个概念, Cache-Control 的这两个指令就很容易理解了:

- Cache-Control: public: 表示任何中间商(浏览器, 代理, CDN 等), 一些不常被缓存的 case (譬如 post 请求)都可以缓存.

- Cache-Control: private: 表示只有浏览器能缓存

### 具体的过程

弄清了缓存的分类, 我们直接来看看缓存应用的具体流程, 如果从用户发起请求来看, 整个缓存的逻辑分以下几个阶段

#### Service Worker

Service Worker 是一种特殊的 Worker, 它可以拦截从当前页面发出的请求, 所以本质上可以认为它实际可以算是架设在浏览器侧的代理服务器. 虽然不能直接访问 DOM, XHR, localStorage, 但是却提供了 cache 相关的存储 API. 不过从概念上并不算是 HTTP 协议的一部分, 另一方面兼容性也是不算特别好, 感兴趣的同学可以看看 [Service Worker API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

#### 不缓存

即 Cache-Contol: no store，表示直接跳过缓存环节, 直接向服务端请求最新的内容. 不过要注意如果你是想真的拿到服务端响应的最新资源, 直接 no-store 可能不太好使, 参见

> Note that this will not prevent a valid _pre-existing_ cached response being returned. Clients can set `max-age=0` to also clear existing cache responses, as this forces the cache to revalidate with the server (no other directives have an effect when used with `no-store` ).

换句话说你得

> The no-store directive will prevent a new resource being cached, but it will not prevent the cache from responding with a non-stale resource that was cached as the result of an earlier request. Setting max-age=0 as well forces the cache to revalidate (clears the cache).
> `Cache-Control: no-store, max-age=0`

#### 强制缓存 & 协商缓存

强制缓存指的是浏览器在缓存未失效的情况下,直接避免向后端发起请求转而直接使用本地的缓存, 那如何确认浏览器缓存是否失效呢? 相关响应头有 Pragma, Expire 以及替代者 Cache-Control, 其中前两个由 HTTP1.0 提出, 而替代者是 HTTP1.1 的新规范, 为缓存提供了更大的操作空间:

- Pragma 只有一个可选值 no-cache, 与 Cache-Control 中的 no-cache 同意, 当然这里并不是字面意思不缓存, 作为响应头出现时, 意思是每次获取资源都需要和最终的服务器再次确认. 不过严格来讲, HTTP 协议中并没有明确规范 Pragma 的行为, 所以它的行为可能会在不同实现上有所差别, 所以在支持 Cache-Control 场景下来时尽量避免使用这个字段.

- 刚才提到 no-cache 作为响应头的时候, 意思是每次获取资源都需要和最终的服务器再次确认. 但其实 `Cache-Control: no-cache` 也可以作为请求头, 其行为和作为响应头还是有一定差别的, 具体可以看下面的代码实现.

- Expires 的值为服务端返回的到期时间，例如 `Expires: Wed, 21 Oct 2015 07:28:00 GMT` , 即下一次请求时，请求时间如果早于上面这个到期时间，那么直接使用缓存数据. 当然也返回 0, 表示资源已经过期了, 是否利用缓存需要前往服务端进行验证.

- Expires 的问题在于, 当客户端和服务器端时间存在误差时, 容易导致缓存策略提前或延后失效. 基于这个背景, HTTP1.1 提出的新的 HTTP Header "Cache-Control", 首先 t 它的优先级高于 Expire, 它里面有关过期的字段有这么几个:

  - max-age=<seconds>: 指令的值是资源的最大过期时间, 这样就避免了 Expire 使用绝对过期时间导致的问题. （request & response）

  - s-maxage=<seconds> : 这个是专为 Shared Cache 准备, 在 Private Cache 场景下 (浏览器侧)会被忽略, 含义同上. (response only)

  - max-stale[=<seconds>]: 服务端响应的内容如果过期(不超过 x 秒), 那么仍然使用缓存. (request only)

  - min-fresh=<seconds>: 服务端响应的内容至少在 x 秒内需要是有效的. (request only)

  - stale-while-revalidate=<seconds>: 之前比较火的请求库 swr 命名就是出自这里, 表示客户端在响应内容过期(不超过 x 秒)的时间里, 客户端会可以先接受过期的缓存, 但是在后台仍然向服务端请求一个最新的. (experimental)

  - stale-if-error=<seconds>： 表示当请求内容的请求失败时, 如果最初请求(上一次成功) 的请求过期(不超过 x 秒), 那么会直接使用缓存内容进行兜底. (experimental)

到这可能会困惑, Cache Control 指令很多, 而且作用上有一些能相互补充, 实际中怎么选择呢 ? 其实不需要选择, 完全可以一次性可以指定多个不矛盾的指令, 用逗号隔开, 比如说, `Cache-Control: public, max-age=604800` 是完全合法的.

#### 协商缓存

协商缓存指的是判断发现浏览器缓存已经失效的情况下, 向服务端发起请求, 验证缓存的有效性. 相关的请求头也有几套 `Last-Modified / If-Modified-Since` 以及 `Etag / If-None-Match` .

- 前者的使用方法是, 客户端在请求头中带上 If-Modified-Since \*\*\*\*字段, 其值是服务端上次请求返回的 Last-Modified, 真实例子大概长这样 `Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT`

- 这种方式精度偏低, 所以协议也固定了一种优先级更高的协商方式即 `Etag / If-None-Match` , 交互方式与前者类似, 唯一的区别是 Etag 是基于响应内容生成的, 会有更高的精度.

服务端收到请求后应该根据实际的情况判断当前客户端所持有的资源是否仍然有效, 若有效则返回 304, 否则将最新的响应内容返回.

### 主流程之外

#### 缓存的标识符

这里提一个在很多资料中被忽略的细节, 类似于数据库中的记录, 缓存需要有一个唯一标识符号, 换句话说就是, 如何判断请求 a 和 请求 b 本质上是同一个请求? 其实这里有多条标准:

1. 首要的当然是 URI 和 请求方法, 这个是最核心的, 如果这两个不相等, 那肯定不能缓存.

2. 然后就要提到另一个 Http Header -- Vary，意思是除了 URI 和 method 以外, 也需要参考 vary 中声明的这些字段, 只有他们都一致, 才可以认为这两个请求可共用缓存.

   - Vary: \*

   - Vary: <header-name>, <header-name>, ...

前者作用和 `Cache-Control: no-store` 一致, 后者表示列举的这些字段也作为判断两个请求是否复用缓存的条件.
比较常见的用法如 `Vary: User-Agent` ，这样可以防止把 PC 端版本的页面错误地返回给移动端用户.

#### 浏览器刷新

打开控制台后, 共有三种刷新方式, 这里简单介绍下三种方式与我们上面提到的缓存策略之间的关系, 从现象来看

- "正常重新加载"时浏览器只会对当前地址栏中地址对应的请求使用 `max-age: 0` , 对于直接依赖的文件是仍然按照正常的请求流程.

- "硬性重新加载"时浏览器不但会对地址栏中地址所对应的请求发送做特殊处理, 也会对该请求产生的直接依赖文件进行特殊处理, 且处理方式是 `no-cache` 而不是 `max-age: 0` , 关于他们的区别可以看看 [https://stackoverflow.com/a/1383359/5817139,](https://stackoverflow.com/a/1383359/5817139,) 简单来说就是, 前者将不依赖协商缓存的校验机制, 服务端必须最终返回一个份新的非缓存的数据, 而后者则取访问链路上最近的(经过协商后)合理的节点的缓存.

- 清除缓存并硬性重新加载: 这个就比较简单了, 就是在硬性重新加载之前先清除浏览器的缓存, 这前者的唯一区别是, 现在连间接依赖(譬如用户浏览的是 index.html, 它引入了一个 a.js, 那么这个 a.js 算直接依赖, 如果 a.js 依赖另一个文件 b.js, 此时 b.js 算间接依赖)也不再走缓存流程.

### 代码实现

**相关的代码可以在文章首部给出的代码仓库中的 src/example2 中找到**

上面聊了这么多, 其实这块整体还是偏概念的. 下面尝试给出一个简单的实例进行验证来加深大家的理解.

1. 首先我们来写一个简单的 html 来负责给服务端发请求:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>X</title>
  </head>
  <body>
    <button id="b1">getTime (no-store)</button>
    <div style="border: 1px solid red;margin: 12px 0 24px 0;">
      <div id="d1"></div>
    </div>

    <button id="b2">getTime (no-cache)</button>
    <div style="border: 1px solid red;margin: 12px 0 24px 0;">
      <div id="d2"></div>
    </div>

    <button id="b3">getTime (max-age=5; Etag=invalid)</button>
    <div style="border: 1px solid red;margin: 12px 0 24px 0;">
      <div id="d3"></div>
    </div>

    <button id="b4">getTime (max-age=5; Etag=1234)</button>
    <div style="border: 1px solid red;margin: 12px 0 24px 0;">
      <div id="d4"></div>
    </div>

    <button id="b5">getTime (max-age=5; Etag=1234; Vary)</button>
    <div style="border: 1px solid red;margin: 12px 0 24px 0;">
      <div id="d5"></div>
    </div>
  </body>

  <script>
    const bind = (btnId, divId, headers) => {
      const btn$ = document.getElementById(btnId);
      const div$ = document.getElementById(divId);
      btn$.onclick = async () => {
        const res = await fetch(`/api/${headers['Cache-Control']}/${btnId}`, {
          headers: {
            ...headers,
            // 思考下原样传送 no cache 会发生什么
            // 和传空有什么区别
            'Cache-Control':
              headers['Cache-Control'] === 'no-cache'
                ? ''
                : headers['Cache-Control'],
            'x-date': Date.now(),
          },
        });
        div$.innerHTML = await res.text();
      };
    };
    bind('b1', 'd1', {
      'Cache-Control': 'no-store',
    });

    bind('b2', 'd2', {
      'Cache-Control': 'no-cache',
    });

    bind('b3', 'd3', {
      'Cache-Control': 'max-age=5',
    });
    bind('b4', 'd4', {
      'Cache-Control': 'max-age=5',
    });
    bind('b5', 'd5', {
      'Cache-Control': 'max-age=5',
    });
  </script>
</html>
```

这里思路很简单, 就是分别往服务端发送各种带不同缓存头的 header, 方便服务端对应返回不同的缓存头 (注意, 真实情况下服务端对于不同缓存头的处理会更加复杂, 这里我们主要是验证浏览器对于缓存头的处理).

2.  接下来写个简单的 server, 为了防止三方 server 对于缓存会有额外的处理, 这里我们选择直接用 Node 的原生模块来起一个 server

```typescript
import debug from 'debug';
import { createReadStream } from 'fs';
import { createServer } from 'http';

const d = debug('ex2/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`);
    const path = req.url || '';
    if (path.startsWith('/api')) {
      if (path.includes('no-store')) {
        res.setHeader('Cache-Control', 'no-store');
      }
      if (path.includes('no-cache')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
      if (path.includes('max-age')) {
        if (path.includes('b5')) {
          res.setHeader('Vary', 'x-date');
        } else {
          res.setHeader('Vary', 'Cache-Control');
        }
        res.setHeader('Cache-Control', 'max-age=10');
      }

      if (req.headers['If-None-Match'.toLowerCase()] && !path.includes('b3')) {
        res.statusCode = 304;
      }

      res.setHeader('Etag', '1234');
      const body = Date.now() + '';
      d(body);
      res.end(body);
    } else if (path === '/') {
      const htmlStream = createReadStream('./dist/index.html');
      htmlStream.pipe(res);
    } else {
      res.statusCode = 404;
      res.end();
    }
  });

  server.listen(port, host, cb);
};
```

思路也很简单, 根据客户端的请求作出对应的响应.

3. 完事之后，拉起服务器, 打开 [http://localhost:10086](http://localhost:10086/) , 一切顺利应该能看到如图, 尝试点击各个按钮观察控制台以及页面行为, 验证自己的想法

![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-4-1620799682981.png)

### 小练习

1. 修改上述代码, 探究一下 `Cache-Control: no-store` 作为请求头和响应头的区别.

2. 沿着上面的思路, 尝试验证代理服务器对于缓存的影响

## 3.2 跨域相关

### 长啥样

![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-5-1620799683383.png)

### 学习资料

[Same-origin policy - Web security | MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)

### 同源

为了定义两个 url 之间的亲疏关系 (即是否来自相同的服务器, 或者相互信任的组织), w3c 提出了同源的概念, 同源必须满足三个条件:

1. protocol 相同

2. host 相同

3. port 相同

譬如在页面 [https://www.bytedance.com](https://www.bytedance.com/) 上, 以下请求的情况是:

1. [http://www.bytedance.com](http://www.bytedance.com/) 协议不同

2. [https://www.bytedance.net](https://www.bytedance.net/) host 不同

3. [https://www.bytedance.com:10086](https://www.bytedance.com:10086/) port 不同

4. [https://www.bytedance.com/api](https://www.bytedance.com/api) 同源

### 同源策略

再来看看同源策略的定义

> The **same-origin policy** is a critical security mechanism that restricts how a document or script loaded from one origin can interact with a resource from another origin. It helps isolate potentially malicious documents, reducing possible attack vectors.

更通俗的, 现代网页应用同时与多个 url 发生交互是很常见的事情, 出于安全考虑, 浏览器会根据 url 之间的亲疏关系来对它们的交互进行不同程度的限制. 很自然地, 借用我们上面的定义, 同源的 url 更亲近, 倾向于互相信任, 它们之间的交互会获得更多的自由, 反之, 不同源在交互过程中会受到限制, 更具体的, MDN 定义了三种类型的跨域交互:

1. 首先是跨域写, 比如类似重定向, 表单提交等, MDN 表示这通常是被允许的. 这里听起来可能会有些费解, 我的理解是, 这里写是发生在跨域域名的服务器上, 因为这个请求确实被发送到了服务器, 不管服务器是否有相应的鉴权逻辑或者防御机制, 认为服务器被 “写” 了是说得通的.

2. 然后是跨域的嵌入资源, 通常也是被允许的, 比如所谓的 script, link, img, video, iframe 等等, 这个很好理解, 一些早期的跨域方案实际上就是依赖了嵌入资源不受跨域限制这一点.

3. 最后一种是跨域读, MDN 表示这通常是被禁止的, 这个就是我们平时看到的 `Access xxx url has been blocked by CORS policy`.

### 跨域 & CORS

现实中其实有很多不同源的 url 实际是来自同一厂商, 它们之间也有丰富的资源交互的需求. 所以可以看到的是, 同源策略的存在在提升了 web 安全的同时, 也导致了诸多不便, 我个人理解跨域实际上就是在解决 **“如何安全地在不同源但是相互信任的 url 之间进行资源交互”** 的问题.

随手 Google 一下, 可以发现大量跨域解决方案, 比较常见的有譬如 proxy, jsonp, iframe 以及 cors. 严格来讲其实只有 CORS 和 proxy 可以算是正统的解决思路, 其他的解法都比较 tricky, 不过为了介绍的完整性, 依然会简单介绍除 CORS 以外的其他的一些跨域思路.

### proxy

#### 流程

这个准确来说不算从根本上解决了问题, 做法很简单, 既然跨域发生在两个 url 不同源的情况下, 那就加一层反向代理把其中一个 url 的链接映射到到另一个 url 上, 如图所示:
![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-6-1620799685406.png)

#### 局限性

相当于变相地把服务放在了同一个域名下, 大部分情况是, 如果两个服务能放在同一个域名下, 最初设计的时候就放了.

### jsonp (json with padding)

#### 流程

jsonp 是早期使用比较广泛的一种跨域手段, 利用的就是我们上面提到的嵌入资源不存在跨域限制的这一点. 假设在 [www.foo.com](http://www.foo.com/) 依赖了 bar 服务器的一些信息, 那么
在页面上我们需要:

1. 定义一个响应的处理函数

```typescript
const handleResponse = (infoJson) => {
  // logic with info
};
```

2. 动态创建一个 script 标签, 其 src 为 `[https://www.bar.com/api/info?callback=handleResponse](https://www.bar.com/api/info?callback=handleResponse)`

按照约定, bar 服务器需要发返回 js 文件, 其内容为一个被我们声明的 callback 函数包裹的 json, 这就是所谓的 JSON (Json with Padding)

```typescript
handleResponse({
  // info content
  name: 'xxx',
  age: 24,
});
```

此时一旦 js 被返回, 其内容被浏览器解析, 则自动调用 handleResponse, 这就完成了一次跨域的数据交换.

#### 局限性

这个方法其实存在不少安全隐患, 比较典型的譬如 CSRF, 攻击者写一个有问题的网页 a, 在其中使用 jsonp 访问了存在安全隐患的服务器 b 的某个隐私数据接口. 此时如果用户进入这个问题网页 a, 会在不知情的情况下访问服务器 b, 假设用户曾经在 b 登陆过, 那么他的数据自然会被带给问题网页 a, 此时攻击者顺利拿到了用户的隐私数据.

### iframe

关于这一块的例子可以看实例代码中的 src/example3
**window.name 跨域**
可以利用 `window.name` 只要页面不关闭, 即使发生跳转仍然会保留的这个性质, 我们可以在主窗口中打开一个需要跨域访问的地址 (这个过程本质完成了将父窗口对子窗口的通讯), 这个地址返回的 html 的 script 标签中把主窗口需要的信息放在 `window.name` 中, 主窗口一旦监听到 iframe 的 onload 事件, 就将 iframe 的 src 设置为与主窗口同源的域名, 此时 `window.name` 可访问, 进而完成了子窗口信息向父窗口的回传.
![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-7-1620799687630.png)

**window.hash 跨域**
基于哈希改变并不会触发请求, 父窗口可以通过改变跨域子 iframe 的 hash 来完成父对子的通讯, 而子窗口为了实现将信息回传给父窗口, 可以通过在子窗口中再次新建一个与父窗口同域的 iframe, 同样用哈希的方式将信息汇入, 由于孙子窗口与爷爷窗口同域, 所以可以通过 `window.parent.parent` 获取到爷爷窗口, 基于这种方式将信息回传.
![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-8-1620799688847.png)
**postMessage 跨域**
可以看出来上面两种方式本质上都是试图在跨域场景下进行 iframe 通讯, 实际上是比较 tricky, 现在最常见的是基于 postMessage 实现通讯, 这也是 h5 实现的一部分, 可以认为是比较官方的做法.
![](https://raw.githubusercontent.com/nzhl/http-learning-guide/master/images/image-9-1620799689250.png)
本质就是父窗口利用 `iframe.contentWindow.postMessage` 发消息, `window.onMessage` 收消息. 而子窗口利用 `window.onMessage` 收到消息后, 再利用 `event.source.postMessage` 回复消息.

### CORS 跨域

Ok, 看了各种花里胡哨的跨域手段, 现在回归到目前最推崇的也是标准的方式, 配置 CORS 跨域头跨域.

## 3.3 TODO 编码相关

## 3.4 TODO 代理及其应用
