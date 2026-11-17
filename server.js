const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = '9233588941:AAExCKc9KZjK-UDspUNwIWRUCAEdxV7GnYU';
const ADMIN_ID = '8516187208'; 
const PAYMENT_LINK = 'https://razorpay.me/@VRConnect?amount=CVDUr6Uxp2FOGZGwAHntNg%3D%3D'; 

const app = express();
app.get('/', (req, res) => res.send('Bot is Live!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server running...'));

const bot = new TelegramBot(token, { polling: true });
const users = {}; 
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getGreeting = () => ["hie", "hii", "hello", "hiiii", "hyy"][Math.floor(Math.random() * 5)];
const getLocation = () => ["delhi", "mumbai", "jaipur", "pune", "bangalore", "indore", "chandigarh", "bhopal", "ahmedabad"][Math.floor(Math.random() * 9)];
const getAge = () => Math.floor(Math.random() * (35 - 19 + 1)) + 19;

// TRAP NAMES (Before Payment)
const getTrapName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha"][Math.floor(Math.random() * 8)];
// VIP NAMES (After Payment)
const getVipName = () => ["Pooja", "Neha", "Simran", "Shweta", "Kavya", "Riya", "Anjali", "Sneha", "Varsha Chouhan"][Math.floor(Math.random() * 9)];

// ==========================================
// 1. WARNING & WELCOME SCREEN
// ==========================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const warningText = "⚠️ <b>ATTENTION!</b>\n\n<i>Please Talk Respectfully To everyone otherwise we Will block Your Account & Your Age must be 18+</i>";
    const options = {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: "✅ I Agree (18+)", callback_data: "agree_terms" }]] }
    };
    bot.sendMessage(chatId, warningText, options);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === 'agree_terms') {
        bot.deleteMessage(chatId, query.message.message_id).catch(() => {}); 
        
        if (!users[chatId]) {
            users[chatId] = { state: 'NEW', isVip: false, vipExpiry: null, msgCount: 0, nudges: [], richaTimeout: null, trapName: getTrapName(), vipName: "" };
        }
        
        const welcomeText = "💖 ✨ <b>WELCOME TO FIND PARTNER</b> ✨ 💖\n\n<i>Nayi chat shuru karne ke liye niche click karein 👇</i>";
        const options = {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: "💞 Find GF 💘", callback_data: "find_gf" }]] }
        };
        bot.sendMessage(chatId, welcomeText, options);
        bot.answerCallbackQuery(query.id);
        return;
    }

    const user = users[chatId];
    if (!user) return;

    if (query.data === 'find_gf') {
        if (user.isVip && user.vipExpiry < Date.now()) {
            user.isVip = false;
            user.state = 'AWAITING_PAYMENT';
        }
        
        if (user.state === 'CHATTING_1' || user.state === 'CHATTING_2' || user.state === 'RICHA_CHAT') {
            bot.answerCallbackQuery(query.id);
            bot.sendMessage(chatId, "<i>Tum pehle se chat mein ho! Upar ladki ke message ka reply karo.</i>", { parse_mode: 'HTML' });
            return;
        }

        bot.answerCallbackQuery(query.id);
        bot.sendMessage(chatId, "<i>Searching GF... ⏳💖</i>", { parse_mode: 'HTML' });
        bot.sendChatAction(chatId, 'typing');
        await sleep(3000); 

        // ==========================================
        // 🔥 THE LURING PHASE (TRAP STARTS)
        // ==========================================
        if (user.state === 'NEW' || user.state === 'AWAITING_PAYMENT') {
            user.state = 'LURING';
            user.luringMsgCount = 0; // Ladke ke messages count karne ke liye
            user.nudges = [];
            bot.sendMessage(chatId, `<b>${user.trapName}:</b> ${getGreeting()}`, { parse_mode: 'HTML' });
            
            // Ladki lagatar message krti rahegi
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> kya hua`, { parse_mode: 'HTML' }) }, 6000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> name ?`, { parse_mode: 'HTML' }) }, 12000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> aap kaha se ho`, { parse_mode: 'HTML' }) }, 18000));
            user.nudges.push(setTimeout(() => { if (users[chatId].state === 'LURING') bot.sendMessage(chatId, `<b>${user.trapName}:</b> are u there`, { parse_mode: 'HTML' }) }, 24000));
            user.nudges.push(
                
