var Discord = require("discord.js");
var client = new Discord.Client();
var fs = require("fs");
var sql = require('sqlite');
var prefix = (process.env.PREFIX);
var config = require("./config.json");
var dateformat = require("dateformat");
var commandJSON = require("./commands.json");
var jsonfile = require("jsonfile");
var mutes = require("./mutes.json");

//logs in using token
client.login(process.env.TOKEN);

var answers = [
  "If I had a pound for every time someone tagged me, I'd be very poor. feelsbadman.",
  "What do you want?",
  "What am I, Google Assistant?",
  "<https://www.youtube.com/watch?v=VeSyyu5JrLY>",
  "If you want my opinion, Pineapple should go on pizza. It's a free world.",
  "Hurin > Oscar.",
  "Here's a snippet from my sourcecode:\n\`\`\`var answers = ['Here's a snippet from my sourcecode: ']\`\`\` \nPlease pay to view more.",
  "Lootboxes aren't bad. They allow the developer to make more revenue to make the game better! \n*This message was sponsored by Electronic Arts*.",
  "Hello, I am Lt. Kamada. I am in posession of USD$1,000,000,000 in untraceable bullion and I must get it out of this country, my country, liberia. \nWill you the help me?"
]

//sends ready echo to console
client.on('ready', () => {
  console.log("Prefix is: " + prefix);
  console.log("Shade is R E A D Y.");
  client.user.setUsername("Shade")
  .then(user => console.log("My name has changed to Shade."));
  client.user.setActivity("!!help for help");
  //client.user.setStatus("idle");

  //mute function
  client.setInterval(() => {
    for(var i in mutes){
      var time = mutes[i].time;
      var guildID = mutes[i].guild;
      var guild = client.guilds.get(guildID);
      var member = guild.members.get(i)
      var mutedRole = guild.roles.find(role => role.name.toLowerCase() === config[guild.id].muteRoleName.toLowerCase());
      var logchannel = guild.channels.get(config[guild.id].modlogchannelID);
      if(!logchannel){
        logchannel = guild.channels.get(config[guild.id].logchannelID);
      }

      if(Date.now() > time){
        member.removeRole(mutedRole);

        delete mutes[i];
        jsonfile.writeFileSync("./mutes.json", mutes, {spaces:4}, function(err){
          if(err){
            console.log(err);
          }else{
            console.log("Mute removed.");
          }
        })

        const embed = new Discord.RichEmbed()
          .addField("User unmuted", member.displayName)
          .setColor(guild.member(client.user).highestRole.color)
          .setFooter("Automatic mod logging")
          .setTimestamp(new Date())
        logchannel.send(`**Infraction for: **<@${member.id}>`, {embed})
      }
    }
  }, 3000);
});

client.on("guildMemberRemove", member => {
  var embed = new Discord.RichEmbed()
  let guild = member.guild

    embed.addField("User Left", member.user.username)
    embed.addField("User Discriminator", member.user.discriminator, true)
    embed.addField("User ID", member.user.id)
    embed.setTimestamp(new Date())
    embed.setColor(guild.member(client.user).highestRole.color)
    embed.setThumbnail(member.user.avatarURL)

    if(config[guild.id].disabledMisc.indexOf("memberLog") == -1){
      var joinLogChannel = guild.channels.get(config[guild.id].joinLogChannel)
      joinLogChannel.send(`${member.displayName} has left the server! Bye!`)
    }

    var logchannel = guild.channels.get(config[guild.id].joinlogchannelID)
    if(!logchannel){
      logchannel = guild.channels.get(config[guild.id].logchannelID)
    }
    logchannel.send({embed})
})

client.on("guildMemberAdd", member => {
  var embed = new Discord.RichEmbed()
  let guild = member.guild
  var ruleschannel = guild.channels.find("name", "server-rules")

    embed.addField("User Joined", member.user.username, true)
    embed.addField("User Discriminator", member.user.discriminator, true)
    embed.addField("User ID", member.user.id)
    embed.addField("User account creation date", member.user.createdAt)
    embed.setTimestamp(new Date())
    embed.setColor(guild.member(client.user).highestRole.color)
    embed.setThumbnail(member.user.avatarURL)

    var joinLogChannel = guild.channels.get(config[guild.id].joinLogChannel)
    if(config[guild.id].disabledMisc.indexOf("memberLog") == -1){
      joinLogChannel.send(`${member.displayName} has joined the server! Welcome!`)
    }


    var logchannel = guild.channels.get(config[guild.id].joinlogchannelID)
    if(!logchannel){
      logchannel = guild.channels.get(config[guild.id].logchannelID)
    }
    logchannel.send({embed})
})

client.on("messageDelete", message => {
  if(message.author.id === client.user.id){
    return;
  }
  var guild = message.guild
  var embed = new Discord.RichEmbed()
    .setAuthor("Message Deleted")
    .addField("Message Author", `${message.author.username}#${message.author.discriminator}`, false)
    .setColor(guild.member(client.user).highestRole.color)
    .setThumbnail(message.author.avatarURL)
    .setTimestamp(new Date());

    if(!message.content){
  		return;
  	}else{
  		if(message.content.length >= 1023){
  			embed.addField("Message Content", "Too long to post", false)
  		}else{
  			embed.addField("Message Content", message.content, false)
  		}
  	}

    embed.addField("Channel", "#" + message.channel.name);

    var logchannel = guild.channels.get(config[guild.id].messagelogchannelID)
    if(!logchannel){
      logchannel = guild.channels.get(config[guild.id].logchannelID)
    }

    logchannel.send(`**Message delete log for: **${message.author.tag}`, {embed})
})

client.on("messageUpdate", (oldMessage, newMessage) => {

  if(oldMessage.content.length == 0 || oldMessage.author.id === client.user.id || oldMessage.content == newMessage.content){
    return;
  }else if(newMessage.content.length == 0 || newMessage.author.id === client.user.id){
    return;
  }
  var guild = newMessage.guild
  var embed = new Discord.RichEmbed()
    .setAuthor("Message Edited")
    .addField("Message Author", `${newMessage.author.tag}`, false)
    .addField("Old Message Content", oldMessage.content, false)
    .addField("New Message Content", newMessage.content, false)
    .addField("Channel", "#" + newMessage.channel.name)
    .setColor(guild.member(client.user).highestRole.color)
    .setThumbnail(newMessage.author.avatarURL)
    .setTimestamp(new Date())

    var logchannel = guild.channels.get(config[guild.id].messagelogchannelID)
    if(!logchannel){
      logchannel = guild.channels.get(config[guild.id].logchannelID)
    }

    var userTagForMessage = newMessage.author.tag
    if(!userTagForMessage){
      userTagForMessage = oldMessage.author.tag
    }
    logchannel.send(`**Message edit log for: **${userTagForMessage}`, {embed})

})

client.on("voiceStateUpdate", (oldMember, newMember) => {
  var embed = new Discord.RichEmbed();
  var guild = oldMember.guild
  var user = newMember.user

    var voicelogchannel = guild.channels.get(config[guild.id].voicelogchannelID)
    if(!voicelogchannel || voicelogchannel === "null"){
      voicelogchannel = guild.channels.get(config[guild.id].logchannelID)
    }

    if(!user){
      user = newMember.user
    }

    if(!oldMember.voiceChannel){
      embed.addField("User joined a voice channel", `${user.tag} joined ${newMember.voiceChannel.name}.`, true)
    }else if(!newMember.voiceChannel){
      embed.addField("User disconnected from voice channels", `${user.tag} left ${oldMember.voiceChannel.name}.`, true)
    }else{
      embed.setAuthor(`${user.tag} changed voice channels.`)
      if((oldMember.mute == true) || (oldMember.deaf == true) || (newMember.mute == true) || (newMember.deaf == true)){
        return;
      }else{
        embed.addField("Old channel", `${oldMember.voiceChannel.name}`, true)
        embed.addField("New channel", `${newMember.voiceChannel.name}`, true)
      }
    }

    embed.addField("User ID", newMember.id)
    embed.setColor(newMember.guild.member(client.user).highestRole.color)
    embed.setTimestamp(newMember.createdAt)

    var userTagForMessage = user.tag
    if(!userTagForMessage){
      userTagForMessage = user.tag
    }
    voicelogchannel.send(`**Voice Log Information for: **${userTagForMessage}`, {embed}).catch(console.log)
})

//ON CLIENT JOIN (CONFIG SETUP)
client.on("guildCreate", guild =>{
  var logchannelIDFinder = guild.channels.find("name", "log-channel").id;
  if(!logchannelIDFinder){
    logchannelIDFinder = "null"
  }
  if(!config[guild.id]){
    config[guild.id] = {
      "disabledCommands" : "null",
      "disabledEvents" : "null",
      "disabledMisc" : "memberLog",
      "disabledAutoMod" : "null",
      "logchannelID" : logchannelIDFinder,
      "modlogchannelID" : "null",
      "voicelogchannelID" : "null",
      "autoCleanUpBlacklist" : "null",
      "muteRoleName" : "Muted",
      "muteMessage" : "null",
      "selfRoles" : "null",
      "joinLogChannel" : "null"
    }

    jsonfile.writeFile("config.json", config, {spaces: 4}, err =>{
      if(!err){
        const embed = new Discord.RichEmbed()
          .addField("Welcome to the Shade Community!", "Thanks for adding Shade!")
          .addField("I highly reccomend you check out the following link for info:", "https://veraxonhd.gitbooks.io/shade-modbot/content/first-time-setup.html")
          .setColor("#30167c");
        guild.owner.send({embed}).catch(console.log);
      }else{
        console.log(err);
      }
    })
  }else{
    return
  }

  
})
// This loop reads the /events/ folder and attaches each event file to the appropriate event.
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach(file => {
    let eventFunction = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    // super-secret recipe to call events with all their proper arguments *after* the `client` var.
    client.on(eventName, (...args) => eventFunction.run(client, ...args));
  });
});

//GENERAL COMMANDS
client.on("message", message => {

  if(message.channel.type === "dm") return;

  let guild = message.guild;
  var logchannel = guild.channels.get(config[guild.id].logchannelID);
  var commandDir = fs.readdirSync("./commands");
  let args = message.content.split(" ").slice(1);
  
  /*
  BROKEN - repeats messages for no known reason.
  if(!logchannel){
    message.channel.send("`Shade Critical Error` - There is no base log channel. You must set one up to use any of Shade's commands. Consult the docs.");
    return;
  }*/

  if(message.content === `<@${client.user.id}>`){
    var randomAnswer = answers[Math.floor(Math.random() * answers.length)];
    message.channel.send(randomAnswer)
  }
  if(!message.content.startsWith(prefix)) return;
  exports.noPermReact = () => {
    return message.channel.send(`Shade - \`Error\` - You do not have permission to perform that command.`)
      .then(message => message.react('❎'))
    };

  let command = message.content.split(" ")[0];
  command = command.slice(prefix.length);

  try {
    if(command == "ui"){
      command = "userinfo"
    }
    let commandFile = require(`./commands/${command}.js`);

    var serverid = guild.id;

    if(config[guild.id].disabledCommands.indexOf(command) == -1){
      commandFile.run(client, message, args, Discord, guild, command)
    }else{
      return(message.channel.send("This command has been disabled by a server administrator."))
    }
  } catch (err) {
    console.log(err)
  }
});
process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: \n", err);
});
