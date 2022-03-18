ThreeUtil = {
    renderer:{},//渲染器
    camera:{},//相机
    scene:{},//场景
    light:{},//光源
    controls:{},//视角控制器
    transformControls: {},//物体操作工具
    dragControls:{},//拖拽控件
    raycaster: new THREE.Raycaster(),//射线工具
    vector3: new THREE.Vector3(),
    objects:[],//存放模型数据
    devices: new Map(),//存放设备模型
    alarmColor:{//告警级别颜色
        level1:"#fcff00",
        level2:"#ff8d00",
        level3:"#ff0000",
    },
    alarmDeviceMap: new Map(),//告警设备
    selectBox: new THREE.BoxHelper(),//辅助对象（选中效果）
};

/**
 * 初始化渲染器
 * @param domElementID 节点ID
 * @param color 背景色
 * @param width 画布宽度
 * @param height 画布高度
 */
ThreeUtil.initRenderer = function (domElementID,color,width,height) {
    this.renderer = new THREE.WebGLRenderer({
        antialias:true//抗锯齿:true
    });
    this.renderer.setSize(width,height);//画布尺寸
    this.renderer.setClearColor(color);//背景色
    document.getElementById(domElementID).appendChild(this.renderer.domElement);
};

/**
 * 初始化相机（透视相机）
 */
ThreeUtil.initPerspectiveCamera = function () {
    this.camera = new THREE.PerspectiveCamera(50,this.renderer.domElement.width/this.renderer.domElement.height,0.1,2000);
    this.camera.position.set(0,500,500);//左右，上下、前后视角
    /*camera.lookAt({
        x : 100,
        y : 1000,
        z : 0
    });*/
};

/**
 * 初始化场景
 */
ThreeUtil.initScene = function(){
    this.scene = new THREE.Scene();
    //添加坐标轴
    //this.scene.add(axes = new THREE.AxisHelper(100));
    this.scene.background = new THREE.Color(0x225F93);
};

/**
 * 初始化光源
 * @param color 光源颜色（十六进制）
 * @param x
 * @param y
 * @param z
 */
ThreeUtil.initLight = function (color,x,y,z) {
    let light = new THREE.AmbientLight(0xcccccc);
    light.position.set(0, 0,0);
    this.scene.add(light);
    let light2 = new THREE.PointLight(0x555555);
    light2.shadow.camera.near =1;
    light2.shadow.camera.far = 5000;
    light2.position.set(0, 350, 0);
    light2.castShadow = true;//表示这个光是可以产生阴影的
    this.scene.add(light2);
};

/**
 * 初始化视角控制器
 */
ThreeUtil.initOrbitControls = function () {
    this.controls = new THREE.OrbitControls(this.camera,document.getElementById("content"));
    this.controls.addEventListener('change',this.render);

    this.controls.autoRotate = true;
    this.controls.keys2 = {};//禁用WASD键移动相机
    this.controls.noKeys = false;//不使用键（W、A、S、D键，上下左右键）移动相机
    this.controls.noPan = false;//不使用相机水平移动
    //controls.noRotate = true;//不使用相机垂直移动
    //controls.noZoom = true;//不使用相机缩放
    this.controls.maxDistance = 1000;//相机最远距离(只能用在PerspectiveCamera)
    this.controls.minDistance = 50;//相机最近距离(只能用在PerspectiveCamera)
    this.controls.maxAzimuthAngle = 1.5;//水平旋转，范围-Math.PI~Math.PI 或者Infinity 默认Infinity
    this.controls.minAzimuthAngle = -1.5;//水平旋转，范围-Math.PI~Math.PI 或者-Infinity 默认-Infinity
    this.controls.maxPolarAngle = 1.5;//垂直旋转，范围0~Math.PI 默认Math.PI
    this.controls.minPolarAngle = 0;//垂直旋转，范围0~Math.PI 默认0
};

/**
 * 初始化TransformControls物体控制器
 * @param cabinet
 */
ThreeUtil.initTransformControls = function(cabinet){
    let _this = this;
    _this.transformControls = new THREE.TransformControls( _this.camera, _this.renderer.domElement );
    _this.transformControls.addEventListener( 'change', _this.render );

    _this.transformControls.addEventListener( 'dragging-changed', function ( event ) {
        _this.controls.enabled = ! event.value;
    } );
    _this.transformControls.setMode( "translate" );//移动模式
    _this.transformControls.showY = false;
    _this.transformControls.setSize(0.4);
};

/**
 * 在物体上打开TransformControls物体控制器
 * @param cabinet 模型对象
 */
ThreeUtil.openTransformControls = function(cabinet){
    this.transformControls.attach(cabinet);
    this.scene.add(this.transformControls);
};

/**
 * 在物体上关闭TransformControls物体控制器
 */
ThreeUtil.closeTransformControls = function(){
    this.transformControls.detach();
    this.controls.enabled = true;
    this.scene.remove(this.transformControls);
};

/**
 * 初始化拖动物体控制器
 */
ThreeUtil.initDragControls = function(){
    let _this = this;
    _this.dragControls = new THREE.DragControls( _this.objects, _this.camera, _this.renderer.domElement );
    //_this.dragControls.transformGroup = true;//true：拖动上面传入的objects  false(默认)：拖动鼠标射线获取到的第一个模型对象
    _this.dragControls.addEventListener( 'drag', _this.render );
    // 开始拖拽
    _this.dragControls.addEventListener('dragstart', function (event) {
        _this.controls.enabled = false;//进行拖拽时，关闭视角控制器
    });
    // 拖拽结束
    _this.dragControls.addEventListener('dragend', function (event) {
        _this.controls.enabled = true;//拖拽结束，打开视角控制器
        console.log(_this.objects)
    });
    _this.dragControls.dispose();//初始化时设为关闭拖动状态
};

/**
 * 初始化地面
 * @param floorWidth地面宽度
 * @param floorHeight地面高度
 * @param floorDepth地面长度
 */
ThreeUtil.initFloor = function(floorWidth,floorHeight,floorDepth){
    let floorTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/floor.jpg', ThreeUtil.render);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;//两个方向都重复
    floorTexture.repeat.set(14,10);//两个方向上的重复数

    let geometry = new THREE.BoxGeometry(floorWidth,2,floorDepth);
    let material = new THREE.MeshLambertMaterial({
        color:0xffffff,
        map:floorTexture
    });
    let floor = new THREE.Mesh(geometry,material);
    floor.position.set(0,-1,0);
    this.scene.add(floor);

    //初始化墙壁
    this.initWall(floorWidth,floorDepth);
};

/**
 * 根据地面长宽初始化墙壁
 * @param floorWidth地面宽度
 * @param floorDepth地面长度
 */
ThreeUtil.initWall = function(floorWidth,floorDepth){
    //墙壁贴图
    let fwallTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/wall.png', ThreeUtil.render);
    fwallTexture.wrapS = fwallTexture.wrapT = THREE.RepeatWrapping;//两个方向都重复
    fwallTexture.repeat.set(14,10);//两个方向上的重复数

    let wall1Width = floorWidth - 200;//前后墙长度
    let wall2Width = floorDepth - 200;//左右墙长度
    let wallThickness = 8;//墙厚度
    let wallHight = 120;//墙高

    //墙结构（四面墙）
    let geometry1 = new THREE.BoxGeometry(wall1Width,wallHight,wallThickness);//前
    let geometry2 = new THREE.BoxGeometry(wallThickness,wallHight,wall2Width);//右
    let geometry3 = new THREE.BoxGeometry(wall1Width,wallHight,wallThickness);//后
    let geometry4 = new THREE.BoxGeometry(wallThickness,wallHight,wall2Width);//左

    let material = new THREE.MeshLambertMaterial({
        color:0xb0cee0,
        map:fwallTexture
    });

    //前面的墙
    let wall1 = new THREE.Mesh(geometry1,material);
    wall1.position.set(0,60,wall2Width/2);
    let wall1Bsp =  new ThreeBSP(wall1);

    //左边的门
    let leftDoorTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/door_left.png', ThreeUtil.render);
    let leftDoorMaterial = new THREE.MeshLambertMaterial({
        color:0x51443e,
        map:leftDoorTexture,
        transparent: true,
    });
    let leftDoor = new THREE.BoxGeometry(40,100,1);
    let leftDoorMesh = new THREE.Mesh(leftDoor,leftDoorMaterial);
    leftDoorMesh.objType = "leftDoor";
    leftDoorMesh.position.set(20,0,0);
    let leftDoorGroup = new THREE.Group();
    leftDoorGroup.add(leftDoorMesh);
    leftDoorGroup.position.set(wall1Width / 2 - 140,50,wall2Width/2);
    //右边的门
    let rightDoorTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/door_right.png', ThreeUtil.render);
    let rightDoorMaterial = new THREE.MeshLambertMaterial({
        color:0x51443e,
        map:rightDoorTexture,
        transparent: true,
    });
    let rightDoor = new THREE.BoxGeometry(40,100,1);
    let rightDoorMesh = new THREE.Mesh(rightDoor,rightDoorMaterial);
    rightDoorMesh.objType = "rightDoor";
    rightDoorMesh.position.set(-20,0,0);
    let rightDoorGroup = new THREE.Group();
    rightDoorGroup.add(rightDoorMesh);
    rightDoorGroup.position.set(wall1Width / 2 - 60,50,wall2Width/2);

    //初始化植物花
    /*for(let i = 0; i < 2; i++){
        this.initObjPlant((leftDoorGroup.position.x - 25)+i*135,0,leftDoorGroup.position.z + 30);
    }*/

    //窗沿
    let windowsillMaterial = new THREE.MeshLambertMaterial(0x808080);
    let windowsillBox = new THREE.BoxGeometry(200,5,wallThickness+4);
    let windowsillMesh = new THREE.Mesh(windowsillBox,windowsillMaterial);
    windowsillMesh.position.set(-wall1Width/2+150,30,wall2Width/2);
    //窗玻璃
    let glassTextur = THREE.ImageUtils.loadTexture(ipAddress + 'img/glass.jpg', ThreeUtil.render);
    glassTextur.wrapS = glassTextur.wrapT = THREE.RepeatWrapping;//两个方向都重复
    glassTextur.repeat.set(14,10);//两个方向上的重复数
    let glassMaterial = new THREE.MeshLambertMaterial({
        map:glassTextur,
        transparent: true,
        opacity: 0.2
    });
    let glassBox = new THREE.BoxGeometry(200,60,1);
    let glassMesh = new THREE.Mesh(glassBox,glassMaterial);
    glassMesh.position.set(-wall1Width/2+150,60,wall2Width/2);

    //门洞
    let doorway = new THREE.BoxGeometry(80,100,wallThickness);
    let doorwayMesh = new THREE.Mesh(doorway);
    doorwayMesh.position.set(wall1Width / 2 - 100,50,wall2Width/2);//门洞位置
    let doorBsp =  new ThreeBSP(doorwayMesh);

    //窗户洞
    let windowHole = new THREE.BoxGeometry(200,60,wallThickness);
    let windowHoleMesh = new THREE.Mesh(windowHole);
    windowHoleMesh.position.set(-wall1Width/2+150,60,wall2Width/2);
    let windowBsp = new ThreeBSP(windowHoleMesh);

    //使用ThreeBSP，前面的墙模型减去门洞模型，再减去窗户洞模型，得到一个用有门洞和窗户洞的墙
    let result = wall1Bsp.subtract(doorBsp);
    result = result.subtract(windowBsp);

    result = result.toMesh(material);//转成模型并添加材质

    let wall2 = new THREE.Mesh(geometry2,material);
    wall2.position.set(wall1Width/2-(wallThickness/2),60,0);
    this.initTV(wall1Width,wallThickness);

    let wall3 = new THREE.Mesh(geometry3,material);
    wall3.position.set(0,60,-wall2Width/2);

    let wall4 = new THREE.Mesh(geometry4,material);
    wall4.position.set(-wall1Width/2+(wallThickness/2),60,0);

    this.scene.add(result,wall2,wall3,wall4,leftDoorGroup,rightDoorGroup,windowsillMesh,glassMesh);
    //创建空调模型
    this.initAirCondition(wall1Width,wall2Width,wallThickness);
};

/**
 * 创建空调模型
 */
ThreeUtil.initAirCondition = function(wall1Width,wall2Width,wallThickness){
    let material = [];
    material.push(
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
              ipAddress + 'img/aircondition.png',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        }),
        new THREE.MeshBasicMaterial({color:0xffffff})
    );

    let geometry = new THREE.BoxGeometry(40,100,30);
    let mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(wall1Width / 2 - 30 - wallThickness,50,-wall2Width / 2 + 25 + wallThickness);
    mesh.rotation.set(0,-0.5,0);
    this.scene.add(mesh);
};

/**
 * 电视
 * @param floorWidth
 */
ThreeUtil.initTV = function(wall1Width,wallThickness){
    let material = [];
    material.push(
        new THREE.MeshBasicMaterial({color:0x000000}),
        new THREE.MeshBasicMaterial({color:0x000000}),
        new THREE.MeshBasicMaterial({color:0x000000}),
        new THREE.MeshBasicMaterial({color:0x000000}),
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
                ipAddress + 'res/tv.jpg',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        }),
        new THREE.MeshBasicMaterial({color:0x000000})
    );

    let geometry = new THREE.BoxGeometry(200,80,3);
    let mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(wall1Width/2-wallThickness,60,0);
    mesh.rotation.set(0,-1.57,0);
    this.scene.add(mesh);
};

/**
 * 初始化植物花
 * @param x
 * @param y
 * @param z
 */
ThreeUtil.initObjPlant = function(x,y,z){
    let _this=this;
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.load("plant/plant.mtl", function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load('plant/plant.obj', function(object) {
            object.traverse( function ( child ) {
                if ( child.isMesh ) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            object.scale.set(0.05,0.05,0.05);
            object.position.set(x,y,z);
            _this.scene.add(object)
        });
    });
};

/**
 * 渲染
 */
ThreeUtil.render = function () {
    TWEEN.update();
    ThreeUtil.renderer.render(ThreeUtil.scene,ThreeUtil.camera);
};

/**
 * 初始化模型数据
 * @param list 模型数据集合
 */
ThreeUtil.initData = function (list) {
    if(list && list.length>0){
        for(let i=0;i<list.length;i++){
            this.initAddObject(list[i]);
        }
    }
    this.initCabinetAlarm();
    this.scene.add(ThreeUtil.selectBox);
};

/**
 * 初始化机柜告警
 */
ThreeUtil.initCabinetAlarm = function(){
    this.objects.forEach((obj,index)=>{
        this.updateCabinetAlarm(obj);
    })
};

/**
 * 更新机柜告警
 * @param cabinet
 */
ThreeUtil.updateCabinetAlarm = function(cabinet){
    let _this = this;
    cabinet.alarmLevel = "0";//先将机柜告警等级设为正常
    //比较机柜中设备的告警级别
    cabinet.deviceMap.forEach(function (value,key) {
        if(value.alarmLevel > 0){
            _this.alarmDeviceMap.set(value.name,value);//存储发生告警的设备
            if(cabinet.alarmLevel < value.alarmLevel){//获取机柜中设备的最高告警等级
                cabinet.alarmLevel = value.alarmLevel;
                cabinet.alarmInfo = "告警设备：" + value.ip +"<br>告警原因：" + value.alarmCause;
            }
        }else{
            _this.alarmDeviceMap.delete(value.name);//从告警设备map中删除未告警的设备
        }
    });

    cabinet.remove(cabinet.spriteObj);//移除之前的告警精灵图标
    if(cabinet.alarmLevel > 0){
        let sprite = this.createAlarmIcon(cabinet);//创建新的告警精灵图标
        cabinet.spriteObj = sprite;//保存告警精灵图标到机柜对象上（方便操作）
        cabinet.add(sprite);//加入机柜子对象数组（会自动渲染到画布上）
    }
};

/**
 * 创建一个告警精灵图标
 * @param obj 所属机柜
 * @returns {Sprite} 告警精灵图标对象
 */
ThreeUtil.createAlarmIcon = function(obj){
    let url="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE0AAABrCAYAAAAy/A+bAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/sl0p8zAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAABoKSURBVHja3F17jFxXff7O4z7n6fXa3uw6TuI81KiYFhRIpKA2iVBBaUNRvQlxSloQpNSiKaUgolR1wBRKCrRNWilIkIQKFSIcLw0EQitEmgImJXJL3ZgQk7h1nX16Z3fnPfd9+8fec3PmzJ31PmY3gSNdzezOzH189/f4fo9zLonjGFljYmICWzhyAC4GcAkAC8A2ACYAB4ALoA1gHsAUgDMA/M0+of379/f9jGPrRw7ArwG4lhDyRsbYaxljuwghIIQAAOI47novXpMtiKLohSiKfhzH8b8D+FcAJ7fyArYKtBKAmwkhN2uadh1jTBegyMD0AalrI4RwSumVjLEroyi6LfnuZBiGXwdwBMD3ft5Bu4YQ8j5N025hjNmU0hQQSmkqTYQQRFGEKIq6fkwI6ZI68XcYhoiiCGEYin3tZoy9H8D7oyh6Po7jhwE8BGDx5wm06wkhh0zTvF6AE8cxGGMpaEEQdF14lrTJ4KnvCSHQdR2UUvi+jyAIEAQBOOe/RCn9dBzHh4IgeIAx9jcAzr2aQXsNIeTvDcO4jnOeXhylFHEcpxcXRVGXyp1v9ANRSCYhBJxz6LqOMAzhui4AFDjndwG4MwzDexljnwXQeTWBVgDwSV3XD+q6zgGk6hcEAVzXTSVKVUEB4GqHAEzcCPE/oeKEENi2jTAM0el0AMDmnH88iqJ3x3H8x4yxb74aQLuGMfaPhmFcyhhLL0BIlbA/MmDiYsMwhOd56XdkAMV3BfhCYiml0DQNmqZ1qaqwl7IdzOVyCMMQzWYTjLFLOOePB0HwBUrpBymlrVcCNALgz3Rd/5iu61zYLN/34XleFwiyOnqeB9/34fs+wjBEu92G4zjodDpwXTcFOgxDiJvAGIOmaTBNE5ZlIZfLwTAMUErBOYdhGOCcd0mhDF6xWITrunAcB5zzOwgh14dh+DuMsWe3EjSLEPJF0zTfwRhL77LjOPB9vwcsoaK+78N1XSwtLaFWq6FaraYqtZYRxzEsy0KhUMD27dtRKBRS6TNNMwVLgEcpha7r0DQN9XodYRhepmnaD+M4fifn/OtbAdp2Qsi3Lct6gzDAQrqCIOgBSwBZq9UwNzeHpaWlLvskHIaQkH5DtYVCcs6dOwfTNDE0NISRkRG4rgvDMGAYRuqxwzBMASyXy2g0Guh0Onld178WRdGHOOf3rXTsjYK2kzH2HcMwXitUw3XdVB0FhwrDEI7jwPM8LC4uYnp6Gq1Wq8f+yHYoCzj5uzJosucVdnFmZgazs7MYHh7G2NgYLMuCYRgwTbPH9uXzeTiOg1arRXVd/9s4ji1N0z61WuDWAtoOxthTpmleCQCMsVSKZGPvui5c10Wr1cKZM2dQq9Ugvi+DJNsfSmn6uaxWqtqqNEXcIHmbn59HpVLB6OgoRkdHEYYhTNMEYwyMsdQcmKYJSilqtRp0Xf/LKIqoruufFFxyEKDZhJDHDcO4EgA45+h0OinnEiTVcRy4rovJyUlMTU11gSVAEJsw7uJi5O/JxlzlairHE8cWDkRI/fT0NBYWFnDppZeiVCrBNE3oup4eGwB0XUe5XMbS0hJ0Xf8LAGd0Xf/y+YDjq/SSj5imebU4oAyYuMOdTgftdhunT59GrVbrAUtIFOc8BYxznv5fBanfkFVIlbg4jmEYRuqdfd/Hc889h4suuggjIyOIogimaaY2TtCXUqmExcVFYhjGw4SQGULIkxsF7S7Lst4mAHMcpwsw3/fhOA7q9TpOnToFz/NSwGTQdF1PWbsArh9QWWqZ9ZmQNrE/8Z5zDk3TUm89NTWFVquFvXv3IooiWJbVdRMMw0CxWES9XtcBHKGUvg7AS32l6Dz5tGt1XX+KL4+UNqiALS0t4YUXXkAURV1gCbXTNA26rkPX9S7bNoihZkWECotz9DwPnufBdV3k83ns3bsXtm3DsqwuDSCEoFarodVqwTTNH9i2fd2tt94aZkr7SqERY+zLjDEuB8WyDXFdF7VaDadOneoCTBh2TdNgWVZ6kpqm9TiDQW1ZN0vXdZimCdu2Ydt2aj4EmVaJd6lUAmMMruu+qdPp/HlfE7ECaPdqmnaRYNYi3BGe0nVdNBoNnDp1qsvgC8AMw4BlWbAsK81GqJ5zEEPen0poBQ8UpNe2bbiuizNnzsDzPDiO0+ORh4eHhYTe/aUvfemKVYM2MTFxlaZp7xN3TQ6LAMDzPHQ6HTz//POIoqgLMPkEZekaNFj9wOsneSLcsiwLnU4H09PTKSmX01OMMZTLZXieZ3Q6nc995StfIatyBISQT1NKGaW0Z6eCzJ4+fRpBEKSAiRPTdR22bXep4lYPOXUkczP55lWrVeTzeQwNDUGmGIL8tlot+L5/g+M4NwH4xoqOYGJi4npd15+UvaVKLaampnD27NkULBUwwYfOFxpt5pAzKmoEIRKWnufhiiuugGVZKQEW5+z7PqampmAYxolCofC622+/Pe6rnoSQjwsbJTylOAHf99Fut3sAE0ZXACar6ys1ZPuqkmpBSzjnmJ6eRhRFaWQjhqZpsG0bvu//SqfT2d/Xpk1MTLyBc/4mORcv7pYgi2fOnOmxF8JLCcBebUMGTgZU0zR0Oh00m82uJKnQvm3btiGKInie96GVHMFBWTzlnFgQBKhWq2g0Gl0H5Zz3ALYR6lAqlbBnzx5ceOGF2L17N3bs2NGToV3rJgOXxSFnZ2cBIM3SiONJ0nbN5z//+Tf2OIKJiYltjLFb5dBELoKEYYjp6en0wEIFTdOEYRjQdT2Tza9lvP71r8cNN9zQ8//Z2Vk8+OCDXdRlvRIn1xVkLarX6yiVSl0ZZkopisUims0mHMd5L4BnVEm7iRBiUUoRBEHXwUTKuNlspictuJhhGGnqeaOUQgCvjpGREdRqNfi+v2E6ooZ3wsYtLCyAEJKqqQDUNE1omoYgCMYfeughXQXt7XLSTq0vzs3NZTLuraIWjuN0Ger1gieDJoMnQsKsEC2fzyOKom2O41yXgjYxMWFRSt+qxnBCz4MgwNLSUpdqilhSzrxu5lhtuW+14Mk2TrwXuT+VsuRyOXHjbpRt2huTvH9PyjqKIlSr1bQqLrPrQdix9ajYIGmJuC5KKer1Oi644II0jpbpB6UUURT9egpaFEXXCjslOwDxWqvV0rsjFyk240KyRlK/HMix5DYHkU4SAIokhG3bXRGFKAfW6/V9DzzwQIkmP3iduhPhAKIoQrPZ7EkkipLZVkiZINODOJYa4MsOgnOOdrsNtYNJVL/iOGau6+4T6vnLWXYjiqK0QCLXIIXr34yMRb//iyzvII4npE2oplxGbLfbmclPTdOEIL2GT0xMaAAul7mZbAQdx+kymrLHlKtFmwVaHMeIJHs6qOMJ4i6He+J6ZUlMCW2iWVEUXUkBjArbltW5kzSTdEUBagluUKNer2cABkQD8por9YXI/SBqjVWk0ZPPL+EAdvcryIpUkMxx1DhukOrZaDRetqdRjBgxwihCpPSoDcpzCrVU9+15XpczEF5W13UEQbCbh2E4KnQ2K9/u+35XzkwlhpvBx5alaxmsKIoRhvGmSVlWaVEVHllF4zge5QCKAvGsL8uxmuBoqrQN8kIiLAMWRomURTGiONqUVLmQNpmzqbREjV3jOLY5AFvOImSxbtklZ2UQBogaoihCECagxUmrQ3IRm+GtVTWV+9yEd1VAK/A4jnP9xFG1IZvOyeIYYRQjSKQrSqRtcWFxyzihKtFZNVcex7HfL6ZTg1o1QzBwzJKTDKNw2REkUlZdWtwUG6p2VQqpW4kVxHEccACLsi5nGT/VLW+m5C3bsmUJEyBCCuG2oqKVlYSQ8mxVDmBGTm2rOxFMuB/NGOhFEJI4AQkwAHSFTqKNeOl+Q9hu9TtJsXyBEkLOytGA6oblvgfZMG6Gii4tLCzTDInyUEJAN0G6Vjp30ZraowVhCELIS1wGTS2KiOysfAAR+W+GpAVBAIKXpZkRAkYp2IBvVD+GIAhsFtEX0VEcx/9Hb7nlliaAKVnSZAoimHG/A8kh1kY3xhhAlqWLUwqNM+icgTM6sGOoM2XU+Nm27S7PKYPn+z4IIado8uNn5bqAfEc557Btu6tRRAVskIOCQGMMutg4AyUDPoYUoKvA5HK5noq7ACwhvc+KszkRBEEPAKJmUCqVBp5y7us9Qx8aY9D48sYpxdLS1vE0y7JSCiJfq+hnoZT+F0+k5piwKUKEhboyxlAsFjE3N5emwlcKNTY6Jo4cwa5du8AZBxDjxRdfxOTkJMrl8qbm7kQXpWEYmUyi0+kgiqL/PXTo0CxPgPkhpTT2fZ8YhtGz43w+D8MweoxjVnf2RofrODj1/PPp1CBCCIaGhmBZVtcEi0EVaWRpKpVK4Jx3CYcY7XYbQRAcWzYhAA4cOLBAKT3heV6PXQvDEJxzbN++fTkuTBr7sjzMIJrzbNvG5Zdfjje/+c24+uqrsXfv3vSmZTU8r7XSroIhA1gqlVIvqqb9XdcFpfRJuRoFAP/suu6vFgqFTCB27tyJSqWSdt2o9m8QEpDP57F///6eovFTTz2FkydPdnUjbTRrqzq0crks8mU9oCU115hS+i+ppCUq+oTwEqpXDIIAmqZh586d8DyvR7RVr7rebd++fZlV9muuuQaNRiNV1/VIWD/wRGF8+/btXekheSQNMicOHTo03QUa5/wYY2xWlMtU0iekTQCrTjnsV+VZyzY0NJR5caZpCpuyLsD61R7Eq5hnIGiFanZarRbCMDz6Mi1KxoEDByJK6dfk0rxM/nzfh67rGB0dTZuW1QNs1KOuRGdkW7rRcEkuHBFCsGvXrq76gHweSUckGGOP9oCWSNsjoiKT5R2jKMLw8DA0TeuaoykXIzbC4+QawSDT52onpDyHa2RkBJqmpWZHvTGNRgNBEPzHPffc87N+oB1jjJ2SVVQWcVFkufjii9MmP9V9q0Z0LaokOsXV8cwzz/SdLrRaT6m2vwNAoVDA0NBQpoQJr5mo5he7oxZp3HbbbTHn/B8ER1LzaAI40zQxNjbWI21ZgK1lzM3N4ciRI3j66adx+vRpnDx5Eo899hieeOKJlKdtRO3lsIkxhrGxMRBCuqRMlrRmswnP8zqMsUe6hEs9gK7rDzqO87FOp2Pk8/keiRFzCMrlMlzXRb1eT4mvHNOtJ+fGOcfS0hImJyfT6USCu6kN0Ku1jTJQYiOE4MILL0wnxsmeVN7/0tISfN8/cvjw4cW+kgYAt99+e4Vz/lXZvqiiLybEjo6Oolgspmoqt873Y93nm3Wi6zpKpRK2b9+OHTt2YMeOHdi2bRts2+5pOs6iFVlSpS5lsWfPHti2nU6+kCVM3Ph2uy3M0d/1JhWyk3D3iR/KO5JVVXiVsbGxdIK9fHKquq7WQYhSoZgoIToRV5NNUac3qk4qiiLs2bMHuVwubfWXz1mVsiAIvn/48OH/XBVo73rXu37MGPvOStJGCEGj0YDv+9izZw8KhUIKnDx5X7V3a11SYlXFZWX//baLL74YhUIhXWBABkwWDjHJNwzDT2enr/oMXdf/SsxB7ydtwHL/heu62L17N3bu3Nklaf1WTMhS4fVSiCyw5MmzwuhfdtllyOfz6HQ6qTmRuZ8sZYuLi/B9/yTn/FuZtneFPPl3Hcf5Qa1We5Npmn1L+XEcixUIMDw8jHw+j7Nnz2YmLbNWRlALGCux95UyFbIEy9PDi8Uidu/enXpDWSVlwIRQeJ4nQrZPHD58OF4TaLquwzCMj7bb7e86jpPO+RazcuUeL5k5Dw0N4YorrsDs7Gy6MoL4br95Bv0AXIk6ZPFCGSxKKXbv3i0mh6HdbnfNiRCACecixsLCAnzfPylHAKsGLTHGTzqO82S1Wr1hZGRkRWkTd6lSqaBQKGBsbAzDw8OYmppKvZR8V+OMVoOVwrCVkgQqOR0eHsYFF1yQMno5ppQlTJ4LJWxZImWHDh8+HK0ZNFHKMk3zrlar9Uyr1SK5XK5L2rIuRnSCdzodbNu2DZdffjlarRZmZ2dTbywvNqKmaFYLWtYiTzt27MDw8HDKv4SHlCeSyUZflfRKpQLf948xxh5bkU+u9CFjDKZpHncc56u1Wu1W0RouGprlBhKVUDqOg7m5OViWhXK5jMsuuwy+72NhYUGQxq5UjwpYv/U4VLUUoZBIIDqOg0aj0QWWLGFyw7V8nFarhWazGYdh+BG51rtm0IRtsyzrrnq9/rZqtWqXy+W+FEQFTsRurutC0zQUCgWMjIxgbGwsnchVr9fTpSlk0PpNtBDTuwuFAgqFQnoDm81mV8pKBUtufZd70cSYn5+H7/uPcM5/KMqW6wYtsW1nNU37bL1evyefz6dNw+JEVKcgv5fnVonlczRNQy6Xw9DQEIaHh1NplVe4EqCJY4m1hGSD32q1ulafkT8TPDGLZ6pEOTEn7SiK7hYh24ZAE9KWy+Xurdfrty8sLFyya9euTKcgN8mpwKmTVD3PS+cnyLNgxMw+UeARFy9LkqquMjeUDf1KgAkp830flUoFnud9Qtf1syIK2TBoibR1NE27s9PpfLPdbsO27R6nIDfDrURM5eBYrnyLwk5WIbqfbZPVL6uYLXvsfsbf87yfMsb+2jRN5HK5vhPb1gSaUJN8Pv+tIAgerVQqN4+NjXVxnCzbtloAs/bRrzaZRTlW4nb9EgOC7Nbr9TgMw4OGYXi5XK5rWnb/LoBVDhFEm6b5R3EcVwRxzZrRpq5MtdrQSF7zo98mx7T9wrB+M1LkcwvDEOfOnYPrul/gnP+bWMxuNTOj19QkQSmFbdvndF3/k2azmeaiZPc9yOa/9cSoq1XLc+fOwXGcaQAfMU0ThUIBhmFsDmi6riOfz3+ZUvr4wsJCl+FXJW6remT7AdZPyoRa+r7/Xl3Xa2INkdVmhtfcjpMQXti2/YdBECwtLi72MOysVaq2EkDVwcjaEASBUMuHOOfftiwL+Xw+pTObApoALpfLTRuG8b5Go5Guwpdl37YKuJVqrrLKzc3NwXGc/wHwQdM005aHtazysC7QhJrmcrlHKaUPz8/Pp/PeVfu2FRLXz46px65Wq2g2m6Hv++/Udb2Zy+XSNPqarn+9J8oYQyLaHwDws3Pnzp23DrCVdkz15K7rYn5+Ho7jfFTTtKdt20Y+n1/XCgwbajFkjMG27aZpmr/ruq6n2rfNlrbzSZhML6anp+F53pOMsXuFt1wNJxs4aJI3Pc4Yu6tarXYVYzbK3zYiYTIYCb2YDcPwnbquh/l8HrZtr7uOuuFmVuFNi8XifYSQR0XH5GbytyzG30+ql5aWUK/XQ8/z3qFp2kw+n4dIOqxbWAahJpxzscLxewA8Pzc315NOHqSqrlYt2+22sGN3c86/J1JKa/WWmwIakK7L0zBNc7/ruq1KpdIljYOiImqisp/h930fs7Oz8Dzvnxhjn7UsC8Vicd12bFNAE6t4FgqF5zjnv99sNuNqtdpXjdYDXJYdW8nwdzqdn0RR9G5d1+NisZguhrfhax2k+xc0pFQqTRBCPr64uJjpGNYD3PlUUjX87XZ7MQzDt+u6XisUCgMDbOCgycAVi8XDhJCJubm5NE+metTVzqpbC2CVSkUY/ps55y/KdmxQE0U2ZWWlJPcW27b9e3Ec//f09HRP65bczKJSkX7Sl2UXVca/uLgIx3Hu5Jw/ads2SqUSLMsa6GJ4mwKamLpdKBTalmX9ZhiGkzMzMz2dOVn2aCXwZA6m/q7VaglPeT9j7HOJmVhXmPSKgCYnLQuFwqRpmm9xXXd+bm4u06Oeb2GUfk5EfnjE7OwsXNf9BoAPiWWlB2nHtgQ02b4lHvWmZrPZXg1wWYvE9eNivu9jZmYGjuP8KIqiA4ZhhMViEblcblMA23TQpPgU5XL5R5qmHWg2m2E/DrcSQFkqGYYhpqam0Ol0XgzD8CZd19vFYhGFQmHDSyG+oqAJx5AY5W9QSu+s1WpYWFjoAk5dAlb9W62Mh2GIyclJtNvtSd/3b9A0bb5QKKBYLG6Y8b8qQBMRQy6XQ7FY/Bwh5N5qtYpqtdqlhur63/IyPbK3jaIIMzMzaLfbC77v36hp2kvJvgfC+M8rBFuZw0+oCOI4vrter+cWFxfvpJR2TUtU29nV/4unWjQajZrneW/VNO3ZXC6Hcrm8KZ7yFQdNtBckPbofaDab9vz8/HuA5YV4zxcVCBvWaDRanufdqGna8cRebhlgWwba+Pg4wfJjR1hiEigAcu211/7pjTfemJ+fn39HHMcYGhrKJLaiH2Rqagr1er1dr9dv+cxnPnMCgA0sL08ktqNHj0Y/t6CNj4/zZP9MASsF7dixY+Sll1768B133JGbm5v7Ld/30/4yWR07nY6wYU6lUvmD+++//8dYfv5enIAlXqPx8fEQQAggABAePXo0HPS1kUE/fnd8fJwB0AFoCVg8AalLyqRXPjw8nDt48OCnDMN4S0KIoet6Clij0YDnec7Zs2c//PDDDz+F5acnxlmgJYBFCWgBAO/o0aPeWq9jpcfvDhS08fFxCsBIANMUSWMKYHkAwwCKAHKGYVgHDx787XK5/BuUUiZLmuM4lRMnTjz0xBNP/AzLzzFuAahi+bmdvgRcKAEXJp/56wFuK59ZLIPSo47KZ6VkKwDIua5r3Hfffd+/6qqrfrJv377XmKa5PY5jv1KpnH388cd/6i5PHylKEhwlEieSdpFEoWLpbwqAjo+Pk6NHj8avRpumqkokgUWkzwCglgAQJ2pkAtCOHz/eOn78+HTyfUiSE+Dlp2U3k9/XpeOox40VBxFvuk1ba+pZjpxWadNkqbOx/ChxI/ktVUALAHh4+fHizlpsWrL1jPVeOxnElJs+4J3Xe2Zs6S7V68t4lQFTQQsl0KJBgTVQ0FYJYj9pywKt34gl4LIAizYDpC0B7Rd9/P8A12VCYmM3Gg8AAAAASUVORK5CYII="
    let texture = new THREE.TextureLoader().load(url);
    let spriteMaterial = new THREE.SpriteMaterial({
        color:this.alarmColor["level"+obj.alarmLevel],//设置精灵矩形区域颜色
        map: texture,//设置精灵纹理贴图
        //transparent: false
    });
    // 创建精灵模型对象，不需要几何体geometry参数
    let sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0,obj.h+15,0);
    sprite.scale.set(25,25,1); // 控制精灵大小，比如可视化中精灵大小表征数据大小 只需要设置x、y两个分量就可以
    //sprite.data={"cabinetUUID":uuid,"level":"1",alarmInfo:[]}; //告警等级默认给1，给最低告警
    sprite.name="spriteAlarm";
    sprite.visible=true;
    return sprite;
};

/**
 * 根据数据类型创建模型
 * @param obj 模型数据
 */
ThreeUtil.initAddObject = function (obj) {
    if (obj.show != null || typeof (obj.show) != 'undefined' || obj.show) {
        let tempObj = null;
        let cabinet = null;
        switch (obj.objType) {
            case 'server':
                if(!this.addDeviceToCabinetUArr(obj)){
                    return false;
                }
                tempObj = this.createServer(obj);
                cabinet = this.scene.getObjectByName(tempObj.cabinet);//获取所属机柜
                cabinet.deviceMap.set(tempObj.name,tempObj);
                cabinet.add(tempObj);//将设备加入所属机柜模型
                this.addObject(tempObj,"device");
                break;
            case 'switch':
                if(!this.addDeviceToCabinetUArr(obj)){
                    return false;
                }
                tempObj = this.createSwitch(obj);
                cabinet = this.scene.getObjectByName(tempObj.cabinet);//获取所属机柜

                cabinet.deviceMap.set(tempObj.name,tempObj);
                cabinet.add(tempObj);//将设备加入所属机柜模型
                this.addObject(tempObj,"device");
                break;
            case 'emptyCabinet'://机柜
                tempObj = this.createEmptyCabinet(obj);
                this.addObject(tempObj,"");
                break;

        }
    }
};

/**
 * 添加设备模型
 * @param device 设备模型对象
 * @returns {boolean} 成功失败标识
 */
ThreeUtil.addDevice = function(device){
    //占用机柜U位置（占用失败不向下执行）
    if(!this.addDeviceToCabinetUArr(device)){
        return false;
    }

    if (device.show != null || typeof (device.show) != 'undefined' || device.show) {
        let tempObj = null;
        let cabinet = null;
        switch (device.objType) {
            case 'server':
                tempObj = this.createServer(device);
                break;
            case 'switch':
                tempObj = this.createSwitch(device);
                break;
        }

        cabinet = this.scene.getObjectByName(tempObj.cabinet);//获取所属机柜

        cabinet.deviceMap.set(tempObj.name,tempObj);
        cabinet.add(tempObj);//将设备加入所属机柜模型
        this.updateCabinetAlarm(cabinet);
        this.addObject(tempObj,"device");
    }
    return true;
};

/**
 * 创建一个机柜
 * @param obj 机柜信息
 * @returns {*}
 */
ThreeUtil.createEmptyCabinet = function (obj) {
    //设置机箱的外壳
    let texture1 = THREE.ImageUtils.loadTexture(ipAddress + 'img/rack_panel.jpg', {}, this.render);//机箱外表贴图
    let texture3 = THREE.ImageUtils.loadTexture(ipAddress + 'img/'+obj.uNumber+'U_left.jpg', {}, this.render);//cabz
    let texture2 = THREE.ImageUtils.loadTexture(ipAddress + 'img/'+obj.uNumber+'U_right.jpg', {}, this.render);//caby


    let cabGroup = new THREE.Group();
    //cabGroup的平面中心是机柜主体的平面中心
    cabGroup.name = "cabinetBody";


    let cabMatLambert = new THREE.MeshLambertMaterial({//设置朗伯材质和贴图
        color:0x8E8E8E,
        map:texture1
    });
    let cabMatBasic = new THREE.MeshBasicMaterial({//设置基础材质和贴图
        color:0x8E8E8E,
        map:texture1
    });

    let cabdGeo = new THREE.BoxGeometry(obj.w,2,obj.l);//箱主体底宽，高2，长
    let cabd = new THREE.Mesh(cabdGeo,cabMatBasic);
    cabd.position.set(0,1,0);

    let cabzGeo = new THREE.BoxGeometry(2,obj.h-4,obj.l);//箱左侧，厚2，高，长
    let cabzMaterials = [];
    cabzMaterials.push(//push顺序：X轴正、反，Y轴正、反，Z轴正、反
        cabMatLambert,
        cabMatLambert,
        cabMatLambert,
        cabMatLambert,
        new THREE.MeshBasicMaterial({
            color:0xBEBEBE,
            map:texture2
        }),
        cabMatBasic
    );
    let cabzMat = new THREE.MeshFaceMaterial(cabzMaterials);
    let cabz = new THREE.Mesh(cabzGeo,cabzMat);
    cabz.position.set(obj.w/2-1,obj.h/2,0);

    let cabyGeo = new THREE.BoxGeometry(2,obj.h-4,obj.l);//箱左侧，厚2，高，长
    let cabyMaterials = [];
    cabyMaterials.push(
        cabMatLambert,
        cabMatBasic,
        cabMatLambert,
        cabMatLambert,
        new THREE.MeshBasicMaterial({
            color:0xBEBEBE,
            map:texture3
        }),
        cabMatBasic
    );
    let cabyMat = new THREE.MeshFaceMaterial(cabyMaterials);
    let caby = new THREE.Mesh(cabyGeo,cabyMat);
    caby.position.set(-obj.w/2+1,obj.h/2,0);

    let cabhGeo = new THREE.BoxGeometry(obj.w-4,obj.h-4,2);//后板宽，高，厚2
    let cabh = new THREE.Mesh(cabhGeo,cabMatBasic);
    cabh.position.set(0,obj.h/2,0-obj.l/2+1);

    let cabsGeo = new THREE.BoxGeometry(obj.w,2,obj.l);
    let cabsMaterials = [];
    cabsMaterials.push(
        cabMatBasic,
        cabMatBasic,
        new THREE.MeshLambertMaterial({
            color:0x8E8E8E,
            map:ThreeUtil.canvasTxture(obj.name)//canvas贴图
        }),
        cabMatLambert,
        cabMatLambert,
        cabMatLambert
    );
    let cabsMat = new THREE.MeshFaceMaterial(cabsMaterials);
    let cabs = new THREE.Mesh(cabsGeo,cabsMat);
    cabs.position.set(0,obj.h-1,0);
    cabs.name = 'cabs';

    cabd.objType = "cabinetBody";
    cabz.objType = "cabinetBody";
    caby.objType = "cabinetBody";
    cabh.objType = "cabinetBody";
    cabs.objType = "cabinetBody";
    cabGroup.add(cabd,cabz,caby,cabh,cabs);//cabGroup不包括机箱门

    //设置机箱门
    let menGroup = new THREE.Group();
    menGroup.position.set(obj.w/2, 0, obj.l/2);//x,y,z指向机柜的中心点，门的位置在机柜前面

    let menGeo = new THREE.BoxGeometry(obj.w,obj.h,1);//机箱门宽，高，厚
    let mMaterials = [];
    mMaterials.push(
        new THREE.MeshLambertMaterial({color:0x999999}),
        new THREE.MeshLambertMaterial({color:0x999999}),
        new THREE.MeshLambertMaterial({color:0x999999}),
        new THREE.MeshLambertMaterial({color:0x999999}),
        new THREE.MeshLambertMaterial({
            map:THREE.ImageUtils.loadTexture(
              ipAddress + 'img/rack_front_door.jpg',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        }),
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
              ipAddress + 'img/rack_door_back.jpg',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        })
    );

    let menMat = new THREE.MeshFaceMaterial(mMaterials);
    let men = new THREE.Mesh(menGeo,menMat);
    men.name = obj.name+"_door";
    men.objType = "door";
    men.position.set(-obj.w/2,obj.h/2,.5);
    menGroup.objType = "door";
    menGroup.name = obj.name+"_door";
    menGroup.add(men);

    cabGroup.l = obj.l;
    cabGroup.w = obj.w;
    cabGroup.h = obj.h;

    let group = $.extend(new THREE.Group(),obj);
    group.add(cabGroup,menGroup);
    group.position.set(obj.positionX,obj.positionY,obj.positionZ);
    return group;
};

/**
 * 创建服务器设备模型
 * @param obj 服务器模型信息
 * @returns {Group}
 */
ThreeUtil.createServer = function(obj){
    let serv2Group = $.extend(new THREE.Group(),obj);
    //两层的服务器
    let servTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/rack_inside.jpg', {}, ThreeUtil.render);
    let serv2Geo = new THREE.BoxGeometry(25.5,3.5,37);//这里服务器的尺寸要跟机箱尺寸对应好
    let servMat = new THREE.MeshBasicMaterial({
        color:0x9AC0CD,
        map:servTexture
    });

    let server2 = new THREE.Mesh(serv2Geo,servMat);//服务器主体
    //server2.position.set(0,obj.positionY,2);

    let server2mGeo = new THREE.BoxGeometry(25.5,4,0.2);//服务器面板尺寸
    let smb2Materials = [];
    smb2Materials.push(
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({color:0xffffff}),
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
              ipAddress + 'img/server2.jpg',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        }),
        new THREE.MeshBasicMaterial({color:0xffffff})
    );

    if(obj.alarmLevel){//如果设备有告警，根据告警级别改变模型颜色
        servMat.color.set(this.alarmColor["level"+obj.alarmLevel]);
        for (let i = 0; i < smb2Materials.length; i++){
            smb2Materials[i].color.set(this.alarmColor["level"+obj.alarmLevel]);
        }
    }

    let server2face = new THREE.Mesh(server2mGeo,smb2Materials );
    server2face.name= obj.name;
    server2face.objType = "server";
    server2face.position.set(0,0,37/2);

    serv2Group.isOpen = false;//是否为打开状态
    serv2Group.add(server2,server2face);
    serv2Group.position.set(0,obj.positionY,1.2);
    return serv2Group;
};

/**
 * 创建交换机模型
 * @param obj 交换机模型数据
 * @returns {Group}
 */
ThreeUtil.createSwitch = function(obj){
    let switchGroup = $.extend(new THREE.Group(),obj);
    let switchTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/rack_inside.jpg', {}, ThreeUtil.render);
    let switchGeo = new THREE.BoxGeometry(25.5,11.5,37);//交换机主体尺寸，宽厚长，要跟机箱对应
    let switchMat = new THREE.MeshBasicMaterial({
        color:0x9AC0CD,
        map:switchTexture
    });
    let switchBody = new THREE.Mesh(switchGeo,switchMat);
    //switchBody.position.set(0,this.h,2);

    let switchmGeo = new THREE.BoxGeometry(25.5,12,0.2);//交换机面板尺寸
    let switchmMat = new THREE.MeshBasicMaterial({//交换机面板材质
        color:0xffffff
    });
    let switchfMaterials = [];
    switchfMaterials.push(
        switchmMat,
        switchmMat,
        switchmMat,
        switchmMat,
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
              ipAddress + 'img/switchboard.jpg',
                {},
                ThreeUtil.render
            ),
            overdraw:true
        }),
        switchmMat
    );

    if(obj.alarmLevel){//如果设备有告警，根据告警级别改变模型颜色
        switchMat.color.set(this.alarmColor["level"+obj.alarmLevel]);
        for (let i = 0; i < switchfMaterials.length; i++){
            switchfMaterials[i].color.set(this.alarmColor["level"+obj.alarmLevel]);
        }
    }

    let switchface = new THREE.Mesh(switchmGeo,switchfMaterials);
    switchface.position.set(0,0,37/2);//交换机面板位置，X,Y,Z

    switchface.name = obj.name;
    switchface.objType = "switch";

    switchGroup.isOpen = false;//是否为打开状态
    switchGroup.add(switchBody,switchface);
    switchGroup.position.set(0,obj.positionY,1.2);
    return switchGroup;
};

/**
 * 创建阵列交换机
 */
ThreeUtil.createPlugboard = function(){
    let switchTexture = THREE.ImageUtils.loadTexture(ipAddress + 'img/rack_inside.jpg', {}, ThreeUtil.render);
    let switchMat = new THREE.MeshBasicMaterial({
        color:0x9AC0CD,
        map:switchTexture
    });

    let outerSkinBox = new THREE.BoxGeometry(26,11.5,38);
    let outerSkinMesh = new THREE.Mesh(outerSkinBox);
    outerSkinMesh.position.set(0,50,0);

    let subBox = new THREE.BoxGeometry(25,11,37);
    let subMesh = new THREE.Mesh(subBox);
    subMesh.position.set(0,50,0.5);

    let outerSkinBoxBsp = new ThreeBSP(outerSkinMesh);
    let subBsp = new ThreeBSP(subMesh);
    let result = outerSkinBoxBsp.subtract(subBsp);
    result = result.toMesh(switchMat);

    let switchmMat = new THREE.MeshBasicMaterial({//交换机面板材质
        color:0xffffff
    });
    let switchfMaterials = [];
    switchfMaterials.push(
        switchmMat,
        switchmMat,
        switchmMat,
        switchmMat,
        new THREE.MeshBasicMaterial({
            map:THREE.ImageUtils.loadTexture(
                'res/server3.png',
                {},
                ThreeUtil.render
            ),
            overdraw:true,
            transparent:true
        }),
        switchmMat
    );

    let panelBox = new THREE.BoxGeometry(27,12,0.2);
    let panelMesh = new THREE.Mesh(panelBox,switchfMaterials);
    panelMesh.position.set(0,50,19);

    for(let i = 0; i < 15; i++){

    }


    this.scene.add(result,panelMesh);
};

/**
 * 添加设备至机柜，成功返回true 失败返回false
 * @param device 设备
 * @returns {boolean} 成功失败标识
 */
ThreeUtil.addDeviceToCabinetUArr = function(device){
    let flag = true;
    let occupyUNumber = device.uNumber;//设备需要占用的机柜空间（U）
    let cabinet = this.scene.getObjectByName(device.cabinet);//获取所属机柜

    if(ThreeUtil.checkCanAddToUArr(cabinet.uArr,device.uIndex,occupyUNumber,device.name)){
        //删除该设备之前占用的U数组位置
        ThreeUtil.clearUArrBydeviceName(cabinet,device.name);
        //占用机柜U数组位置
        for (; occupyUNumber > 0; occupyUNumber-- ){
            let index = device.uIndex + occupyUNumber - 2;
            cabinet.uArr[index] = device.name;
        }
    }else{
        flag = false;
    }

    device.positionX = cabinet.positionX;
    device.positionZ = cabinet.positionZ;

    return flag;
};

/**
 * 校验机柜U数组能否加入该设备
 * @param uArr U数组
 * @param uIndex 该设备要加入的位置
 * @param occupyUNumber 该设备占用的U数
 * @param deviceName 该设备名称
 * @returns {boolean} true：能    false：不能
 */
ThreeUtil.checkCanAddToUArr = function(uArr, uIndex, occupyUNumber, deviceName){
    let flag = true;
    let length = uArr.length;
    if((uIndex + occupyUNumber - 1) > length){//校验设备是否超出机柜U数
        flag = false;
        return flag;
    }else{
        for (; occupyUNumber > 0; occupyUNumber-- ){
            let index = uIndex + occupyUNumber - 2;
            if(uArr[index] && uArr[index] != deviceName){//判断所需占用空间是否已被其他设备占用
                flag = false;
                break;
            }
        }
    }

    return flag;
};

/**
 * 根据设备名称删除在机柜U数组中占用的位置
 * @param cabinet 机柜对象
 * @param deviceName 设备名称
 */
ThreeUtil.clearUArrBydeviceName = function(cabinet,deviceName){
    for (let i = 0,length = cabinet.uArr.length; i < length; i++){
        if(cabinet.uArr[i] == deviceName){
            cabinet.uArr[i] = "";
        }
    }
};

/**
 * 校验名称是否已存在
 * @param name 设备名称
 * @returns {boolean} true已存在   false未存在
 */
ThreeUtil.checkNameIsAlreadyExists = function(name){
    return this.devices.has(name);
};

/**
 * 在机柜上写上name
 * @param str name值
 * @returns {Texture}
 */
ThreeUtil.canvasTxture = function canvasTxture(str){
    let canvas = document.createElement("canvas");
    canvas.width = 50;
    canvas.height = 40;
    let ctx = canvas.getContext("2d");
    let g = ctx.createLinearGradient(0,0,50,40);
    g.addColorStop(0,"#777");
    g.addColorStop(1,"#777");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,50,40);
    ctx.textBaseline='top';
    ctx.font="20px SimHei";
    ctx.fillStyle = "#00ffff";//编号颜色
    let txtWidth = ctx.measureText(str).width;
    ctx.fillText(str ,50/2-txtWidth/2,40/2-20/2);
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
};

/**
 * 加入场景或全局参数中
 * @param obj 模型对象
 * @param info 加入标识
 */
ThreeUtil.addObject = function (obj,info) {
    if(info){
        if(info=="object"){
            this.objects.push(obj);
        }
        if(info=="scene"){
            this.scene.add(obj);
        }
        if(info == "device"){
            this.devices.set(obj.name,obj);
        }
    }else{
        this.objects.push(obj);
        this.scene.add(obj);
    }
};

/**
 * 根据字段和字段值模糊查询设备模型
 * @param field 字段
 * @param value 字段值
 * @returns {[]} 结果数组
 */
ThreeUtil.findDeviceObjByField = function (field,value) {
    let results = [];
    this.devices.forEach(function (val,key) {
        if(val[field].indexOf(value) >= 0){
            results.push(val);
        }
    });

    return results;
};

/**
 * 通过射线获取鼠标点击位置处点击到的第一个对象
 * @param event
 * @returns {null|*}
 */
ThreeUtil.getObjByRaycaster = function (event,recursive) {
    //1、先基于我们在屏幕上点击的位置创建一个向量
    ThreeUtil.vector3.set(
        (event.clientX / window.innerWidth ) * 2 - 1,
        -( event.clientY / window.innerHeight ) * 2 + 1,
        0.5
    );
    //2、然后用unproject函数将点击位置转换成Thres.js场景中的坐标
    //vector = vector.unproject(ThreeUtil.camera);
    //3、用THREE.Raycaster对象向点击位置发射光线
    ThreeUtil.raycaster.setFromCamera(ThreeUtil.vector3, ThreeUtil.camera);
    //4、计算射线相机到的对象，可能有多个对象，因此返回的是一个数组，按离相机远近排列
    //将射线投影到屏幕，如果scene.children里的某个或多个形状相交，则返回这些形状
    //第二个参数是设置是否递归，默认是false，也就是不递归。当scene里面添加了Group对象的实例时，就需要设置这个参数为true
    //第一个参数不传scene.children也可以，传一个group.children或一个形状数组都可以（这样可以实现一些特别的效果如点击内部的效果）
    //另外，因为返回的是一个数组，所以遍历数组就可以获得所有相交的对象，当元素重叠时，特别有用
    var intersects = ThreeUtil.raycaster.intersectObjects(ThreeUtil.scene.children,recursive);

    if(!intersects || intersects.length < 1){
        return null;
    }

    let object = null;//返回第一个被射线相交的模型对象
    for (let i = 0,length = intersects.length; i < length; i++){//过滤辅助模型
        if(intersects[i].object.type === "BoxHelper"){
            continue;
        }
        object = intersects[i].object;
        break;
    }

    return object;
};

/**
 * 获取告警语音播报文本
 * @returns {string} 告警语音播报文本
 */
ThreeUtil.getAlarmInfo = function(){
    let info = "";
    this.alarmDeviceMap.forEach(function (value,key) {
        info += "设备" + key + ":" + value.alarmCause+",";
    });
    return info;
};

/**
 * 告警播放
 */
ThreeUtil.alarmPlay = function(info){
    let utterThis = new window.SpeechSynthesisUtterance();
    utterThis.text=info;
    utterThis.lang="zh-CN";  //使用语言
    utterThis.pitch=2; //表示说话的音高，数值，范围从0（最小）到2（最大）。默认值为1
    utterThis.rate=0.7;  // 语速，数值，默认值是1，范围是0.1到10，表示语速的倍数，例如2表示正常语速的两倍
    utterThis.volume=1;  //声音的音量，区间范围是0到1，默认是1
    window.speechSynthesis.speak(utterThis);
    //百度
    /*var url = "http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&text=" + encodeURI(info);        // baidu
    var n = new Audio(url);
    n.src = url;
    n.pause();
    //n.play();*/
};

/**
 * 删除设备模型
 * @param device 设备模型
 */
ThreeUtil.deleteDevice = function (device) {
    let cabinet = this.scene.getObjectByName(device.cabinet);
    cabinet.deviceMap.delete(device.name);
    this.devices.delete(device.name);
    this.alarmDeviceMap.delete(device.name);
    cabinet.remove(device);
    //删除该设备占用的U数组位置
    ThreeUtil.clearUArrBydeviceName(cabinet,device.name);

    this.updateCabinetAlarm(cabinet);//更新机柜告警
};

/**
 * 设置模型选中效果
 * @param obj 被选中的模型
 */
ThreeUtil.selectObject = function (obj) {
    this.selectBox.setFromObject(obj);//设置对象
    this.selectBox.visible = true;//显示
};

/**
 * 隐藏模型选中效果
 */
ThreeUtil.hideSelect = function () {
    this.selectBox.visible = false;//隐藏
};

/**
 * 根据告警级别修改设备材质
 * @param device 设备
 */
ThreeUtil.updateDeviceMaterial = function (device) {
    let color = "";
    //设备由两个子模型组成（设备主体模型，设备面板模型）
    device.children.forEach(function (value,index) {
        if(Array.isArray(value.material)){//数组为面板模型
            //根据告警级别设置颜色
            if(device.alarmLevel > 0){
                color = ThreeUtil.alarmColor["level"+device.alarmLevel]
            }else{
                color = 0xffffff;
            }
            //面板模型材质由六个材质对象组成
            for (let i = 0,length = value.material.length; i < length; i++){
                value.material[i].color.set(color);
            }
        }else{//主体模型
            //根据告警级别设置颜色
            if(device.alarmLevel > 0){
                color = ThreeUtil.alarmColor["level"+device.alarmLevel]
            }else{
                color = 0x9AC0CD;
            }
            //设备主体模型只有一个材质
            value.material.color.set(color);
        }
    });
};

/**
 * 显示或隐藏机柜上的告警精灵
 * @param falg  true：显示     false：隐藏
 */
ThreeUtil.enableSprite = function (falg) {
    this.objects.forEach(function (value,index) {
        if(value.spriteObj){
            value.spriteObj.visible = falg;
        }
    });
};

/**
 *  视角转至该设备的位置并选中该设备
 * @param device
 */
ThreeUtil.goToDevice = function (device) {
    let _this = this;
    let cabinet = device.parent;

    let door = cabinet.getObjectByProperty("objType","door");//在机柜对象的子模型中获取机柜门模型对象

    _this.openCabinetDoor(door);//打开机柜门

    if(!device.isOpen){//打开设备
        _this.openDevice(device);
    }

    _this.selectObject(device);//选中设备
};

/**
 * 打开机柜门
 * @param door机柜门模型对象
 */
ThreeUtil.openCabinetDoor = function (door) {
    let _this = this;
    new TWEEN.Tween( door.rotation ).to({//打开机柜门动画
        y: 0.6*Math.PI
    }, 1500 ).easing( TWEEN.Easing.Elastic.Out).start();

    _this.controls.target=new THREE.Vector3(//重新设置视角控制器的中心点
        door.parent.position.x,
        door.parent.position.y+50,
        door.parent.position.z
    );

    //移动相机的位置(有动画)
    new TWEEN.Tween( _this.camera.position ).to({
         x:door.parent.position.x,
         y:door.parent.position.y+96.5,
         z:door.parent.position.z+150
     }, 700 ).start();
    new TWEEN.Tween( _this.camera.rotation ).to({
        x:-0.3,
        y:0,
        z:0
    }, 700 ).start();

    //移动相机的位置（无动画）
    /*this.camera.position.set(
        door.parent.position.x-5,
        door.parent.position.y+100,
        door.parent.position.z+150
    );*/

    _this.controls.update()//更新视角控制器
};

/**
 * 关闭机柜门（顺便关闭该机柜打开的设备）
 * @param door 机柜门模型对象
 */
ThreeUtil.closeCabinetDoor = function (door) {
    let _this = this;
    //根据机柜名称查找设备
    let parentGroup = door.parent;
    let objArr = this.findDeviceObjByField("cabinet",parentGroup.name);
    $.each(objArr,function (index,obj) {
        if((obj.objType === "server" || obj.objType === "switch") && obj.isOpen){//设备，且已打开
            _this.closeDevice(obj);
        }
    });
    //关闭机柜门
    new TWEEN.Tween( door.rotation ).to({//关闭动画
        y: 0
    }, 300 ).start();

    this.controls.update();//更新视角控制器
};

/**
 * 打开设备模型（抽出）
 * @param device 设备模型对象
 */
ThreeUtil.openDevice = function (device) {
    new TWEEN.Tween( device.position ).to({
        z:device.position.z+20
    }, 500 ).easing( TWEEN.Easing.Elastic.Out).start();

    device.isOpen = true;//更新状态
};

/**
 * 关闭设备模型（推回）
 * @param device 设备模型对象
 */
ThreeUtil.closeDevice = function (device) {
    new TWEEN.Tween( device.position ).to({
        z:device.position.z-20
    }, 500 ).easing( TWEEN.Easing.Elastic.Out).start();

    device.isOpen = false;//更新状态
};