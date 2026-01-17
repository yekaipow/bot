import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bot = new Telegraf(process.env.BOT_TOKEN);
const commandsDir = path.join(__dirname, "commands");
const loadedModules = new Map();

/**
 * 动态加载单个命令模块（ESM 正确写法）
 */
async function loadCommand(commandName) {
  const filePath = path.join(commandsDir, `${commandName}.js`);

  try {
    // 卸载旧模块
    if (loadedModules.has(commandName)) {
      const old = loadedModules.get(commandName);
      old.unload?.();
      loadedModules.delete(commandName);
    }

    // ESM 动态 import（必须使用 file://）
    const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
    const module = await import(fileUrl);

    const init = module.default;
    if (typeof init !== "function") {
      throw new Error(`Module ${commandName} does not export a function`);
    }

    const result = init(bot) || {};
    loadedModules.set(commandName, result);

    console.log(`✅ Loaded command: ${commandName}`);
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
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const name = file.replace(".js", "");
    await loadCommand(name);
  }
}

/**
 * 热重载：监听整个 commands 目录
 */
function enableHotReload() {
  if (process.env.NODE_ENV === "production") return;

  fs.watch(commandsDir, async (event, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const commandName = filename.replace(".js", "");
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
bot.command("reload", async ctx => {
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
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));