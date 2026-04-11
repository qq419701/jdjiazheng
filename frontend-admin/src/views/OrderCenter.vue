<el-table-column prop="card_code" label="卡密" width="150" show-overflow-tooltip v-if="false" />
            <el-table-column label="电商单号" width="170" show-overflow-tooltip>
              <template #default="{ row }">
                <span v-if="row.ecommerce_order_no" style="color:#409eff;font-size:12px;font-weight:500">{{ row.ecommerce_order_no }}</span>
                <span v-else style="color:#bbb;font-size:12px">-</span>
              </template>
            </el-table-column>\n          
            <!-- 其他内容 -->