# obelus

obelus is a self-hosted private reading record (think goodreads but probably better in some ways and worse in others).

![List page view](https://raw.githubusercontent.com/s992/obelus/main/screenshots/list.png)
![Detail page view](https://raw.githubusercontent.com/s992/obelus/main/screenshots/detail.png)

## ai disclaimer

i'm not a big fan of robots writing code, so i only feel it's fair to call out where i've used robots to assist me in developing this:

- initial iteration: my first pass at this was 100% written by robots in a different repo. you can enjoy my pain at https://github.com/s992/obelus-slop. surprisingly, it works. still some god awful code, though.
- ui design: i'm not a designer and claude design did a pretty good job. i still implemented the designs by hand (other than the theme files), but all the actual design was done by a robot.
- troubleshooting: i asked a lot of questions to a lot of robots while figuring stuff out. i never copy pasted, though.
- cleanup: occasionally i'll do things in a hacky way and ask the robot to clean it up after the fact. think stuff like migrating inline styles into proper css, not large-scale rewrites.
- code review: similar to the above, sometimes i'll bug a robot to find bad code. then i fix it myself.
- docker compose: the initial docker compose file was written by a robot. i haven't changed it much.
- the github publish workflow might be written by a robot. i'm not really sure, i just copied it from another project i have.

## getting started

### docker

first, grab a [hardcover api token](https://docs.hardcover.app/api/getting-started/). you'll need this to grab book metadata. don't worry, we are responsible consumers of the API and cache heavily in redis.

once you have your api token, grab the [`docker-compose.yml`](https://raw.githubusercontent.com/s992/obelus/main/docker-compose.yml) and create a `.env` file next to it. all enviornment variables are *required*:

```
OBELUS_API_PORT=3000
OBELUS_AUTH_TOKEN_SECRET=
OBELUS_BASE_URL=http://localhost
OBELUS_CLIENT_PORT=80
OBELUS_COOKIE_SECRET=
OBELUS_DATABASE_URL=postgres://obelus:obelus@postgres:5432/obelus
OBELUS_HARDCOVER_API_TOKEN=
OBELUS_LOG_LEVEL=info
OBELUS_REDIS_URL=redis://redis:6379
```

use a [key generator](https://randomkeygen.com/random-string) (or write whatever you want; i don't really care) for `OBELUS_AUTH_TOKEN_SECRET` and `OBELUS_COOKIE_SECRET`.

spin it up with `docker compose up -d`. when that doesn't work, [let me know](https://github.com/s992/obelus/issues/new) and i'll try to fix it. as far as i know, i'm the only one using this whole thing so it works on my machine but i haven't given it a bunch of testing.

hit the url and start tracking your books!

### k8s
coming soon™
