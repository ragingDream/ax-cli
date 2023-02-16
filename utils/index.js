import process from "node:process"; // node 进程
import { execa } from "execa"; // 增强版 child_process
import chalk from "chalk"; // 输出样式化
import semver from "semver"; // npm 版本比较
import downloadGitRepo from "download-git-repo"; // git 远程下载
import { log } from "node:console";

/**
 * @description 清除控制台消息
 */
export const clearConsole = (version) => {
  console.clear();
  console.log(chalk.bold.blue(`AX CLI v${version}`));
};

/**
 * @description 校验 node 版本
 * @param {string} wanted 模板要求的 node 版本
 */
export const checkNodeVersion = (wanted) => {
  if (!semver.satisfies(process.version, wanted, { includePrerelease: true })) {
    console.log(
      chalk.red(
        `You are using Node ${process.version}, but this version of @ax/lic requires Node ${wanted}.\nPlease upgrade your Node version.`
      )
    );
    process.exit(1);
  }
};

/**
 * @description 下载项目
 * @param {string} repository 仓库地址
 * @param {string} dirPath 存放的目录路径
 * @returns 返回 Promise
 */
export const download = async (repository, dirPath) => {
  return await new Promise((resolve, reject) => {
    downloadGitRepo(repository, dirPath, { clone: true }, (err) => {
      if (err) return reject(err);

      resolve();
    });
  });
};

/**
 * @description 安装依赖
 * @param {string} command 命令语句
 * @param {array} arg 参数
 * @param {string} targetDir 目标目录
 * @returns promise
 */
export const installModules = (command, arg, targetDir) => {
  return new Promise((resolve, reject) => {
    const child = execa(command, arg, { cwd: targetDir });

    child.stderr.on("data", (buf) => {
      const str = buf.toString();

      if (/warning/.test(str)) {
        return;
      }

      process.stderr.write(buf);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        console.log();
        console.log(chalk.redBright(`command failed: ${command}`));
        reject();
        return;
      }

      resolve();
    });
  });
};
