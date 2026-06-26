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
