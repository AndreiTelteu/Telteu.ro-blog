+++
date = '2024-11-18T00:08:54+02:00'
slug = 'mysql-dynamic-max-connections'
title = 'MySQL dynamic max_connections setting'
description = 'MySQL Dynamic max_connections based on active threads'
tags = ['docker', 'mysql', 'snippet']
categories = 'Devops'
+++

Put the following script in a .sh file, for example in `/root/watch-mysql.sh`

```bash
#!/usr/bin/bash
trap "exit" 0

MAXCONN=1000 # set this to whatever base max_connections you have defined in your my.conf setting
while true; do
  #mysql -e "SHOW VARIABLES LIKE 'max_connections';"
  THREADS=`mysqladmin status | awk '{print $4}'`
  THREADSINT=`echo "$THREADS" | bc`
  #echo "Load is: $THREADS"
  NEWMAX=$MAXCONN
  if [[ $THREADSINT -ge 1 ]]; then
    NEWMAX=1000
  fi
  if [[ $THREADSINT -ge 600 ]]; then
    NEWMAX=2000
  fi
  if [[ $THREADSINT -ge 1400 ]]; then
    NEWMAX=3000
  fi
  if [[ $THREADSINT -ge 2400 ]]; then
    NEWMAX=4000
  fi
  if [[ $THREADSINT -ge 3400 ]]; then
    NEWMAX=5000
  fi
  if [[ $NEWMAX -ne $MAXCONN ]]; then
    mysql -e "set global max_connections = $NEWMAX;"
    #echo "increased: $NEWMAX"
    MAXCONN=$NEWMAX
  fi
  sleep 3
done
```

If `mysqladmin status` gives error "connect to server at 'localhost' failed", make sure you have your credentials stored in `~/.my.cnf`

I have a separate mysql server, runing PerconaDB inside docker, so in my case my `~/.my.cnf` looks like this:
```
[client]
protocol=tcp
port=3306
user=root
password="secret"
```

---

You can run this script on startup by creating a [systemd service](https://linuxconfig.org/how-to-run-script-on-startup-on-ubuntu-20-04-focal-fossa-server-desktop) or by using [supervisor](https://www.digitalocean.com/community/tutorials/how-to-install-and-manage-supervisor-on-ubuntu-and-debian-vps).

---

An easier setup is by runing a cron job every minute. If you do a while loop in a cron job, you will end up with unlimited proceses spawned and we don't want that. Instead we will replace while with a for loop:
```
# replace `while true; do` with
for i in {1..20}; do
```
For loop for 20 iterations because each loop sleeps for 3 seconds. So `20 * 3 = 60` seconds assuming our code does not take too long to execute.

Now run command `crontab -e` and add a cron job for this:
```
* * * * * bash /root/watch-mysql.sh
```
