const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Tumhari details aur Razorpay Link
const token = '9233588941:AAExCKc9KZjK-UDspUNwIWRUCAEdxV7GnYU';
const ADMIN_ID = '8516187208'; 
const PAYMENT_LINK = 'https://razorpay.me/@VRConnect?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D'; 

// Render ko chalane ke liye Web Server (Zaroori hai)
const app = express();
app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server running...'));

// Bot Setup
const bot = new TelegramBot(token, { polling: true });
const users = {}; 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!users[chatId]) {
        users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null };
    }
    const options = {
        reply_markup: {
            inline_keyboard: [[{ text: "❤️ Find GF", callback_data: "find_gf" }]]
        }
    };
    bot.sendMessage(chatId, "Welcome! Nayi chat shuru karne ke liye niche click karein 👇", options);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const user = users[chatId] || { state: 'NEW', isVip: false, vipExpiry: null };
    users[chatId] = user;

    if (query.data === 'find_gf') {
        if (user.isVip && user.vipExpiry < Date.now()) {
            user.isVip = false;
            user.state = 'AWAITING_PAYMENT';
        }
        bot.answerCallbackQuery(query.id);
        
        bot.sendMessage(chatId, "<i>Searching GF... ⏳</i>", { parse_mode: 'HTML' });
        bot.sendChatAction(chatId, 'typing');
        await sleep(5000); 

        if (user.state === 'NEW' || user.state === 'PUJA_1') {
            bot.sendMessage(chatId, "<b>Puja:</b> Hi, kaise ho?", { parse_mode: 'HTML' });
            user.state = 'PUJA_REPLY_1';
        } 
        else if (user.state === 'SHWETA_START' && user.isVip) {
            bot.sendMessage(chatId, "<b>Shweta:</b> Hi, kaise ho?", { parse_mode: 'HTML' });
            user.state = 'SHWETA_REPLY_1';
        }
        else if (user.state === 'SIMRAN_START' && user.isVip) {
            bot.sendMessage(chatId, "<b>Simran:</b> Hello!", { parse_mode: 'HTML' });
            user.state = 'SIMRAN_REPLY_1';
        }
        else if (user.state === 'RICHA_HANDOFF' && user.isVip) {
            bot.sendMessage(chatId, "<b>Richa:</b> Hi, main Richa! Aur batao kya chal raha hai?", { parse_mode: 'HTML' });
            user.state = 'RICHA_CHAT';
        }
        else if (!user.isVip) {
            sendPaywall(chatId);
        }
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    if (!text || text.startsWith('/')) return;

    if (chatId.toString() === ADMIN_ID && msg.reply_to_message) {
        const replyText = msg.reply_to_message.text;
        const targetUserId = replyText.match(/\[ID: (\d+)\]/)?.[1];
        if (targetUserId) {
            bot.sendMessage(targetUserId, `<b>Richa:</b> ${text}`, { parse_mode: 'HTML' });
        }
        return;
    }

    const user = users[chatId];
    if (!user) return;

    if (user.state === 'PUJA_REPLY_1') {
        bot.sendChatAction(chatId, 'typing');
        await sleep(3000);
        bot.sendMessage(chatId, "<b>Puja:</b> Main Jaipur se hu. Tum kahan se ho?", { parse_mode: 'HTML' });
        user.state = 'PUJA_REPLY_2';
    }
    else if (user.state === 'PUJA_REPLY_2') {
        sendPaywall(chatId);
        user.state = 'AWAITING_PAYMENT';
    }
    else if (user.state === 'SHWETA_REPLY_1') {
        bot.sendChatAction(chatId, 'typing');
        await sleep(2000);
        bot.sendMessage(chatId, "<i>*Shweta has left the chat.*</i>\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.", { parse_mode: 'HTML' });
        user.state = 'SIMRAN_START';
        sendFindGfButton(chatId);
    }
    else if (user.state === 'SIMRAN_REPLY_1') {
        bot.sendChatAction(chatId, 'typing');
        await sleep(2000);
        bot.sendMessage(chatId, "<i>*Simran has left the chat.*</i>\n\nDusri GF find karne ke liye wapas 'Find GF' dabayein.", { parse_mode: 'HTML' });
        user.state = 'RICHA_HANDOFF';
        sendFindGfButton(chatId);
    }
    else if (user.state === 'RICHA_CHAT' && user.isVip) {
        bot.sendMessage(ADMIN_ID, `📩 <b>Message from User</b> [ID: ${chatId}]\n\n${text}`, { parse_mode: 'HTML' });
    }
});

function sendPaywall(chatId) {
    const paywallText = `🔒 <b>VIP Pass Required</b>\n\nAage baat continue rakhne ke liye 24-hours ka VIP pass lein.\n<b>Membership Fee: ₹99</b>\n\n<span class="tg-spoiler">This is a strictly digital entertainment service providing 24-hour access to automated virtual personas and manual chat support. By proceeding with the payment, you acknowledge that you are purchasing a digital membership for entertainment purposes only. No physical product is involved, and fees are strictly non-refundable.</span>`;
    
    bot.sendMessage(chatId, paywallText, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "💳 Pay ₹99 Now", url: PAYMENT_LINK }]] }
    });
}

function sendFindGfButton(chatId) {
    bot.sendMessage(chatId, "Menu:", {
        reply_markup: { inline_keyboard: [[{ text: "❤️ Find GF", callback_data: "find_gf" }]] }
    });
}

bot.onText(/\/approve (.+)/, (msg, match) => {
    if (msg.chat.id.toString() !== ADMIN_ID) return;
    
    const targetId = match[1];
    if (users[targetId]) {
        users[targetId].isVip = true;
        users[targetId].vipExpiry = Date.now() + (24 * 60 * 60 * 1000); 
        users[targetId].state = 'SHWETA_START';
        bot.sendMessage(ADMIN_ID, `✅ User ${targetId} VIP activated for 24h.`);
        bot.sendMessage(targetId, "✅ <b>Payment Successful!</b>\nVIP Pass Active for 24 hours.\n\nNayi chat ke liye niche click karein 👇", {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "❤️ Find GF", callback_data: "find_gf" }]] }
        });
    }
});
                        
