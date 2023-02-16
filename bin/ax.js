#!/usr/bin/env node

import process from "node:process"; // node 进程
import path from "node:path"; // 路径
import fs from "fs-extra"; // fs 文件系统增强
import inquirer from "inquirer"; // 命令行交互
import chalk from "chalk"; // 输出样式化
import boxen from "boxen"; // 控制台输出框
import ora from "ora"; // loading
import slash from "slash"; // 路径转换
import { Command } from "commander"; // 命令行工具
import { checkNodeVersion, clearConsole, download, installModules } from "../utils/index.js";
import { enhanceErrorMessages } from "../utils/enhanceErrorMessages.js";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")); //package.json 信息
const program = new Command();
const spinner = ora();
const { version } = pkg;
const TEMPLATE = {
  Vue2: {
    url: "direct:https://github.com/ragingDream/vite-admin-template#vue2",
    engines: {
      node: ">= 14.18.0",
    },
  },
  Vue3: {
    url: "direct:https://github.com/ragingDream/vite-admin-template#main",
    engines: {
      node: ">= 16.0.0",
    },
  },
}; // 模板信息

// 版本
program.version(version);

// 创建新项目
program
  .command("create <project-name>")
  .description("创建新项目")
  .option("-f, --force", "Overwrite target directory if it exists")
  .action(async (projectName, options) => {
    const targetDir = path.resolve(process.cwd(), projectName);
    const isForce = options.force;
    const isFileExists = fs.pathExistsSync(targetDir);

    /**
     * @description 是否强制创建项目
     *  是 => 删除文件夹
     *  否 => 选择模式，Overwrite-删除后写入，Cancel-取消操作
     */
    if (isForce) {
      await clearConsole(version);
      console.log(`Removing ${chalk.cyan(targetDir)}`);

      // 删除文件夹
      fs.removeSync(targetDir);
    } else {
      if (isFileExists) {
        await clearConsole(version);

        const { action } = await inquirer.prompt({
          name: "action",
          type: "list",
          message: `Target directory ${chalk.yellowBright(targetDir)} already exists. Pick an action:`,
          choices: [
            { name: "Overwrite", value: "overwrite" },
            { name: "Cancel", value: false },
          ],
        });

        if (action === "overwrite") {
          console.log();
          console.log(`Removing ${chalk.cyan(targetDir)}`);

          // 删除文件夹
          fs.removeSync(targetDir);
        } else {
          process.exit(1);
        }
      }
    }

    await clearConsole(version);

    // 获取对应的模板信息
    const { preset } = await inquirer.prompt({
      name: "preset",
      type: "list",
      message: "Please pick a preset:",
      choices: [
        { name: `Default(${chalk.yellow("Vue2")})`, value: "Vue2" },
        { name: `Default(${chalk.yellow("Vue3")})`, value: "Vue3" },
      ],
    });
    const {
      url,
      engines: { node },
    } = TEMPLATE[preset];
    // 转化下载的目标路径
    const downloadDirPath = slash(targetDir);

    // 比较 node 版本 ==> 不符合，直接退出
    checkNodeVersion(node);

    // 创建文件夹
    fs.ensureDirSync(targetDir);

    await clearConsole(version);
    console.log(`✨  Creating project in ${chalk.yellow(targetDir)}`);
    console.log();
    spinner.start("loading...");

    try {
      // 下载模板
      await download(url, downloadDirPath);

      spinner.succeed("Download template succeed!");
    } catch (error) {
      // 下载失败
      console.log();
      spinner.fail(chalk.red(`Failed fetching remote preset ${chalk.cyan(preset)}:`));
      console.log();
      throw error;
    }

    try {
      console.log();
      console.log("📦  Installing additional dependencies...");
      console.log();

      // 安装依赖
      await installModules("pnpm i", [], downloadDirPath);

      console.log(`🎉  Successfully created project ${chalk.yellow(projectName)}`);
      console.log("👉  Get started with the following commands:");
      console.log();
      console.log(` ${chalk.gray("$")} ${chalk.cyan(`cd ${projectName}`)}`);
      console.log(` ${chalk.gray("$")} ${chalk.cyan("pnpm run dev")}`);
      console.log(
        boxen(`Thanks For Using!`, {
          title: `${chalk.bold.blue("@ax/cli")}`,
          titleAlignment: "center",
          padding: 2,
          margin: 1,
        })
      );
    } catch (error) {
      // 安装失败
      console.log();
      spinner.fail(chalk.red(`Failed Installing additional dependencies`));
      console.log();
      throw error;
    }
  });

enhanceErrorMessages("missingArgument", (argName) => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}`;
});

enhanceErrorMessages("unknownOption", (optionName) => {
  return `Unknown option ${chalk.yellow(optionName)}`;
});

enhanceErrorMessages("optionMissingArgument", (option, flag) => {
  return (
    `Missing required argument for option ${chalk.yellow(option.flags)}` + (flag ? `, got ${chalk.yellow(flag)}` : ``)
  );
});

program.parse(process.argv);
