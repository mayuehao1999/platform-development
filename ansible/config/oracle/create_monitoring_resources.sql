CREATE USER c##zlmonitor
  IDENTIFIED BY zlsoft2016
  DEFAULT TABLESPACE USERS
  TEMPORARY TABLESPACE TEMP
  PROFILE DEFAULT
  ACCOUNT UNLOCK;
  GRANT ALTER SESSION TO c##zlmonitor;
  GRANT CREATE SESSION TO c##zlmonitor;
  GRANT CONNECT TO c##zlmonitor;
  GRANT RESOURCE TO c##zlmonitor;
  ALTER USER c##zlmonitor DEFAULT ROLE ALL;
  GRANT SELECT ANY DICTIONARY TO c##zlmonitor;
  GRANT UNLIMITED TABLESPACE TO c##zlmonitor;
  GRANT oem_monitor TO c##zlmonitor;
  GRANT SELECT ON V_$INSTANCE TO c##zlmonitor;
  GRANT SELECT ON DBA_USERS TO c##zlmonitor;
  GRANT SELECT ON V_$LOG_HISTORY TO c##zlmonitor;
  GRANT SELECT ON V_$PARAMETER TO c##zlmonitor;
  GRANT SELECT ON SYS.DBA_AUDIT_SESSION TO c##zlmonitor;
  GRANT SELECT ON V_$LOCK TO c##zlmonitor;
  GRANT SELECT ON DBA_REGISTRY TO c##zlmonitor;
  GRANT SELECT ON V_$LIBRARYCACHE TO c##zlmonitor;
  GRANT SELECT ON V_$SYSSTAT TO c##zlmonitor;
  GRANT SELECT ON V_$PARAMETER TO c##zlmonitor;
  GRANT SELECT ON V_$LATCH TO c##zlmonitor;
  GRANT SELECT ON V_$PGASTAT TO c##zlmonitor;
  GRANT SELECT ON V_$SGASTAT TO c##zlmonitor;
  GRANT SELECT ON V_$LIBRARYCACHE TO c##zlmonitor;
  GRANT SELECT ON V_$PROCESS TO c##zlmonitor;
  GRANT SELECT ON DBA_DATA_FILES TO c##zlmonitor;
  GRANT SELECT ON DBA_TEMP_FILES TO c##zlmonitor;
  GRANT SELECT ON DBA_FREE_SPACE TO c##zlmonitor;
  GRANT SELECT ON V_$SYSTEM_EVENT TO c##zlmonitor;
  grant select on dba_hist_sqlstat to c##zlmonitor;
  grant select on dba_hist_sqltext to c##zlmonitor;
  grant select on dba_hist_snapshot to c##zlmonitor;
  grant select on dba_hist_sql_plan to c##zlmonitor;
  grant select on sys.wri$_adv_tasks to c##zlmonitor;
  grant select on sys.wri$_adv_addm_tasks to c##zlmonitor;
  grant select on sys.wri$_adv_addm_fdg to c##zlmonitor;
  grant select on sys.wri$_adv_findings to c##zlmonitor;
  grant select on v_$active_session_history to c##zlmonitor;

conn c##zlmonitor/zlsoft2016

create table TOPSQL
(
  btime         DATE,
  etime         DATE,
  seqno         NUMBER(3),
  sqltype       VARCHAR2(20),
  sql_id        VARCHAR2(40),
  module        VARCHAR2(100),
  getscount     NUMBER(10),
  diskread      NUMBER(10),
  execount      NUMBER(10),
  diskread_one  NUMBER(10),
  getscount_one NUMBER(10),
  elaptime_one  NUMBER,
  cpu_time      NUMBER(10),
  elaptime      NUMBER(10),
  sqltext       CLOB
)
/
create index topsql_ix_etime on topsql(etime)
/
create table topfulltable
( snapid    number,
  btime         DATE,
  etime         DATE,
  seqno         NUMBER(3),
  sql_id        VARCHAR2(40),
  object_name       VARCHAR2(30),
  module        VARCHAR2(100),
  cost          number(10),
  sqltext       CLOB
)
/
create index topfulltab_ix_etime on topfulltable(etime)
/

create or replace function f_getaddmmessage(taskname_in varchar2)
  return clob is
  FunctionResult clob;
begin
  select dbms_advisor.get_task_report(taskname_in)
    into FunctionResult
    from dual;
  return(FunctionResult);
end f_getaddmmessage;

/
grant execute on f_getaddmmessage to c##zlmonitor;
/
--用zlmonitor用户执行
create or replace procedure p_topSQL_Hist is
  bsnap         number;
  esnap         number;
  ndbid         number;
  btime_in      date;
  etime_in      date;
  v_addm_name   varchar2(30);
  n_addm_taskid number;
begin
  etime_in := sysdate;
  btime_in := sysdate - 2 / 24;
  begin
    select dbid, minsnap, maxsnap
      into ndbid, bsnap, esnap
      from (select min(dbid) as dbid,
                   min(SNAP_ID) as minsnap,
                   max(snap_id) as maxsnap
              from dba_hist_snapshot a
             where BEGIN_INTERVAL_TIME between btime_in and etime_in);
  exception
    when no_data_found then
      return;
  end;

  --SQL ordered by Elapsed Time

  insert into topSQL
    (Btime,
     Etime,
     Seqno,
     Sqltype,
     Sql_Id,
     Module,
     Getscount,
     Diskread,
     Execount,
     Diskread_One,
     Getscount_One,
     Elaptime_One,
     Cpu_Time,
     Elaptime,
     Sqltext)
  
    select btime_in,
           etime_in,
           a.seqno,
           'elapsed_time' as sqltype,
           a.sql_id,
           a.module,
           a.bget,
           a.diskread,
           a.exec,
           round(decode(a.exec, 0, to_number(null), a.diskread / a.exec), 0) diskread_one,
           round(decode(a.exec, 0, to_number(null), a.bget / a.exec), 2) get_per_exec,
           round(decode(a.exec, 0, to_number(null), (a.elap / a.exec)), 2) elap_one,
           round((a.cput / 1000000) / elap * 100, 2) CPU,
           round(a.elap, 2) Elaptime,
           b.sql_text
      from dba_hist_sqltext b,
           (select row_number() over(order by elap desc) as seqno,
                   sql_id,
                   module,
                   bget,
                   diskread,
                   exec,
                   cput,
                   elap
              from (select sql_id,
                           max(module) module,
                           sum(buffer_gets_delta) bget,
                           sum(disk_reads_delta) diskread,
                           sum(executions_delta) exec,
                           sum(cpu_time_delta) cput,
                           sum(elapsed_time_delta) / 1000000 elap
                      from dba_hist_sqlstat
                     where dbid = ndbid
                       and instance_number = 1
                       and snap_id between bsnap and esnap
                     group by sql_id)) a
     where a.sql_id = b.sql_id
       and a.exec <> 0
       and seqno < 11;

  --SQL ordered by Gets
  insert into topSQL
    (Btime,
     Etime,
     Seqno,
     Sqltype,
     Sql_Id,
     Module,
     Getscount,
     Diskread,
     Execount,
     Diskread_One,
     Getscount_One,
     Elaptime_One,
     Cpu_Time,
     Elaptime,
     Sqltext)
    select btime_in,
           etime_in,
           a.seqno,
           'gets' as sqltype,
           a.sql_id,
           a.module,
           a.bget,
           a.diskread,
           a.exec,
           round(decode(a.exec, 0, to_number(null), a.diskread / a.exec), 0) diskread_one,
           round(decode(a.exec, 0, to_number(null), a.bget / a.exec), 2) get_per_exec,
           round(decode(a.exec, 0, to_number(null), (a.elap / a.exec)), 2) elap_one,
           round((a.cput / 1000000) / elap * 100, 2) CPU,
           round(a.elap, 2) Elaptime,
           b.sql_text
      from dba_hist_sqltext b,
           (select row_number() over(order by bget desc) as seqno,
                   sql_id,
                   module,
                   bget,
                   diskread,
                   exec,
                   cput,
                   elap
              from (select sql_id,
                           max(module) module,
                           sum(buffer_gets_delta) bget,
                           sum(disk_reads_delta) diskread,
                           sum(executions_delta) exec,
                           sum(cpu_time_delta) cput,
                           sum(elapsed_time_delta) / 1000000 elap
                      from dba_hist_sqlstat
                     where dbid = ndbid
                       and instance_number = 1
                       and snap_id between bsnap and esnap
                     group by sql_id)) a
     where a.sql_id = b.sql_id
       and a.exec <> 0
       and seqno < 11;

  --SQL ordered by Reads
  insert into topSQL
    (Btime,
     Etime,
     Seqno,
     Sqltype,
     Sql_Id,
     Module,
     Getscount,
     Diskread,
     Execount,
     Diskread_One,
     Getscount_One,
     Elaptime_One,
     Cpu_Time,
     Elaptime,
     Sqltext)
    select btime_in,
           etime_in,
           a.seqno,
           'diskread' as sqltype,
           a.sql_id,
           a.module,
           a.bget,
           a.diskread,
           a.exec,
           round(decode(a.exec, 0, to_number(null), a.diskread / a.exec), 0) diskread_one,
           round(decode(a.exec, 0, to_number(null), a.bget / a.exec), 2) get_per_exec,
           round(decode(a.exec, 0, to_number(null), (a.elap / a.exec)), 2) elap_one,
           round((a.cput / 1000000) / elap * 100, 2) CPU,
           round(a.elap, 2) Elaptime,
           b.sql_text
      from dba_hist_sqltext b,
           (select row_number() over(order by diskread desc) as seqno,
                   sql_id,
                   module,
                   bget,
                   diskread,
                   exec,
                   cput,
                   elap
              from (select sql_id,
                           max(module) module,
                           sum(buffer_gets_delta) bget,
                           sum(disk_reads_delta) diskread,
                           sum(executions_delta) exec,
                           sum(cpu_time_delta) cput,
                           sum(elapsed_time_delta) / 1000000 elap
                      from dba_hist_sqlstat
                     where dbid = ndbid
                       and instance_number = 1
                       and snap_id between bsnap and esnap
                     group by sql_id)) a
     where a.sql_id = b.sql_id
       and a.exec <> 0
       and seqno < 11;
  insert into topfulltable
    (snapid,
     btime,
     etime,
     seqno,
     sql_id,
     module,
     object_name,
     cost,
     sqltext)
    select snap_id,
           btime_in,
           etime_in,
           row_number() over(order by cost desc) as seqno,
           c.sql_id,
           c.module,
           object_name,
           a.cost,
           b.sql_text
      from dba_hist_sql_plan a, dba_hist_sqltext b, dba_hist_sqlstat c
     where options = 'FULL'
       and object_owner <> 'SYS'
       and a.sql_id = b.sql_id
       and cost > 500
       and snap_id between bsnap and esnap
       and a.sql_id = c.sql_id;
  exception
  when others then
    null;
end p_topSQL_Hist;
/

begin
  sys.dbms_scheduler.create_job(job_name            => 'WORK_TOPSQL',
                                job_type            => 'STORED_PROCEDURE',
                                job_action          => 'p_topSQL_Hist',
                                start_date          => to_date('25-10-2021 12:00:00', 'dd-mm-yyyy hh24:mi:ss'),
                                repeat_interval     => 'Freq=Hourly;Interval=1',
                                end_date            => to_date(null),
                                job_class           => 'DEFAULT_JOB_CLASS',
                                enabled             => true,
                                auto_drop           => true,
                                comments            => 'topsql');
end;
/
