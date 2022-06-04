#!/usr/bin/env node

import {Admin, ConfigResourceTypes, Kafka} from "kafkajs";
import chalk from 'chalk';

const yaml = require('js-yaml');
const fs = require('fs');
const yargs = require('yargs');

interface ICLIOptions {
    config: string,
}

interface IKafaTopicConfig {
    name: string;
    retentionHours?: number;
    retentionMinutes?: number;
    compression?: string;
}

interface IYamlConfig {
    bootstrapServers: string,
    replication: number,
    defaultCompression: string,
    topics: IKafaTopicConfig[],
}

function hoursToMs(hours: number) {
    const minutes = hours * 60;
    return minutesToMs(minutes);
}

function minutesToMs(minutes: number) {
    const seconds = minutes * 60;
    return seconds * 1000;
}

async function createTopic(mainConfig: IYamlConfig, topicConfig: IKafaTopicConfig, existingTopics: string[], admin: Admin) {
    if(!topicConfig.retentionMinutes && !topicConfig.retentionHours) {
        console.log(`No retention period specified for topic ${topicConfig.name}`);
        return;
    }

    let retentionMs;
    if(topicConfig.retentionHours) {
        retentionMs = hoursToMs(topicConfig.retentionHours);
    } else {
        retentionMs = minutesToMs(topicConfig.retentionMinutes!);
    }

    const compression =  topicConfig.compression ? topicConfig.compression : mainConfig.defaultCompression;

    if (!existingTopics.includes(topicConfig.name)) {
        await admin.createTopics({
            topics: [
                {
                    topic: topicConfig.name,
                    replicationFactor: mainConfig.replication,
                    configEntries: [
                        {name: "retention.ms", value: `${retentionMs}`},
                        {name: "compression.type", value: compression},
                    ]
                }
            ]
        });

        console.log(`created topic ${topicConfig.name}`);
    }
    else {
        console.log(`topic already exists: ${topicConfig.name}`);
        await admin.alterConfigs( {
            validateOnly: false,
            resources : [
                {
                    type: ConfigResourceTypes.TOPIC,
                    name: topicConfig.name,
                    configEntries: [
                        {name: "retention.ms", value: `${retentionMs}`},
                        {name: "compression.type", value: compression},
                    ]
                }
            ]
        });

        console.log(`updated topic config: ${topicConfig.name}`);
    }
}

async function main() {
    const options: ICLIOptions = yargs
        .usage("Usage: --config <config.yaml>")
        .option("c", {alias: "config", describe: "configuration yaml", type: "string", demandOption: true})
        .argv;

    const yamlFile = options.config;
    if (!fs.existsSync(yamlFile)) {
        console.log(chalk.red("file doesnt exist"), yamlFile);
        return;
    }
    const yamlContents = fs.readFileSync(yamlFile);
    const kafkaConfig: IYamlConfig = yaml.safeLoad(yamlContents);

    const kafka = new Kafka({
        clientId: 'config-generator-app',
        brokers: kafkaConfig.bootstrapServers.split(",")
    });

    const admin: Admin = kafka.admin();

    console.log("Connecting to Kafka...");
    try {
        await admin.connect();
        console.log("Connected to Kafka...");

        const existingTopics = await admin.listTopics();

        for (const topic of kafkaConfig.topics) {
            await createTopic(kafkaConfig, topic, existingTopics, admin);
        }
    } finally {

        await admin.disconnect();
    }

    console.log("Done");
}

main();
