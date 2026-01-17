import { Telegraf } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let __filename = fileURLToPath(import.meta.url);
let __dirname = path.dirname(__filename);
let bot = new Telegraf(process.env.BOT_TOKEN);

let commandsDir = path.join(__dirname, 'commands');
let loadedModules = new Map();


/**
 * 动态加载单个命令模块
 */


function loadCommand(commandName) {
  let filePath = path.join(commandsDir, `${commandName}.js`);

  try {
    // 清除 require 缓存
    delete require.cache[require.resolve(filePath)];

    // 卸载旧模块
    if (loadedModules.has(commandName)) {
      let old = loadedModules.get(commandName);
      old.unload?.();
      loadedModules.delete(commandName);
    }

    // 加载新模块
    let init = require(filePath);
    
    if (typeof init !== "function") {
      throw new Error(`Module ${commandName} does not export a function`);
    }

    let result = init(bot) || {};
    loadedModules.set(commandName, result);

    return result.meta;
  } catch (err) {
    console.error(`❌ Failed to load command "${commandName}":`, err);
    throw err;
  }
}



/**
 * 扫描 commands 目录并加载所有命令
 */
async function loadAllCommands() {
  let files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  for (let file of files) {
    let name = file.replace('.js', '');
    await loadCommand(name);
  }
}

/**
 * 热重载：监听整个 commands 目录
 */
function enableHotReload() {
  if (process.env.NODE_ENV === 'production') return;

  fs.watch(commandsDir, async (event, filename) => {
    if (!filename.endsWith('.js')) return;

    let commandName = filename.replace('.js', '');
    console.log(`♻️ File changed: ${filename}`);

    try {
      await loadCommand(commandName);
      console.log(`🔄 Reloaded: ${commandName}`);
    } catch (err) {
      console.error(`❌ Reload failed for ${commandName}`, err);
    }
  });
}

/**
 * /reload 命令：重载所有命令
 */
bot.command('reload', async ctx => {
  try {
    await loadAllCommands();
    ctx.reply("🔄 All commands reloaded!");
  } catch (err) {
    ctx.reply(`❌ Reload failed: ${err.message}`);
  }
});

/**
 * 启动 bot
 */
(async () => {
  await loadAllCommands();
  enableHotReload();

  console.log("🤖 Bot started with elegant dynamic reloading!");
  bot.launch({ polling: true });
})();

// 优雅关闭
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));