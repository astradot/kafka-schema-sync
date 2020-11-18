#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('chalk');
const yargs = require('yargs');
const {resolve} = require("path");
const dedent = require('dedent-js');

interface ICLIOptions {
    config: string,
    kdir: string,
    outfile: string;
}

interface IKafaTopicConfig {
    name: string;
    retentionHours: number;
    compression?: string;
}

interface IYamlConfig {
    bootstrapServers: string,
    replication: number,
    topics: IKafaTopicConfig[],
}

function hoursToMs(hours: number) {
    const minutes = hours * 60;
    const seconds = minutes * 60;
    const ms = seconds * 1000;
    return ms;
}

function createKafkaCommand(topic: IKafaTopicConfig, kafka: IYamlConfig) {
    const compression = topic.compression ? topic.compression : "zstd";
    const retentionMs = hoursToMs(topic.retentionHours);

    return `$KTOOLS_HOME/kafka-topics.sh -bootstrap-server "${kafka.bootstrapServers}" --create --replication-factor ${kafka.replication}  --config compression.type=${compression} --config retention.ms=${retentionMs} --topic ${topic.name}`;
}


function createBashFile(commandList: string[], toolsBaseDir: string, bashScriptFile: string) {
    const cmdContents = commandList.join("\n\n");

    const bashContents = `
            #!/bin/bash
            
            # https://twitter.com/b0rk/status/1314345978963648524/photo/1
            set -euo pipefail
            
            KTOOLS_HOME='${toolsBaseDir}'
            
            ${cmdContents}
            
            echo "All Kafka Config Done"
    `;

    fs.writeFile(bashScriptFile, dedent(bashContents), (err: any) => {
        if (err) throw err;
        console.log(chalk.green(`Done writing bash file ${chalk.white(bashScriptFile)}`)); // Success
    });
}

function main() {
    const options: ICLIOptions = yargs
        .usage("Usage: --config <config.yaml>")
        .option("c", {alias: "config", describe: "configuration yaml", type: "string", demandOption: true})
        .option("k", {alias: "kdir", describe: "directory containing kafka tools binaries", type: "string", demandOption: true})
        .option("o", {alias: "outfile", describe: "file to output bash script to", type: "string", demandOption: true})
        .argv;

    const kDir = resolve(options.kdir);
    if (!fs.existsSync(kDir)) {
        console.log(chalk.red("directory doesnt exist"), kDir);
        return;
    }
    const yamlFile = options.config;
    if (!fs.existsSync(yamlFile)) {
        console.log(chalk.red("file doesnt exist"), yamlFile);
        return;
    }
    const yamlContents = fs.readFileSync(yamlFile);
    const kafkaConfig: IYamlConfig = yaml.safeLoad(yamlContents);

    const topicCmds = kafkaConfig.topics.map(topic => createKafkaCommand(topic, kafkaConfig));

    createBashFile(topicCmds, kDir, options.outfile);
}

main();
