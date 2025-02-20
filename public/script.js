// 获取DOM元素
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const topicInput = document.getElementById('topicInput');
const currentTopic = document.getElementById('currentTopic');
const exportButton = document.getElementById('exportButton');

// 加载highlight.js
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
document.head.appendChild(script);

// 加载highlight.js样式
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css';
document.head.appendChild(style);

// 消息历史记录
let messageHistory = [];

// 创建消息元素
function createMessageElement(content, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    // 检查是否包含代码块
    if (content.includes('```')) {
        const parts = content.split(/```(\w+)?\n?/);
        parts.forEach((part, index) => {
            if (index % 2 === 0) {
                // 普通文本
                if (part.trim()) {
                    const textNode = document.createElement('div');
                    textNode.textContent = part;
                    messageDiv.appendChild(textNode);
                }
            } else {
                // 代码块
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = parts[index + 1];
                pre.appendChild(code);
                messageDiv.appendChild(pre);
                hljs.highlightElement(code);
            }
        });
    } else {
        messageDiv.textContent = content;
    }
    return messageDiv;
}

// 添加消息到界面
function addMessage(content, isUser) {
    const messageElement = createMessageElement(content, isUser);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 更新主题显示
    if (topicInput.value && !currentTopic.textContent) {
        currentTopic.textContent = topicInput.value;
    }
    
    // 更新消息历史
    messageHistory.push({
        role: isUser ? 'user' : 'assistant',
        content: content
    });
}

// 处理用户输入
async function handleUserInput() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // 禁用输入和按钮
    userInput.disabled = true;
    sendButton.disabled = true;

    // 显示用户消息
    addMessage(userMessage, true);
    userInput.value = '';

    try {
        // 准备请求数据
        const requestData = {
            messages: messageHistory
        };

        // 发送请求到后端服务器
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) throw new Error('网络请求失败');

        // 创建AI回复的消息元素
        const aiMessage = createMessageElement('', false);
        messagesContainer.appendChild(aiMessage);

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
            const {value, done} = await reader.read();
            if (done) break;

            // 解析数据
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices && data.choices[0].delta.content) {
                            aiResponse += data.choices[0].delta.content;
                            aiMessage.textContent = aiResponse;
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析响应数据失败:', e);
                    }
                }
            }
        }

        // 更新消息历史
        if (aiResponse) {
            messageHistory.push({
                role: 'assistant',
                content: aiResponse
            });
        }

    } catch (error) {
        console.error('请求失败:', error);
        addMessage('抱歉，发生了错误，请稍后重试。', false);
    } finally {
        // 恢复输入和按钮
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// 绑定事件监听器
sendButton.addEventListener('click', handleUserInput);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
    }
});

// 历史对话记录相关元素
const historyHeader = document.getElementById('historyHeader');
const historyContent = document.getElementById('historyContent');
const historyToggle = document.getElementById('historyToggle');

// 更新历史记录显示
function updateHistoryDisplay() {
    historyContent.innerHTML = '';
    messageHistory.forEach((msg, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
        historyItem.title = msg.content;
        historyContent.appendChild(historyItem);
    });
}

// 切换历史记录面板显示/隐藏
historyHeader.addEventListener('click', () => {
    const isExpanded = historyContent.style.display === 'block';
    historyContent.style.display = isExpanded ? 'none' : 'block';
    historyToggle.textContent = isExpanded ? '▼' : '▲';
});

// 在添加新消息后更新历史记录并显示面板
const originalAddMessage = addMessage;
addMessage = function(content, isUser) {
    originalAddMessage(content, isUser);
    updateHistoryDisplay();
    // 确保历史记录面板可见
    historyContent.style.display = 'block';
    historyToggle.textContent = '▲';
};

// 页面加载完成后的初始化
window.addEventListener('load', () => {
    userInput.focus();
    historyContent.style.display = 'none';
    
    // 主题输入事件处理
    topicInput.addEventListener('change', () => {
        currentTopic.textContent = topicInput.value;
    });
    
    // 导出对话功能
    exportButton.addEventListener('click', exportChat);
});

// 导出对话记录
function exportChat() {
    let content = '# ' + (currentTopic.textContent || 'AI对话记录') + '\n\n';
    
    messageHistory.forEach(msg => {
        content += `## ${msg.role === 'user' ? '用户' : 'AI'}\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTopic.textContent || 'chat'}_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 新对话按钮功能
const newChatButton = document.getElementById('newChatButton');

function startNewChat() {
    // 清空消息历史
    messageHistory = [];
    
    // 清空消息显示区域
    messagesContainer.innerHTML = '';
    
    // 清空历史记录面板
    updateHistoryDisplay();
    
    // 重置输入框
    userInput.value = '';
    userInput.focus();
}

// 绑定新对话按钮点击事件
newChatButton.addEventListener('click', startNewChat);

// 表情按钮和面板
const emojiButton = document.createElement('button');
emojiButton.className = 'emoji-button';
emojiButton.textContent = '😊';
const emojiPanel = document.createElement('div');
emojiPanel.className = 'emoji-panel';

// 常用表情列表
const emojis = ['😊', '😂', '🤣', '😍', '🥰', '😘', '😎', '🤔', '😅', '😉', '😇', '🙃', '😋', '🤗', '🤭', '😌', '😏', '🥳', '🤩', '😊'];

// 创建表情面板内容
emojis.forEach(emoji => {
    const emojiItem = document.createElement('div');
    emojiItem.className = 'emoji-item';
    emojiItem.textContent = emoji;
    emojiItem.onclick = () => {
        const cursorPos = userInput.selectionStart;
        const textBefore = userInput.value.substring(0, cursorPos);
        const textAfter = userInput.value.substring(cursorPos);
        userInput.value = textBefore + emoji + textAfter;
        userInput.focus();
        emojiPanel.classList.remove('show');
    };
    emojiPanel.appendChild(emojiItem);
});

// 添加表情按钮和面板到输入容器
const inputContainer = document.querySelector('.input-container');
inputContainer.insertBefore(emojiButton, userInput);
inputContainer.appendChild(emojiPanel);

// 表情按钮点击事件
emojiButton.onclick = () => {
    emojiPanel.classList.toggle('show');
};

// 点击其他地方关闭表情面板
document.addEventListener('click', (e) => {
    if (!emojiButton.contains(e.target) && !emojiPanel.contains(e.target)) {
        emojiPanel.classList.remove('show');
    }
});