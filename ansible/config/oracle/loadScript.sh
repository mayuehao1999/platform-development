#!/bin/bash
path=$1
su - oracle <<!
sqlplus -S / as sysdba <<EOF
set heading off
set sqlblanklines on
@${path} 
exit 
EOF
!
