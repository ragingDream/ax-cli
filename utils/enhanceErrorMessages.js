import { Command } from "commander"; // 命令行工具
import chalk from "chalk"; // 输出样式化

/**
 * @description 增强报错信息提示
 * @param {string} methodName 方法名称
 * @param {function} log 打印方法
 */
export const enhanceErrorMessages = (methodName, log) => {
  Command.prototype[methodName] = function (...args) {
    if (methodName === "unknownOption" && this._allowUnknownOption) {
      return;
    }

    // 输出帮助信息
    this.outputHelp({ error: true });

    // 定位错误
    console.log();
    console.log(`  ` + chalk.red(log(...args)));
    console.log();

    // 退出程序
    process.exit(1);
  };
};
