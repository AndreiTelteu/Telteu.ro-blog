+++
date = '2024-11-18T00:10:52+02:00'
slug = 'docker-compose-helper-script'
title = 'Docker Compose helper script'
description = 'How to make a helper script to run docker compose commands'
tags = ['docker', 'homelab', 'snippet']
categories = 'Devops'
+++

Make a new file at the root folder called `dc` without extension.

Content example. Modify for your needs.

```bash
#!/bin/bash
trap "exit" 0
DC="docker compose" # add  `-f docker/compose.yml` if it's in another folder

if [ $# -eq 0 ]; then
    $DC ps -a
    
elif [ $1 == "up" ]; then
    $DC up -d
    
elif [ $1 == "php" ]; then
    if [ $# -gt 1 ]; then
        $DC exec php su app -c "${*:2}"
    else
        $DC exec php su app
    fi
    
elif [ $1 == "c" ]; then
    $DC exec php su app -c "composer ${*:2}"
    
elif [ $1 == "ci" ]; then
    $DC exec php su app -c 'composer install'
    
elif [ $1 == "recreate" ]; then
    $DC up -d --force-recreate ${*:2}
    
elif [ $1 == "build" ]; then
    $DC up -d --force-recreate --build ${*:2}
    
else
    $DC $*
fi
```

Give execute permission with `chmod +x ./dc`

And now you can run:

- `./dc` - to show all containers with status
- `./dc up` - to start in detached mode
- `./dc ci` - to run composer install in the php container as user app
- `./dc c require spatie/image` - to run any composer command inside php container
- `./dc php` - interactive exec inside php container
- `./dc php ls -alh` - run any command inside php container
- `./dc recreate` - applies any modifications to docker-compose.yml
- `./dc recreate php` - applies modifications to compose, only for php container
- `./dc build` - if you have a custom dockerfile, does run dc up with a fresh build.
- `./dc logs -n 10 -f php` - any other docker-compose command works as expected. 
