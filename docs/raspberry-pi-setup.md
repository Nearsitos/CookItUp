# Raspberry Pi prototype server setup

This guide runs the CookItUp web app, Node.js API, and MySQL database on the Pi
with Docker Compose. The Compose setup is designed for a 64-bit ARM Pi OS image.
Use a Raspberry Pi 4 or 5 with 64-bit Raspberry Pi OS; a Pi 5 is needed for the
Raspberry Pi AI HAT family.

## What you need

- The Pi connected to your network and powered reliably.
- 64-bit Raspberry Pi OS and current updates.
- GitHub access to this repository.
- Docker Engine and the Docker Compose plugin.
- A Tailscale account if remote testers need to connect from outside your LAN.

## 1. Update the Pi and install deployment tools

Open a terminal on the Pi (or connect over SSH) and run:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y git docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
```

Sign out and back in so the Docker group change takes effect, then confirm:

```bash
docker --version
docker compose version
git --version
```

If your Raspberry Pi OS image does not offer `docker-compose-v2`, follow the
[official Docker Engine instructions for Debian ARM64](https://docs.docker.com/engine/install/debian/)
and install the Compose plugin from Docker's repository.

## 2. Get the project from GitHub

Replace the URL below with the repository's clone URL. Clone it once; later,
use `git pull` to get reviewed changes.

```bash
git clone <your-GitHub-repository-url> KookItUp
cd KookItUp
```

If you already cloned the repository, enter its folder and update the branch
you intend to deploy:

```bash
cd <your-KookItUp-folder>
git checkout main
git pull
```

## 3. Set private database passwords

Create a local environment file from the checked-in example, then edit it:

```bash
cp .env.example .env
nano .env
```

Replace both example passwords with different, long random values. Save the
file and keep it private: `.env` is ignored by Git. Do not use real personal
data for a prototype test database.

## 4. Start the app and database

From the repository root:

```bash
docker compose up -d --build
docker compose ps
```

On the Pi, open `http://localhost:3000`. From another device on the same home
network, use `http://<pi-ip-address>:3000`. Find the Pi's address with:

```bash
hostname -I
```

Check backend and database availability at `http://<pi-ip-address>:3000/api/health`.
An `ok` status means the API can reach MySQL. The MySQL port is intentionally
not published to the network; only the web app/API port is.

## 5. Give remote teammates private access

For a small user test, use a private Tailscale network:

1. Install Tailscale on the Pi and the testers' computers or phones, then sign
   each device into the team's tailnet.
2. In the Tailscale admin console, share the Pi with the testers or grant them
   access to it according to the team's policy.
3. Find the Pi's Tailscale IP or MagicDNS name in the admin console.
4. Test `http://<pi-tailscale-name-or-ip>:3000` from a tester device.

Keep testers on the private tailnet and do not forward port 3000 or 3306 on the
home router. If testers cannot install Tailscale, use a controlled HTTPS tunnel
with an access gate (for example, Cloudflare Tunnel + Cloudflare Access); do
not make the prototype publicly accessible without authentication.

## Deploying later GitHub changes

After changes have been reviewed and merged to the branch you deploy:

```bash
cd <your-KookItUp-folder>
git checkout main
git pull
docker compose up -d --build
```

Useful operations:

```bash
docker compose logs -f app       # view API logs
docker compose logs -f db        # view MySQL logs
docker compose restart app       # restart the API
docker compose down              # stop services; database volume remains
```

The MySQL data is stored in a Docker volume and persists across container
rebuilds. Back it up before changing or replacing the Pi. `docker compose down
-v` deletes the database volume; avoid it unless you intentionally want to
erase the prototype database.

## AI HAT+ 2: optional future backend feature

The 8 GB onboard RAM points to the Raspberry Pi AI HAT+ 2. It is a separate
accelerator and memory on the HAT; it does not add 8 GB to the Pi's system RAM.
The regular AI HAT+ models use Pi memory and support vision workloads, while
AI HAT+ 2 adds local LLM and vision-language model support. The regular app and
database do not need HAT software installed.

When ready to experiment, first confirm the board says **AI HAT+ 2**. Raspberry
Pi's current guidance requires a Raspberry Pi 5 with 64-bit Raspberry Pi OS
Trixie for HAT AI software. Follow the official [AI software setup](https://www.raspberrypi.com/documentation/computers/ai.html)
and [AI HAT documentation](https://www.raspberrypi.com/documentation/accessories/ai-hat-plus.html)
for the correct Hailo package and model workflow. Do not install `hailo-h10-all`
unless the hardware is AI HAT+ 2; the original AI HAT+ uses a different package.

Keep any local model service as a separate optional service. Later, the Express
API can call it over a private local interface for recipe text assistance,
ingredient image classification, or receipt parsing, while the core inventory
and SQL API continue to work without the accelerator. Test inference load and
memory separately before adding it to the team's user-test deployment.

## Current backend scope

The starter backend serves the existing frontend and has a database-aware
health endpoint. Inventory CRUD and schema migrations still need to be built;
the SQL file in `client/docs/` is currently a draft placeholder. Until those
features are added, the UI's data services still use mock data.
