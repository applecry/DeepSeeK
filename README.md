# DeepSeek R1 API 交互项目

## 项目简介
这是一个简单的Web应用程序，用于与DeepSeek R1 API进行交互。项目采用简单的HTML5和CSS开发，并使用Node.js作为后端服务器来处理API请求。

## 项目结构
```
├── README.md          # 项目说明文档
├── server.js          # Node.js后端服务器
├── public/            # 静态资源目录
│   ├── index.html     # 主页面
│   ├── styles.css     # 样式文件
│   └── script.js      # 前端交互脚本
└── package.json       # 项目依赖配置文件
```

## 功能说明
1. 前端页面（index.html）
   - 简洁的用户界面
   - 输入框用于用户提问
   - 对话历史显示区域
   - 发送按钮触发API请求

2. 样式设计（styles.css）
   - 响应式布局，适配不同设备
   - 使用Flexbox布局
   - 现代简约的设计风格

3. 后端服务器（server.js）
   - 处理与DeepSeek R1 API的通信
   - 解决CORS跨域问题
   - 支持流式输出
   - 超时设置为60秒
   - 温度参数设置为0.7

## 使用说明
1. 安装依赖：`npm install`
2. 启动服务器：`npm start`
3. 在浏览器中访问：`http://localhost:3000`

## 注意事项
- API密钥已经配置在后端服务器中
- 所有请求都通过后端服务器转发，确保API密钥安全
- 代码包含详细的中文注释，方便理解和维护