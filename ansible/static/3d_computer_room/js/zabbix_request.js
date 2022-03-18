//token
let token = "";
//ajax的请求头设置
let setting = {};
//zabbix Api的url
const zabbixApiUrl = configParam.zabbixApiUrl;
//所有主机的信息
let hostInformations = [];
let cabList = [];

var requestJSON = {
  jsonrpc: "2.0",
  method: "user.login",
  params: configParam.params,
  id: 0,
  auth: null
}

var requestInformation = configParam.requestInformation;

let promiseArr = [];



//根据bite进行单位换算
var byteConvert = function(bytes) {
  if (isNaN(bytes)) {
      return '';
  }
  var symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  var exp = Math.floor(Math.log(bytes)/Math.log(2));
  if (exp < 1) {
      exp = 0;
  }
  var i = Math.floor(exp / 10);
  bytes = bytes / Math.pow(2, 10 * i);

  if (bytes.toString().length > bytes.toFixed(2).toString().length) {
      bytes = bytes.toFixed(2);
  }
  return bytes + ' ' + symbols[i];
};

//ajax请求头
var requestHead = (requestData, async) => {
  return {
    url: zabbixApiUrl,
    method: "POST",
    dataType: "json",
    headers:{
      "Content-Type": "application/json-rpc"
    },
    async: async,
    data: JSON.stringify(requestData),
    cache: false
  }
};

//刷新ajax的data值，别问为什么不直接用post，后面可能还会对请求头进行设置，先这么弄着
var setToken = () => {
  setting = requestHead(requestJSON, false);
  $.ajax(setting).done(function (response) {
   token = response.result;
   requestJSON.auth = token
  });
}


//获取网络拓扑图的信息
var getMapInformation = ()=> {
  requestJSON.method = "map.get";
  requestJSON.params = {"selectSelements": "extend","sysmapids": configParam.sysmapids};

  setting = requestHead(requestJSON, false);
  $.ajax(setting).done(function (respone) {
  
    respone.result[0].selements.map(item => {

      result =  JSON.parse(item.urls[0].url);
      
      var index = hostInformations.findIndex((host) => {
        return host.name == result.name;
      })

      if(index === -1){
        cabList.push(result);
      } else {
        Object.keys(result).map((key) => {
          hostInformations[index][key] = result[key];
        })
      }

    }) 
  })
}

//添加属性的
var addHostAttribute = () => {
  for (let index = 0; index < hostInformations.length; index++) {
    Object.keys(requestInformation).map((key) => {
      hostInformations[index][key] = requestInformation[key];
    })
  }
}

//获取所有的主机的hostID
var getAllHostId = () => {
  requestJSON.method = "host.get";
  requestJSON.params = {"output":["hostid","name"]};

  setting = requestHead(requestJSON, false);
  $.ajax(setting).done(function (respone) {
    hostInformations = respone.result;
  })
  addHostAttribute();
}


//获取所有主机的ip地址
var getAllHostIp = () => {
  requestJSON.method = "hostinterface.get";

  for (let index = 0; index < hostInformations.length; index++) {
    var hostId = hostInformations[index].hostid;
  
    requestJSON.params = 
    {
        "filter": {
            "hostid": [hostId]
        },
        "output": [
            "ip",
            "hostid"
        ]
    };
  
    setting = requestHead(requestJSON, true);
    let wait = new Promise((resolve, reject) => {
      $.ajax(setting).done(function (respone) {
        hostInformations[index].ip = respone.result[0].ip;
        resolve();
     })
    });
    promiseArr.push(wait);
  }
}


//获取服务器的详细信息
var getComputerInformation = () => {
  requestJSON.method = "item.get";
  var filter = [];

  Object.values(requestInformation).map((value) => {
    filter.push(value);
  })

  for (let index = 0; index < hostInformations.length; index++) {
    var hostId = hostInformations[index].hostid;
    requestJSON.params = {
      "hostids": hostId,
      "output":["key_","lastvalue"],
      "filter": {
          "key_": filter
        }  
    }

    setting = requestHead(requestJSON, true);
    let wait = new Promise((resolve, reject) => {
      $.ajax(setting).done(function (respone) {
       
        Object.keys(requestInformation).map((key) => {
          var resultIndex = respone.result.findIndex((item) => {
            return item.key_ === requestInformation[key];
          });

          if (resultIndex != -1){
            if(key[0] === 'p'){
              hostInformations[index][key] = parseFloat(respone.result[resultIndex].lastvalue).toFixed(2) + "%";
            } else {
              hostInformations[index][key] = byteConvert(respone.result[resultIndex].lastvalue);
            }
          }

        })
        resolve();
     })
    });
    promiseArr.push(wait);
  }
}

var start = () => {
  getAllHostId();
  getAllHostIp();
  getComputerInformation();
}

//流程顺序，获取Token，获取所有的HostId，获取ip和获取查询值是同步进行的
setToken();
start();

Promise.all(promiseArr).then(() => {
  getMapInformation();
  $.getScript(ipAddress + 'js/index.js', () => {console.log("加载文件")})
})


setInterval(() => {
  getComputerInformation();
},5000)