from ast import Name
from django.http import HttpResponse
from pgModel.models import ansible_group_information
# Create your tests here.


def testdb(request):
    ansible_group_information.objects.create(ansible_ssh_host='192.168.213.209', name='192.168.213.209',
                                             ssh_usr='root', ssh_pass='1010124897', ansible_group='linux', ssh_port=22)
    print(ansible_group_information.objects.filter(
        name='192.168.213.209', ansible_group='linux'))
    return HttpResponse("<p>数据添加成功！</p>")
