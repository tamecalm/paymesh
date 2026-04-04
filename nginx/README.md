# Nginx gRPC Reverse Proxy — paymesh

Nginx config for routing gRPC traffic on `paymesh.trimz.cc` to two backend services.

| Route | Backend |
| --- | --- |
| `/user.UserService/*` | `grpc://127.0.0.1:50051` |
| `/wallet.WalletService/*` | `grpc://127.0.0.1:50052` |

## Prerequisites

- Ubuntu 22.04
- Nginx with HTTP/2 module (`nginx-full` package)

Verify the HTTP/2 module is compiled in:

```bash
nginx -V 2>&1 | grep http_v2
```

If the output contains `--with-http_v2_module`, gRPC support is confirmed.

## Install Nginx

```bash
sudo apt update && sudo apt install -y nginx
```

## Deploy the Config

From the repository root:

```bash
sudo ln -s $(pwd)/nginx/paymesh-grpc.conf /etc/nginx/sites-enabled/paymesh-grpc.conf
```

Test the config for syntax errors:

```bash
sudo nginx -t
```

Reload Nginx to apply:

```bash
sudo systemctl reload nginx
```

## Provision TLS with Certbot

Install certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Provision the certificate (DNS for `paymesh.trimz.cc` must point to the server first):

```bash
sudo certbot --nginx -d paymesh.trimz.cc
```

After certbot completes, uncomment the HTTP-to-HTTPS redirect in `paymesh-grpc.conf` and reload Nginx.

## Rollback

Remove the symlink and reload:

```bash
sudo rm /etc/nginx/sites-enabled/paymesh-grpc.conf
sudo systemctl reload nginx
```
