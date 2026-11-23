# CCv3 字段与导出

规范见 [Character Card V3](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md)，实际 PNG 读取见 [SillyTavern 解析器](https://github.com/SillyTavern/SillyTavern/blob/release/src/character-card-parser.js)。

- 顶层使用 spec = chara_card_v3、spec_version = "3.0" 及 data 对象。字符串字段包括 name、description、personality、scenario、first_mes、mes_example、creator、creator_notes、character_version、system_prompt、post_history_instructions。未用的字段填空字符串。tags、alternate_greetings、group_only_greetings 为字符串数组，无内容用空数组。extensions 为对象。
- description 放主要设定，personality、scenario 按需放各自独有信息。first_mes 放主开局，alternate_greetings 放备选，group_only_greetings 专供群聊。creator_notes 面向玩家。system_prompt 和 post_history_instructions 默认留空，按需及目标客户端配置填写。
- data.character_book 为对象，含 extensions 对象和 entries 数组。条目含 keys 字符串数组、content 字符串、enabled 布尔、insertion_order 数字、use_regex 布尔和 extensions 对象。建议写唯一数字 id、comment 和明确的 constant。普通条目设 use_regex 为 false，常驻条目设 constant 为 true、keys 可为空。可选 position 仅 before_char 或 after_char。支持更细位置的客户端使用其版本对应的扩展字段。参考 [SillyTavern 世界书](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)。
- 单独世界书仅在用户需要时另交。CCv3 世界书交换格式为 {"spec":"lorebook_v3","data":{…}}。SillyTavern 独立世界书导入使用其自己的结构，应以目标版本导出的样本为准。
- PNG 使用标准 tEXt/ccv3，载荷是 UTF-8 JSON 的 Base64。需要旧读卡器时可用 --v2-fallback 同时加 chara。V2 投影只用于兼容，V3 专属字段以 ccv3 为准。

在技能目录用 Node.js 运行：

    node scripts/card.mjs pack 草稿.json 交付目录/角色名 --cover 卡面.png
    node scripts/card.mjs verify 交付目录/角色名.json 交付目录/角色名.png

不传 --cover 时使用内建占位图。文件已存在时选新文件名或版本。脚本离线，无依赖。命令行不可用且有 Node REPL 时可直接动态 import，调用 packCard(input, outputStem, {cover, v2Fallback}) 和 verifyPair(jsonPath, pngPath)。编辑已有卡时在本地另存输出。verify 检查数据一致及 PNG 块完整性，实际酒馆导入另行验证。
