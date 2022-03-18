import re
import json
import socket
import ast
from unicodedata import name
from pgModel.models import ansible_group_information

#########################################################################读文件#########################################################################

host_router = '/mnt/win/platform-development/ansible/config/hosts'
db4bix_router = '/zabbix/node-db4bix/config/db4bix.conf'
logstash_router = '/etc/sysconfig/logstash'


class Host:
    def __init__(self):
        self.group_name = ''
        self.group_list = []

    def list_append(self, config):
        self.group_list.append(config)

    def set_group_name(self, name):
        self.group_name = name


def creat_temp_host():
    host = Host()
    host.set_group_name("temp")
    return host


def edit_db4bix_host():
    conf_str = open_file(db4bix_router)
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    strlist = conf_str.split('\n')
    for i in range(len(strlist)):
        if(re.search(r'host=*', strlist[i]) != None):
            strlist[i] = "host=" + ip
            break

    with open(db4bix_router, "w") as file:
        for index in range(len(strlist)):
            file.write(strlist[index] + "\n")


def creat_db4bix_obj(strlist, i, result_list):
    temp_str = ''
    # 将[DB.*]变为name=*
    temp_str += "name" + "=" + strlist[i][1: len(strlist[i]) - 1].split('.')[1]
    i += 1
    connectString = ''

    while (i < len(strlist) and re.search(r'\[.*\]', strlist[i]) == None):
        temp_kv = strlist[i].split('=', 1)
        # 不读取空行
        if(temp_kv[0] != ""):
            if(temp_kv[0] != "connectString"):
                # 转化为字典的字符串的格式是a=x b=x c=x,这里就是在处理格式问题
                temp_str += " " + temp_kv[0] + "=" + temp_kv[1]
            else:
                # db4bix的配置文件的connectString需要最后添加，因为connectString中包含=,直接replace会出错
                connectString = temp_kv[1]
                temp_str += " " + temp_kv[0] + "="
        i += 1

    # 这里将字符串转化为字典，为了以后转化为json字符串
    dict = ast.literal_eval(
        '{\"' + temp_str.replace(" ", "\", \"").replace("=", "\": \"") + connectString + '\"}')
    result_list.append(dict)
    # 返回当前处理行进行读取行数的更新
    return i

# 将ansible配置文件转化为json文件的处理函数


def creat_host_obj(strlist, i, result_list):
    host = Host()
    host.set_group_name(strlist[i][1: len(strlist[i]) - 1])
    i += 1

    while (i < len(strlist) and re.search(r'\[.*\]', strlist[i]) == None):
        # 将每一个ansible的配置中的ssh配置参数给删除
        strlist[i] = re.sub(r' ansible_ssh_extra_args=\".*\"', "", strlist[i])
        temp_list = strlist[i].split(' ', 1)
        name = temp_list[0]
        # 不读取空行
        if(name != ""):
            # 将配置文件的该行转为能转化成对象或者字典的json字符串，就是字符串转为'{"isSucess":true, "name":"yoyo", "status": "200"}'这种样子
            temp_list = '{\"' + temp_list[1].replace(
                " ", "\", \"").replace("=", "\": \"") + '\"}'
            # 将这个转化为对象
            dict = ast.literal_eval(temp_list)
            dict.update({'name': name})
            host.list_append(dict)
        i += 1

    result_list.append(host)
    return i

# 所有的配置文件读取，我采取的都是正则校验的方式，第一次严格校验判断下面的字符是不是配置文件中的数据
# 是的话开始读取并进入第二次校验，第二次校验校验的是结束标志，数据处理都是在第二次校验中的，并返回当前行数。


def deal_config(conf_str, type):
    # 第二次校验的方法
    method_switch = {
        "host": creat_host_obj,
        "db4Bix": creat_db4bix_obj,
        "logstash": creat_logstash_obj
    }

    regex_switch = {
        "host": r'\[.*\]',
        "db4Bix": r'\[DB.*\]',
        "logstash": r'connstr\d'
    }

    strlist = conf_str.split('\n')
    result_list = []
    i = 0

    while (i < len(strlist)):
        if(len(strlist[i]) > 0 and strlist[i][0] != '#' and strlist[i][0] != '\n'):
            # 第一次校验
            if(re.search(regex_switch.get(type), strlist[i]) != None):
                i = method_switch.get(type)(strlist, i, result_list)
            else:
                i += 1
        else:
            i += 1
    return result_list


def creat_logstash_obj(strlist, i, result_list):
    temp_str = ''
    temp_kv = strlist[i].split('=', 1)
    # key=value 中key的数字，这个是没有意义的
    temp_kv[0] = re.sub(r'[0-9]+', '', temp_kv[0])
    temp_str += temp_kv[0] + "=" + temp_kv[1]
    i += 1

    while (i < len(strlist) and re.search(r'connstr\d', strlist[i]) == None):
        temp_kv = strlist[i].split('=', 1)
        # 不读取空行
        if(temp_kv[0] != ""):
            temp_kv[0] = re.sub(r'[0-9]+', '', temp_kv[0])
            temp_str += " " + temp_kv[0] + "=" + temp_kv[1]
        i += 1

    # 将这个字符串转化为对象
    dict = ast.literal_eval(
        '{\"' + temp_str.replace(" ", "\", \"").replace("=", "\": \"") + '\"}')
    result_list.append(dict)
    return i


# 根据路径读取文件
def open_file(router):
    f = None
    conf_str = ''
    try:
        f = open(router, 'r')
        conf_str = f.read()
    finally:
        if f:
            f.close()
    return conf_str


def return_host_conf():
    conf_str = open_file(host_router)
    host_conf = deal_config(conf_str, "host")
    return json.dumps(host_conf, default=lambda obj: obj.__dict__)


def return_db4Bix_conf():
    conf_str = open_file(db4bix_router)
    db_conf = deal_config(conf_str, "db4Bix")
    return json.dumps(db_conf, default=lambda obj: obj.__dict__)


def return_logstash_conf():
    conf_str = open_file(logstash_router)
    logstash_conf = deal_config(conf_str, "logstash")
    return json.dumps(logstash_conf, default=lambda obj: obj.__dict__)


#########################################################################写文件#########################################################################
# 要看数据结构的话，直接在每个写文件上面写print形参运行就看得出来了，这里就不多写数据结构了

def wirte_host_file(host_conf):

    with open(host_router, "w") as file:
        for group_information in host_conf:
            file.write("\n[" + group_information.get("group_name") + "]\n")

            for host_information in group_information.get("group_list"):
                name = host_information.get("name")
                del host_information['name']

                host_information = host_information.__repr__()
                # 最后的参数是全部ansible的配置开启长链接ssh的保留时间为5天，关闭所有连接会话的回复
                file.write(name + " " + host_information[2: len(
                    host_information) - 2].replace("\': \'", "=").replace("\', \'", " ") + " ansible_ssh_extra_args=\"-o ControlMaster=auto -o ControlPersist=5d -o StrictHostKeyChecking=no\"" + "\n")


def wirte_logstash_file(logstash_conf):
    logstash_conf = json.loads(logstash_conf)

    with open(logstash_router, "w") as file:
        for index in range(len(logstash_conf)):
            for key, value in logstash_conf[index].items():
                file.write(key + str(index + 1) + "=" + value + "\n")
            file.write("\n")

# 删除不要的db4Bix配置文件


def del_db4Bix_file(i, strlist):
    begin = i
    end = 0
    i += 1
    while (i < len(strlist) and re.search(r'\[.*\]', strlist[i]) == None):
        i += 1
    end = i - 1

    conf_str = strlist[:begin] + strlist[end:]
    return conf_str


def wirte_db4Bix_file(db_conf_json):

    conf_str = open_file(db4bix_router)
    db_conf_list = deal_config(conf_str, "db4Bix")

    db_conf2_list = json.loads(db_conf_json)

    # 分出两个组，一个是要在配置文件中进行删除的组，一个是需要新添加的组
    del_result = [i for i in db_conf_list if i not in db_conf2_list]
    add_result = [i for i in db_conf2_list if i not in db_conf_list]

    strlist = conf_str.split('\n')

    # 对配置文件中的dbs[]=*先进行移除
    for del_obj in del_result:
        strlist.remove("dbs[]=" + del_obj.get("name"))

    i = 0
    # 删除配置文件中的配置，因为需要原有的一些数据，所以不能直接覆写
    for del_obj in del_result:
        while (i < len(strlist)):
            if(len(strlist[i]) > 0 and strlist[i][0] != '#'):
                # 第一次校验
                if(re.search(r'\[DB.' + del_obj.get("name") + '*\]', strlist[i]) != None):
                    strlist = del_db4Bix_file(i, strlist)
                    break
                else:
                    i += 1
            else:
                i += 1

    # 在字符串中插入新添加的配置
    for add_obj in add_result:
        index = strlist.index('; <-- end of the DB list definition')
        strlist.insert(index, "dbs[]=" + add_obj.get("name"))
        strlist.insert(index + 2, "[DB." + add_obj.get("name") + "]")
        del add_obj['name']
        add_obj = add_obj.__repr__()
        # 就是把json字符串又变回配置文件的样子
        strlist.insert(index + 3, add_obj[2:len(add_obj) - 2].replace("', '",
                                                                      "\n").replace("': '", "=") + "\n")
    # 将所有配置写入文件中
    with open(db4bix_router, "w") as file:
        for str in strlist:
            file.write(str + '\n')

