<context>
NOTE: 请新建一个酒馆助手脚本名为 `MVU`，将代码块中的内容复制到脚本中
```js
import 'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js'
```

NOTE: 请再新建一个酒馆助手脚本名为 `变量结构`，将代码块中的内容复制到脚本中
<variable_schema>
```js
import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  世界: z.object({
    当前历法: z.object({
      年: z.coerce.number(),
      月: z.string(),
      日: z.coerce.number(),
      时段: z.string(),
      天气: z.string(),
    }),
    当前地点: z.object({
      区域: z.string(),
      具体位置: z.string(),
      坐标: z.object({
        x: z.coerce.number(),
        y: z.coerce.number(),
      }),
    }),
  }),
  酒馆: z.object({
    名称: z.string(),
    声望: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    资金铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    今日营业状态: z.string(),
    区域: z.record(z.string().describe('区域名'), z.object({
      状态: z.string(),
      风格: z.string(),
      描述: z.string(),
      分配员工: z.string(),
      设施: z.record(z.string().describe('设施名'), z.object({
        状态: z.string(),
        风格: z.string(),
        描述: z.string(),
        价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      })),
      客房: z.record(z.string().describe('房间名'), z.object({
        类型: z.string(),
        住客: z.string(),
        价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
        舒适: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
        私密: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
        清洁: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
        设施: z.record(z.string().describe('房间设施名'), z.object({
          状态: z.string(),
          描述: z.string(),
        })),
      })),
    })),
  }),
  主角: z.object({
    姓名: z.string(),
    称号: z.string(),
    当前状态: z.string(),
    所在位置: z.string(),
    生命: z.object({
      当前值: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
      阶段: z.string(),
    }),
    精力: z.object({
      当前值: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
      阶段: z.string(),
    }),
    烹饪等级: z.object({
      等级: z.coerce.number().transform(value => _.clamp(Math.floor(value), 1, 8)),
      称号: z.string(),
      做菜次数: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      下级所需次数: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    }),
  }),
  库房: z.object({
    食材: z.record(z.string().describe('食材批次名'), z.object({
      数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      标签: z.array(z.string()),
      价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    })),
    调料: z.record(z.string().describe('调料名'), z.object({
      数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      标签: z.array(z.string()),
      价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    })),
    成品: z.record(z.string().describe('成品名'), z.object({
      数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      标签: z.array(z.string()),
      搭配判定: z.enum(['灾难级', '严重冲突', '轻微冲突', '无冲突', '经典搭配', '绝佳搭配', '奇迹']),
      价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    })),
    酒水: z.record(z.string().describe('酒水名'), z.object({
      数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      标签: z.array(z.string()),
      搭配判定: z.enum(['灾难级', '严重冲突', '轻微冲突', '无冲突', '经典搭配', '绝佳搭配', '奇迹']),
      价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    })),
    杂物: z.record(z.string().describe('杂物名'), z.object({
      数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
      标签: z.array(z.string()),
      价格折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
    })),
  }),
  人物羁绊: z.record(z.string().describe('配角名'), z.object({
    种族: z.string(),
    身份: z.string(),
    羁绊阶段: z.coerce.number().transform(value => _.clamp(Math.floor(value), 0, 8)),
    阶段文字: z.string(),
    好感: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
    心情: z.string(),
    所在位置: z.string(),
    生命: z.object({
      当前值: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
      阶段: z.string(),
    }),
    精力: z.object({
      当前值: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
      阶段: z.string(),
    }),
    膀胱: z.object({
      当前值: z.coerce.number().transform(value => _.clamp(value, 0, 100)),
      阶段: z.string(),
    }),
    备注: z.string(),
  })),
  农田与酒窖: z.object({
    农田: z.record(z.string().describe('田畦名'), z.object({
      状态: z.string(),
      作物: z.string(),
      播种日: z.string(),
      成熟日: z.string(),
      预计产出: z.string(),
      批次标签: z.array(z.string()),
    })),
    酒窖桶: z.record(z.string().describe('桶名'), z.object({
      状态: z.string(),
      内容物: z.string(),
      类型: z.string(),
      酿造开始日: z.string(),
      收获日: z.string(),
      预计产出: z.string(),
    })),
  }),
  街坊商铺: z.object({
    当前商铺: z.string(),
    商铺: z.record(z.string().describe('商铺名'), z.object({
      类型: z.string(),
      店主: z.string(),
      氛围: z.string(),
      招呼语: z.string(),
      今日货架: z.record(z.string().describe('商品名'), z.object({
        分类: z.string(),
        数量: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
        单价折合铜币: z.coerce.number().transform(value => Math.max(0, Math.floor(value))),
        标签: z.array(z.string()),
        备注: z.string(),
      })),
    })),
  }),
  地图: z.object({
    当前地点: z.string(),
    当前坐标: z.object({
      x: z.coerce.number(),
      y: z.coerce.number(),
    }),
    节点: z.record(z.string().describe('地点名'), z.object({
      所属: z.string(),
      性质: z.string(),
      主标签: z.string(),
      地形: z.string(),
      坐标: z.object({
        x: z.coerce.number(),
        y: z.coerce.number(),
      }),
      描述: z.string(),
      相邻: z.record(z.string().describe('相邻地点名'), z.object({
        距离公里: z.coerce.number().transform(value => Math.max(0, value)),
        路线类型: z.string(),
        预计耗时: z.string(),
      })),
    })),
    商路: z.record(z.string().describe('商路名'), z.object({
      类型: z.string(),
      经过节点: z.array(z.string()),
      状态: z.string(),
    })),
  }),
  编年摘要: z.record(z.string().describe('楼层编号'), z.object({
    时间: z.string(),
    地点: z.string(),
    人物: z.array(z.string()),
    事件: z.string(),
    总结: z.string(),
  })),
});

$(() => {
  registerMvuSchema(Schema);
});
```
这个结构按普利莫迪亚当前前端的主要页面来设计：世界、酒馆、主角、库房、人物羁绊、农田与酒窖、街坊商铺、地图、编年摘要都能被 MVU 记录。库房的食材、调料、杂物只记录数量、标签与价格；成品和酒水才使用菜品/饮品引擎的“搭配判定”，只允许灾难级、严重冲突、轻微冲突、无冲突、经典搭配、绝佳搭配、奇迹。价格统一按铜币折算存储，超过 100 铜也不需要拆成银币或金币，前端显示时再换算。CG 图床属于前端/角色资料配置，不放进 MVU 剧情变量。库存、设施、人物、地图节点都使用 `z.record`，方便后续不断添加新物品、新设施、新配角和新地点；数值类使用 `z.coerce.number()`，生命、精力、膀胱、声望等需要阶段判断的数值限制在 0~100；没有使用 `.passthrough`，也没有把字段做成 optional，符合增量更新时稳定解析的需求。
</variable_schema>
</context>
