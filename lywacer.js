const { Discord, Client, MessageEmbed } = require('discord.js');
const client = global.client = new Client({fetchAllMembers: true});
const ayarlar = require('./ayarlar.json');
const config = global.config = require("./Config.json");
const configknk = require('./Config.json')
const fs = require('fs');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://mongogirknk@cluster0.17sst.mongodb.net/şifregirknk?retryWrites=true&w=majority'
, {useNewUrlParser: true, useUnifiedTopology: true});// Mongo connect bağlantısı.
const Database = require("./models/role.js");

client.on("ready", async () => {
  client.user.setPresence({ activity: { name: "❤️‍🩹" }, status: "idle" });
  let botVoiceChannel = client.channels.cache.get(ayarlar.botVoiceChannelID);
  if (botVoiceChannel) botVoiceChannel.join().catch(err => console.error("Bot ses kanalına bağlanamadı!"));
  setRoleBackup();
  setInterval(() => {
    setRoleBackup();
  }, 1000*60*60*1);
});

//guard
fs.readdir("./lywacer", (err, files) => {
  if(err) return console.error(err);
  files.filter(file => file.endsWith(".js")).forEach(file => {
    let prop = require(`./lywacer/${file}`);
      if(!prop.configuration) return;
      client.on(prop.configuration.name, prop);
  });
});


//backup tarafı
client.on("message", async message => {
  if (message.author.bot || !message.guild || !message.content.toLowerCase().startsWith(ayarlar.botPrefix)) return;
  if (message.author.id !== ayarlar.botOwner && message.author.id !== message.guild.owner.id) return;
  let args = message.content.split(' ').slice(1);
  let command = message.content.split(' ')[0].slice(ayarlar.botPrefix.length);
  let embed = new MessageEmbed().setColor("#00ffdd").setAuthor(message.member.displayName, message.author.avatarURL({ dynamic: true, })).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Yashinu"} was here!`).setTimestamp();
  
  if (command === "eval" && message.author.id === ayarlar.botOwner) {
    if (!args[0]) return message.channel.send(`Kod belirtilmedi`);
      let code = args.join(' ');
      function clean(text) {
      if (typeof text !== 'string') text = require('util').inspect(text, { depth: 0 })
      text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203))
      return text;
    };
    try { 
      var evaled = clean(await eval(code));
      if(evaled.match(new RegExp(`${client.token}`, 'g'))) evaled.replace(client.token, "Yasaklı komut");
      message.channel.send(`${evaled.replace(client.token, "Yasaklı komut")}`, {code: "js", split: true});
    } catch(err) { message.channel.send(err, {code: "js", split: true}) };
  };
  
  // Koruma açma kapama
  if (command === "ayar")  {
    if (!args[0] || args[0] !== "rol") return message.channel.send(embed.setDescription(`Rol korumasını aktif etmek veya devre dışı bırakmak için **${ayarlar.botPrefix}ayar rol** yazmanız yeterlidir! Rol koruması şu anda **${ayarlar.roleGuard ? "aktif" : "devre dışı"}!**`));
    ayarlar.roleGuard = !ayarlar.roleGuard;
    fs.writeFile("./ayarlar.json", JSON.stringify(ayarlar), (err) => {
      if (err) console.log(err);
    });
    message.channel.send(embed.setDescription(`**${args[0]}** koruması, ${message.author} tarafından ${ayarlar.roleGuard ? "aktif edildi" : "devre dışı bırakıldı"}!`));
  };
// Rolü oluşturtup geri dağıtma kısmı
  if(command === "kur" || command === "kurulum" || command === "backup" || command === "setup") {
    if (!args[0] || isNaN(args[0])) return message.channel.send(embed.setDescription("Geçerli bir rol ID'si belirtmelisin!"));

    Database.findOne({guildID: ayarlar.guildID, roleID: args[0]}, async (err, roleData) => {
      if (!roleData) return message.channel.send(embed.setDescription("Belirtilen rol ID'sine ait veri bulunamadı!"));
      message.react("✅");
      let yeniRol = await message.guild.roles.create({
        data: {
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          permissions: roleData.permissions,
          position: roleData.position,
          mentionable: roleData.mentionable
        },
        reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
      });

      setTimeout(() => {
        let kanalPermVeri = roleData.channelOverwrites;
        if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
          let kanal = message.guild.channels.cache.get(perm.id);
          if (!kanal) return;
          setTimeout(() => {
            let yeniKanalPermVeri = {};
            perm.allow.forEach(p => {
              yeniKanalPermVeri[p] = true;
            });
            perm.deny.forEach(p => {
              yeniKanalPermVeri[p] = false;
            });
            kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
          }, index*5000);
        });
      }, 5000);

      let roleMembers = roleData.members;
      roleMembers.forEach((member, index) => {
        let uye = message.guild.members.cache.get(member);
        if (!uye || uye.roles.cache.has(yeniRol.id)) return;
        setTimeout(() => {
          uye.roles.add(yeniRol.id).catch(console.error);
        }, index*3000);
      });

      let logKanali = client.channels.cache.get(ayarlar.logChannelID);
      if (logKanali) { logKanali.send(new MessageEmbed().setColor("#00ffdd").setTitle('Rol Yedeği Kullanıldı!').setDescription(`${message.author} (${message.author.id}) tarafından **${roleData.name} (${roleData.roleID})** rolünün yedeği kurulmaya başlandı! Rol tekrar oluşturularak, üyelerine dağıtılmaya ve izinleri kanallara eklenmeye başlanıyor.`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Acerhizm"} was here!`).setTimestamp()).catch(); } else { message.guild.owner.send(new MessageEmbed().setColor("#00ffdd").setTitle('Rol Yedeği Kullanıldı!').setDescription(`${message.author} (${message.author.id}) tarafından **${roleData.name} (${roleData.roleID})** rolünün yedeği kurulmaya başlandı! Rol tekrar oluşturularak, üyelerine dağıtılmaya ve izinleri kanallara eklenmeye başlanıyor.`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Acerhizm"} was here!`).setTimestamp()).catch(err => {}); };
    });
  };
});

// Güvenli kişi fonksiyonu
function guvenli(kisiID) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  let guvenliler = ayarlar.whitelist || [];
  if (!uye || uye.id === client.user.id || uye.id === ayarlar.botOwner || uye.id === uye.guild.owner.id || guvenliler.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

// Cezalandırma fonksiyonu
const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_NICKNAMES", "MANAGE_EMOJIS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(ayarlar.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "jail") return uye.roles.cache.has(ayarlar.boosterRole) ? uye.roles.set([ayarlar.boosterRole, ayarlar.jailRole]) : uye.roles.set([ayarlar.jailRole]);
  if (tur == "ban") return uye.ban({ reason: "Mercia Koruma" }).catch();
};
// Rol sililince yapanı banlayıp rolüü tekrar dağıtan kısım
client.on("roleDelete", async role => {
  let entry = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());
  if (!entry || !entry.executor || Date.now()-entry.createdTimestamp > 5000 || guvenli(entry.executor.id) || !ayarlar.roleGuard) return;
  cezalandir(entry.executor.id, "jail");
  let yeniRol = await role.guild.roles.create({
    data: {
      name: role.name,
      color: role.hexColor,
      hoist: role.hoist,
      position: role.position,
      permissions: role.permissions,
      mentionable: role.mentionable
    },
    reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
  });

  Database.findOne({guildID: role.guild.id, roleID: role.id}, async (err, roleData) => {
    if (!roleData) return;
    setTimeout(() => {
      let kanalPermVeri = roleData.channelOverwrites;
      if (kanalPermVeri) kanalPermVeri.forEach((perm, index) => {
        let kanal = role.guild.channels.cache.get(perm.id);
        if (!kanal) return;
        setTimeout(() => {
          let yeniKanalPermVeri = {};
          perm.allow.forEach(p => {
            yeniKanalPermVeri[p] = true;
          });
          perm.deny.forEach(p => {
            yeniKanalPermVeri[p] = false;
          });
          kanal.createOverwrite(yeniRol, yeniKanalPermVeri).catch(console.error);
        }, index*5000);
      });
    }, 5000);

    let roleMembers = roleData.members;
    roleMembers.forEach((member, index) => {
      let uye = role.guild.members.cache.get(member);
      if (!uye || uye.roles.cache.has(yeniRol.id)) return;
      setTimeout(() => {
        uye.roles.add(yeniRol.id).catch();
      }, index*3000);
    });
  });

  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("#00ffdd").setTitle('Rol Silindi!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından **${role.name} (${role.id})** rolü silindi, silen kişi banlandı! Rol tekrar oluşturuldu, üyelerine dağıtılmaya ve izinleri kanallara eklenmeye başlanıyor.`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Yashinu"} was here!`).setTimestamp()).catch(); } else { role.guild.owner.send(new MessageEmbed().setColor("#00ffdd").setTitle('Rol Silindi!').setDescription(`${entry.executor} (${entry.executor.id}) tarafından **${role.name} (${role.id})** rolü silindi, silen kişi banlandı! Rol tekrar oluşturuldu, üyelerine dağıtılmaya ve izinleri kanallara eklenmeye başlanıyor.`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Yashinu"} was here!`).setTimestamp()).catch(err => {}); };
});

// Backup alma fonksiyonu
function setRoleBackup() {
  let guild = client.guilds.cache.get(ayarlar.guildID);
  if (guild) {
    guild.roles.cache.filter(r => r.name !== "@everyone" && !r.managed).forEach(role => {
      let roleChannelOverwrites = [];
      guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
        let channelPerm = c.permissionOverwrites.get(role.id);
        let pushlanacak = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() };
        roleChannelOverwrites.push(pushlanacak);
      });

      Database.findOne({guildID: ayarlar.guildID, roleID: role.id}, async (err, savedRole) => {
        if (!savedRole) {
          let newRoleSchema = new Database({
            _id: new mongoose.Types.ObjectId(),
            guildID: ayarlar.guildID,
            roleID: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions,
            mentionable: role.mentionable,
            time: Date.now(),
            members: role.members.map(m => m.id),
            channelOverwrites: roleChannelOverwrites
          });
          newRoleSchema.save();
        } else {
          savedRole.name = role.name;
          savedRole.color = role.hexColor;
          savedRole.hoist = role.hoist;
          savedRole.position = role.position;
          savedRole.permissions = role.permissions;
          savedRole.mentionable = role.mentionable;
          savedRole.time = Date.now();
          savedRole.members = role.members.map(m => m.id);
          savedRole.channelOverwrites = roleChannelOverwrites;
          savedRole.save();
        };
      });
    });

    Database.find({guildID: ayarlar.guildID}).sort().exec((err, roles) => {
      roles.filter(r => !guild.roles.cache.has(r.roleID) && Date.now()-r.time > 1000*60*60*24*3).forEach(r => {//1 saatte bir alır. Süreyi değiştirebilirsiinz.
        Database.findOneAndDelete({roleID: r.roleID});
      });
    });
    console.log(`Rol veri tabanı düzenlendi!`);
  };
};
// Yt kapat fonksiyonu
function ytKapat(guildID) {
  let sunucu = client.guilds.cache.get(guildID);
  if (!sunucu) return;
  sunucu.roles.cache.filter(r => r.editable && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_GUILD") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_WEBHOOKS"))).forEach(async r => {
    await r.setPermissions(0);
  });
  // loglandırma fonksiyonu
  let logKanali = client.channels.cache.get(ayarlar.logChannelID);
  if (logKanali) { logKanali.send(new MessageEmbed().setColor("#00ffdd").setTitle('İzinler Kapatıldı!').setDescription(`Rollerin yetkileri kapatıldı!`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Acerhizm"} was here!`).setTimestamp()).catch(); } else { logKanali.guild.owner.send(new MessageEmbed().setColor("#00ffdd").setTitle('İzinler Kapatıldı!').setDescription(`Rollerin yetkileri kapatıldı!`).setFooter(`${client.users.cache.has(ayarlar.botOwner) ? client.users.cache.get(ayarlar.botOwner).tag : "Yashinu"} was here!`).setTimestamp()).catch(err => {}); };
};
client.login(ayarlar.botToken).then(c => console.log(`${client.user.tag} olarak giriş yapıldı!`)).catch(err => console.error("Bota giriş yapılırken başarısız olundu!"));
