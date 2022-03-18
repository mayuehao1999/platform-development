"""ansible URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from unicodedata import name
from django.contrib import admin
from django.urls import path
from . import views
from ansible.function import testdb

urlpatterns = [
    ######### 两个视图页 #########
    path('runoob/', views.runoob),
    path('room/', views.computer_room),

    ######### ansible host 配置文件修改的数据处理的api #########
    path('deal_config/get_ansible_host', views.get_ansible_host),
    path('deal_config/upload',views.upload),
    path('deal_config/hostsdownload',views.hostsdownload),
    path('deal_config/add_ansible_host', views.add_ansible_host),
    path('deal_config/del_ansible_host', views.del_ansible_host),
    path('deal_config/edit_ansible_host', views.edit_ansible_host),
    path('deal_config/ping_all_host', views.ping_all_host),

    ######### db4bix 配置文件修改的数据处理的api #########
    path('deal_config/get_db4bix_config', views.get_db4bix_config),
    # 因为这个配置文件采用全覆写的方式，增删改都是一个接口
    path('deal_config/deal_db4bix_config', views.deal_db4bix_config),

    ######### logstash 配置文件修改的数据处理的api #########
    path('deal_config/get_logstash_config', views.get_logstash_config),
    # 因为这个配置文件采用全覆写的方式，增删改都是一个接口
    path('deal_config/deal_logstash_config', views.deal_logstash_config),
    path('restart/logstash',
         views.restart_logstash),

    ######### 调用ansible playbook的api #########
    # 获取oracle的服务名
    path('deal_config/get_oracle_port_and_instance_name',
         views.get_oracle_port_and_instance_name),
    path('deal_config/oracle_authorization', views.oracle_authorization),
    path('deal_config/install_zabbix_agent', views.install_zabbix_agent),

]
