! function() {
  "use strict";
  angular.module("app", ["ngRoute", "ngAnimate", "ngSanitize", "ui.bootstrap", "ui.select", "textAngular", "easypiechart", "angular-skycons", "angular-loading-bar", "FBAngular", "app.ctrls", "app.directives", "app.ui.table.ctrls"]).config(["uiSelectConfig", function(uiSelectConfig) {
      uiSelectConfig.theme = "bootstrap"
  }]).config(["cfpLoadingBarProvider", function(cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = !1, cfpLoadingBarProvider.latencyThreshold = 50
  }]).config(["$routeProvider", "$locationProvider", function($routeProvider) {
      function setRoutes(route) {
          var url = "/" + route,
              config = {
                  templateUrl: ipAddress + "views/" + route + ".html"
              };
          return $routeProvider.when(url, config), $routeProvider
      }

      var routes = ["dashboard", "tables/ansible-config","tables/db4bix-config","tables/logstash-config"];
      routes.forEach(function(route) {
          setRoutes(route)
      }), $routeProvider.when("/", {
          redirectTo: "/dashboard"
      }).when("/404", {
          templateUrl: "views/pages/404.html"
      }).otherwise({
          redirectTo: "/404"
      })
  }])
}();

! function() {
  "use strict";
  angular.module("app.ctrls", []).controller("AppCtrl", ["$rootScope", "$scope", function($rs, $scope) {
      var mm = window.matchMedia("(max-width: 767px)");
      $rs.isMobile = mm.matches ? !0 : !1, $rs.safeApply = function(fn) {
          var phase = this.$root.$$phase;
          "$apply" == phase || "$digest" == phase ? fn && "function" == typeof fn && fn() : this.$apply(fn)
      }, mm.addListener(function(m) {
          $rs.safeApply(function() {
              $rs.isMobile = m.matches ? !0 : !1
          })
      }), $scope.themeActive = "theme-one", $scope.onThemeChange = function(theme) {
          $scope.themeActive = theme
      }
  }]).controller("HeadCtrl", ["$scope", "Fullscreen", function($scope, Fullscreen) {
      $scope.toggleSidebar = function() {
          $scope.sidebarOpen = $scope.sidebarOpen ? !1 : !0
      }, $scope.fullScreen = function() {
          Fullscreen.isEnabled() ? Fullscreen.cancel() : Fullscreen.all()
      }
  }]).controller("NavCtrl", ["$scope", "$rootScope", function($scope) {
      $scope.isCollapsed = !1
  }]).controller("DashboardCtrl", ["$scope", "$rootScope", function($scope) {
      
    $scope.computerInformations = [{
      "hostid": "正在查询中",
      "name": "正在查询中",
      "pfreeCpu": "正在查询中",
      "totleMemory": "正在查询中",
      "availableMemory": "正在查询中",
      "pAvailableMemory": "正在查询中",
      "totalDisk": "正在查询中",
      "usedDIsk": "正在查询中",
      "pUsedDisk": "正在查询中",
      "ip": "正在查询中"
    }]
      
      //这里的只是推迟处理问题，这里的异步仍旧存在问题
      setInterval(() => {
        getComputerInformation();
        $scope.computerInformations = hostInformations
      },3000)
  }])
}();

! function() {
  "use strict";
  angular.module("app.directives", []).directive("toggleNavMin", ["$rootScope", function($rs) {
      return function(scope, el) {
          var app = $("#app");
          $rs.$watch("isMobile", function() {
              $rs.isMobile && app.removeClass("nav-min")
          }), el.on("click", function(e) {
              $rs.isMobile || (app.toggleClass("nav-min"), $rs.$broadcast("nav.reset"), $rs.$broadcast("chartist.update")), e.preventDefault()
          })
      }
  }]).directive("collapseNavAccordion", [function() {
      return {
          restrict: "A",
          link: function(scope, el) {
              var lists = el.find("ul").parent("li"),
                  a = lists.children("a"),
                  listsRest = el.children("ul").children("li").not(lists),
                  aRest = listsRest.children("a"),
                  app = $("#app"),
                  stopClick = 0;
              a.on("click", function(e) {
                  if (e.timeStamp - stopClick > 300) {
                      if (app.hasClass("nav-min") && window.innerWidth > 767) return;
                      var self = $(this),
                          parent = self.parent("li");
                      a.not(self).next("ul").slideUp(), self.next("ul").slideToggle(), lists.not(parent).removeClass("open"), parent.toggleClass("open"), stopClick = e.timeStamp
                  }
                  e.preventDefault()
              }), aRest.on("click", function() {
                  var parent = aRest.parent("li");
                  lists.not(parent).removeClass("open").find("ul").slideUp()
              }), scope.$on("nav.reset", function(e) {
                  a.next("ul").removeAttr("style"), lists.removeClass("open"), e.preventDefault()
              })
          }
      }
  }]).directive("toggleOffCanvas", ["$rootScope", function() {
      return {
          restrict: "A",
          link: function(scope, el) {
              el.on("click", function() {
                  $("#app").toggleClass("on-canvas")
              })
          }
      }
  }]).directive("highlightActive", ["$location", function($location) {
      return {
          restrict: "A",
          link: function(scope, el) {
              var links = el.find("a"),
                  path = function() {
                      return $location.path()
                  },
                  highlightActive = function(links, path) {
                      var path = "#" + path;
                      angular.forEach(links, function(link) {
                          var link = angular.element(link),
                              li = link.parent("li"),
                              href = link.attr("href");
                          li.hasClass("active") && li.removeClass("active"), 0 == path.indexOf(href) && li.addClass("active")
                      })
                  };
              highlightActive(links, $location.path()), scope.$watch(path, function(newVal, oldVal) {
                  newVal != oldVal && highlightActive(links, $location.path())
              })
          }
      }
  }]).directive("uiCheckbox", [function() {
      return {
          restrict: "A",
          link: function(scope, el) {
              el.children().on("click", function(e) {
                  el.hasClass("checked") ? (el.removeClass("checked"), el.children().removeAttr("checked")) : (el.addClass("checked"), el.children().attr("checked", !0)), e.stopPropagation()
              })
          }
      }
  }]).directive("customScrollbar", ["$interval", function($interval) {
      return {
          restrict: "A",
          link: function(scope, el) {
              scope.$isMobile || (el.perfectScrollbar({
                  suppressScrollX: !0
              }), $interval(function() {
                  el[0].scrollHeight >= el[0].clientHeight && el.perfectScrollbar("update")
              }, 60))
          }
      }
  }])
}();

! function() {
  "use strict";
  angular.module("app.ui.table.ctrls", []).controller("ansible_config", ["$scope", "$filter", function($scope, $filter) {

    /*                                                     数据类型                                                        */
    
    $scope.formData = {
      'ansible_ssh_host': "",
      'ansible_ssh_port': "",
      'ansible_ssh_user': "",
      'ansible_ssh_pass': "",
      'group_name': "",
      'system': "linux",
    }
    
    var checkBox = []
    var isEdit = false

    //一个ip和密码的键值对数组，因为在$scope.datas中密码是******的保存，需要另一组数据来不明显的保存密码，同时后面需要验证编辑验证密码
    var ipToPassword = []

    /*                                                     函数(不用对外暴露的)                                                        */ 
    
    //初始化数据的代码
    var resetData = () => {
      $.post("/deal_config/get_ansible_host", {}, (res) => {
        isEdit = false
        var datas = JSON.parse(res.result)
        var tempDatas = JSON.parse(res.result)
        ipToPassword = []
        var dataList = []
        for (let i = 0; i < datas.length; i++) {
          for (let j = 0; j < datas[i]["group_list"].length; j++) {
            datas[i]["group_list"][j]["group_name"] = datas[i]["group_name"]
            datas[i]["group_list"][j]["ansible_ssh_pass"] = "********"
            datas[i]["group_list"][j]["oracle_port"] = "----"
            datas[i]["group_list"][j]["oracle_instance"] = "----"
            dataList.push(datas[i]["group_list"][j])

            ipToPassword.push({
              "name": tempDatas[i]["group_list"][j]["name"],
              "ansible_ssh_pass": tempDatas[i]["group_list"][j]["ansible_ssh_pass"]
            })
          }
        }
        $scope.datas = dataList
        $scope.searchKeywords = "", $scope.filteredData = [], $scope.row = "", $scope.numPerPageOpts = [5, 7, 10, 25, 50, 100], $scope.numPerPage = $scope.numPerPageOpts[1], $scope.currentPage = 1, $scope.currentPageStores = [], $scope.select = function(page) {
          var start = (page - 1) * $scope.numPerPage,
              end = start + $scope.numPerPage;
          $scope.currentPageStores = $scope.filteredData.slice(start, end)
      }, $scope.onFilterChange = function() {
          $scope.select(1), $scope.currentPage = 1, $scope.row = ""
      }, $scope.onNumPerPageChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.onOrderChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.search = function() {
          $scope.filteredData = $filter("filter")($scope.datas, $scope.searchKeywords), $scope.onFilterChange()
      }, $scope.order = function(rowName) {
          $scope.row != rowName && ($scope.row = rowName, $scope.filteredData = $filter("orderBy")($scope.datas, rowName), $scope.onOrderChange())
      }, $scope.search(), $scope.select($scope.currentPage)
      })
    }

    resetData()

    var time = setInterval(() => {
      if(oracle_message.length != 0){
        oracle_message.map((item) => {
          var index = $scope.datas.findIndex(data => {
            return data.ansible_ssh_host == item.ip
          })
          $scope.datas[index]["oracle_port"] = item.port
          $scope.datas[index]["oracle_instance"] = item.instance
        })
        clearInterval(time)
      }
    }, 3000)

    /*                                                     函数对外暴露的方法                                                        */   
    //定位到编辑的地方
    
    $scope.fileupload=()=>{
    var form_data=new FormData();
    var file_info=$('input[name="file"]')[0].files[0];
    var isok=0;
    form_data.append('file',file_info);
        $.post("/deal_config/upload"),{'data':form_data},(callback)=>
        {
          console.log('return:'+callback);
          json_data=JSON.parse(callback);
          if(json_data['status']=='modelerror'){
            alert('模板类型异常');
            }
          else if(json_data['status']=='dumplicate'){
            alert('导入文件中存在重复IP：'+json_data['host_ip']); 
            }
          else if(json_data['status']=='exists'){
            alert('IP已存在：'+json_data['host_ip']);
            }
          else if(json_data['status']=='success'){
            alert('导入成功');
            }
          else{
            alert('导入失败，原因请分析');
            }
            
          console.log('return:'+json_data);
          isok=1;				
    }
    }
    // function fileupload(){
    //   var form_data=new FormData();
    //     var file_info=$('input[name="file"]')[0].files[0];
    //     var isok=0;
    //     form_data.append('file',file_info);
    //     $.ajax({
    //       url:'/deal_config/upload/',
    //       type:'POST',
    //       async:false,
    //       data:form_data,
    //       processData:false,
    //       contentType:false,
    //       success:function(callback){
    //           console.log('return:'+callback);
    //           json_data=JSON.parse(callback);
    //           if(json_data['status']=='modelerror'){
    //             alert('模板类型异常');
    //             }
    //           else if(json_data['status']=='dumplicate'){
    //             alert('导入文件中存在重复IP：'+json_data['host_ip']); 
    //             }
    //           else if(json_data['status']=='exists'){
    //             alert('IP已存在：'+json_data['host_ip']);
    //             }
    //           else if(json_data['status']=='success'){
    //             alert('导入成功');
    //             }
    //           else{
    //             alert('导入失败，原因请分析');
    //             }
                
    //           console.log('return:'+json_data);
    //           isok=1;				
        
    //     }
    
    // });
    
    // }

    
    $scope.edit = (name) => {
      isEdit = true;
      var index = $scope.datas.findIndex(item => {
        return item.name == name
      })

      $scope.formData = Object.assign($scope.formData, $scope.datas[index])
      
      var passwordIndex = ipToPassword.findIndex(item => {
        return item.name == name
      })
      $scope.formData.ansible_ssh_pass = ipToPassword[passwordIndex].ansible_ssh_pass;
      
      console.log($scope.formData)
    }

    $scope.oracleAuthorization = () => {
      $.post("/deal_config/oracle_authorization", {'data': JSON.stringify(checkBox)} , (res) => {
        if (res.result !== "success") {
          alert("oracle数据库授权失败")
        } else {
          alert('oracle数据库授权成功');
        }
      })  
    }

    $scope.installZabbixAgent = () => {
      $.post("/deal_config/install_zabbix_agent", {'data': JSON.stringify(checkBox)} , (res) => {
        if (res.result !== "success") {
          alert("安装脚本执行未成功")
        } else {
          alert('安装脚本执行成功');
        }
      })  
    }

    //重新设置表单
    $scope.resetForm = () => {
      $scope.formData =  {
        'ansible_ssh_host': "",
        'ansible_ssh_port': "",
        'ansible_ssh_user': "",
        'ansible_ssh_pass': "",
        'group_name': "",
        'system': "linux",
      }
      isEdit = false;
    }

    $scope.del = (name) => {
      var index = $scope.datas.findIndex(item => {
        return item.name == name
      })
      
      $.post("/deal_config/del_ansible_host", {'data': JSON.stringify($scope.datas[index])}, (res) => {
        if (res.result !== "success") {
          alert("删除失败")
        } else {
          resetData()
          alert('删除成功');
        }
      });
    }

    $scope.refresh_oracle_message = () => {
      $.post("/deal_config/get_oracle_port_and_instance_name", {}, (res) => {
        oracle_message =  JSON.parse(res.result)
      });
    }

    $scope.ping_all_host = () => {
      $.post("/deal_config/ping_all_host", {}, (res) => {
        var del_name = JSON.parse(res.result)
        var datasIndex = 0
        for( var key in del_name ){
          datasIndex = $scope.datas.findIndex(item => {
            return item.name == key
          })
          $scope.datas.splice(datasIndex, 1)
        }
        $scope.searchKeywords = "", $scope.filteredData = [], $scope.row = "", $scope.numPerPageOpts = [5, 7, 10, 25, 50, 100], $scope.numPerPage = $scope.numPerPageOpts[1], $scope.currentPage = 1, $scope.currentPageStores = [], $scope.select = function(page) {
          var start = (page - 1) * $scope.numPerPage,
              end = start + $scope.numPerPage;
          $scope.currentPageStores = $scope.filteredData.slice(start, end)
      }, $scope.onFilterChange = function() {
          $scope.select(1), $scope.currentPage = 1, $scope.row = ""
      }, $scope.onNumPerPageChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.onOrderChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.search = function() {
          $scope.filteredData = $filter("filter")($scope.datas, $scope.searchKeywords), $scope.onFilterChange()
      }, $scope.order = function(rowName) {
          $scope.row != rowName && ($scope.row = rowName, $scope.filteredData = $filter("orderBy")($scope.datas, rowName), $scope.onOrderChange())
      }, $scope.search(), $scope.select($scope.currentPage)
      
        alert("已保留所有ping通的配置")
      });
    }
    
    /*
    $scope.showBox = (ansible_ssh_host) => {
      var index = checkBox.findIndex( item => {return ansible_ssh_host == item})
       if (index == -1) {
         checkBox.push(ansible_ssh_host)
       } else {
         checkBox.splice(index, 1)
       }
      }
      */

    $scope.reviseHostConfig = () => {
      if (isEdit) {
        $.post("/deal_config/edit_ansible_host", {'data': JSON.stringify($scope.formData)} , (res) => {
          if (res.result !== "success") {
            alert("无法ping通" + $scope.formData.ansible_ssh_host)
          } else {
            resetData()
            alert('修改成功');
          }
        })
      } else {
        $.post("/deal_config/add_ansible_host", {'data': JSON.stringify($scope.formData)} , (res) => {
          if (res.result !== "success") {
            alert("无法ping通" + $scope.formData.ansible_ssh_host)
          } else {
            resetData()
            alert('新增加成功');
          }
        })
      }
    }
  }]).controller("db4bix_config", ["$scope", "$filter", function($scope, $filter) {
/*                                                     数据类型                                                        */    
    var Template = {
      "name": "",
      "type": "oracle",
      "instance": "",
      "host": "",
      "port": "",
      "user": "",
      "password": "",
      "pool": "Common",
      "connectString": ""
    } 

    $scope.formData = {
      'name': "",
      'host': "",
      'instance': "",
      'port': "",
      'user': "",
      'password': "",
      'serviceName': "",
      "connectString": ""
    }
    
    var isEdit = false
    var NameToPassword = []

    /*                                                     函数(不用对外暴露的)                                                        */   
    //在将数据传回后端前格式化数据
    var formatting_data = () => {
      var JsonData = []
      $scope.datas.map( item => {
        //delete item["serviceName"];
        var temp = { ...Object.assign(Template, item) }
        
        temp.connectString = "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST="+  temp.host +")(PORT="+  temp.port +"))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME="+  temp.serviceName +")))"
        delete temp["serviceName"]

        var index = NameToPassword.findIndex(item => {return item.name == temp.name})
        temp.password = NameToPassword[index].password
        JsonData.push(temp)
      })

      return JsonData
    }
    
    //初始化数据的代码
    var resetData = () => {
      $.post("/deal_config/get_db4bix_config", {}, (res) => {
        isEdit = false
        var datas = JSON.parse(res.result)
        var tempDatas = JSON.parse(res.result)
        NameToPassword = []

        var reg = new RegExp(/SERVICE_NAME=\w*/i);

        for (let i = 0; i < datas.length; i++) {
          var item = datas[i];
          var connectString = item.connectString

          item.serviceName = reg.exec(connectString)[0].replace("SERVICE_NAME=", "")
          item.password = "******"

          NameToPassword.push({
            "name": tempDatas[i]["name"],
            "password": tempDatas[i]["password"]
          })
        }

        $scope.datas = datas
   
        $scope.searchKeywords = "", $scope.filteredData = [], $scope.row = "", $scope.numPerPageOpts = [5, 7, 10, 25, 50, 100], $scope.numPerPage = $scope.numPerPageOpts[1], $scope.currentPage = 1, $scope.currentPageStores = [], $scope.select = function(page) {
          var start = (page - 1) * $scope.numPerPage,
              end = start + $scope.numPerPage;
          $scope.currentPageStores = $scope.filteredData.slice(start, end)
      }, $scope.onFilterChange = function() {
          $scope.select(1), $scope.currentPage = 1, $scope.row = ""
      }, $scope.onNumPerPageChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.onOrderChange = function() {
          $scope.select(1), $scope.currentPage = 1
      }, $scope.search = function() {
          $scope.filteredData = $filter("filter")($scope.datas, $scope.searchKeywords), $scope.onFilterChange()
      }, $scope.order = function(rowName) {
          $scope.row != rowName && ($scope.row = rowName, $scope.filteredData = $filter("orderBy")($scope.datas, rowName), $scope.onOrderChange())
      }, $scope.search(), $scope.select($scope.currentPage)

    })
    }
    
    var deal_db4bix_config = () => {
      $.post("/deal_config/deal_db4bix_config", {'data': JSON.stringify(formatting_data())} , (res) => {
        if (res.result !== "success") {
          alert("修改配置文件失败")
        } else {
          resetData()
          alert('修改成功');
        }
      })
    }

    //最开始执行的一次数据请求
    resetData()

    /*                                                     函数对外暴露的方法                                                        */   
    //监听输入host，要是host被扫描出来就把端口和实例给填上去
    $scope.$watch('formData.host',() => {
      var index = oracle_message.findIndex(item => {return item.ip == $scope.formData.host})
      if ( index != -1){
        $scope.formData.port = oracle_message[index].port
        $scope.formData.instance = oracle_message[index].instance
      }
    });

    //定位到编辑的地方
    $scope.edit = (name) => {
      isEdit = true;
      var index = $scope.datas.findIndex(item => {
        return item.name == name
      })

      $scope.formData = Object.assign($scope.formData, $scope.datas[index])

      var passwordIndex = NameToPassword.findIndex(item => {
        return item.name == name
      })
      $scope.formData.password = NameToPassword[passwordIndex].password;
    }

    //重新设置表单
    $scope.resetForm = () => {
      $scope.formData = {
        'name': "",
        'host': "",
        'instance': "",
        'port': "",
        'user': "",
        'password': "",
        'serviceName': "",
        "connectString": ""
      }
      isEdit = false;
    }

    $scope.del = (name) => {
      var index = NameToPassword.findIndex(item => {return item.name == name})
      NameToPassword.splice(index, 1)
      index = $scope.datas.findIndex(item => {return item.name == name})
      $scope.datas.splice(index, 1)
 
      deal_db4bix_config()
    }
    //表单的修改和增添
    $scope.reviseHostConfig = () => {
      if (isEdit) {
        var index = $scope.datas.findIndex(item => {return item.name == $scope.formData.name})

        //这里因为最后格式化数据类型的时候需要依据另一个保存密码的数组，如果密码修改了，那个数组里面的密码也要更新
        if ($scope.datas[index].password != $scope.formData.password) {
          var index = NameToPassword.findIndex(item => {return item.name == $scope.formData.name})  
          NameToPassword[index].password = $scope.formData.password
        }
        Object.assign($scope.datas[index], $scope.formData)
      } else {
        NameToPassword.push({
          "name": $scope.formData.name,
          "password": scope.formData.password
        })
        $scope.datas.push($scope.formData)
      }

      deal_db4bix_config()

    }
  }]).controller("logstash_config", ["$scope", "$filter", function($scope, $filter) {
    /*                                                     数据类型                                                        */    
        var Template = {
          'connstr': "",
          'dbip': "",
          'dbname': "",
          'user': "",
          'passwd': "",
        } 
    
        $scope.formData = {
          "connstr": "",
          'dbip': "",
          'dbname': "",
          'user': "",
          'passwd': "",
          'port': "",
          'serviceName': "",
        }
        
        var isEdit = false
        var ConnstrToPassword = []
    
        /*                                                     函数(不用对外暴露的)                                                        */   
        //在将数据传回后端前格式化数据
        var formatting_data = () => {
          var JsonData = []
          $scope.datas.map( item => {
            var temp = { ...Object.assign(Template, item) }

            var index = ConnstrToPassword.findIndex(item => {return item.connstr == temp.connstr})
            temp.passwd = ConnstrToPassword[index].passwd

            temp.connstr = "jdbc:oracle:thin:@"+  temp.dbip +":"+  temp.port +"\/"+  temp.serviceName
            delete temp["serviceName"]
            delete temp["port"]

            JsonData.push(temp)
          })
    
          return JsonData
        }
        
        //初始化数据的代码
        var resetData = () => {
          $.post("/deal_config/get_logstash_config", {}, (res) => {
            isEdit = false
            var datas = JSON.parse(res.result)
            var tempDatas = JSON.parse(res.result)
    
            ConnstrToPassword = []
    
            for (let i = 0; i < datas.length; i++) {
              var item = datas[i];
              var connstr = item.connstr
         
              //这里的ip直接冲connstr上面拿出来的  jdbc:oracle:thin:@192.168.9.140:1522/dyey
              connstr = connstr.split("@")[1].split(":")
              item.dbip = connstr[0]
              item.port = connstr[1].split("/")[0]
              item.serviceName = connstr[1].split("/")[1]
              
              item.passwd = "******"
    
              ConnstrToPassword.push({
                "connstr": tempDatas[i]["connstr"],
                "passwd": tempDatas[i]["passwd"]
              })
            }
    
            $scope.datas = datas
       
            $scope.searchKeywords = "", $scope.filteredData = [], $scope.row = "", $scope.numPerPageOpts = [5, 7, 10, 25, 50, 100], $scope.numPerPage = $scope.numPerPageOpts[1], $scope.currentPage = 1, $scope.currentPageStores = [], $scope.select = function(page) {
              var start = (page - 1) * $scope.numPerPage,
                  end = start + $scope.numPerPage;
              $scope.currentPageStores = $scope.filteredData.slice(start, end)
          }, $scope.onFilterChange = function() {
              $scope.select(1), $scope.currentPage = 1, $scope.row = ""
          }, $scope.onNumPerPageChange = function() {
              $scope.select(1), $scope.currentPage = 1
          }, $scope.onOrderChange = function() {
              $scope.select(1), $scope.currentPage = 1
          }, $scope.search = function() {
              $scope.filteredData = $filter("filter")($scope.datas, $scope.searchKeywords), $scope.onFilterChange()
          }, $scope.order = function(rowName) {
              $scope.row != rowName && ($scope.row = rowName, $scope.filteredData = $filter("orderBy")($scope.datas, rowName), $scope.onOrderChange())
          }, $scope.search(), $scope.select($scope.currentPage)
    
        })
        }
        
        var deal_logstash_config = () => {
          $.post("/deal_config/deal_logstash_config", {'data': JSON.stringify(formatting_data())} , (res) => {
            if (res.result !== "success") {
              alert("修改配置文件失败")
            } else {
              resetData()
              alert('修改成功');
            }
          })
        }
    
        //最开始执行的一次数据请求
        resetData()
    
        /*                                                     函数对外暴露的方法                                                        */   

        //定位到编辑的地方
        $scope.edit = (connstr) => {
          isEdit = true;
          var index = $scope.datas.findIndex(item => {
            return item.connstr == connstr
          })
    
          $scope.formData = Object.assign($scope.formData, $scope.datas[index])
    
          var passwordIndex = ConnstrToPassword.findIndex(item => {
            return item.connstr == connstr
          })
          $scope.formData.password = ConnstrToPassword[passwordIndex].password;
        }
    
        //重新设置表单
        $scope.resetForm = () => {
          $scope.formData = {
            'dbip': "",
            'dbname': "",
            'user': "",
            'passwd': "",
            'port': "",
            'serviceName': "",
          }
          isEdit = false;
        }
    
        $scope.del = (connstr) => {
          var index = ConnstrToPassword.findIndex(item => {return item.connstr == connstr})
          ConnstrToPassword.splice(index, 1)
          index = $scope.datas.findIndex(item => {return item.connstr == connstr})
          $scope.datas.splice(index, 1)
     
          deal_logstash_config()
        }
        //表单的修改和增添
        $scope.reviseHostConfig = () => {
          if (isEdit) {
            var index = $scope.datas.findIndex(item => {return item.connstr == $scope.formData.connstr})
    
            //这里因为最后格式化数据类型的时候需要依据另一个保存密码的数组，如果密码修改了，那个数组里面的密码也要更新
            if ($scope.datas[index].passwd != $scope.formData.passwd) {
              var index = ConnstrToPassword.findIndex(item => {return item.connstr == $scope.formData.connstr})  
              ConnstrToPassword[index].passwd = $scope.formData.passwd
            }

            Object.assign($scope.datas[index], $scope.formData)
          } else {
            $scope.formData.connstr = "jdbc:oracle:thin:@"+  $scope.formData.dbip +":"+  $scope.formData.port +"/"+  $scope.formData.serviceName
            ConnstrToPassword.push({
              "connstr": $scope.formData.connstr,
              "passwd": $scope.formData.passwd
            })
            $scope.datas.push($scope.formData)
          }

          deal_logstash_config()

        }

        $scope.restartLogstash = () => {
          $.post("/restart/logstash", {} , (res) => {
            if (res.result !== "success") {
              alert("重启失败")
            } else {
              alert('重启成功');
            }
          })
        }
      }])
}();


