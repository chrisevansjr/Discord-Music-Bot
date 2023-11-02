require('dotenv').config(); 
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js'); 

const commands = [
    {
        name: 'add', 
        description: 'adds two numbers',
        options: [
            {
                name: 'first-number',
                description: 'the first number',
                type: ApplicationCommandOptionType.Number,
                required: true,
            }, 
            {
                name: 'second-number',
                description: 'the second number',
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ],
    },
    {
        name: 'embed', 
        description: 'Sends sample embed', 
    }, 
    {
        name: 'join', 
        description: 'bot joins voice channel with users',
    },
    {
        name: "play",
        description: "Plays a song from preferred source",
        options: [
            {
                name: 'source', 
                type: ApplicationCommandOptionType.String,
                required: true,
                description: 'Choose your preferred source to play from', 
                choices: [
                    {
                        name: 'Youtube', value: 'Youtube', 
                    }, 
                    {
                        name: 'Spotify', value: 'Spotify'
                    }, 
                    {
                        name: 'Soundcloud', value: 'Soundcloud'
                    }
                ]
                
            },
            {
                name: "query",
                type: ApplicationCommandOptionType.String,
                description: "The song you want to play",
                required: true
            }
        ]
    },
    {
        name: "skip",
        description: "Skip to the current song"
    },
    {
        name: "queue",
        description: "See the queue"
    },
    {
        name: "pause",
        description: "pause the player"
    }, 
    {
        name: 'resume', 
        description: 'unpauses the current song'
    },
    {
        name: 'get-queue', 
        description: 'Retreives the current queue'
    }, 
    {
        name: 'server-info',
        description: 'Sends logs to bot owner'
    },
    {
        name: 'remove-song',
        description: 'removes a song of you choice'
    },
    {
        name: 'clear-queue',
        description: 'clears the entire queue'
    },
    {
        name: 'search-test', 
        description: "Plays a song from preferred source",
        options: [
            {
                name: 'source', 
                type: ApplicationCommandOptionType.String,
                required: true,
                description: 'Choose your preferred source to play from', 
                choices: [
                    {
                        name: 'Youtube', value: 'Youtube', 
                    }, 
                    {
                        name: 'Spotify', value: 'Spotify'
                    }, 
                    {
                        name: 'Soundcloud', value: 'Soundcloud'
                    }
                ]
                
            },
            {
                name: "query",
                type: ApplicationCommandOptionType.String,
                description: "The song you want to play",
                required: true
            }
        ]
    }
]; 

const rest = new REST({ version: '10'}).setToken(process.env.TOKEN); 

(async () => {
    try {
        console.log('registering slash commands...'); 

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), 
            { body: commands }
        ) 

        console.log('Slash commands have been registered!');
    } catch(error) { 
        console.log(`There was an error thrown during command setup: ${error}`); 
    }
})(); 