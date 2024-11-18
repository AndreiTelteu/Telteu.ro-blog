+++
date = '2024-11-18T00:22:52+02:00'
slug = 'backup-incremental-pentru-fisiere-si-mysql'
title = 'Backup incremental pentru fișiere și MySQL'
description = 'Cum să configurezi Autorestic pentru backup incremental de fișiere și baza de date MySQL'
etichete = ['devops', 'infrastructure', 'autorestic']
categorii = 'Devops'
+++

## 1. Instalează

Instalează autorestic de aici: https://autorestic.vercel.app/installation

În tutorialul ăsta folosim următoarea structură de fișiere: `/root/backup` pentru parole și configurația autorestic, un folder `data` înauntru unde se salvează backup-urile efective (restic repository), și folderul database unde se salvează temporar exportul din baza de date.
```bash
mkdir /root/backup
mkdir /root/backup/data
mkdir /root/backup/database
cd /root/backup
```

## 2. Fisier env pentru parole

Creează fisierul environment  `nano .autorestic.env` și completează datele de access la baza de date:
```env
AUTORESTIC_LOCAL_RESTIC_PASSWORD=

AUTORESTIC_PROD_DB_MYSQL_HOST=localhost
AUTORESTIC_PROD_DB_MYSQL_PORT=3306
AUTORESTIC_PROD_DB_MYSQL_DATABASE=
AUTORESTIC_PROD_DB_MYSQL_USER=
AUTORESTIC_PROD_DB_MYSQL_PASS=
```

Completează la `AUTORESTIC_LOCAL_RESTIC_PASSWORD` o cheie/parolă random generată. Cu parola asta o să fie encriptate toate backup-urile. Salvează această cheie în alt loc (password manager sau în alt fișier undeva sigur).


## 3. Script pentru MySQL backup

Creeaza scriptul bash pentru backup MySQL: `nano backup-db-hook.sh`
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
(script de backup în fișiere separate pentru tabele copiat de la [jeremyharris/backup.sh](https://gist.github.com/jeremyharris/3085738))

## 4. Configurație Autorestic

Creează fișierul config pentru autorestic: `nano auto.yml`
```yml
version: 2

backends:
  local:
    type: local
    path: /root/backup/data # aici se salveaza backup-urile in sine

global:
  forget:
    keep-daily: 7
    keep-weekly: 4

locations:
  prod:
    from: /var/www/html # calea catre fisierele site
    to: local
    cron: '0 1 * * *' # backup fisiere la ora 01:00
    forget: "yes" # sau "prune". Optiunea "Yes" trebuie să fie în ghilimele, altfel este boolean
    options:
      backup:
        exclude:
          - 'vendor'

  prod-db:
    from: /root/backup/database/
    to: local
    cron: '0 0 * * *' # backup baza de date la ora 00:00
    forget: "yes"
    hooks:
      before:
      - bash backup-db-hook.sh

```

> Notă: Numele backend-ului trebuie să fie la fel ca în numele cheii din env: (cum e <code><b>EXAMPLE</b></code>)
> <br />AUTORESTIC_<code><b>EXAMPLE</b></code>_RESTIC_PASSWORD=
> <br />backends:
> <br />&nbsp;&nbsp;<code><b>example</b></code>:
> <br />&nbsp;&nbsp;&nbsp;&nbsp;type: local

## 5. Inițializează folderul cu comanda

```bash
autorestic -c auto.yml -v check
```
Comanda asta validează configurația și inițiază un nou repository in folderul destinație.

## 6. Cron Job

Adaugă cron job ca să facă automat backup și purge. Autorestic recomandă cron jobul să fie setat la 5 minute.

`crontab -e`

```bash
*/5 * * * * cd /root/backup; /usr/local/bin/autorestic -c /root/backup/auto.yml --ci cron --lean
```

---

### Note:

- **Salvează cheia** (`RESTIC_PASSWORD` din env) undeva extern, în afara serverului, într-un password manager sau ceva similar. Dacă pierzi cheia backup-urile sunt inutile, nu le poți decripta.
- Ca să vezi lista de backup-uri intră în folderul `/root/backup` și scrie comanda `autorestic exec -av snapshots`


```bash 
## lista backup-urilor
autorestic -c auto.yml exec -av snapshots

## alege un snapshot id, afișează toate fișierele din acesta
autorestic -c auto.yml exec -av -- ls --long 041c88da

## acum poți alege să restaurezi doar un fișier, de exemplu, in folderul ./restore/
autorestic -c auto.yml exec -av -- restore --target=./restore/ --include=/root/backup/database/example.sql.gz 041c88da
```

