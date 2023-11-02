require('dotenv').config(); 
require('./registerCommands'); 
const ytdl = require('ytdl-core');
const { joinVoiceChannel } = require('@discordjs/voice');
const { Player, QueryType, Playlist, DiscordPlayerQueryResultCache, useQueue, GuildQueueAudioFilters, PlayerError } = require('discord-player'); 
const { YouTubeExtractor, SpotifyExtractor, SoundCloudExtractor, BridgeProvider, BridgeSource, YoutubeExtractor} = require("@discord-player/extractor");

const {Client, IntentsBitField, EmbedBuilder, IntegrationExpireBehavior, managerToFetchingStrategyOptions, TextChannel, channelLink, resolveColor } = require('discord.js'); 
const { parse } = require('dotenv');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers, 
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildVoiceStates
    ], 
});

const player = new Player(client); 
player.extractors.register(SpotifyExtractor,  {}); 
player.extractors.register(YouTubeExtractor, {}); 
player.extractors.register(SoundCloudExtractor, {});

let activeUsers = false;

const botTestChannelId = '1111071154858364989'; 
const musicBotChannelId = '910713045817368616'; 
let channel; 

client.on('ready', (c) => {
    console.log(`${c.user.username} is ready to jam!\n\n---------------------------\n\n`); 
})

client.on('messageCreate', (msg) => {
    if (msg.author.bot) return;

    if (msg.channelId === botTestChannelId && msg.content === 'hello bot') { 
        msg.reply('hello world'); 
    }
})

client.on('voiceStateUpdate', (oldVoice, newVoice) => {
    if (newVoice.channel) { 
        activeUsers = true; 
        console.log('there is active user');
    }
})

client.on('interactionCreate', (interact) => {
    if (!interact.isChatInputCommand()) return; 
    const queue = useQueue(interact.guild.id); 
    channel = client.channels.cache.get(interact.channelId); 

    if (channel.id !== musicBotChannelId && channel.id !== botTestChannelId ) { 
        interact.reply('Command prompts will only work in the music bot channel.'); 
        return; 
    }

    switch (interact.commandName) { 
        //Random commands
        case 'add': 
            addNums(interact); 
            break; 
        case 'embed': 
            sampleEmbed(interact); 
            break;
        case 'join': 
            joinVoice(interact); 
            break;
        case 'server-info': 
            getServerInfo(interact); 
            break; 

        //Music player
        case 'play': 
            querySong(interact, queue); 
            break; 
        case 'pause': 
            queue.node.setPaused(!queue.node.isPaused()); 
            interact.reply('Music has been paused!');
            break; 
        case 'resume':
            queue.node.setPaused(false);
            interact.reply('Music is being resumed!');  
            break;
        case 'skip':
            queue.node.skip(); 
            console.log(queue.tracks.toArray());
            interact.reply(`Skipped to ${queue.currentTrack}`); 
            break; 
        case 'get-queue': 
            interact.reply(`Current Queue - ${getQueue(interact, queue)}`); 
            break; 
        case 'remove-song': 
            removeSong(interact, queue, channel); 
            break; 
        case 'clear-queue': 
            queue.delete(); 
            interact.reply('Current queue has now been cleared. :(');
            break; 
        case 'search-test':
            searchQuery(interact, queue, channel); 
            break; 
    }
})

//still in development
async function searchQuery(interact, queue, channel) { 
    const query = interact.options.get('query').value;
    const source = interact.options.get('source').value; 

    let extractorMap = new Map([
        ['Youtube', YoutubeExtractor],
        ['Spotify', SpotifyExtractor],
        ['Soundcloud', SoundCloudExtractor]
    ]); 

    extractorMap.delete(source); 

    console.log(extractorMap);

    player.search(query, { 
            blockExtractors: extractorMap.values(), requestedBy: interact.user 
        })
        .then((result) => {
            console.log(result); 
            // console.log(result.tracks);
        })
        .catch((e) => {
            console.log(e);
        })
}

function removeSong(interact, queue, channel) {
    let queueList = queue.tracks.toArray();
    let queueString = getQueue(interact, queue);
    let allowedIndexes = [];  

    const msg_filter = m => m.author.id === interact.user.id; 

    const isDigit = /^[\d]+/; 
    const noLetters = /[^A-Za-z]/;

    interact.reply(`Current queue: ${queueString}`); 
    channel.send('Please select a song to remove!'); 

    channel.awaitMessages({filter: msg_filter, max: 1})
        .then((collected) => {
            let message = collected.first(); 
            let input = message.content; 

            allowedIndexes = queueString.match(/\d+[)]/g);
            for (i = 0; i < allowedIndexes.length; i++) { 
                allowedIndexes[i] = /\d+/.exec(allowedIndexes[i])[0];
            }

            if (isDigit.test(input) === false) { 
                message.reply('Please enter a digit'); 
            } else if (isDigit.test(input) && noLetters.test(input)) {
                let num = parseInt(input) 
                if (num !== undefined) {
                    if (num > 0) { 
                        if (allowedIndexes.includes(num.toString())) { 
                            queue.removeTrack(queueList[num - 1]); 
                            message.reply((queueList.length > 0) ? `Updated the queue - ${getQueue(interact, queue)}` : 'Queue is now empty.'); 
                        } else {
                            message.reply('that number is out of scope of the list'); 
                        }
                    } else {
                        message.reply('digit needs to be larger than 0')
                    }
                }            
            } 
        }).catch((e) => {
            console.log(e);
        });         
}
async function getServerInfo(interact) {
    // let totalMembers = await interact.guild.members.list(); 
    // let userList = []; 
    // console.log(totalMembers); 
    // console.log(Object.keys(totalMembers)); 

    // for (i = 0; i < totalMembers.length; i++) { 
    //     console.log(totalMembers[i].user); 
    //     userList.push(totalMembers[i].user);
    // }

    let mainUser = await interact.guild.members.fetchMe(); 

    console.log(mainUser.user.avatarURL()); 
    
}

async function querySong(interact, queue) { 
    const query = interact.options.get('query').value;
    const source = interact.options.get('source').value; 
    const whitespace = "\u3000"; 
    let songEmbed = new EmbedBuilder()


    const extractorMap = new Map([
        ['Youtube', 'com.discord-player.youtubeextractor'],
        ['Spotify', 'com.discord-player.spotifyextractor'],
        ['Soundcloud', 'com.discord-player.soundcloudextractor']
    ]); 

    // await player.extractors.register(extractorMap.get(source)); 
    // await player.extractors.register(SpotifyExtractor,  {}); 
    // await player.extractors.register(YouTubeExtractor, {}); 
    // await player.extractors.register(SoundCloudExtractor, {});
    
    // console.log(player.extractors.store.get(extractorMap.get(source))); 
    
    // await player.extractors.loadDefault(); 

    try {
       await interact.deferReply('loading...'); 
        player.play(interact.member.voice.channel, query, { requestedBy: interact.user })
            .then(({track}) => { 

                if (Object.keys(track).length !== 0){
                    console.log(track); 
                    songEmbed
                        .setTitle('NEW SONG ALERT') 
                        .setThumbnail(track.requestedBy.avatarURL())
                        .setImage(track.thumbnail)
                        .addFields(                
                            { name: 'Song', value: track.title, inline: true },
                            { name: 'Artist', value: track.author, inline: true }, 
                            { name: 'Requested By', value: track.requestedBy.username, inline: true }                
                        );
                    
                    // channel.send({embeds: [songEmbed]});
                    interact.editReply({embeds: [songEmbed]}); 
                }                
            }).catch((e) => {
                console.log(e); 
            });        
    } catch (e) {
        console.log(`Error when querying for song.\n\n${e}`);
        interact.reply(`There was an issue finding your song. Please try again!`); 
    }    
}

function getQueue(interact, queue) { 
    const queueList = queue.tracks.toArray()
    const currentTrack = queue.currentTrack; 
    let queueString; 

    for (i = 0; i < queueList.length; i++) {
        let track = queueList[i]; 

        if (queueString === undefined) { 
            queueString = `${i+1}) ${track.title} By ${track.author}`;
        } else {
            queueString = queueString.concat(`, ${i+1}) ${track.title} By ${track.author}`); 
        }
    }

    console.log(queueString); 
    return queueString; 
}

async function joinVoice(interact) { 
    console.log(interact); 

    if (activeUsers) { 
       joinVoiceChannel({
            channelId: interact.member.voice.channelId,
            guildId: interact.guildId, 
            adapterCreator: interact.guild.voiceAdapterCreator
        });
    } else {
        interact.reply('user not in voice channel.');
    }
}

client.login(process.env.TOKEN); 

