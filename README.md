# 女娲 · 酒馆角色卡

适用于 Codex 的中文写卡技能。可以和你逐步共创，也可以根据一个点子一次成卡。支持角色本体、世界书、开场白、可选文风和卡面绘制，完整卡可导出为 CCv3 JSON 和内嵌角色数据的 PNG。

## 安装到 Codex

在 Codex 对话里发送下面这条指令。

```text
请用 $skill-installer 安装 https://github.com/Molly-0129/nuwa-tavern-card/tree/main/skills/nuwa-tavern-card
```

安装完成后，在下一轮对话输入 `$nuwa-tavern-card`。如果技能列表尚未刷新，重新打开 Codex 后再试。

### 手动安装

从仓库首页选择 **Code → Download ZIP** 并解压。将 `skills/nuwa-tavern-card` 整个文件夹复制到 Codex 的技能目录。使用 `$skill-installer` 时默认目录为 `~/.codex/skills`，Windows 对应 `%USERPROFILE%\.codex\skills`。若设置了 `CODEX_HOME`，则使用其下的 `skills` 目录。复制后确认 `nuwa-tavern-card/SKILL.md` 直接位于该技能文件夹内。

## 使用示例

```text
$nuwa-tavern-card 一次成卡。主角是替亡者送信的邮差，我是唯一能拆开那些信的人。偏悬疑，帮我画卡面并导出 JSON 和 PNG。
```

想一起打磨时，可以说「逐步共创，先定人设和关系」。包内的 [技能说明](skills/nuwa-tavern-card/SKILL.md) 列出了完整工作流。

## 导出与导入

本地 JSON/PNG 打包脚本需要 Node.js，无需安装 npm 依赖。生成新卡面需要当前 Codex 环境具备图像生成工具，也可以提供自己的图片。将输出的角色卡 PNG 或 JSON 导入 SillyTavern 即可使用。需要 MVU 剧情阶段或状态栏时，请说明目标版本和扩展环境，技能会按对应版本处理。

参考 [CCv3 导出说明](skills/nuwa-tavern-card/references/ccv3.md) 与 [MVU 和 EJS 说明](skills/nuwa-tavern-card/references/mvu.md)。
