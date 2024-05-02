#!/bin/sh

# im not sure why im doing this as it probably wont ever work, but i just want to have some fun

a="x64"

while getopts a: flag
do
    case "${flag}" in
        a) a=${OPTARG};;
    esac
done

node -v
if [[ $? -ne "0" ]]; then
  echo "node not installed, installing..."

  if [[ $OS != "Windows_NT" ]]; then
    echo "fatal error: no implementation found for OS: $OS"
    read -p "press any key to exit..."
    exit 1
  fi

  if [[ $a != "x64" && $a != "x82" && $a != "arm64" ]]; then
    echo "fatal error: invalid argment -a ($a)"
    read -p "press any key to exit..."
    exit 2
  fi

  # this is nice
  msiexec -i https://nodejs.org/dist/v20.12.2/node-v20.12.2-${a}.msi -passive -qn

  node -v
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to install node.js"
    echo "try again with administrator privilege or install it manualy: https://nodejs.org/en/download"
    read -p "press any key to exit..."
    exit 3
  fi
fi

echo "git: `git --version`"
if [[ $? -ne "0" ]]; then
  echo "git not installed, installing..."
  if [[ $OS != "Windows_NT" ]]; then
    echo "fatal error: no implementation found for OS: $OS"
    read -p "press any key to exit..."
    exit 4
  fi

  winget install --id Git.Git -e --source winget

  git --version
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to install git"
    echo "try again with administrator privilege or install it manualy: https://git-scm.com/downloads"
    read -p "press any key to exit..."
    exit 5
  fi
fi

git pull
if [[ $? -ne "0" ]]; then

  cd ./advrngmntr
  if [[ $? -ne "0" ]]; then
    echo "source files not found, cloning..."
    git clone https://github.com/Maiku19/ring-api-test.git ./advrngmntr --branch=latest-stable
    if [[ $? -ne "0" ]]; then
      echo "fatal error: failed to clone repo"
      echo "try again with administrator privilege or clone it manualy: https://github.com/Maiku19/ring-api-test"
      read -p "press any key to exit..."
      exit 6
    fi

    cd ./advrngmntr
    npm i
  fi
fi

tsc -v
if [[ $? != "0" ]]; then
  npm install typescript -g

  tsc -v
  if [[ $? != "0" ]]; then 
    echo "fatal error: failed to install typescript"
    echo "try again with administrator privilege or install it manualy: https://www.typescriptlang.org/download/"
    read -p "press any key to exit..."
    exit 7
  fi
fi

# check if exists
mv ./.env ./.env
if [[ $? -ne "0" ]]; then
  node ./node_modules/ring-client-api/lib/ring-auth-cli.js

  read -p "RING_REFRESH_TOKEN="
  echo "RING_REFRESH_TOKEN=$REPLY" > ./.env

  mv ./.env ./.env
  if [[ $? -ne "0" ]]; then
    echo "fatal error: failed to get refresh token"
    echo "try again with administrator privilege or place it manualy in: (echo \"RING_REFRESH_TOKEN=<put_your_token_here>\" > ./.env)"
    read -p "press any key to exit..."
    exit 8
  fi
fi

npm start