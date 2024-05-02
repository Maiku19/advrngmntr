# **IMPORTANT:** I don't know what I'm doing

## Overview:
This is a **[Ring](https://ring.com) home monitor** for ppl who don't feel like paying for ring protect. I'm **neither a professional developer nor have I ever written anything in [TypeScript](https://github.com/topics/typescript)** *(until now)* so expect things to break. I doubt I'll update this much, so feel free to use this repo more as a starting point/template from which you can fork from than a finished product.

## Installation:
- ### curl:
  probably the **easiest** and **fastest** way to install
``` bash
cd ~/your/desired/directory/
curl https://github.com/Maiku19/advrngmntr/releases/latest/download/advrngmntr.sh -o installer.sh
./installer.sh
```

- ### git clone:
``` bash
git clone https://github.com/Maiku19/advrngmntr.git --branch=latest-stable
cd ./advrngmntr # or wherever you've cloned the repo
npm i
```

## Running:
First **make sure** you have your Ring refresh **token** in the `.env` file *(should already be there if you've used the installer/run.sh script)*. **If not**, run:
```bash
npm run auth
```
then add the following to the `.env` file in the project's root directory *(create it if it doesn't exist)*:
```dotenv
RING_REFRESH_TOKEN=<paste_your_token_here>
```

There is a good (knowing my coding skills probably a: BAD) chance that you can omit step above
- using the `run.sh` script
``` bash
./run.sh
```

- using the start script with npm run
``` bash
npm start
```
  this simply runs: `tsc && node ./jsout/main.js`
  alternatively run: `npm run start-dont-build` which will only run the program without converting to it to JS first *(only works if you've ran `tsc` at least once)*

## Credits:
- **The API used in this project**: [Unofficial Ring API](https://github.com/dgreif/ring)