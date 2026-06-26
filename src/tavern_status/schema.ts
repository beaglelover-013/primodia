// 变量结构定义 — Zod schema (zod 4.x)
// 全部使用 z.prefault 保证幂等解析，兼容 MVU JSON patch 增量更新

export const Schema = z.object({
  世界: z
    .object({
      当前日期: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      当前时间: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      天气: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      当前位置: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      声望: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      金钱: z
        .object({
          秘银币: z.coerce.number().prefault(0),
          铂金币: z.coerce.number().prefault(0),
          金币: z.coerce.number().prefault(0),
          银币: z.coerce.number().prefault(0),
          铜币: z.coerce.number().prefault(0),
        })
        .prefault({}),
    })
    .prefault({}),

  酒馆: z
    .object({
      名称: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      所在城市: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      整体风格: z.string().or(z.literal('待初始化')).prefault('待初始化'),
      区域列表: z
        .record(
          z.string(),
          z
            .object({
              状态: z.string().prefault('正常'),
              描述: z.string().prefault(''),
              设施标签: z.array(z.string()).prefault([]),
              子空间: z
                .record(
                  z.string(),
                  z
                    .object({
                      状态: z.string().prefault('正常'),
                      描述: z.string().prefault(''),
                    })
                    .prefault({}),
                )
                .prefault({}),
            })
            .prefault({}),
        )
        .prefault({}),
      进行中的制作: z
        .record(
          z.string(),
          z
            .object({
              容器: z.string().prefault(''),
              所在区域: z.string().prefault(''),
              当前状态: z.string().prefault('准备中'),
              开始: z.string().prefault('待初始化'),
              预计完成: z.string().prefault('待初始化'),
              剩余量感: z.string().prefault(''),
            })
            .prefault({}),
        )
        .prefault({}),
    })
    .prefault({}),

  库存: z
    .record(
      z.string(),
      z
        .object({
          数量: z.coerce.number().prefault(0),
          单位: z.string().prefault('份'),
          分类: z.enum(['食材', '调料', '成品', '其他']).prefault('其他'),
          售价铜币: z.coerce.number().prefault(0),
          风味标签: z.array(z.string()).prefault([]),
          烹饪手法: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  购物: z
    .object({
      店铺列表: z
        .record(
          z.string(),
          z
            .object({
              所在位置: z.string().prefault(''),
              描述: z.string().prefault(''),
              商品列表: z
                .record(
                  z.string(),
                  z
                    .object({
                      分类: z.enum(['食材', '调料', '成品', '其他']).prefault('其他'),
                      单位: z.string().prefault('份'),
                      单价铜币: z.coerce.number().prefault(0),
                      备注: z.string().prefault(''),
                    })
                    .prefault({}),
                )
                .prefault({}),
            })
            .prefault({}),
        )
        .prefault({}),
    })
    .prefault({}),

  账本: z
    .object({
      经营足迹: z
        .object({
          累计营业天数: z.coerce.number().prefault(0),
          累计接待客人数: z.coerce.number().prefault(0),
          累计客房入住: z.coerce.number().prefault(0),
        })
        .prefault({}),
      金银流转: z
        .object({
          累计总收入铜币: z.coerce.number().prefault(0),
        })
        .prefault({}),
      当前总资产: z
        .object({
          秘银币: z.coerce.number().prefault(0),
          铂金币: z.coerce.number().prefault(0),
          金币: z.coerce.number().prefault(0),
          银币: z.coerce.number().prefault(0),
          铜币: z.coerce.number().prefault(0),
          折算合计铜币: z.coerce.number().prefault(0),
        })
        .prefault({}),
    })
    .prefault({}),

  玩家: z
    .object({
      基本信息: z
        .object({
          姓名: z.string().or(z.literal('待初始化')).prefault('待初始化'),
          种族: z.string().prefault('人类'),
          年龄: z.coerce.number().prefault(20),
          头像: z.string().prefault('👤'),
          称号: z.string().prefault(''),
          简介标语: z.string().prefault(''),
        })
        .prefault({}),
      状态: z
        .object({
          生命值: z
            .object({
              当前: z.coerce
                .number()
                .transform(v => _.clamp(v, 0, 9999))
                .prefault(100),
              上限: z.coerce.number().prefault(100),
            })
            .prefault({}),
          精力: z
            .object({
              当前: z.coerce
                .number()
                .transform(v => _.clamp(v, 0, 9999))
                .prefault(100),
              上限: z.coerce.number().prefault(100),
            })
            .prefault({}),
        })
        .prefault({}),
      烹饪等级: z
        .object({
          等级: z.coerce
            .number()
            .transform(v => _.clamp(v, 1, 99))
            .prefault(1),
          等级称号: z.string().prefault('学徒'),
          下一级称号: z.string().prefault('学徒'),
          累计做菜次数: z.coerce.number().prefault(0),
          升级所需次数: z.coerce.number().prefault(10),
        })
        .prefault({}),
      当前穿着: z.string().prefault('待初始化'),
    })
    .prefault({}),

  角色: z
    .record(
      z.string().describe('角色内部id'),
      z
        .object({
          显示名: z.string().prefault(''),
          种族: z.string().prefault('人类'),
          年龄: z.coerce.number().prefault(20),
          性别: z.enum(['男', '女', '其他']).prefault('其他'),
          当前位置: z.string().prefault(''),
          头像: z.string().prefault('👤'),
          简介标语: z.string().prefault(''),
          穿着: z.string().prefault(''),
          精力状态: z.string().prefault('状态良好'),
          膀胱值: z
            .object({
              当前: z.coerce
                .number()
                .transform(v => _.clamp(v, 0, 100))
                .prefault(0),
              上限: z.coerce.number().prefault(100),
            })
            .prefault({}),
          亲密度阶段: z.coerce
            .number()
            .transform(v => _.clamp(v, 1, 8))
            .prefault(1),
          亲密度描述: z.string().prefault(''),
          好感度: z
            .object({
              当前: z.coerce
                .number()
                .transform(v => _.clamp(v, 0, 100))
                .prefault(0),
              上限: z.coerce.number().prefault(100),
            })
            .prefault({}),
        })
        .prefault({}),
    )
    .prefault({}),
});

export type SchemaType = z.infer<typeof Schema>;
