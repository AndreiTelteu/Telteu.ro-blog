+++
date = '2025-01-25T20:04:00+02:00'
slug = 'headscale-with-traefik'
title = 'How to configure Headscale and Traefik to proxy any service'
description = 'Using headscale we can make a public proxy to any of our self-hosted services like Immich or nextcloud.'
# featured_image = ''
# images = ['']
tags = ['devops', 'docker', 'selfhost', 'homelab']
categories = 'DevOps'
+++

## Requirements:

- a linux server with a public IPv4 address
- docker and docker compose installed
- a domain/subdomain with a A DNS record pointing to your IP

I will use **example.com** as the domain name in this example, please replace it with your domain/subdomain.

## Traefik
Ssh to your public server where you want to host your vpn, make a folder called `traefik` with the following files:
`mkdir traefik && cd traefik`
### 1. An empty `letsencrypt` folder: `mkdir letsencrypt`
### 2. An empty file `touch dynamic.yml` (for future expansion)
### 3. The static config: `nano static.yml`
```yaml
api:
  insecure: true
  dashboard: true

providers:
  docker:
    exposedByDefault: false

entryPoints:
  web:
    address: ":80"
    http2:
      maxConcurrentStreams: 250 # fix for network error on the proxy to my immich instance
    http3:
      advertisedPort: 443
    # http:
    #   redirections:
    #     entryPoint:
    #       to: websecure
    #       scheme: https
    forwardedHeaders:
      trustedIPs:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
        - fc00::/7
    proxyProtocol:
      trustedIPs:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
        - fc00::/7
  websecure:
    address: ":443"
    http2:
      maxConcurrentStreams: 250 # fix for network error on the proxy to my immich instance
    http3:
      advertisedPort: 443
    forwardedHeaders:
      trustedIPs:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
        - fc00::/7
    proxyProtocol:
      trustedIPs:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
        - fc00::/7

certificatesResolvers:
  myresolver:
    acme:
      email: "your-email-goes-here@tutorial.example"
      storage: "/letsencrypt/acme.json"
      httpChallenge:
        entryPoint: web

```
> Replace `your-email-goes-here@tutorial.example` with your email address. Let's Encrypt send you notifications when your ssl certificate expires.
### 4. The docker compose config: `nano compose.yml`
```yaml
services:

  traefik:
    image: "traefik:v3.2"
    container_name: "traefik"
    restart: "always"
    ports:
      - "80:80"
      - "443:443"
    networks:
      - pub
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./static.yml:/etc/traefik/traefik.yml:ro"
      - "./dynamic.yml:/etc/traefik/dynamic.yaml:ro"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`example.com`) && (PathPrefix(`/dashboard`) || PathPrefix(`/api/overview`) || PathPrefix(`/api/version`) || PathPrefix(`/api/http`) || PathPrefix(`/api/entrypoints`) || PathPrefix(`/api/tcp`) || PathPrefix(`/api/udp`))"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=myresolver"
      - "traefik.http.routers.dashboard.service=api@internal"
      # # if you want to password protect your traefik dashboard uncomment the following and change the user:pass
      #- "traefik.http.routers.dashboard.middlewares=auth"
      #- "traefik.http.middlewares.auth.basicauth.users=" # to create user and pass:   bash -c 'echo $(htpasswd -nB admin) | sed -e s/\\$/\\$\\$/g'

networks:
  pub:
    external: true
```

Create the `pub` network first using the command `docker network create pub`

Now we can start the traefik instance: `docker compose up -d`

## HeadScale

Let's make a separate folder for headscale: `cd .. && mkdir headscale`

### 1. 2 empty folders: `mkdir data && mkdir tailscale-client`
### 2. The headscale config: `nano config.yml`
```yaml
---
# The url clients will connect to.
server_url: https://example.com

# Address to listen to / bind to on the server
listen_addr: 0.0.0.0:8080

# Address to listen to /metrics, you may want
metrics_listen_addr: 127.0.0.1:9090

# Address to listen for gRPC.
grpc_listen_addr: 127.0.0.1:50443

# Allow the gRPC admin interface to run in INSECURE mode.
grpc_allow_insecure: false

noise:
  # The Noise private key is used to encrypt the traffic
  private_key_path: /var/lib/headscale/noise_private.key

# List of IP prefixes to allocate tailaddresses from.
# Each prefix consists of either an IPv4 or IPv6 address,
prefixes:
  v6: fd7a:115c:a1e0::/48
  v4: 100.64.0.0/10
  # Strategy used for allocation of IPs to nodes, available options:
  # - sequential (default): assigns the next free IP from the previous given IP.
  # - random: assigns the next free IP from a pseudo-random IP generator (crypto/rand).
  allocation: sequential

# DERP is a relay system that Tailscale uses when a direct connection cannot be established.
derp:
  server:
    enabled: false
    # Region ID to use for the embedded DERP server.
    region_id: 999
    region_code: "headscale"
    region_name: "Headscale Embedded DERP"
    # Listens over UDP at the configured address for STUN connections - to help with NAT traversal.
    stun_listen_addr: "0.0.0.0:3478"
    # Private key used to encrypt the traffic between headscale DERP and Tailscale clients.
    private_key_path: /var/lib/headscale/derp_server_private.key
    # This flag can be used, so the DERP map entry for the embedded DERP server is not written automatically,
    automatically_add_embedded_derp_region: true
    # For better connection stability (especially when using an Exit-Node and DNS is not working),
    ipv4: 1.2.3.4
    ipv6: 2001:db8::1
  # List of externally available DERP maps encoded in JSON
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  # Locally available DERP map files encoded in YAML
  paths: []
  # If enabled, a worker will be set up to periodically refresh the given sources and update the derpmap
  auto_update_enabled: true
  # How often should we check for DERP updates?
  update_frequency: 24h
# Disables the automatic check for headscale updates on startup
disable_check_updates: false
# Time before an inactive ephemeral node is deleted?
ephemeral_node_inactivity_timeout: 30m
database:
  type: sqlite
  # Enable debug mode. This setting requires the log.level to be set to "debug" or "trace".
  debug: false
  gorm:
    prepare_stmt: true
    parameterized_queries: true
    skip_err_record_not_found: true
    slow_threshold: 1000
  sqlite:
    path: /var/lib/headscale/db.sqlite
    write_ahead_log: true
  
  ### TLS configuration Let's encrypt / ACME
acme_url: https://acme-v02.api.letsencrypt.org/directory
acme_email: "your-email-goes-here@tutorial.example"
tls_letsencrypt_hostname: ""
# Path to store certificates and metadata needed by letsencrypt
tls_letsencrypt_cache_dir: /var/lib/headscale/cache

# Type of ACME challenge to use, currently supported types: HTTP-01 or TLS-ALPN-01
tls_letsencrypt_challenge_type: HTTP-01
# When HTTP-01 challenge is chosen, letsencrypt must set up a verification endpoint, and it will be listening on:
tls_letsencrypt_listen: ":http" # :http = port 80
tls_cert_path: ""
tls_key_path: ""

log:
  format: text # text or json
  level: info

policy:
  mode: file
  path: ""

dns:
  magic_dns: true
  # Defines the base domain to create the hostnames for MagicDNS.
  base_domain: head.local
  nameservers:
    global:
      - 1.1.1.1
      - 1.0.0.1
      - 2606:4700:4700::1111
      - 2606:4700:4700::1001
    split: {}
  search_domains: []
  # Extra DNS records
  extra_records: []
  
unix_socket: /var/run/headscale/headscale.sock
unix_socket_permission: "0770"
logtail:
  # Enable logtail for this headscales clients.
  enabled: false
# Enabling this option makes devices prefer a random port for WireGuard traffic over the default static port 41641.
randomize_client_port: false
```
> It's the default config, I removed some comments and replaced `server_url`, `acme_email` and the `base_domain` from dns section. This last config is the Magic DNS that headscale uses to create a DNS entry for every device you connect to your tailscale vpn.

### 3. The docker compose config: `nano compose.yml`
```yaml
services:

  headscale:
    container_name: headscale
    image: headscale/headscale
    command: serve
    restart: always
    ports:
      - "8080:8080"
    networks:
      - pub
    volumes:
      - "./data:/var/lib/headscale"
      - "./config.yml:/etc/headscale/config.yaml"
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.headscale.rule=Host(`example.com`)"
      - "traefik.http.routers.headscale.entrypoints=websecure"
      - "traefik.http.routers.headscale.tls.certresolver=myresolver"
      - "traefik.http.services.headscale.loadbalancer.server.port=8080"

  headplane:
    container_name: headplane
    image: ghcr.io/tale/headplane:0.3.2
    restart: unless-stopped
    ports:
      - '3000:3000'
    networks:
      - pub
    depends_on:
      - headscale
    volumes:
      - "./config.yml:/etc/headscale/config.yaml"
    environment:
      HEADSCALE_URL: 'http://headscale:8080'
      API_KEY: ""
      CONFIG_FILE: "/etc/headscale/config.yaml"
      COOKIE_SECRET: 'put-some-random-string-here-32j564b64kl6n34lk'
      DISABLE_API_KEY_LOGIN: 'true'
      COOKIE_SECURE: 'false'
      HOST: '0.0.0.0'
      PORT: '3000'
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.headplane.rule=Host(`example.com`) && PathPrefix(`/admin`)"
      - "traefik.http.routers.headplane.entrypoints=websecure"
      - "traefik.http.routers.headplane.tls.certresolver=myresolver"
      - "traefik.http.services.headplane.loadbalancer.server.port=3000"
      #- "traefik.http.routers.headplane.middlewares=auth" # uncomment this only if you generated a password in traefik step 4

  # client:
  #   container_name: tailscale-client
  #   image: tailscale/tailscale
  #   restart: unless-stopped
  #   environment:
  #     - "TS_AUTHKEY="
  #     - "TS_STATE_DIR=/var/lib/tailscale"
  #     - "TS_USERSPACE=false"
  #     - "TS_EXTRA_ARGS=--login-server=https://example.com --advertise-exit-node --hostname=server-client --shields-up=false"
  #   networks:
  #     - pub
  #   volumes:
  #     - "./tailscale-client:/var/lib/tailscale"
  #     - "/dev/net/tun:/dev/net/tun"
  #   cap_add:
  #     - net_admin
  #     - sys_module

networks:
  pub:
    external: true
```

We can start headscale now: `docker compose up -d`
