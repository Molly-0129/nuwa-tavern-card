# 女娲 · 酒馆角色卡

适用于 Codex、Google Antigravity 和 Claude Code 的中文 Agent Skill。可以和你逐步共创，也可以根据一个点子一次成卡。支持角色本体、世界书、开场白、可选文风和卡面绘制，完整卡可导出为 CCv3 JSON 和内嵌角色数据的 PNG。

## 安装

三个客户端共用仓库里的 `skills/nuwa-tavern-card` 文件夹。手动安装时，从仓库首页选择 **Code → Download ZIP** 并解压，复制整个技能文件夹，保留 `SKILL.md` 和所有子目录。下文的 `~` 指用户主目录，Windows 对应 `%USERPROFILE%`。

### Codex

在 Codex 对话里发送下面这条指令。

```text
请用 $skill-installer 安装 https://github.com/Molly-0129/nuwa-tavern-card/tree/main/skills/nuwa-tavern-card
```

安装完成后，在下一轮对话输入 `$nuwa-tavern-card`。如果技能列表尚未刷新，重新打开 Codex 后再试。

也可以手动复制到项目的 `.agents/skills/nuwa-tavern-card/`。

### Google Antigravity（反重力）

- 当前项目放到 `.agents/skills/nuwa-tavern-card/`。
- 跨项目使用时放到 `~/.gemini/config/skills/nuwa-tavern-card/`。
- 在 App 或交互式 CLI 中输入 `/nuwa-tavern-card`。也可以在对话里明确指定使用该技能。

[Antigravity 技能文档](https://antigravity.google/docs/skills)

### Claude Code（CC）

- 当前项目放到 `.claude/skills/nuwa-tavern-card/`。
- 跨项目使用时放到 `~/.claude/skills/nuwa-tavern-card/`。
- 在 Claude Code 中输入 `/nuwa-tavern-card`，后面可以直接加写卡要求。

[Claude Code 技能文档](https://code.claude.com/docs/en/skills)

## 使用示例

```text
请用 nuwa-tavern-card 一次成卡。主角是替亡者送信的邮差，我是唯一能拆开那些信的人。偏悬疑，帮我画卡面并导出 JSON 和 PNG。
```

想一起打磨时，可以说「逐步共创，先定人设和关系」。包内的 [技能说明](skills/nuwa-tavern-card/SKILL.md) 列出了完整工作流。

## 导出与导入

本地 JSON/PNG 打包脚本需要 Node.js，无需安装 npm 依赖。绘制新卡面需要当前客户端有可用的图像生成工具。也可以提供自己的图片，或由打包脚本生成占位卡面。将输出的角色卡 PNG 或 JSON 导入 SillyTavern 即可使用。需要 MVU 剧情阶段或状态栏时，请说明目标版本和扩展环境，技能会按对应版本处理。

参考 [CCv3 导出说明](skills/nuwa-tavern-card/references/ccv3.md) 与 [MVU 和 EJS 说明](skills/nuwa-tavern-card/references/mvu.md)。
