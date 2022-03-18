from os import system
from django.db import models


class ansible_group_information(models.Model):
    id = models.IntegerField(primary_key=True)
    ansible_ssh_host = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    ansible_ssh_port = models.CharField(max_length=255)
    ansible_ssh_user = models.CharField(max_length=255)
    ansible_ssh_pass = models.CharField(max_length=255)
    group_name = models.CharField(max_length=255)
    system = models.CharField(max_length=255)
