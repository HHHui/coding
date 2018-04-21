<!-- 后台方法重名,导致action creator改名,但前段没有及时修正 --> 以后没有了
原来有个action creator叫
getFindContracts11 { method:get , url: /contract/xx }  --->    对应后端方法名findContracts
一段时间以后后端又多了一个方法名同样为findContracts
于是乎老的swaggerGen之后
getFindContracts11 { method:get , url: /contract/aa }
getFindContracts22 { method:get , url: /contract/xx }

所以代码里的getFindContracts11应该全部改为getFindContracts22.
但是实际上并没有.

再用新的template生成后
getFindContracts11 { method:get , url: /contract/aa }  => getContractAa
getFindContracts22 { method:get , url: /contract/xx }  => getContractXx

于是乎代码中所有的getFindContracts11被替换成了getContractAa,然后报错了

所有引用PropertyContract/v2中的
1.  getCostContractsContractId => getPropertyV2ContractsContractId
2.  getCostContracts => getPropertyV2Contracts
3.  postCostContracts => postPropertyV2Contracts

<!-- API被换了TAG --> 以后还有
import { getCommonsIndustries } from 'redux/modules/swaggerGen/Common';
变为
import { getCommonsIndustries } from 'redux/modules/swaggerGen/BusinessCommon';

state.CommonBySwaggerGen.getCommonsIndustries
变为
state.BusinessCommonBySwaggerGen.getCommonsIndustries,

<!-- swaggerGen/index.js 瞎几把命名 --> 以后可能没有
collect state info 本来是以BySwaggerGen为关键词的,没想到有人在index里加了个叫TemplateSwaggerGen的,导致全部漏掉了,以下是名单
[
  {
    "type": "Identifier",
    "start": 3933,
    "end": 3965,
    "loc": {
      "start": { "line": 127, "column": 44 },
      "end": { "line": 127, "column": 76 },
      "identifierName": "findContractTemplatesForBuilding"
    },
    "name": "findContractTemplatesForBuilding",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/components/PrintContract/PrintContract.jsx"
  },
  {
    "type": "Identifier",
    "start": 719,
    "end": 732,
    "loc": {
      "start": { "line": 33, "column": 46 },
      "end": { "line": 33, "column": 59 },
      "identifierName": "getAllKeyword"
    },
    "name": "getAllKeyword",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/containers/BodyCustomKeyWords/CustomKeyWords.jsx"
  },
  {
    "type": "Identifier",
    "start": 719,
    "end": 732,
    "loc": {
      "start": { "line": 33, "column": 46 },
      "end": { "line": 33, "column": 59 },
      "identifierName": "getAllKeyword"
    },
    "name": "getAllKeyword",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/containers/BodyCustomKeyWords/Property.jsx"
  },
  {
    "type": "Identifier",
    "start": 1205,
    "end": 1225,
    "loc": {
      "start": { "line": 26, "column": 45 },
      "end": { "line": 26, "column": 65 },
      "identifierName": "templateViewKeywords"
    },
    "name": "templateViewKeywords",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/containers/BodyTemplate/NewTemplate.jsx"
  },
  {
    "type": "Identifier",
    "start": 1271,
    "end": 1284,
    "loc": {
      "start": { "line": 27, "column": 44 },
      "end": { "line": 27, "column": 57 },
      "identifierName": "getAllKeyword"
    },
    "name": "getAllKeyword",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/containers/BodyTemplate/NewTemplate.jsx"
  },
  {
    "type": "Identifier",
    "start": 1355,
    "end": 1371,
    "loc": {
      "start": { "line": 29, "column": 47 },
      "end": { "line": 29, "column": 63 },
      "identifierName": "workflowKeywords"
    },
    "name": "workflowKeywords",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/containers/BodyTemplate/NewTemplate.jsx"
  },
  {
    "type": "Identifier",
    "start": 669,
    "end": 682,
    "loc": {
      "start": { "line": 19, "column": 39 },
      "end": { "line": 19, "column": 52 },
      "identifierName": "getAllKeyword"
    },
    "name": "getAllKeyword",
    "filepath":
      "/Users/huizhang/Code/creams-web2/app/components/ContractModalv2/components/OtherInfo.jsx"
  }
]

<!-- building 查看详情 右侧栏出问题 --> 
/Users/huizhang/Code/creams-web2/app/components/CrRight/BuildingRight/index.jsx
/Users/huizhang/Code/creams-web2/app/components/CrRight/BuildingRight/components/buildingInfo.jsx
这两个文件中的action creator都没有被修改.
一个是因为直接从父组件得到action creator,所以没有被收集
父组件是因为使用了export default from导致解析错误,所以没有被收集
将这两个人间中的getQueryBuilding => getBuildingsId

<!-- Tags相关API从Common转到了BusinessCommon -->
/Users/huizhang/Code/creams-web2/app/containers/BodyTenantTag-Profile/components/Table.jsx
/Users/huizhang/Code/creams-web2/app/containers/BodyRoomTag-Profile/components/Table.jsx

<!-- selector.js 使用state的结构,没有被收集到 -->
/Users/huizhang/Code/creams-web2/app/components/ReviewModal/components/HeaderInfo/selector.js
直接使用了state, 改一下就Ok了

<!-- 不属于本次修改的BUG -->
1. 房源管理,可招商,点击房源详情,点右上角"编辑"出现 floorList.map is not a function
2. 招商管理 客户管理 客户详情 右上角"提醒" this.props.list.map is not a function

