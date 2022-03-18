cp /etc/logstash/conf.d/oracle-jdbc_{dbname}.conf.template.new /etc/logstash/conf.d/oracle-jdbc_$1.conf
sed -i s/[0-9]}/$2}/g /etc/logstash/conf.d/oracle-jdbc_$1.conf
