const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 配置CORS和JSON解析中间件
app.use(cors());
app.use(express.json());

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// DeepSeek R1 API配置
const API_KEY = process.env.API_KEY;
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 检查API密钥是否配置
if (!API_KEY) {
    console.error('错误：未设置API_KEY环境变量');
    process.exit(1);
}

// 处理聊天请求的路由
app.post('/api/chat', async (req, res) => {
    try {
        // 设置API请求配置
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            timeout: 60000 // 60秒超时
        };

        // 准备请求数据
        const requestData = {
            model: 'deepseek-r1-250120',
            messages: req.body.messages,
            temperature: 0.7,
            stream: true
        };

        // 发送请求到DeepSeek API并设置流式响应
        const response = await axios.post(API_URL, requestData, {
            ...config,
            responseType: 'stream'
        });

        // 设置响应头
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 转发API响应流
        response.data.pipe(res);

        // 错误处理
        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            res.end();
        });

    } catch (error) {
        console.error('API request error:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});