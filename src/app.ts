#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const chalk = require('chalk');
const yargs = require('yargs');
const {resolve} = require("path");

interface ICLIOptions {
    config: string,
    kdir: string,
}

interface IKafaTopicConfig {
    name: string;
    compression?: string;
}

interface IYamlConfig {
    bootstrapServers: string,
    replication: number,
    topics: IKafaTopicConfig[],
}

function main()
{
    const options: ICLIOptions = yargs
        .usage("Usage: --config <config.yaml>")
        .option("c", {alias: "config", describe: "configuration yaml", type: "string", demandOption: true})
        .option("k", {alias: "kdir", describe: "directory containing kafka tools binaries", type: "string", demandOption: true})
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
    const data: IYamlConfig = yaml.safeLoad(yamlContents);
}

main();