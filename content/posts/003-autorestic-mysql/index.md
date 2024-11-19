+++
date = '2024-11-18T00:09:52+02:00'
slug = 'incremental-backup-files-and-mysql'
title = 'Incremental file and MySQL backup'
description = 'How to use setup Autorestic for incremental backups of files and MySQL database'
tags = ['devops', 'infrastructure', 'autorestic']
categories = 'Devops'
+++


## 1. Install

Install autorestic: https://autorestic.vercel.app/installation

Let's use `/root/backup` to store our env file and autorestic config, make a `data` folder inside to store the actual backups inside, and a temporary `database` folder for MySQL dumps.
```bash
mkdir /root/backup
mkdir /root/backup/data
mkdir /root/backup/database
cd /root/backup
```

## 2. Environment

Create the environment file `nano .autorestic.env` and fill the access data to the database:
```env
AUTORESTIC_LOCAL_RESTIC_PASSWORD=

AUTORESTIC_PROD_DB_MYSQL_HOST=localhost
AUTORESTIC_PROD_DB_MYSQL_PORT=3306
AUTORESTIC_PROD_DB_MYSQL_DATABASE=
AUTORESTIC_PROD_DB_MYSQL_USER=
AUTORESTIC_PROD_DB_MYSQL_PASS=
```

Generate a unique key / password in `AUTORESTIC_LOCAL_RESTIC_PASSWORD`. This is used to encrypt and decrypt all backups. Also please save backup this key in a different location as well (password manager or something).


## 3. MySQL Backup

Make a bash script for MySQL backup: `nano backup-db-hook.sh`
```bash
#!/usr/bin/bash
BACKUP_PATH=./database
mkdir $BACKUP_PATH

export $(cat .autorestic.env | xargs)
MYSQL="$(which mysql)"
MYSQLDUMP="$(which mysqldump)"
GZIP="$(which gzip)"
MYSQL_PERMS=" --protocol tcp "
MYSQL_PERMS+=" -h $(echo $AUTORESTIC_PROD_DB_MYSQL_HOST) "
MYSQL_PERMS+=" -P $(echo $AUTORESTIC_PROD_DB_MYSQL_PORT) "
MYSQL_PERMS+=" -u $(echo $AUTORESTIC_PROD_DB_MYSQL_USER) "
DB="$AUTORESTIC_PROD_DB_MYSQL_DATABASE"
export MYSQL_PWD="$AUTORESTIC_PROD_DB_MYSQL_PASS"
DUMP_OPTIONS="--single-transaction --no-tablespaces"

echo "$(date +"%d-%m-%Y %H:%M:%S") Backing up $DB to $BACKUP_PATH"
TABLES="$($MYSQL $MYSQL_PERMS $DB -Bse 'SHOW TABLES FROM '$DB)"
for TABLE in $TABLES ; do
  echo "$(date +"%d-%m-%Y %H:%M:%S") Backing up $TABLE"
  FILE="$BACKUP_PATH/${TABLE}.sql.gz"
  $MYSQLDUMP $MYSQL_PERMS $DUMP_OPTIONS $DB $TABLE | $GZIP -9 > $FILE
done
echo "$(date +"%d-%m-%Y %H:%M:%S") ...done!"

```
(credits to [jeremyharris/backup.sh](https://gist.github.com/jeremyharris/3085738) for separate db tables script)

## 4. Config

Make a config file: `nano auto.yml`
```yml
version: 2

backends:
  local:
    type: local
    path: /root/backup/data # where you want to store all backups

global:
  forget:
    keep-daily: 7
    keep-weekly: 4

locations:
  prod:
    from: /var/www/html # where the website files are
    to: local
    cron: '0 1 * * *' # at 01:00
    forget: "yes" # or "prune". Yes must be in quotes, otherwise it's a boolean
    options:
      backup:
        exclude:
          - 'vendor'

  prod-db:
    from: /root/backup/database/
    to: local
    cron: '0 0 * * *' # at 00:00
    forget: "yes"
    hooks:
      before:
      - bash backup-db-hook.sh

```

> Note: The backend name must match with the env restic password name: (like <code><b>EXAMPLE</b></code>)
> <br />AUTORESTIC_<code><b>EXAMPLE</b></code>_RESTIC_PASSWORD=
> <br />backends:
> <br />&nbsp;&nbsp;<code><b>example</b></code>:
> <br />&nbsp;&nbsp;&nbsp;&nbsp;type: local

## 5. Initialize repository

```bash
autorestic check
```
This will check your config and initialize a new repository in the backup destination folder or remote location.

## 6. Cron Job

Add  the cron job. autorestic recommends every 5 minutes.

`crontab -e`

```bash
*/5 * * * * cd /root/backup; /usr/local/bin/autorestic -c /root/backup/auto.yml --ci cron --lean
```

---

### Notes:

- **Backup your key** (env RESTIC_PASSWORD) somewhere else (like a password manager). If you lose it, **your backups are useless**.
- Use `autorestic exec -av snapshots` while in the `/root/backup` folder to see the list of backups.

```bash
## list of backups
autorestic -c auto.yml exec -av snapshots

## choose one snapshot id, then list all the files within it
autorestic -c auto.yml exec -av -- ls --long 041c88da

## now you can choose to restore only one file for example, in the relative folder ./restore/
autorestic -c auto.yml exec -av -- restore --target=./restore/ --include=/root/backup/database/example.sql.gz 041c88da
```

