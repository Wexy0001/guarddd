const Discord = require("discord.js");
const config = require("../Config.json");
const panel = require("../Panel.json");
const moment = require("moment");
module.exports = async(role) => {

    if (!panel.RoleProtectiions) return;
    if (role.guild.id !== config.Bot.server) return;
    const entry = await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE' }).then(logs => logs.entries.first());
    const id = entry.executor.id;
    let user = role.guild.members.cache.get(id)
    if(id === config.Bot.owner) return;
    if(entry.executor.id === client.user.id) return;
    if(id === role.guild.owner.id) return;
    let safezone = config.Guard.safezone || [];
    if(safezone.some(a => user.id === a)) return;
    let safebots = config.Guard.safebots || [];
    if(safebots.some(a => user.id === a)) return;

      role.delete()

    user.roles.cache.has(config.Guard.booster) ? user.roles.set([config.Guard.booster, config.Guard.jail]) : user.roles.set([config.Guard.jail]).catch();

    let betaSaat = moment(Date.now()).format("HH:mm");
    let betaGün = moment(Date.now()).format("DD");
    let betaAy = moment(Date.now()).format("MM");
    let betaYıl = moment(Date.now()).format("YYYY");
    let betaWile = `${betaGün} ${betaAy.replace("01", "Ocak").replace("02", "Şubat").replace("03", "Mart").replace("04", "Nisan").replace("05", "Mayıs").replace("06", "Haziran").replace("07", "Temmuz").replace("08", "Ağustos").replace("09", "Eylül").replace("10", "Ekim").replace("11", "Kasım").replace("12", "Aralık")} ${betaYıl}`;

      const beta = new Discord.MessageEmbed().setAuthor(user.user.tag, user.user.avatarURL()).setFooter(role.guild.name, role.guild.iconURL()).setColor("BLUE")

  await role.guild.channels.cache.get(config.Guard.log).send(beta
    .addFields({
      name: `**__Kullanıcı Bilgisi__:**`,
      value: `**\`•\` Kullanıcı: <@${user.id}> \n \`•\` Kullanıcı ID: \`${user.id}\`**`,
      inline: true
    }, {
      name: `**__Rol Bilgisi__:**`,
      value: `**\`•\` Rol İsmi: \`${role.name}\` \n \`•\` Rol ID: \`${role.id}\`**`,
      inline: true
    }, {
      name: `**__Tarih Bilgisi__:**`,
      value: `**\`•\` Saat: \`${betaSaat}\` \n \`•\` Gün/Ay/Yıl: \`${betaWile}\`**`,
      inline: false
    })
    .setDescription(`${user} __adlı kullanıcı tarafından bir rol oluşturuldu.__ \n\n **__Oluşturulan rol silindi ve oluşturan kullanıcının yetkileri alındı.__**`));

}; 
  module.exports.configuration = {
      name: "roleCreate"
};