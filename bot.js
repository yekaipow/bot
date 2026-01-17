import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';

let bot = null;
let currentModule = null;
let modulePath = './commands/ping.js'; // 你的模块路径

// 创建新的 bot 实例
function createBot(token) {
    const bot = new Telegraf(token);
    
    // 全局错误处理
    bot.catch((err, ctx) => {
        console.error('全局错误:', err);
        if (ctx) {
            ctx.reply('发生错误，请重试').catch(() => {});
        }
    });
    
    return bot;
}

// 加载/重载模块
async function loadModule() {
    try {
        console.log('正在加载模块...');
        
        // 删除模块缓存
        const resolvedPath = require.resolve(modulePath);
        delete require.cache[resolvedPath];
        
        // 如果是 ES 模块，使用动态导入
        const module = await import(`${modulePath}?update=${Date.now()}`);
        
        // 卸载旧模块
        if (currentModule && currentModule.unload) {
            currentModule.unload();
            console.log('已卸载旧模块');
        }
        
        // 加载新模块
        currentModule = module.default(bot);
        console.log('模块加载完成，版本:', currentModule.meta?.version);
        
    } catch (err) {
        console.error('模块加载失败:', err);
    }
}

// 初始化
async function init() {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
        console.error('请设置 BOT_TOKEN 环境变量');
        process.exit(1);
    }
    
    // 创建新 bot 实例
    bot = createBot(BOT_TOKEN);
    
    // 添加重载指令
    bot.command('reload', async (ctx) => {
        if (ctx.from.id.toString() === "7563798903") { // 仅管理员可用
            await ctx.reply('正在重载模块...');
            await loadModule();
            await ctx.reply('模块重载完成！');
        }
    });
    
    // 初始加载模块
    await loadModule();
    
    // 启动机器人
    await bot.launch();
    console.log('机器人已启动');
    
    // 监听文件变化（开发环境）
    if (process.env.NODE_ENV === 'development') {
        fs.watch(path.dirname(modulePath), (eventType, filename) => {
            if (filename === path.basename(modulePath)) {
                console.log('检测到文件变化，正在重载...');
                loadModule();
            }
        });
    }
}

// 优雅关闭
process.once('SIGINT', () => {
    console.log('正在关闭机器人...');
    if (bot) bot.stop('SIGINT');
    process.exit();
});

process.once('SIGTERM', () => {
    console.log('正在关闭机器人...');
    if (bot) bot.stop('SIGTERM');
    process.exit();
});

// 启动
init();