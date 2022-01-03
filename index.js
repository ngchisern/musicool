import { Client, Intents } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";

import dotenv from "dotenv";
import {
  getNextResource,
  help,
  list,
  pause,
  play,
  player,
  quit,
  remove,
  setResourceVolume,
  skip,
} from "./player.js";

dotenv.config();

const prefix = "@";

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("@help");
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(prefix)) {
    return;
  }

  const args = msg.content.split(/\s+/);

  switch (args[0].substring(1)) {
    case "list":
      list(msg.channel);
      break;

    case "play":
      play(msg.channel, msg.member.voice.channel, msg.guild, args);
      break;

    case "volume":
      setResourceVolume(msg.channel, args);
      break;

    case "pause":
      pause(msg.channel);
      break;

    case "skip":
      skip(msg.channel);
      break;

    case "remove":
      remove(msg.channel, args);
      break;

    case "help":
      help(msg.channel);
      break;

    case "quit":
      quit();
      break;
  }
});

player.on(AudioPlayerStatus.Idle, () => {
  const next = getNextResource();

  if (next) {
    player.play(next);
  }
});

client.login(process.env.CLIENT_TOKEN);
