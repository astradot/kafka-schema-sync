#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('chalk');
const yargs = require('yargs');
const { Kafka } = require('kafkajs')

interface ICLIOptions {
    config: string,
}

interface IKafaTopicConfig {
    name: string;
    retentionHours: number;
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
    const seconds = minutes * 60;
    const ms = seconds * 1000;
    return ms;
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

    const admin = kafka.admin()

    console.log("Connecting to Kafka...")
    await admin.connect()
    console.log("Connected to Kafka...")
    await admin.disconnect()

    console.log("Done")
}

main();
