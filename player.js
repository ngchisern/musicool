import {
  createAudioResource,
  createAudioPlayer,
  joinVoiceChannel,
  AudioPlayerStatus,
} from "@discordjs/voice";
import youtubedl from "youtube-dl-exec";

var connection;
var connectionId;
export const player = createAudioPlayer();
var playlist = [];

function joinVC(voiceChannel, textChannel, guild) {
  if (!voiceChannel) {
    textChannel.send("You're not in a voice channel.");
    return false;
  }

  if (connection && connectionId != voiceChannel.id) {
    textChannel.send("The bot is in another channel.");
    return false;
  }

  if (connection) {
    return true;
  }

  connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  connectionId = voiceChannel.id;

  connection.subscribe(player);

  return true;
}

export function getNextResource() {
  playlist.shift();
  return playlist[0]?.resource;
}

export function list(textChannel) {
  var lst = playlist
    .map((value, index) => {
      return `${index + 1}. ${value.data.title}`;
    })
    .join("\n");

  textChannel.send(lst == "" ? "The playlist is empty" : lst);
}

export function play(textChannel, voiceChannel, guild, args) {
  if (!joinVC(voiceChannel, textChannel, guild)) {
    return;
  }

  const YDL_OPTIONS = {
    format: "bestaudio/best",
    dumpSingleJson: true,
    noWarnings: true,
    noCallHome: true,
    noCheckCertificate: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
    noPlaylist: true,
    defaultSearch: "ytsearch",
  };
  const FFMPEG_OPTIONS = {
    before_options: "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
    options: "-vn",
  };

  if (args.length == 1) {
    if (playlist.length != 0) {
      player.unpause();
    }

    return;
  }

  const search = args.slice(1).join(" ");

  youtubedl(search, YDL_OPTIONS).then(async (output) => {
    const song = output?.entries?.[0] || output;

    const resource = createAudioResource(song.url, {
      inlineVolume: true,
      ...FFMPEG_OPTIONS,
    });

    resource.volume.setVolume(0.5);
    playlist.push({ resource: resource, data: song });

    if (player.state.status == AudioPlayerStatus.Idle) {
      player.play(resource);
      textChannel.send(`Playing ${song.title}`);
    } else {
      textChannel.send(`Added ${song.title} to the queue`);
    }
  });
}

export function setResourceVolume(textChannel, args) {
  if (playlist.length == 0) {
    textChannel.send(`No music is playing currently`);
    return;
  }

  playlist[0].resource.volume.setVolume(args[1] / 100);
  textChannel.send(`Set volume as ${args[1]}%`);
}

export function pause(textChannel, args) {
  if (playlist.length == 0) {
    textChannel.send(`No music is playing currently`);
    return;
  }

  player.pause();
  textChannel.send(`Paused the music`);
}

export function skip(textChannel, args) {
  if (playlist.length == 0) {
    textChannel.send(`No music is playing currently`);
    return;
  }

  player.stop();
  textChannel.send(`Skipped the current music`);
}

export function remove(textChannel, args) {
  args = args.slice(1).sort().reverse();
  for (var i = 0; i < args.length; i++) {
    if (args[i] == 1) {
      skip(textChannel);
      continue;
    }

    if (playlist.length < args[i]) {
      textChannel.send(`No music is in this position: ${args[i]}`);
      continue;
    }

    textChannel.send(
      `Removed ${playlist[args[i] - 1].data.title} from the playlist`
    );
    playlist.splice(args[i] - 1, 1);
  }
}

export function help(textChannel) {
  var help = "";
  help += "@list - shows the playlist\n";
  help +=
    "@play [url/song name] - plays the song/ adds to the playlist/ resumes\n";
  help += "@volume [x%] - sets the volume as x\n";
  help += "@pause - pauses the music player\n";
  help += "@skip - skips the current music\n";
  help +=
    "@remove [INDEX INDEX...] - removes music from the playlist based on the INDEX(es)\n";
  help += "@quit - removes bot from the voice channel";

  textChannel.send(help);
}

export function quit() {
  player.stop();
  connection?.disconnect();
  connection = null;
  connectionId = -1;
  playlist = [];
}
