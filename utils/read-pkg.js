import path from "node:path"; // 路径
import { fileURLToPath } from "node:url";
import fs from "fs-extra"; // fs 文件系统增强

/**
 * @description 获取 package 信息
 * @returns package 信息
 */
export const getPkgInfo = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pkgPath = path.resolve(__dirname, "../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  return pkg;
};
