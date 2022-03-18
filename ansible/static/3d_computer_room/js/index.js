/*    var mysqlHead = (requestData,url) => {
      return {
        url: url,
        method: "POST",
        dataType: "json",
        headers:{
          "Content-Type": "application/json"
        },
        async: false,
        data: JSON.stringify(requestData),
        cache: false
      }
    };

    const nodeUrl = "http://localhost:8099/";
    */
    //添加场景
    ThreeUtil.initScene();
    //设置渲染器
    ThreeUtil.initRenderer("content",'#39609B',window.innerWidth,window.innerHeight);
    //配置相机
    ThreeUtil.initPerspectiveCamera();
    //配置光源
    ThreeUtil.initLight(0xffffff,300,400,200);

    //ThreeUtil.initTransformControls();//初始化TransformControls物体控制器
    //ThreeUtil.createPlugboard();

    //初始化地面
    var floorWidth = 800;
    var floorDepth = 600;
    ThreeUtil.initFloor(floorWidth,2,floorDepth);

    var objs = [];
    var cabs = [];
    var servers = [];
    var switchs = [];

    initCabinetData();

    //初始化机柜，并且时刻警惕类型安全牌
    function initCabinetData() {      
      for(var i = 0; i < cabList.length; i++){
        //机柜
        var cab = {
            positionX: parseInt(cabList[i].positionX),
            positionY: parseInt(cabList[i].positionY),
            positionZ: parseInt(cabList[i].positionZ),
            name: cabList[i].name,
            l: 40,
            w: 30,
            h: cabList[i].uNumber*2+4,//U数*2+上下底座高度
            uNumber: parseInt(cabList[i].uNumber),
            uArr: new Array(parseInt(cabList[i].uNumber)),
            objType: cabList[i].objType,
            deviceMap: new Map(),
            show: cabList[i].show,
            alarmLevel: cabList[i].alarmLevel,
        };
        cabs.push(cab);
        objs.push(cab);
      }

      



      for (let i = 0; i < hostInformations.length; i++) {
        var cabIndex = cabs.findIndex((item) => {
          return item.name === hostInformations[i].cabinet;
        });

       if(cabIndex !== -1){
        var server = {
          //机柜属性
          ip: hostInformations[i].ip,
          cabinet: cabs[cabIndex].name,

          positionX: cabs[cabIndex].positionX,
          positionY: hostInformations[i].uIndex * 2 + 2,
          positionZ: cabs[cabIndex].positionZ,

          data: hostInformations[i],
          name: hostInformations[i].name,
          objType: hostInformations[i].objType,
          uIndex:  parseInt(hostInformations[i].uIndex),
          uNumber: parseInt(hostInformations[i].uNumber),
          show: hostInformations[i].show,
          }
          objs.push(server);
       }

      }

      console.log(objs);
      
      ThreeUtil.initData(objs);//初始化模型数据
      ThreeUtil.initDragControls();//初始化DragControls物体拖动控制器
      initCabinetSelector();
  }

    /**
     * 初始化所属机柜选择框
     */
    function initCabinetSelector(){
        var html = "<option value=''>请选择</option>";
        $.each(cabs,function (index,cab) {
            html += "<option value='" + cab.name + "'>" + cab.name + "</option>";
        });
        document.getElementById("cabinetSelector").innerHTML = html;
    }

    /**
     * 初始化机柜位置选择框
     * @param cab
     */
    function initIndexSelector(cab){
        var html = "<option value=''>请选择</option>";
        $.each(cab.uArr,function (index,cab) {
            html += "<option value='" + (index+1) + "'>" + (index+1) + "U</option>";
        });
        document.getElementById("indexSelector").innerHTML = html;
    }

    ThreeUtil.renderer.domElement.addEventListener('dblclick', onDocumentMouseDown, false);
    function onDocumentMouseDown(event) {
        event.preventDefault();
        //获取鼠标点击到的第一个模型对象
        var currObj = ThreeUtil.getObjByRaycaster(event,true);
        if(!currObj){
            return;
        }

        //如果这个对象是门
        //如果门是关闭的
        //那么打开，并且移动摄像机位置
        //如果门是打开的
        //那么关闭
        if(currObj.objType == 'door'){

            if(currObj.parent.rotation.y == 0){//打开机柜门

                ThreeUtil.openCabinetDoor(currObj.parent);

            }else{//关闭机柜门（同时关闭已打开的服务器和交换机）

                ThreeUtil.closeCabinetDoor(currObj.parent);

            }

        }

        if(currObj.objType == 'server' || currObj.objType == 'switch'){//设备
            var device = currObj.parent;

            if(!device.isOpen){//打开
                ThreeUtil.openDevice(device);
                //显示详情
                showDetail(device);
            }else{//关闭
                ThreeUtil.closeDevice(device);
            }
        }

        if(currObj.objType == 'leftDoor'){
            if(currObj.parent.rotation.y == 0) {//打开门
                //currObj.parent.position.set((floorWidth-100) / 2 - 140,50,floorDepth/2-50);
                new TWEEN.Tween( currObj.parent.rotation ).to({
                    y: -0.5*Math.PI
                }, 1500 ).easing( TWEEN.Easing.Elastic.Out).start();
            }else{
                //关闭门
                //currObj.parent.position.set((floorWidth-100) / 2 - 140,50,floorDepth/2-50);
                new TWEEN.Tween( currObj.parent.rotation ).to({
                    y: 0
                }, 300 ).start();
            }
        }
        if(currObj.objType == 'rightDoor'){
            if(currObj.parent.rotation.y == 0) {//打开门
                //currObj.parent.position.set((floorWidth-100) / 2 - 60,50,floorDepth/2-50);
                new TWEEN.Tween( currObj.parent.rotation ).to({
                    y: 0.5*Math.PI
                }, 1500 ).easing( TWEEN.Easing.Elastic.Out).start();
            }else{
                //关闭门
                //currObj.parent.position.set((floorWidth-100) / 2 - 60,50,floorDepth/2-50);
                new TWEEN.Tween( currObj.parent.rotation ).to({
                    y: 0
                }, 300 ).start();
            }
        }

        ThreeUtil.render();
    }

    //当前鼠标右击的机柜模型
    var selectCabinet = null;
    var selectDevice = null;
    /**
     * 右键机柜顶显示右键菜单
     * @param event
     * @returns {boolean}
     */
    ThreeUtil.renderer.domElement.oncontextmenu = function(event){
        event.preventDefault();
        hideRightMenu();
        //鼠标右键
        if(event.button == 2){
            //获取鼠标点击到的第一个模型对象
            var currObj = ThreeUtil.getObjByRaycaster(event,true);
            if(currObj && (currObj.objType === "door" || currObj.objType === "cabinetBody")){//机柜上右击（不包括机柜中的设备）
                selectCabinet = currObj.parent.parent;
                var obj = selectCabinet.getObjectByName("cabinetBody");
                ThreeUtil.selectObject(obj);//设置选中效果

                showRightMenu(event);
            }else if(currObj && (currObj.objType === "server" || currObj.objType === "switch")){
                selectDevice = currObj.parent;
                ThreeUtil.selectObject(selectDevice);//设置选中效果

                showRightMenu2(event);
            }else{
                ThreeUtil.hideSelect();//隐藏选中效果
            }
        }
        return false;
    };

    /**
     * 鼠标悬浮事件
     */
    ThreeUtil.renderer.domElement.addEventListener('mousemove',onDocumentMouseMove, false);
    function onDocumentMouseMove(event) {
        var currObj = ThreeUtil.getObjByRaycaster(event,true);
        var tooltip = document.getElementById("tooltip");//悬浮提示框
        var nowObj = null;
        if(currObj){
                var tipInfo = "";//提示信息
                if(currObj.objType === "server" || currObj.objType === "switch"){//设备
                    nowObj = currObj;
                    tipInfo = "设备IP：" + currObj.parent.ip;
                    tooltip.style.background = "#ACDEFE";
                    tooltip.querySelector("span").style.borderTop="10px solid #ACDEFE";
                }else if(currObj.name === "spriteAlarm"){//告警精灵（显示机柜中告警级别最高的设备告警信息）
                    nowObj = currObj;
                    tipInfo = currObj.parent.alarmInfo;
                    tooltip.style.background = ThreeUtil.alarmColor["level"+currObj.parent.alarmLevel];
                    tooltip.querySelector("span").style.borderTop="10px solid " + ThreeUtil.alarmColor["level"+currObj.parent.alarmLevel];
                }

                let tiplen=tipInfo.length;
                tooltip.querySelector("#tipDiv").innerHTML = tipInfo;
                tooltip.style.display = "block";//显示
                tooltip.style.width=tiplen*15+"px";
                tooltip.style.left = (event.clientX - tooltip.clientWidth / 2) + "px";
                tooltip.style.top = (event.clientY - tooltip.clientHeight - 15) + "px";
            }

        if(!nowObj){//如果未悬浮在规范的对象上，则隐藏
            tooltip.style.display = "none";
        }
    }

    /*
    function showRightMenu(event){
        var el = document.getElementById('list'); //获取右键菜单
        var x = event.clientX;
        var y = event.clientY;
        el.style.display = 'block';
        el.style.left = x+'px';
        el.style.top = y+'px';
    }
    function showRightMenu2(event){
        var el = document.getElementById('list2'); //获取右键菜单
        var x = event.clientX;
        var y = event.clientY;
        el.style.display = 'block';
        el.style.left = x+'px';
        el.style.top = y+'px';
    }
    */

    /**
     * 隐藏右键菜单
     */
    document.onclick = function(){
        hideRightMenu();
    };

    function hideRightMenu(){
        var mymenu = document.getElementById("list");
        mymenu.style.display = "none";
        mymenu = document.getElementById("list2");
        mymenu.style.display = "none";
    }

    //视角控制器
    ThreeUtil.initOrbitControls();

    ThreeUtil.render();

    var clock = new THREE.Clock();
    function animate() {
        ThreeUtil.selectBox.update();//更新辅助模型（选中效果）
        var delta = clock.getDelta();
        if ( mixer ) mixer.update( delta );
        requestAnimationFrame(animate);//动画持续渲染
        ThreeUtil.render();
    }
    animate();


    function onResize() {
        // aspect表示屏幕长宽比
        ThreeUtil.camera.aspect = window.innerWidth / window.innerHeight;
        ThreeUtil.camera.updateProjectionMatrix();
        ThreeUtil.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    // 浏览器变化时画布自适应
    window.addEventListener('resize', onResize, false);


    var menu ;
    /**
     * 显示详情
     * @param currObj
     */
    function showDetail(currObj) {
        menu = document.getElementById("detail");
        document.getElementById("information").innerHTML = configParam.informationHTML;
        
        document.getElementById("name").innerHTML = currObj.name;
        document.getElementById("ip").innerHTML = currObj.ip;
        Object.keys(requestInformation).map((key) => {
          document.getElementById(key).innerHTML = currObj.data[key];
        })

        //菜单出现后的位置
        menu.style.display = "block";
    }

    function closeDetail(e) {
        menu.style.display = "none"
    }

    //initFBX();
    var mixer;
    function initFBX(){
        var loader = new THREE.FBXLoader();var i = 1;
        loader.load( 'fbx/avg.FBX', function ( object ){//加载路径fbx文件

            //动画
            /*mixer = new THREE.AnimationMixer( object );

            var action = mixer.clipAction( object.animations[ 0 ] );
            action.play();*/

            object.traverse( function ( child ) {
                if ( child.isMesh ) {
                    if(i == 149 ){

                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                    i++;
                }

            });
            object.scale.multiplyScalar(0.005);
            //object.scale.multiplyScalar(20);
            object.position.set(0,15,10);
            object.rotation.y = 1.57;
            ThreeUtil.scene.add( object );//模型

        }, onProgress, onError);
    }

    var onProgress = function(xhr){
        if(xhr.lengthComputable){
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    var onError = function(xhr){
        console.error(xhr);
    };

    //importObj();
    /**
     * 加载OBJ模型
     */
    function importObj(){
        let mtlLoader = new THREE.MTLLoader();
        mtlLoader.load("mtl/obj/guidaodiao.mtl", function(materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.load('mtl/obj/guidaodiao.obj', function(object) {
                object.traverse( function ( child ) {
                    if ( child.isMesh ) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                object.scale.multiplyScalar(0.005);
                object.position.set(0,15,10);
                object.rotation.y = -1.57;
                ThreeUtil.scene.add(object)
            });
        });
    }



    $(function () {

        //打开添加机柜页面
        $("body").on("click"," #addCab",function () {
            $("#addDevice").hide();
            $("#addCabinet").show();
        });

        //打开添加设备页面
        $("body").on("click"," #addDev",function () {
            $("#addCabinet").hide();
            $("#addDevice").show();
        });

        /**
         * 添加机柜
         */
        $("body").on("click"," #save",function () {
            var cabinet = {};
            //这里的数据是要保存到数据库中的数据
            var savedata = {};
            cabinet.name = $("#cabinetName").val();
            cabinet.uNumber = parseInt($("#cabinetU").val());
            cabinet.positionX = parseInt($("#x").val());
            cabinet.positionY = parseInt($("#y").val());
            cabinet.positionZ = parseInt($("#z").val());

            cabinet.h = cabinet.uNumber * 2 + 4;
            cabinet.l = 40;
            cabinet.w = 30;
            cabinet.uArr = new Array(cabinet.uNumber);
            cabinet.objType = "emptyCabinet";
            cabinet.deviceMap = new Map();
            cabinet.show = true;
            cabinet.alarmLevel = "0";

            savedata = {
              positionX: cabinet.positionX,
              positionY: cabinet.positionY,
              positionZ: cabinet.positionZ,
              name: cabinet.name,
              uNumber: cabinet.uNumber,
              objType: cabinet.objType,
              show: cabinet.show,
              alarmLevel: cabinet.alarmLevel
            } 

            /*
            setting = mysqlHead(savedata, nodeUrl + "addCab");
            $.ajax(setting);
            */

            ThreeUtil.initAddObject(cabinet);//保存并添加机柜至场景
            cabs.push(cabinet);
            initCabinetSelector();//重新加载机柜选择下拉框
        });

        $("body").on("click"," #reflush",function () {
            ThreeUtil.controls.reset();//还原相机至初始值
        });

        $("body").on("change"," #cabinetSelector",function () {
            var cabNumber = $(this).val();
            if(!cabNumber){
                $("#indexSelector").html("<option value=''>请选择</option>");
                return;
            }
            var cab = ThreeUtil.scene.getObjectByName(cabNumber);


            initIndexSelector(cab);
        });

        $("body").on("click"," #add",function () {

            var objType = $("#deviceType").val();
            var positionY;
            var uNumber;
            if(objType == "server"){
                positionY = $("#indexSelector").val()*2 + 2;
                uNumber = 2;
            }else if(objType == "switch"){
                positionY = $("#indexSelector").val()*2 + 6;
                uNumber = 6;
            }

            var serverInfo = {
                name : $("#deviceName").val(),
                objType : objType,
                cabinet : $("#cabinetSelector").val(),
                uIndex : parseInt($("#indexSelector").val()),
                positionY: positionY,
                uNumber: uNumber,
                show: true,
                alarmLevel: $("#alarmLevelSelector").val(),
                alarmCause: $("#alarmCause").val(),
                ip: $("#deviceIp").val(),
            };

            var saveData = {
              cabinet: serverInfo.cabinet,
              name: serverInfo.name,
              objType: serverInfo.objType,
              uIndex: serverInfo.uIndex,
              uNumber: serverInfo.uNumber,
              show: serverInfo.show,
              ip: serverInfo.ip,
            } 
            /*
            setting = mysqlHead(saveData, nodeUrl + "addServer");
            $.ajax(setting);
            */
            //校验名称是否已存在
            if(ThreeUtil.checkNameIsAlreadyExists(serverInfo.name)){//修改
                if(ThreeUtil.addDeviceToCabinetUArr(serverInfo)){//更新设备在机柜uArr中的位置
                    //获取设备模型对象并赋予新的值
                    let device = ThreeUtil.scene.getObjectByName(serverInfo.name);
                    device = $.extend(device,serverInfo);

                    device.position.y = positionY;//更新设备3D模型位置
                    ThreeUtil.updateDeviceMaterial(device);//根据告警更新设备材质
                    ThreeUtil.updateCabinetAlarm(ThreeUtil.scene.getObjectByName(device.cabinet));//更新机柜告警状态
                }else{
                    alert("修改失败");
                }
            }else{//新增
                if(ThreeUtil.addDevice(serverInfo)){
                    //ThreeUtil.alarmPlay(ThreeUtil.getAlarmInfo());//播放告警语音
                    alert("添加成功");
                }else{
                    alert("添加失败");
                }
            }


        });

        var editFlag = false;
        $("#editCabinetIndex").click(function () {
            if(editFlag){
              /*
                var savedatas = []
                ThreeUtil.objects.map((item) => {
                  savedatas.push({
                    positionX: item.position.x,
                    positionY: item.position.y,
                    positionZ: item.position.z,
                    name: item.name,
                    uNumber: item.uNumber,
                    objType: item.objType,
                    show: item.show,
                    alarmLevel: item.alarmLevel
                  })
                })
                setting = mysqlHead(savedatas,nodeUrl + "updateInformation"); 
                $.ajax(setting);
                */
                ThreeUtil.dragControls.dispose();
                editFlag = false;
                ThreeUtil.enableSprite(true);
                $(this).text("打开编辑模式");
            }else{
                ThreeUtil.dragControls.activate();
                editFlag = true;
                ThreeUtil.enableSprite(false);//开启拖拽控件时需要隐藏精灵模型（精灵模型会导致拖拽有误）
                $(this).text("关闭编辑模式");
            }
        });


        $("#speak").click(function () {
            ThreeUtil.alarmPlay(ThreeUtil.getAlarmInfo());
        });
        //$("#speak").click();

        //删除设备
        $("#deleteDevice").click(function () {
            ThreeUtil.deleteDevice(selectDevice);
            ThreeUtil.alarmPlay(ThreeUtil.getAlarmInfo());
            ThreeUtil.hideSelect();
        });

        //编辑设备
        $("#editDevice").click(function () {
            $("#deviceName").val(selectDevice.name);
            $("#deviceType").val(selectDevice.objType);
            $("#cabinetSelector").val(selectDevice.cabinet);
            $("#alarmLevelSelector").val(selectDevice.alarmLevel);
            $("#alarmCause").val(selectDevice.alarmCause);
            initIndexSelector(ThreeUtil.scene.getObjectByName(selectDevice.cabinet));//渲染机柜U数选择框
            $("#indexSelector").val(selectDevice.uIndex);
        });

        var searchKey = "";//搜索关键字
        var deviceArr = [];//搜索结果
        var index = 0;//下标
        /**
         * 循环查询设备
         */
        $("#search").click(function () {
            var deviceIp = $("#serachIp").val().trim();//用户当前输入

            if(!deviceIp){
                return;
            }

            if(searchKey != deviceIp){//更改了查询关键字
                searchKey = deviceIp;//更新查询关键字
                deviceArr = ThreeUtil.findDeviceObjByField("ip",searchKey);//查询

                if(!deviceArr || deviceArr.length < 1){
                    alert("未找到设备");
                    return;
                }

                index = 0;//下标重置
            }else{//跟上次查询一致
                index++;//下标迭代
                if(index == deviceArr.length){//下标越界，重置下标
                    index = 0;
                }
            }

            for(;index < deviceArr.length;){
                ThreeUtil.goToDevice(deviceArr[index]);//
                showDetail(deviceArr[index]);
                break;
            }
        });

    });